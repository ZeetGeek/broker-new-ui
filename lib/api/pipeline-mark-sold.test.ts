import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { pipelineApi } from "@/lib/api/pipeline";

import { USE_MOCK_DATA } from "@/config";
import {
    markSoldBlockedReason,
    otherLiveClientCount,
    saleConfirmMode,
} from "@/features/pipeline/sale-mode";
import type { DealItem, DealStatus } from "@/features/pipeline/types";

function captureBodies(t: test.TestContext): unknown[] {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const bodies: unknown[] = [];
    api.defaults.adapter = async (config) => {
        bodies.push(JSON.parse(String(config.data ?? "{}")));
        return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
    return bodies;
}

test("setStage to closed sends closedAmount", { skip: USE_MOCK_DATA }, async (t) => {
    const bodies = captureBodies(t);
    await pipelineApi.setStage("lead-1", "closed", { closedAmountInr: 4_500_000 });
    assert.deepEqual(bodies, [{ status: "closed_won", closedAmount: 4_500_000 }]);
});

test("setStage to lost does not send closedAmount", { skip: USE_MOCK_DATA }, async (t) => {
    const bodies = captureBodies(t);
    await pipelineApi.setStage("lead-1", "lost", { closedAmountInr: 4_500_000 });
    assert.deepEqual(bodies, [{ status: "closed_lost" }]);
});

test("saleConfirmMode: only owner listings with the owner portal on wait for the owner", () => {
    assert.equal(saleConfirmMode({ isBrokerListing: true, ownerPortalOn: true }), "immediate");
    assert.equal(saleConfirmMode({ isBrokerListing: false, ownerPortalOn: true }), "owner");
    assert.equal(saleConfirmMode({ isBrokerListing: false, ownerPortalOn: false }), "immediate");
    assert.equal(saleConfirmMode({ isBrokerListing: true, ownerPortalOn: false }), "immediate");
});

function deal(
    id: string,
    status: DealStatus,
    propertyId: string,
    extra: { offerStatus?: DealItem["offerStatus"]; isSold?: boolean } = {},
): DealItem {
    return {
        id,
        status,
        offerStatus: extra.offerStatus ?? null,
        property: { id: propertyId, isSold: extra.isSold ?? false },
    } as DealItem;
}

test("markSoldBlockedReason explains a pending offer only in owner mode", () => {
    const pending = deal("d1", "negotiation", "p1", { offerStatus: "pending" });
    assert.equal(markSoldBlockedReason(pending, "owner"), "Waiting for the owner on your offer.");
    assert.equal(markSoldBlockedReason(pending, "immediate"), null);
});

test("markSoldBlockedReason refuses a sold property", () => {
    const sold = deal("d1", "negotiation", "p1", { isSold: true });
    assert.equal(markSoldBlockedReason(sold, "immediate"), "This property is already sold.");
    assert.equal(markSoldBlockedReason(deal("d2", "negotiation", "p1"), "immediate"), null);
});

test("otherLiveClientCount counts only other live deals on the same property", () => {
    const target = deal("d1", "negotiation", "p1");
    const deals = [
        target,
        deal("d2", "new", "p1"),
        deal("d3", "visit", "p1"),
        deal("d4", "lost", "p1"),
        deal("d5", "closed", "p1"),
        deal("d6", "contacted", "p2"),
    ];
    assert.equal(otherLiveClientCount(deals, target), 2);
});
