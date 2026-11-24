import assert from "node:assert/strict";
import test from "node:test";

import {
    type BrokerVisit,
    siteVisitsApi,
    type VisitListPage,
    type VisitListQuery,
} from "@/lib/api/site-visits";

import {
    dashboardVisitPhase,
    groupDashboardVisits,
} from "@/features/new-dashboard/dashboard-visit";

const NOW = Date.parse("2026-11-23T09:30:00.000Z"); // 3:00 pm IST

function visit(id: string, startIst: string, endIst: string, extra: Partial<BrokerVisit> = {}) {
    return {
        id,
        startsAt: new Date(`${startIst}+05:30`).toISOString(),
        endsAt: new Date(`${endIst}+05:30`).toISOString(),
        status: "scheduled",
        ...extra,
    } as BrokerVisit;
}

test("phase follows the clock for unmarked visits", () => {
    assert.equal(
        dashboardVisitPhase(visit("a", "2026-11-23T12:30", "2026-11-23T13:15"), NOW),
        "needs_update",
    );
    assert.equal(
        dashboardVisitPhase(visit("b", "2026-11-23T14:45", "2026-11-23T15:30"), NOW),
        "running",
    );
    assert.equal(
        dashboardVisitPhase(visit("c", "2026-11-23T16:00", "2026-11-23T16:45"), NOW),
        "upcoming",
    );
});

test("marked and cancelled visits have no dashboard phase", () => {
    const base = ["2026-11-23T12:30", "2026-11-23T13:15"] as const;
    for (const status of ["completed", "no_show", "cancelled"] as const) {
        assert.equal(dashboardVisitPhase(visit(status, ...base, { status }), NOW), null);
    }
});

test("grouping keeps yesterday's unmarked visit and lists each visit once", () => {
    const elapsedToday = visit("today-elapsed", "2026-11-23T12:30", "2026-11-23T13:15");
    const yesterday = visit("yesterday", "2026-11-22T11:00", "2026-11-22T11:45");
    const groups = groupDashboardVisits(
        [
            elapsedToday,
            visit("running", "2026-11-23T14:45", "2026-11-23T15:30"),
            visit("later", "2026-11-23T16:00", "2026-11-23T16:45"),
        ],
        [elapsedToday, yesterday],
        NOW,
    );
    assert.deepEqual(
        groups.upcoming.map((v) => v.id),
        ["later"],
    );
    assert.deepEqual(
        groups.running.map((v) => v.id),
        ["running"],
    );
    assert.deepEqual(
        groups.needs_update.map((v) => v.id),
        ["today-elapsed", "yesterday"],
    );
});

test("needs-update count uses the API total when the list is cut short", async () => {
    const { needsUpdateCount } = await import("@/features/new-dashboard/dashboard-visit");
    assert.equal(needsUpdateCount(20, 35), 35);
    assert.equal(needsUpdateCount(3, 2), 3);
    assert.equal(needsUpdateCount(4, undefined), 4);
});

test("a next visit that has already started reads as happening now", async () => {
    const { visitStatusLabel } = await import("@/features/new-dashboard/dashboard-visit");
    const started = visit("s", "2026-11-23T14:45", "2026-11-23T15:30");
    assert.equal(visitStatusLabel(started, new Date(NOW)), "Happening now");
    const later = visit("l", "2026-11-23T16:00", "2026-11-23T16:45");
    assert.match(visitStatusLabel(later, new Date(NOW)), /^Starts in /);
});

test("the visit time names the day when it is not today", async () => {
    const { visitWhenLabel } = await import("@/features/new-dashboard/dashboard-visit");
    const today = visit("t", "2026-11-23T16:00", "2026-11-23T16:45");
    assert.equal(visitWhenLabel(today, new Date(NOW)), "4:00–4:45 PM");
    const tomorrow = visit("m", "2026-11-24T11:30", "2026-11-24T12:15");
    assert.equal(visitWhenLabel(tomorrow, new Date(NOW)), "Tue 24 Nov · 11:30 AM–12:15 PM");
});

test("busy visit ids are tracked per visit, so one finishing keeps another busy", async () => {
    const { withBusy } = await import("@/features/new-dashboard/dashboard-visit");
    const a = withBusy(new Set(), "a", true);
    const ab = withBusy(a, "b", true);
    const b = withBusy(ab, "a", false);
    assert.deepEqual([...b], ["b"]);
    assert.notEqual(b, ab);
});

test("today's paginated source keeps upcoming visits beyond earlier unmarked visits", async (t) => {
    const earlier = Array.from({ length: 100 }, (_, i) =>
        visit(`earlier-${i}`, "2026-11-23T09:00", "2026-11-23T09:30"),
    );
    const running = visit("running", "2026-11-23T14:45", "2026-11-23T15:30");
    const later = visit("later", "2026-11-23T16:00", "2026-11-23T16:45");
    const all = [...earlier, running, later];
    const counts = {
        upcoming: 1,
        running: 1,
        needs_update: 100,
        completed: 0,
        not_attended: 0,
        cancelled: 0,
    };
    const signal = new AbortController().signal;
    const requested: number[] = [];
    t.mock.method(
        siteVisitsApi,
        "list",
        async (query: VisitListQuery, receivedSignal?: AbortSignal) => {
            assert.equal(query.tab, "active");
            assert.equal(query.from, "2026-11-23");
            assert.equal(query.to, "2026-11-23");
            assert.equal(receivedSignal, signal);
            const page = query.page ?? 1;
            const limit = query.limit ?? 20;
            requested.push(page);
            return {
                items: all.slice((page - 1) * limit, page * limit),
                page,
                totalPages: 2,
                total: all.length,
                counts,
                clientOptions: [],
                propertyOptions: [],
                nextChangeAt: running.endsAt,
            } satisfies VisitListPage;
        },
    );
    const result = await siteVisitsApi.searchSource(
        { tab: "active", from: "2026-11-23", to: "2026-11-23", sort: "start_asc" },
        signal,
    );
    const groups = groupDashboardVisits(result.items, earlier.slice(0, 20), NOW);
    assert.deepEqual(requested, [1, 2]);
    assert.deepEqual(
        groups.upcoming.map((item) => item.id),
        ["later"],
    );
    assert.deepEqual(
        groups.running.map((item) => item.id),
        ["running"],
    );
    assert.equal(groups.needs_update.length, 100);
    assert.deepEqual(result.counts, counts);
    assert.equal(result.nextChangeAt, running.endsAt);
});

test("today's paginated source reports a later-page failure instead of a false empty result", async (t) => {
    t.mock.method(siteVisitsApi, "list", async (query: VisitListQuery) => {
        if (query.page === 2) throw new Error("Offline");
        return { items: [], totalPages: 2 } as unknown as VisitListPage;
    });
    await assert.rejects(siteVisitsApi.searchSource({ tab: "active" }), /Offline/);
});
