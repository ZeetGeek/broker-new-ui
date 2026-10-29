import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { pipelineApi } from "@/lib/api/pipeline";

import { DEFAULT_DEALS_FILTERS } from "@/features/pipeline/types";

test("pipeline uses API records without inventing contact dates, locations or closed amounts", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const lead = {
        id: "real-lead",
        stage: "closed_won",
        offerAmount: "4500000",
        updatedAt: "2026-10-28T10:00:00Z",
        property: { id: "property", salePrice: "5000000", transactionType: "sale" },
        client: { id: "client", name: "Client from API" },
    };
    api.defaults.adapter = async (config) => ({
        data: config.url?.includes("/real-lead") ? lead : { items: [lead], totalPages: 1 },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });
    const result = await pipelineApi.list(DEFAULT_DEALS_FILTERS);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, lead.id);
    assert.equal(result.items[0].lastContactedAt, null);
    assert.equal(result.items[0].closedAmountInr, null);
    assert.equal(result.items[0].property.city, "");
    assert.equal(result.items[0].property.imageSrc, "");
    const detail = await pipelineApi.get(lead.id);
    assert.equal(detail.closedAmountInr, null);
    assert.deepEqual(detail.history, []);
});
