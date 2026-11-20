import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { pipelineApi } from "@/lib/api/pipeline";

import { USE_MOCK_DATA } from "@/config";
import { dealAsClosed } from "@/features/pipeline/closed-as";
import {
    canPutBackOnBoard,
    findDealForMove,
    markSoldBlockedReason,
    otherLiveClientCount,
    saleConfirmMode,
} from "@/features/pipeline/sale-mode";
import { type DealItem, type DealStatus, DEFAULT_DEALS_FILTERS } from "@/features/pipeline/types";

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

test("setStage to closed sends closedAs when given", { skip: USE_MOCK_DATA }, async (t) => {
    const bodies = captureBodies(t);
    await pipelineApi.setStage("lead-1", "closed", { closedAmountInr: 35_000, closedAs: "rent" });
    assert.deepEqual(bodies, [{ status: "closed_won", closedAmount: 35_000, closedAs: "rent" }]);
});

test("a Sale & Rent listing is marked on the deal", { skip: USE_MOCK_DATA }, async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const lead = (id: string, transactionType: string) => ({
        id,
        stage: "negotiation",
        stageHistory: [],
        client: { id: `c-${id}`, name: "Ravi" },
        property: {
            id: `p-${id}`,
            title: "3 BHK in Vesu",
            city: "Surat",
            transactionType,
            salePrice: "9000000",
            monthlyRent: "35000",
            commissionPercent: 2,
            commissionAmount: "30000",
        },
    });
    api.defaults.adapter = async (config) => ({
        data: { items: [lead("both", "both"), lead("sale", "sale")], totalPages: 1 },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });

    const { items } = await pipelineApi.list(DEFAULT_DEALS_FILTERS);
    const both = items.find((deal) => deal.id === "both");
    const sale = items.find((deal) => deal.id === "sale");
    assert.deepEqual(both?.property.saleAndRent, {
        salePriceInr: 9_000_000,
        monthlyRentInr: 35_000,
    });
    assert.equal(sale?.property.saleAndRent, undefined);
});

test("dealAsClosed values a Sale & Rent deal the way it closed", () => {
    const both = {
        id: "d1",
        status: "negotiation",
        offerAmountInr: 85_00_000,
        offerStatus: "accepted",
        property: {
            id: "p1",
            isRent: false,
            amountInr: 90_00_000,
            saleAndRent: { salePriceInr: 90_00_000, monthlyRentInr: 35_000 },
        },
    } as DealItem;

    const rented = dealAsClosed(both, "rent");
    assert.equal(rented.property.isRent, true);
    assert.equal(rented.property.amountInr, 35_000);
    assert.equal(rented.offerAmountInr, null);
    assert.equal(rented.offerStatus, null);

    const sold = dealAsClosed(both, "sale");
    assert.equal(sold.property.isRent, false);
    assert.equal(sold.property.amountInr, 90_00_000);
    assert.equal(sold.offerAmountInr, 85_00_000);
    // The original deal is untouched.
    assert.equal(both.property.isRent, false);
});

test("setStage to lost sends the reason, not closedAmount", { skip: USE_MOCK_DATA }, async (t) => {
    const bodies = captureBodies(t);
    await pipelineApi.setStage("lead-1", "lost", {
        closedAmountInr: 4_500_000,
        lostReason: "price",
    });
    assert.deepEqual(bodies, [{ status: "closed_lost", lostReason: "price" }]);
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

test("findDealForMove falls back to the open deal when it is not on the loaded board", () => {
    const onBoard = deal("d1", "negotiation", "p1");
    const opened = deal("d9", "negotiation", "p9");
    assert.equal(findDealForMove([onBoard], opened, "d1"), onBoard);
    assert.equal(findDealForMove([onBoard], opened, "d9"), opened);
    assert.equal(findDealForMove(null, opened, "d9"), opened);
    assert.equal(findDealForMove([onBoard], opened, "d5"), null);
    assert.equal(findDealForMove([onBoard], null, "d5"), null);
});

test("canPutBackOnBoard: on a sold property only the sold deal of a broker listing", () => {
    const soldOwn = { ...deal("d1", "closed", "p1", { isSold: true }) };
    soldOwn.property = { ...soldOwn.property, isBrokerListing: true };
    const soldOwner = deal("d2", "closed", "p2", { isSold: true });
    const lostOnSold = { ...deal("d3", "lost", "p1", { isSold: true }) };
    lostOnSold.property = { ...lostOnSold.property, isBrokerListing: true };
    assert.equal(canPutBackOnBoard(soldOwn), true);
    assert.equal(canPutBackOnBoard(soldOwner), false);
    assert.equal(canPutBackOnBoard(lostOnSold), false);
    assert.equal(canPutBackOnBoard(deal("d4", "lost", "p4")), true);
});

test("markSoldBlockedReason: a draft property can't be sold", () => {
    const draft = deal("d1", "negotiation", "p1");
    draft.property = { ...draft.property, isDraft: true };
    assert.equal(
        markSoldBlockedReason(draft, "immediate"),
        "Publish this property before marking it sold.",
    );
    assert.equal(
        markSoldBlockedReason(draft, "owner"),
        "Publish this property before marking it sold.",
    );
});
