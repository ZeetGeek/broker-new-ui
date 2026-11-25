import assert from "node:assert/strict";
import test from "node:test";

import type { DealItem } from "@/features/pipeline/types";
import {
    canOpenVisitAction,
    canScheduleVisit,
    scheduleVisitHref,
} from "@/features/pipeline/visit-link";

function deal(id: string, clientId: string, propertyId: string): DealItem {
    return { id, buyer: { id: clientId }, property: { id: propertyId } } as DealItem;
}

test("scheduleVisitHref opens Visits' schedule form with the deal's client and property", () => {
    const url = new URL(scheduleVisitHref(deal("lead-1", "client-9", "prop-3")), "https://x.test");
    assert.equal(url.pathname, "/broker/visits");
    assert.equal(url.searchParams.get("schedule"), "1");
    assert.equal(url.searchParams.get("clientId"), "client-9");
    assert.equal(url.searchParams.get("propertyId"), "prop-3");
    assert.equal(url.searchParams.get("leadId"), "lead-1");
});

test("scheduleVisitHref encodes ids safely", () => {
    const url = new URL(scheduleVisitHref(deal("a&b", "c d", "e/f")), "https://x.test");
    assert.equal(url.searchParams.get("leadId"), "a&b");
    assert.equal(url.searchParams.get("clientId"), "c d");
    assert.equal(url.searchParams.get("propertyId"), "e/f");
});

test("only deals on the broker's own exclusive listings offer scheduling", () => {
    const exclusive = { property: { isExclusiveProperty: true } } as DealItem;
    const ownerListed = { property: { isExclusiveProperty: false } } as DealItem;
    const unknown = { property: {} } as DealItem;
    assert.equal(canScheduleVisit(exclusive), true);
    assert.equal(canScheduleVisit(ownerListed), false);
    assert.equal(canScheduleVisit(unknown), false);
});

test("booked visits expose their workflow even when the listing omits the exclusive flag", () => {
    const booked = { property: {}, nextVisitAt: "2026-11-27T12:00:00Z" } as DealItem;
    assert.equal(canOpenVisitAction(booked), true);
    assert.equal(canOpenVisitAction({ ...booked, nextVisitAt: null }), false);
    assert.equal(canOpenVisitAction({ ...booked, nextVisitAt: "invalid" }), false);
    assert.equal(
        canOpenVisitAction({
            ...booked,
            property: { ...booked.property, isExclusiveProperty: true },
            nextVisitAt: null,
        }),
        true,
    );
});
