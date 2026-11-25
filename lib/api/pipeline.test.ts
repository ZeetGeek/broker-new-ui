import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { pipelineApi } from "@/lib/api/pipeline";
import { EMPTY_PROPERTY_CRITERIA } from "@/lib/properties/list-criteria";

import { DEFAULT_DEALS_FILTERS, hasActiveDealsFilters } from "@/features/pipeline/types";

test("pipeline loads remaining pages with bounded concurrency and keeps every deal", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    let active = 0;
    let peak = 0;
    const requested: number[] = [];
    api.defaults.adapter = async (config) => {
        const page = Number(new URL(config.url!, "https://example.test").searchParams.get("page"));
        requested.push(page);
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, (8 - page) * 2));
        active -= 1;
        return {
            data: {
                items: [
                    {
                        id: `deal-${page}`,
                        stage: "new",
                        createdAt: "2026-11-01T00:00:00Z",
                        property: {
                            id: `property-${page}`,
                            salePrice: "1000000",
                            transactionType: "sale",
                        },
                        client: { id: `client-${page}`, name: `Client ${page}` },
                    },
                ],
                totalPages: 7,
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const result = await pipelineApi.list(DEFAULT_DEALS_FILTERS);
    assert.equal(peak, 3);
    assert.deepEqual(requested, [1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(
        result.items.map((item) => item.id),
        Array.from({ length: 7 }, (_, i) => `deal-${i + 1}`),
    );
    assert.equal(result.summary.liveTotal, 7);
});

test("pipeline does not publish partial results when a later API page fails", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = async (config) => {
        const page = Number(new URL(config.url!, "https://example.test").searchParams.get("page"));
        if (page === 3) throw new Error("Page unavailable");
        return {
            data: { items: [], totalPages: 4 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    await assert.rejects(pipelineApi.list(DEFAULT_DEALS_FILTERS));
});

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

test("pipeline sends the filter sheet to the leads API as query params", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const urls: string[] = [];
    api.defaults.adapter = async (config) => {
        urls.push(config.url ?? "");
        return {
            data: { items: [], totalPages: 1 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    await pipelineApi.list({
        ...DEFAULT_DEALS_FILTERS,
        dealType: "sale",
        propertyFilters: {
            ...EMPTY_PROPERTY_CRITERIA,
            where: "Andheri",
            min: "5000000",
            bhk: ["2", "3"],
            furnishing: "semi",
        },
    });
    const params = new URL(urls[0], "http://x").searchParams;
    assert.equal(params.get("transactionType"), "sale");
    assert.equal(params.get("where"), "Andheri");
    assert.equal(params.get("minPrice"), "5000000");
    assert.deepEqual(params.getAll("bhk"), ["2", "3"]);
    assert.equal(params.get("furnishingStatus"), "semi");
    assert.equal(params.get("page"), "1");
});

test("pipeline search is sent to the API and its results are kept as returned", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const sale = { salePrice: "5000000", transactionType: "sale" };
    const leads = [
        {
            id: "baner",
            stage: "new",
            property: { id: "p2", ...sale, address: "Baner", city: "Pune" },
            client: { id: "c2", name: "Meera Iyer", phone: "9123456789" },
        },
        {
            // The server matched this one on a field the card does not show
            // as text (e.g. the BHK); the browser must not filter it out again.
            id: "wakad",
            stage: "contacted",
            property: { id: "p3", ...sale, address: "Wakad", city: "Pune" },
            client: { id: "c3", name: "Anil Rao" },
        },
    ];
    const searches: (string | null)[] = [];
    api.defaults.adapter = async (config) => {
        const params = new URL(config.url ?? "", "http://x").searchParams;
        searches.push(params.get("search"));
        return {
            data: { items: params.get("search") ? leads : [], totalPages: 1 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };

    const result = await pipelineApi.list({ ...DEFAULT_DEALS_FILTERS, q: "  ravi andheri " });
    assert.deepEqual(searches, ["ravi andheri"], "trimmed search goes to the API");
    assert.deepEqual(result.items.map((deal) => deal.id).sort(), ["baner", "wakad"]);
    assert.equal(result.summary.counts.new, 1, "stage counts follow the search");
    assert.equal(result.summary.counts.contacted, 1);

    searches.length = 0;
    await pipelineApi.list({ ...DEFAULT_DEALS_FILTERS, q: "   " });
    assert.deepEqual(searches, [null], "a blank search is not sent");
});

test("pipeline filter state: whitespace search and empty sheet are not filters", () => {
    assert.equal(hasActiveDealsFilters(DEFAULT_DEALS_FILTERS), false);
    assert.equal(hasActiveDealsFilters({ ...DEFAULT_DEALS_FILTERS, q: "   " }), false);
    assert.equal(
        hasActiveDealsFilters({
            ...DEFAULT_DEALS_FILTERS,
            propertyFilters: { ...EMPTY_PROPERTY_CRITERIA },
        }),
        false,
    );
    assert.equal(hasActiveDealsFilters({ ...DEFAULT_DEALS_FILTERS, q: "ravi" }), true);
    assert.equal(hasActiveDealsFilters({ ...DEFAULT_DEALS_FILTERS, stage: "visit" }), true);
    assert.equal(hasActiveDealsFilters({ ...DEFAULT_DEALS_FILTERS, dealType: "rent" }), true);
    assert.equal(
        hasActiveDealsFilters({
            ...DEFAULT_DEALS_FILTERS,
            propertyFilters: { ...EMPTY_PROPERTY_CRITERIA, category: "land" },
        }),
        true,
    );
});
