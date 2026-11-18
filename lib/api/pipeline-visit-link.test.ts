import assert from "node:assert/strict";
import test from "node:test";

import type { DealItem } from "@/features/pipeline/types";
import { scheduleVisitHref } from "@/features/pipeline/visit-link";

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
