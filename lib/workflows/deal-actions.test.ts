import assert from "node:assert/strict";
import test from "node:test";

import { pipelineApi } from "@/lib/api/pipeline";
import { saveWorkflowDealOffer, saveWorkflowDealStage } from "@/lib/workflows/deal-actions";

import type { DealDetail, DealItem } from "@/features/pipeline/types";

function deal(extra: Partial<DealItem> = {}): DealDetail {
    return {
        id: "deal-1",
        status: "negotiation",
        offerStatus: null,
        property: { id: "property-1", isBrokerListing: true, isSold: false, isDraft: false },
        ...extra,
    } as DealDetail;
}

function capture(t: test.TestContext, current: DealDetail) {
    const previous = {
        get: pipelineApi.get,
        setStage: pipelineApi.setStage,
        makeOffer: pipelineApi.makeOffer,
    };
    t.after(() => Object.assign(pipelineApi, previous));
    const writes: unknown[] = [];
    pipelineApi.get = async (id) => {
        assert.equal(id, current.id);
        return current;
    };
    pipelineApi.setStage = async (...args) => {
        writes.push({ stage: args });
    };
    pipelineApi.makeOffer = async (...args) => {
        writes.push({ offer: args });
    };
    return writes;
}

test("same-page sold confirmation preserves the final price and note on broker inventory", async (t) => {
    const current = deal();
    const writes = capture(t, current);
    assert.equal(
        await saveWorkflowDealStage(
            current,
            "closed",
            "Commission agreed",
            { closedAmountInr: 4500000 },
            false,
        ),
        "immediate",
    );
    assert.deepEqual(writes, [
        { stage: ["deal-1", "closed", { note: "Commission agreed", closedAmountInr: 4500000 }] },
    ]);
});

test("owner listings still require owner confirmation when that portal is enabled", async (t) => {
    const current = deal({
        property: { id: "property-1", isBrokerListing: false } as DealItem["property"],
    });
    const writes = capture(t, current);
    assert.equal(
        await saveWorkflowDealStage(
            current,
            "closed",
            "Final terms",
            { closedAmountInr: 4500000 },
            true,
        ),
        "owner",
    );
    assert.deepEqual(writes, [{ offer: ["deal-1", 4500000, "Final terms"] }]);
});

test("a stale confirmation cannot overwrite a newer stage", async (t) => {
    const snapshot = deal();
    const writes = capture(t, deal({ status: "lost" }));
    await assert.rejects(
        saveWorkflowDealStage(snapshot, "closed", "", { closedAmountInr: 4500000 }, false),
        /deal has changed/,
    );
    assert.deepEqual(writes, []);
});

test("sold confirmations reject absent prices and newly sold or draft properties before writes", async (t) => {
    const current = deal();
    const writes = capture(t, current);
    await assert.rejects(saveWorkflowDealStage(current, "closed", "", {}, false), /final price/);
    current.property.isSold = true;
    await assert.rejects(
        saveWorkflowDealStage(current, "closed", "", { closedAmountInr: 4500000 }, false),
        /already sold/,
    );
    current.property.isSold = false;
    current.property.isDraft = true;
    await assert.rejects(
        saveWorkflowDealStage(current, "closed", "", { closedAmountInr: 4500000 }, false),
        /Publish this property/,
    );
    assert.deepEqual(writes, []);
});

test("a newly pending owner offer preserves the consent gate", async (t) => {
    const current = deal({
        offerStatus: "pending",
        property: { id: "property-1", isBrokerListing: false } as DealItem["property"],
    });
    const writes = capture(t, current);
    await assert.rejects(
        saveWorkflowDealStage(current, "closed", "", { closedAmountInr: 4500000 }, true),
        /Waiting for the owner/,
    );
    assert.deepEqual(writes, []);
});

test("shared offer submission keeps launch mode and live-deal restrictions", async (t) => {
    const current = deal();
    const writes = capture(t, current);
    await assert.rejects(saveWorkflowDealOffer(current.id, 4000000, "", false), /not available/);
    current.status = "closed";
    await assert.rejects(saveWorkflowDealOffer(current.id, 4000000, "", true), /deal is finished/);
    current.status = "negotiation";
    await saveWorkflowDealOffer(current.id, 4000000, "Ready to close", true);
    assert.deepEqual(writes, [{ offer: ["deal-1", 4000000, "Ready to close"] }]);
});
