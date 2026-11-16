import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { CALL_LOGGED_NOTE, pipelineApi } from "@/lib/api/pipeline";
import { formatPrice } from "@/lib/format/price";

import { describeStageHistory } from "@/features/pipeline/stage-history";
import { DEFAULT_DEALS_FILTERS } from "@/features/pipeline/types";

function serve(t: test.TestContext, lead: Record<string, unknown>) {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = async (config) => ({
        data: config.url?.includes(`/${lead.id}`) ? lead : { items: [lead], totalPages: 1 },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });
}

const base = {
    property: { id: "p", salePrice: "5000000", transactionType: "sale" },
    client: { id: "c", name: "Client" },
    updatedAt: "2026-11-10T10:00:00Z",
};

test("a logged call or saved note does not reset days in stage", async (t) => {
    serve(t, {
        ...base,
        id: "deal-1",
        stage: "contacted",
        stageHistory: [
            { status: "new", at: "2026-11-01T10:00:00Z", by: "broker" },
            { status: "contacted", at: "2026-11-03T10:00:00Z", by: "broker" },
            {
                status: "contacted",
                at: "2026-11-05T10:00:00Z",
                by: "broker",
                note: CALL_LOGGED_NOTE,
            },
            {
                status: "contacted",
                at: "2026-11-08T10:00:00Z",
                by: "broker",
                note: "Wants 2 parking",
            },
        ],
    });
    const [deal] = (await pipelineApi.list(DEFAULT_DEALS_FILTERS)).items;
    assert.equal(deal.stageEnteredAt, "2026-11-03T10:00:00Z");
    assert.equal(deal.lastContactedAt, "2026-11-05T10:00:00Z");
});

test("a call logged before the current stage is not the last contact in it", async (t) => {
    serve(t, {
        ...base,
        id: "deal-1",
        stage: "site_visit",
        stageHistory: [
            { status: "contacted", at: "2026-11-03T10:00:00Z", by: "broker" },
            {
                status: "contacted",
                at: "2026-11-04T10:00:00Z",
                by: "broker",
                note: CALL_LOGGED_NOTE,
            },
            { status: "site_visit", at: "2026-11-06T10:00:00Z", by: "broker" },
        ],
    });
    const [deal] = (await pipelineApi.list(DEFAULT_DEALS_FILTERS)).items;
    assert.equal(deal.stageEnteredAt, "2026-11-06T10:00:00Z");
    assert.equal(deal.lastContactedAt, null);
});

test("an owner rejecting an offer keeps the deal's time in negotiation", async (t) => {
    serve(t, {
        ...base,
        id: "deal-1",
        stage: "offer_made",
        stageHistory: [
            { status: "negotiation", at: "2026-11-02T10:00:00Z", by: "broker" },
            { status: "offer_made", at: "2026-11-04T10:00:00Z", by: "broker" },
            { status: "offer_rejected", at: "2026-11-06T10:00:00Z", by: "owner" },
        ],
    });
    const [deal] = (await pipelineApi.list(DEFAULT_DEALS_FILTERS)).items;
    assert.equal(deal.stageEnteredAt, "2026-11-04T10:00:00Z");
});

test("stage history rows: newest first, in-place updates named, board labels, plain money", () => {
    const rows = describeStageHistory(
        [
            {
                status: "new",
                at: "2026-11-01T10:00:00Z",
                by: "broker",
                note: "Property lead created",
            },
            { status: "contacted", at: "2026-11-02T10:00:00Z", by: "broker", note: null },
            {
                status: "contacted",
                at: "2026-11-03T10:00:00Z",
                by: "broker",
                note: CALL_LOGGED_NOTE,
            },
            {
                status: "contacted",
                at: "2026-11-04T10:00:00Z",
                by: "broker",
                note: "Prefers east facing",
            },
            {
                status: "offer_made",
                at: "2026-11-05T10:00:00Z",
                by: "broker",
                note: "Offer submitted: ₹4500000",
            },
            { status: "offer_rejected", at: "2026-11-06T10:00:00Z", by: "owner", note: null },
            { status: "closed_lost", at: "2026-11-07T10:00:00Z", by: "owner", note: null },
            { status: "contacted", at: "2026-11-08T10:00:00Z", by: "broker", note: null },
            { status: "closed_won", at: "2026-11-09T10:00:00Z", by: "broker", note: null },
            { status: "some_new_status", at: null, by: null, note: null },
        ],
        { isRent: false },
    );

    assert.deepEqual(
        rows.map((row) => [row.kind, row.title, row.note, row.actor]),
        [
            ["stage", "Some new status", null, null],
            ["stage", "Closed", null, "You"],
            ["stage", "Contacted", null, "You"],
            ["stage", "Lost", null, "Owner"],
            ["stage", "Offer rejected", null, "Owner"],
            ["stage", "Offer made", `Offer submitted: ${formatPrice(4_500_000)}`, "You"],
            ["note", "Note added", "Prefers east facing", "You"],
            ["call", "Call logged", null, "You"],
            ["stage", "Contacted", null, "You"],
            ["stage", "New", "Property lead created", "You"],
        ],
    );
    assert.equal(rows[0].at, null);
    assert.equal(rows[1].at, "2026-11-09T10:00:00Z");
});

test("rent offers read as monthly rent", () => {
    const [row] = describeStageHistory(
        [{ status: "offer_made", at: null, by: "broker", note: "Offer submitted: ₹25000" }],
        { isRent: true },
    );
    assert.equal(row.note, `Offer submitted: ${formatPrice(25_000)}/mo`);
});
