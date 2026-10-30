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

test("outcome dates use matching stage history instead of later record edits", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const base = {
        property: { id: "property", salePrice: "5000000", transactionType: "sale" },
        client: { id: "client", name: "Client" },
        updatedAt: "2026-10-30T10:00:00Z",
    };
    api.defaults.adapter = async (config) => ({
        data: {
            items: [
                {
                    ...base,
                    id: "finished",
                    stage: "closed_won",
                    stageHistory: [
                        { status: "closed_won", at: "2026-10-20T10:00:00Z" },
                        { status: "note", at: "2026-10-30T10:00:00Z" },
                    ],
                },
                {
                    ...base,
                    id: "lost",
                    stage: "closed_lost",
                    stageHistory: [
                        { status: "closed_lost", at: "2026-10-21T10:00:00Z" },
                        { status: "contacted", at: "2026-10-22T10:00:00Z" },
                        { status: "closed_lost", at: "2026-10-23T10:00:00Z" },
                    ],
                },
                { ...base, id: "unknown-date", stage: "closed_won" },
            ],
            totalPages: 1,
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });
    const { items } = await pipelineApi.list(DEFAULT_DEALS_FILTERS);
    assert.equal(items.find((item) => item.id === "finished")?.resolvedAt, "2026-10-20T10:00:00Z");
    assert.equal(items.find((item) => item.id === "lost")?.resolvedAt, "2026-10-23T10:00:00Z");
    assert.equal(items.find((item) => item.id === "unknown-date")?.resolvedAt, null);
});

test("lost reasons are read only from saved API values and omitted when absent", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const base = {
        stage: "closed_lost",
        property: { id: "property", salePrice: "5000000", transactionType: "sale" },
        client: { id: "client", name: "Client" },
    };
    const leads = [
        { ...base, id: "known", lostReason: "price" },
        { ...base, id: "custom", lostReason: "  Client postponed their move  " },
        { ...base, id: "missing" },
        { ...base, id: "null", lostReason: null },
        { ...base, id: "blank", lostReason: "  " },
        { ...base, id: "finished", stage: "closed_won", lostReason: "price" },
    ];
    api.defaults.adapter = async (config) => ({
        data: config.url?.endsWith("/known") ? leads[0] : { items: leads, totalPages: 1 },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });
    const { items } = await pipelineApi.list(DEFAULT_DEALS_FILTERS);
    assert.equal(items.find((item) => item.id === "known")?.lostReason, "price");
    assert.equal(
        items.find((item) => item.id === "custom")?.lostReason,
        "Client postponed their move",
    );
    for (const id of ["missing", "null", "blank", "finished"]) {
        assert.equal(items.find((item) => item.id === id)?.lostReason, undefined);
    }
    assert.equal((await pipelineApi.get("known")).lostReason, "price");
});
