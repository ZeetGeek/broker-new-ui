import assert from "node:assert/strict";
import test from "node:test";

import { pipelineApi } from "@/lib/api/pipeline";
import { type BrokerVisit, siteVisitsApi, type VisitListPage } from "@/lib/api/site-visits";
import { VisitSyncError } from "@/lib/visits/sync-error";
import {
    bookVisitForDeal,
    cancelVisitForDeal,
    getDealWithVisit,
    listDealsWithVisits,
    moveDealWithVisits,
    rescheduleVisitForDeal,
    stageBeforeVisit,
    updateVisitRemindersForDeal,
} from "@/lib/workflows/visit-deal-sync";

import { visitErrorMessage } from "@/features/new-site-visits/model";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import {
    type DealDetail,
    type DealHistoryEntry,
    type DealStatus,
    DEFAULT_DEALS_FILTERS,
} from "@/features/pipeline/types";

const input = {
    leadId: "deal",
    propertyId: "property",
    startAt: "2026-12-01T05:00:00Z",
    durationMinutes: 30 as const,
};
function booking(id = "visit", extra: Partial<BrokerVisit> = {}): BrokerVisit {
    return {
        id,
        leadId: "deal",
        propertyId: "property",
        startsAt: input.startAt,
        durationMinutes: input.durationMinutes,
        status: "confirmed",
        ...extra,
    } as BrokerVisit;
}
function history(...statuses: string[]): DealHistoryEntry[] {
    return statuses.map((status, index) => ({
        status,
        at: new Date(index * 1000).toISOString(),
        by: null,
        note: null,
    }));
}
function setup(t: test.TestContext, status: DealStatus = "contacted", visits: BrokerVisit[] = []) {
    const originalPipeline = {
        get: pipelineApi.get,
        setStage: pipelineApi.setStage,
        list: pipelineApi.list,
    };
    const originalVisits = {
        get: siteVisitsApi.get,
        searchSource: siteVisitsApi.searchSource,
        activeForLead: siteVisitsApi.activeForLead,
        book: siteVisitsApi.book,
        cancel: siteVisitsApi.cancel,
        reschedule: siteVisitsApi.reschedule,
        updateReminders: siteVisitsApi.updateReminders,
    };
    t.after(() => {
        Object.assign(pipelineApi, originalPipeline);
        Object.assign(siteVisitsApi, originalVisits);
    });
    const deal = {
        ...structuredClone(MOCK_DEALS[0]),
        id: "deal",
        status,
        property: { ...structuredClone(MOCK_DEALS[0].property), id: "property", isSold: false },
        history: history("new", "contacted", ...(status === "visit" ? ["site_visit"] : [])),
    } as DealDetail;
    const state = {
        deal,
        visits,
        writes: [] as string[],
        failBook: false,
        lostBookResponse: false,
        failCancel: false,
        failStage: false,
    };
    pipelineApi.get = async () => structuredClone(deal);
    pipelineApi.setStage = async (_id, next) => {
        if (state.failStage) throw new Error("stage failed");
        state.writes.push(`stage:${next}`);
        deal.status = next;
        deal.history.push({
            status: next === "visit" ? "site_visit" : next,
            at: new Date().toISOString(),
            note: null,
            by: null,
        });
    };
    pipelineApi.list = async () => ({
        items: [structuredClone(deal)],
        summary: { liveTotal: 1 } as Awaited<ReturnType<typeof pipelineApi.list>>["summary"],
    });
    const active = () =>
        visits.filter((visit) => visit.status === "confirmed" || visit.status === "scheduled");
    siteVisitsApi.get = async (id) =>
        structuredClone(visits.find((visit) => visit.id === id) ?? null);
    siteVisitsApi.searchSource = async () =>
        ({ items: structuredClone(active()) }) as VisitListPage;
    siteVisitsApi.activeForLead = async () => structuredClone(active()[0] ?? null);
    siteVisitsApi.book = async () => {
        state.writes.push("book");
        if (state.failBook) throw new Error("time unavailable");
        visits.push(booking());
        if (state.lostBookResponse) throw new Error("response lost");
    };
    siteVisitsApi.cancel = async (id) => {
        state.writes.push(`cancel:${id}`);
        if (state.failCancel) throw new Error("cancel failed");
        visits.find((visit) => visit.id === id)!.status = "cancelled";
    };
    siteVisitsApi.reschedule = async (id, body) => {
        const visit = visits.find((item) => item.id === id)!;
        visit.startsAt = body.startAt;
        return structuredClone(visit);
    };
    siteVisitsApi.updateReminders = async (id, reminders) => {
        const visit = visits.find((item) => item.id === id)!;
        visit.reminders = reminders;
        return structuredClone(visit);
    };
    return state;
}

test("booking from Visits moves the existing deal and uses its existing property", async (t) => {
    const state = setup(t);
    await bookVisitForDeal(input);
    assert.deepEqual(state.writes, ["book", "stage:visit"]);
    assert.equal(state.deal.status, "visit");
    assert.equal((await getDealWithVisit("deal")).nextVisitAt, input.startAt);
});

test("a failed booking leaves the original stage untouched without inventing a visit", async (t) => {
    const state = setup(t, "new");
    state.failBook = true;
    await assert.rejects(bookVisitForDeal(input), /time unavailable/);
    assert.deepEqual(state.writes, ["book"]);
    assert.equal(state.deal.status, "new");
    assert.equal(state.visits.length, 0);
});

test("a saved booking with a lost response is not rolled back or duplicated on retry", async (t) => {
    const state = setup(t);
    state.lostBookResponse = true;
    await bookVisitForDeal(input);
    assert.equal(state.deal.status, "visit");
    await bookVisitForDeal(input);
    assert.equal(state.visits.length, 1);
    assert.deepEqual(state.writes, ["book", "stage:visit"]);
});

test("a booked visit whose stage failed can be retried without booking twice", async (t) => {
    const state = setup(t);
    state.failStage = true;
    await assert.rejects(bookVisitForDeal(input), /visit was saved.*Pipeline could not be updated/);
    assert.equal(state.deal.status, "contacted");
    assert.equal(state.visits.length, 1);
    state.failStage = false;
    await bookVisitForDeal(input);
    assert.equal(state.deal.status, "visit");
    assert.equal(state.visits.length, 1);
});

test("the same saved booking is idempotent and finished deals cannot book visits", async (t) => {
    const state = setup(t, "visit", [booking()]);
    await bookVisitForDeal(input);
    state.deal.status = "closed";
    await assert.rejects(bookVisitForDeal(input), /finished/);
    assert.deepEqual(state.writes, []);
});

test("a separate follow-up visit is allowed and retries still find it after an earlier booking", async (t) => {
    const state = setup(t, "visit", [booking("earlier", { startsAt: "2026-11-30T05:00:00Z" })]);
    await bookVisitForDeal(input);
    await bookVisitForDeal(input);
    assert.equal(state.visits.length, 2);
    assert.deepEqual(state.writes, ["book"]);
});

test("leaving Site visit cancels all active bookings and preserves completed history", async (t) => {
    const state = setup(t, "visit", [
        booking("one"),
        booking("two"),
        booking("past", { status: "completed" }),
    ]);
    await moveDealWithVisits(state.deal, "negotiation", {});
    assert.deepEqual(state.writes, ["cancel:one", "cancel:two", "stage:negotiation"]);
    assert.equal(state.visits[2].status, "completed");
});

test("a failed cancellation prevents the stage move", async (t) => {
    const state = setup(t, "visit", [booking()]);
    state.failCancel = true;
    await assert.rejects(moveDealWithVisits(state.deal, "new", {}), /cancel failed/);
    assert.equal(state.deal.status, "visit");
});

test("partial failures explain that the visit was cancelled and retain its history", async (t) => {
    const state = setup(t, "visit", [booking()]);
    state.failStage = true;
    await assert.rejects(moveDealWithVisits(state.deal, "negotiation", {}), /visit was cancelled/);
    assert.equal(state.visits[0].status, "cancelled");
    state.failStage = false;
    await moveDealWithVisits(state.deal, "negotiation", {});
    assert.equal(state.deal.status, "negotiation");
});

test("cancelling from Visits restores the previous stage, including after a retry", async (t) => {
    const state = setup(t, "visit", [booking()]);
    state.deal.history = history("new", "negotiation", "site_visit", "site_visit");
    state.failStage = true;
    await assert.rejects(cancelVisitForDeal("visit"), /Pipeline could not be updated/);
    state.failStage = false;
    await cancelVisitForDeal("visit");
    assert.equal(state.deal.status, "negotiation");
    assert.equal(state.visits[0].status, "cancelled");
});

test("cancelling one booking leaves a deal with another active visit in Site visit", async (t) => {
    const state = setup(t, "visit", [booking("one"), booking("two")]);
    await cancelVisitForDeal("one");
    assert.equal(state.deal.status, "visit");
    assert.deepEqual(state.writes, ["cancel:one"]);
});

test("historical outcomes and a deal that has already advanced are preserved", async (t) => {
    const state = setup(t, "negotiation", [booking("past", { status: "completed" }), booking()]);
    await assert.rejects(cancelVisitForDeal("past"), /already been marked/);
    await cancelVisitForDeal("visit");
    assert.equal(state.deal.status, "negotiation");
    assert.equal(state.visits[0].status, "completed");
});

test("moving to Site visit without a booking is rejected", async (t) => {
    const state = setup(t);
    await assert.rejects(moveDealWithVisits(state.deal, "visit", {}), /Schedule a visit/);
    assert.deepEqual(state.writes, []);
});

test("rescheduling updates the shared booking and repairs its deal stage", async (t) => {
    const state = setup(t, "new", [booking()]);
    await rescheduleVisitForDeal("visit", { startAt: "2026-12-02T05:00:00Z", durationMinutes: 30 });
    assert.equal(state.deal.status, "visit");
    assert.equal((await getDealWithVisit("deal")).nextVisitAt, "2026-12-02T05:00:00Z");
});

test("Pipeline displays the earliest active visit and clears dates after cancellation", async (t) => {
    const state = setup(t, "visit", [
        booking("later", { startsAt: "2026-12-03T05:00:00Z" }),
        booking("earlier"),
    ]);
    let result = await listDealsWithVisits(DEFAULT_DEALS_FILTERS);
    assert.equal(result.items[0].nextVisitAt, input.startAt);
    await cancelVisitForDeal("earlier");
    result = await listDealsWithVisits(DEFAULT_DEALS_FILTERS);
    assert.equal(result.items[0].nextVisitAt, "2026-12-03T05:00:00Z");
    await cancelVisitForDeal("later");
    result = await listDealsWithVisits(DEFAULT_DEALS_FILTERS);
    assert.equal(result.items[0].nextVisitAt, null);
    assert.equal(state.visits.length, 2);
});

test("saving unchanged visit times can finish syncing after a stage update failed", async (t) => {
    const state = setup(t, "new", [booking()]);
    state.failStage = true;
    await assert.rejects(
        rescheduleVisitForDeal("visit", { startAt: input.startAt, durationMinutes: 30 }),
        /Pipeline could not be updated/,
    );
    state.failStage = false;
    await updateVisitRemindersForDeal("visit", [30]);
    assert.equal(state.deal.status, "visit");
    assert.equal(state.visits[0].status, "confirmed");
});

test("previous stage ignores non-stage activity and uses the existing Contacted stage as fallback", () => {
    assert.equal(
        stageBeforeVisit(history("new", "offer_made", "site_visit", "call_logged")),
        "negotiation",
    );
    assert.equal(stageBeforeVisit(history("site_visit")), "contacted");
});

test("parallel booking submissions cannot create two visits for the same deal", async (t) => {
    const state = setup(t);
    const results = await Promise.allSettled([bookVisitForDeal(input), bookVisitForDeal(input)]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(state.visits.length, 1);
});

test("sync recovery instructions are shown without exposing arbitrary runtime errors", () => {
    const message =
        "The visit was saved, but Pipeline could not be updated. Save again to finish syncing.";
    assert.equal(visitErrorMessage(new VisitSyncError(message)), message);
    assert.equal(
        visitErrorMessage(new Error("https://private-server.invalid stack trace")),
        "That didn't save. Check your connection and try again.",
    );
});
