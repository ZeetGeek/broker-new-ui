import assert from "node:assert/strict";
import test from "node:test";

import type { EarningsReport } from "@/features/earnings/earnings-math";
import { pipelineView } from "@/features/new-dashboard/pipeline-view";

const zero = { new: 0, contacted: 0, visit: 0, negotiation: 0 };

function live(overrides: Partial<EarningsReport["live"]> = {}): EarningsReport["live"] {
    return {
        count: 0,
        saleValueInr: 0,
        saleCount: 0,
        stageCounts: zero,
        stageCommissionInr: zero,
        stageSaleValueInr: zero,
        stageMonthlyRentInr: zero,
        rentValueInr: 0,
        stalledCount: 0,
        potentialInr: 0,
        valuedCount: 0,
        likelyInr: 0,
        likelyCount: 0,
        acceptedOfferCount: 0,
        topDeals: [],
        ...overrides,
    };
}

test("pipeline view lists the four live stages in board order with their values", () => {
    const view = pipelineView(
        live({
            count: 24,
            saleValueInr: 9_42_00_000,
            rentValueInr: 50_000,
            stageCounts: { new: 10, contacted: 7, visit: 4, negotiation: 3 },
            stageSaleValueInr: { new: 2_30_00_000, contacted: 0, visit: 0, negotiation: 0 },
            stageMonthlyRentInr: { new: 22_000, contacted: 0, visit: 28_000, negotiation: 0 },
        }),
    );
    assert.equal(view.total, 24);
    assert.equal(view.saleValueInr, 9_42_00_000);
    assert.equal(view.rentValueInr, 50_000);
    assert.deepEqual(
        view.stages.map((stage) => stage.id),
        ["new", "contacted", "visit", "negotiation"],
    );
    assert.deepEqual(
        view.stages.map((stage) => stage.label),
        ["New", "Contacted", "Site visit", "Negotiation"],
    );
    assert.deepEqual(view.stages[0], {
        id: "new",
        label: "New",
        count: 10,
        saleValueInr: 2_30_00_000,
        rentValueInr: 22_000,
        color: "bg-stage-1",
        chartColor: "var(--color-stage-1)",
    });
});

test("total is the live deal count, not the stage sum", () => {
    const view = pipelineView(
        live({ count: 5, stageCounts: { new: 1, contacted: 1, visit: 1, negotiation: 1 } }),
    );
    assert.equal(view.total, 5);
});

test("a broker with no live deals gets four zero stages", () => {
    const view = pipelineView(live());
    assert.equal(view.total, 0);
    assert.equal(view.stages.length, 4);
    assert.ok(view.stages.every((stage) => stage.count === 0 && stage.saleValueInr === 0));
});

test("an older API without per-stage values still renders counts", () => {
    const old = live({
        count: 2,
        stageCounts: { new: 2, contacted: 0, visit: 0, negotiation: 0 },
    }) as Partial<EarningsReport["live"]>;
    delete old.stageSaleValueInr;
    delete old.stageMonthlyRentInr;
    delete old.rentValueInr;
    const view = pipelineView(old as EarningsReport["live"]);
    assert.equal(view.stages[0]?.count, 2);
    assert.equal(view.stages[0]?.saleValueInr, 0);
    assert.equal(view.rentValueInr, 0);
});
