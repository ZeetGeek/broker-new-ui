import assert from "node:assert/strict";
import test from "node:test";

import { checkVisitConflicts } from "@/lib/visits/conflicts";

import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";

function visit(overrides: Partial<BrokerSiteVisit> = {}): BrokerSiteVisit {
    return {
        id: "v_existing",
        source: "slot",
        propertyId: "p_1",
        propertySource: "marketplace",
        ownerId: "o_1",
        brokerId: "broker_me",
        buyerIds: ["b_1"],
        startsAt: "2026-09-15T04:00:00.000Z",
        endsAt: "2026-09-15T04:45:00.000Z",
        status: "confirmed",
        remindBuyer: true,
        createdAt: "2026-09-14T04:00:00.000Z",
        updatedAt: "2026-09-14T04:00:00.000Z",
        property: {
            id: "p_1",
            title: "Riverstone Residency",
            configLabel: "2 BHK",
            propertyType: "Apartment",
            locality: "Adajan",
            city: "Surat",
            address: "Adajan, Surat",
            areaSqft: 1320,
            amountInr: 8_200_000,
            purpose: "sale",
        },
        owner: { id: "o_1", name: "Ramesh Shah" },
        buyers: [{ id: "b_1", name: "Meera Desai" }],
        distanceKm: 11.4,
        driveMinutes: 28,
        ...overrides,
    };
}

const now = new Date("2026-09-14T03:30:00.000Z");

test("blocks overlapping broker bookings hard; buyer overlap is advisory", () => {
    const result = checkVisitConflicts(
        {
            startsAt: "2026-09-15T04:15:00.000Z",
            endsAt: "2026-09-15T05:00:00.000Z",
            buyerIds: ["b_1"],
            locality: "Vesu",
        },
        [visit()],
        {},
        now,
    );
    assert.equal(result.level, "clash");
    assert.deepEqual(
        result.reasons.map((reason) => reason.code),
        ["OVERLAP", "BUYER_BUSY"],
    );
});

test("ignores an existing visit for the same open slot", () => {
    const result = checkVisitConflicts(
        {
            startsAt: "2026-09-15T04:15:00.000Z",
            endsAt: "2026-09-15T05:00:00.000Z",
            buyerIds: ["b_1"],
            locality: "Vesu",
            slotId: "slot_1",
        },
        [visit({ slotId: "slot_1" })],
        {},
        now,
    );
    assert.equal(result.level, "clear");
});

test("blocks a visit inside the notice window", () => {
    const result = checkVisitConflicts(
        {
            startsAt: "2026-09-14T04:00:00.000Z",
            endsAt: "2026-09-14T04:45:00.000Z",
            buyerIds: ["b_2"],
            locality: "Vesu",
        },
        [],
        {},
        now,
    );
    assert.equal(result.level, "clash");
    assert.equal(result.reasons[0].code, "TOO_SOON");
});

test("returns a concrete travel warning with distance and drive time", () => {
    const result = checkVisitConflicts(
        {
            startsAt: "2026-09-15T05:00:00.000Z",
            endsAt: "2026-09-15T05:45:00.000Z",
            buyerIds: ["b_2"],
            locality: "Vesu",
        },
        [visit()],
        { v_existing: { minutes: 28, distanceKm: 11.4 } },
        now,
    );
    assert.equal(result.level, "tight");
    assert.match(result.reasons[0].message, /15 min gap.*11\.4 km.*28 min/);
});

test("marks back-to-back visits as warning-only", () => {
    const result = checkVisitConflicts(
        {
            startsAt: "2026-09-15T04:45:00.000Z",
            endsAt: "2026-09-15T05:30:00.000Z",
            buyerIds: ["b_2"],
            locality: "Vesu",
        },
        [visit()],
        {},
        now,
    );
    assert.equal(result.level, "tight");
    assert.equal(result.reasons[0].code, "BACK_TO_BACK");
});

test("warns on a sixth visit and a late-evening finish", () => {
    const existing = Array.from({ length: 5 }, (_, index) =>
        visit({
            id: `v_${index}`,
            startsAt: `2026-09-15T${String(1 + index).padStart(2, "0")}:00:00.000Z`,
            endsAt: `2026-09-15T${String(1 + index).padStart(2, "0")}:30:00.000Z`,
            buyerIds: [`b_${index + 10}`],
        }),
    );
    const result = checkVisitConflicts(
        {
            startsAt: "2026-09-15T14:45:00.000Z",
            endsAt: "2026-09-15T15:45:00.000Z",
            buyerIds: ["b_99"],
            locality: "Vesu",
        },
        existing,
        {},
        now,
    );
    assert.equal(result.level, "tight");
    assert.ok(result.reasons.some((reason) => reason.code === "DAY_OVERLOAD"));
    assert.ok(result.reasons.some((reason) => reason.code === "LATE_EVENING"));
});

test("ignores cancelled visits", () => {
    const result = checkVisitConflicts(
        {
            startsAt: "2026-09-15T04:15:00.000Z",
            endsAt: "2026-09-15T05:00:00.000Z",
            buyerIds: ["b_1"],
            locality: "Vesu",
        },
        [visit({ status: "cancelled_by_owner" })],
        {},
        now,
    );
    assert.equal(result.level, "clear");
});
