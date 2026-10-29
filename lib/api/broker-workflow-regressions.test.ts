import assert from "node:assert/strict";
import test from "node:test";

import { listAttachableProperties } from "@/lib/api/attachable-properties";
import { brokerVisitsApi } from "@/lib/api/broker-visits";
import { api } from "@/lib/api/client";
import { clientsApi } from "@/lib/api/clients";
import { pipelineApi } from "@/lib/api/pipeline";

import type { BrokerSiteVisit, VisitOutcome } from "@/features/site-visits/broker/model";
import { USE_MOCK_VISITS } from "@/mocks/visits";

test(
    "unsupported outcome saving rejects without reporting success or mutating the visit",
    { skip: USE_MOCK_VISITS },
    async (t) => {
        const previous = api.defaults.adapter;
        t.after(() => {
            api.defaults.adapter = previous;
        });
        let requests = 0;
        api.defaults.adapter = async () => {
            requests++;
            throw new Error("Unexpected request");
        };
        const visit = {
            id: "qa-visit",
            buyerIds: ["qa-buyer"],
            status: "confirmed",
        } as BrokerSiteVisit;
        const original = structuredClone(visit);
        const outcome = {
            nextStep: "schedule_followup",
            followUpAt: "2026-11-01T05:30:00Z",
        } as VisitOutcome;
        await assert.rejects(brokerVisitsApi.recordOutcome(visit, outcome), /not available yet/);
        assert.deepEqual(visit, original);
        assert.equal(requests, 0);
    },
);

test("note edits and call logging preserve authoritative finished and offer stages", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const writes: Array<{ status: string; note: string }> = [];
    let stage: string | undefined;
    api.defaults.adapter = async (config) => {
        if (config.method === "patch") writes.push(JSON.parse(config.data));
        return {
            data: { id: "qa-lead", stage },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    for (stage of ["closed_won", "closed_lost", "offer_made", "site_visit", "new"]) {
        await pipelineApi.setNote("qa-lead", "contacted", "  Buyer called  ");
        assert.deepEqual(writes.at(-1), { status: stage, note: "Buyer called" });
        await pipelineApi.logContact("qa-lead", "contacted");
        assert.deepEqual(writes.at(-1), { status: stage, note: "Call logged" });
    }
    stage = undefined;
    const count = writes.length;
    await assert.rejects(
        pipelineApi.setNote("qa-lead", "contacted", "Note"),
        /verify the current lead stage/,
    );
    assert.equal(writes.length, count);
});

test("buyer picker loads all own inventory pages without representation requests and keeps linking additive", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const pages: number[] = [];
    const writes: unknown[] = [];
    api.defaults.adapter = async (config) => {
        const url = new URL(config.url!, "https://qa.local");
        let data: unknown;
        if (config.method === "post") {
            assert.equal(url.pathname, "/clients/leads");
            writes.push(JSON.parse(config.data));
            data = {};
        } else {
            assert.equal(url.pathname, "/properties");
            const page = Number(url.searchParams.get("page") ?? 1);
            pages.push(page);
            data = {
                totalPages: 2,
                items:
                    page === 1
                        ? [
                              {
                                  id: "own-published",
                                  title: "Office",
                                  status: "available",
                                  publishStatus: "published",
                                  transactionType: "sale",
                                  salePrice: "7500000",
                                  commissionPercent: "1",
                              },
                              { id: "sold", status: "sold" },
                          ]
                        : [
                              {
                                  id: "own-draft",
                                  title: "Private flat",
                                  status: "available",
                                  publishStatus: "draft",
                                  transactionType: "rent",
                                  monthlyRent: "20000",
                                  commissionAmount: "10000",
                              },
                              { id: "unavailable", status: "unavailable" },
                              { id: "own-published", title: "Office", status: "available" },
                          ],
            };
        }
        return { data, status: 200, statusText: "OK", headers: {}, config };
    };
    const result = await listAttachableProperties(undefined, false);
    assert.deepEqual(pages, [1, 2]);
    assert.deepEqual(
        result.map((item) => item.id),
        ["own-published", "own-draft"],
    );
    assert.equal(result[1].isDraft, true);
    assert.equal(result[1].amountInr, 20000);
    assert.equal(result[1].commissionAmount, 10000);
    await clientsApi.attachClientToProperties("qa-buyer", ["own-draft", "own-draft"]);
    assert.deepEqual(writes, [{ propertyId: "own-draft", clientIds: ["qa-buyer"] }]);
});

test("buyer picker propagates inventory failures instead of presenting an empty success", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    api.defaults.adapter = async () => {
        throw new Error("Inventory unavailable");
    };
    await assert.rejects(listAttachableProperties(undefined, false), /Inventory unavailable/);
});
