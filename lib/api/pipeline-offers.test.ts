import { AxiosError } from "axios";
import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { pipelineApi } from "@/lib/api/pipeline";

import { USE_MOCK_DATA } from "@/config";
import { DEFAULT_DEALS_FILTERS } from "@/features/pipeline/types";

for (const isRent of [false, true]) {
    test(
        `record and update a ${isRent ? "rent" : "sale"} offer round-trips through the API without creating another deal`,
        { skip: USE_MOCK_DATA },
        async (t) => {
            const previous = api.defaults.adapter;
            t.after(() => {
                api.defaults.adapter = previous;
            });
            const lead = {
                id: "offer-lead",
                stage: "contacted",
                offerAmount: null as string | null,
                offerStatus: null as string | null,
                property: {
                    id: "property-1",
                    transactionType: isRent ? "rent" : "sale",
                    salePrice: isRent ? null : "5000000",
                    monthlyRent: isRent ? "18000" : null,
                },
                client: { id: "client-1", name: "Test client" },
            };
            const writes: { url: string | undefined; method: string | undefined; body: unknown }[] =
                [];
            api.defaults.adapter = async (config) => {
                if (config.method === "post") {
                    const body = JSON.parse(String(config.data));
                    writes.push({ url: config.url, method: config.method, body });
                    lead.offerAmount = String(body.offerAmount);
                    lead.offerStatus = "pending";
                    lead.stage = "offer_made";
                }
                return {
                    data: config.url?.endsWith("/offer-lead")
                        ? lead
                        : { items: [lead], totalPages: 1 },
                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config,
                };
            };

            const firstAmount = isRent ? 16_000 : 4_500_000;
            const revisedAmount = isRent ? 17_000 : 4_750_000;
            await pipelineApi.makeOffer(lead.id, firstAmount, "  Client’s first offer  ");
            assert.deepEqual(writes[0], {
                url: "/clients/leads/offer-lead/offer",
                method: "post",
                body: { offerAmount: firstAmount, notes: "Client’s first offer" },
            });
            const detail = await pipelineApi.get(lead.id);
            assert.equal(detail.offerAmountInr, firstAmount);
            assert.equal(detail.property.isRent, isRent);
            assert.equal(detail.status, "negotiation");

            await pipelineApi.makeOffer(lead.id, revisedAmount, "  ");
            assert.deepEqual(writes[1].body, { offerAmount: revisedAmount });
            const board = await pipelineApi.list(DEFAULT_DEALS_FILTERS);
            assert.equal(board.items.length, 1);
            assert.equal(board.items[0].offerAmountInr, revisedAmount);
            assert.equal(board.items[0].status, "negotiation");
            assert.equal(board.items[0].property.id, "property-1");
            assert.equal(board.items[0].buyer.id, "client-1");
            assert.equal(board.items[0].closedAmountInr, null);
        },
    );
}

test(
    "a rejected offer save propagates the failure instead of reporting success",
    { skip: USE_MOCK_DATA },
    async (t) => {
        const previous = api.defaults.adapter;
        t.after(() => {
            api.defaults.adapter = previous;
        });
        api.defaults.adapter = async (config) => {
            throw new AxiosError("Save failed", "ERR_BAD_RESPONSE", config, undefined, {
                data: { message: "Could not save the offer" },
                status: 500,
                statusText: "Server error",
                headers: {},
                config,
            });
        };
        await assert.rejects(
            pipelineApi.makeOffer("offer-lead", 4_500_000),
            /Could not save the offer/,
        );
    },
);
