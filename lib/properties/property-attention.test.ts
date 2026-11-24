import assert from "node:assert/strict";
import test, { afterEach, beforeEach, mock } from "node:test";

import type { BrokerVisit } from "@/lib/api/site-visits";

import type { DealItem } from "@/features/pipeline/types";
import { buildPropertyAttention } from "@/features/properties/property-analytics/property-attention-model";
import { type Task, taskSchema } from "@/features/tasks/model";

// 10 AM in India; tests must also behave on a computer using a different timezone.
const NOW = Date.parse("2026-11-23T04:30:00Z");
beforeEach(() => {
    mock.method(Date, "now", () => NOW);
});
afterEach(() => mock.restoreAll());

function task(patch: Partial<Task> = {}): Task {
    return taskSchema.parse({
        id: "t1",
        title: "Discuss the revised offer",
        details: "",
        dueDate: "2026-11-23",
        dueTime: "16:00",
        reminders: [],
        clientId: "c1",
        propertyId: "p1",
        completedAt: null,
        priority: "low",
        createdAt: "2026-11-20T00:00:00Z",
        updatedAt: "2026-11-20T00:00:00Z",
        deliveredReminderKeys: [],
        ...patch,
    });
}
function deal(patch: Partial<DealItem> = {}): DealItem {
    return {
        id: "d1",
        status: "negotiation",
        buyer: { id: "c1", name: "Saved client" },
        property: { id: "p1" },
        lastContactedAt: "2026-11-01T04:30:00Z",
        stageEnteredAt: "2026-11-01T04:30:00Z",
        ...patch,
    } as DealItem;
}
function visit(patch: Partial<BrokerVisit> = {}): BrokerVisit {
    return {
        id: "v1",
        clientName: "Visit client",
        propertyId: "p1",
        status: "confirmed",
        startsAt: "2026-11-22T06:30:00Z",
        endsAt: "2026-11-22T07:00:00Z",
        ...patch,
    } as BrokerVisit;
}

test("attention uses saved task titles and dates, excluding other properties, completed, deleted and future tasks", () => {
    const items = buildPropertyAttention(
        "p1",
        [
            task(),
            task({ id: "overdue", dueDate: "2026-11-22" }),
            task({ id: "elsewhere", propertyId: "p2" }),
            task({ id: "completed", completedAt: "2026-11-22T10:00:00Z" }),
            task({ id: "deleted", deletedAt: "2026-11-22T10:00:00Z" }),
            task({ id: "future", dueDate: "2026-11-25" }),
        ],
        [],
        [],
    );
    assert.deepEqual(
        items.map((item) => item.id),
        ["task:overdue", "task:t1"],
    );
    assert.equal(items[1].title, "Discuss the revised offer");
    assert.match(items[1].detail, /Today, 4:00 PM/);
    assert.equal(items[1].href, "/broker/tasks?view=detail&task=t1");
});

test("client-only tasks match live deals by ID, but an explicit different property never matches", () => {
    const items = buildPropertyAttention(
        "p1",
        [
            task({ propertyId: null }),
            task({ id: "other-property", propertyId: "p2" }),
            task({ id: "unrelated-client", propertyId: null, clientId: "someone-else" }),
        ],
        [deal()],
        [],
    );
    assert.deepEqual(
        items.map((item) => item.id),
        ["task:t1"],
    );
    assert.match(items[0].detail, /Saved client/);
    assert.match(items[0].detail, /Client task/);
});

test("Visits contributes only past visits still awaiting an outcome on this property", () => {
    const items = buildPropertyAttention(
        "p1",
        [],
        [],
        [
            visit(),
            visit({ id: "completed", status: "completed" }),
            visit({ id: "cancelled", status: "cancelled" }),
            visit({ id: "not-attended", status: "no_show" }),
            visit({ id: "other", propertyId: "p2" }),
            visit({
                id: "future",
                startsAt: "2026-11-24T06:30:00Z",
                endsAt: "2026-11-24T07:00:00Z",
            }),
        ],
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].title, "Record the visit outcome");
    assert.match(items[0].detail, /Visit client/);
    assert.match(items[0].detail, /12:00 PM IST/);
    assert.match(items[0].href, /visit=v1/);
});

test("Pipeline attention follows quiet-deal rules and never invents an owner reply or offer deadline", () => {
    const items = buildPropertyAttention(
        "p1",
        [],
        [
            deal(),
            deal({
                id: "fresh",
                lastContactedAt: "2026-11-22T04:30:00Z",
                offerAmountInr: 5000000,
                offerStatus: "pending",
            }),
            deal({ id: "unknown", lastContactedAt: null, stageEnteredAt: "" }),
            deal({ id: "closed", status: "closed" }),
            deal({ id: "lost", status: "lost" }),
            deal({ id: "other", property: { id: "p2" } as DealItem["property"] }),
        ],
        [],
    );
    assert.deepEqual(
        items.map((item) => item.id),
        ["deal:d1"],
    );
    assert.equal(items[0].detail, "No contact logged for 22 days");
    assert.equal(items[0].href, "/broker/pipeline/d1");
    assert.equal(items[0].urgent, false);
});

test("a future scheduled follow-up suppresses a duplicate quiet-deal reminder", () => {
    assert.deepEqual(
        buildPropertyAttention("p1", [task({ dueDate: "2026-11-25" })], [deal()], []),
        [],
    );
});

test("completed tasks and updated visit outcomes disappear instead of remaining as demo alerts", () => {
    const initial = buildPropertyAttention("p1", [task()], [], [visit()]);
    assert.equal(initial.length, 2);
    const updated = buildPropertyAttention(
        "p1",
        [task({ completedAt: "2026-11-23T04:29:00Z" })],
        [],
        [visit({ status: "completed" })],
    );
    assert.deepEqual(updated, []);
});

test("no related records means no fabricated sample items", () => {
    assert.deepEqual(buildPropertyAttention("p1", [], [], []), []);
});
