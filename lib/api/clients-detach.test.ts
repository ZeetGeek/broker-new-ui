import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { clientsApi } from "@/lib/api/clients";

import { USE_MOCK_DATA } from "@/config";

test(
    "detaching follows pagination and deletes only the selected buyer/property pair",
    { skip: USE_MOCK_DATA },
    async (t) => {
        const previous = api.defaults.adapter;
        t.after(() => {
            api.defaults.adapter = previous;
        });
        const deleted: string[] = [];
        const pages: string[] = [];
        api.defaults.adapter = async (config) => {
            let data: unknown = {};
            if (config.method === "get") {
                const page = new URL(config.url!, "https://example.test").searchParams.get("page")!;
                pages.push(page);
                data = {
                    totalPages: 2,
                    items:
                        page === "1"
                            ? [
                                  {
                                      id: "target",
                                      propertyId: "property-a",
                                      client: { id: "buyer-a" },
                                  },
                                  {
                                      id: "other-buyer",
                                      propertyId: "property-a",
                                      clientId: "buyer-b",
                                  },
                                  {
                                      id: "other-property",
                                      propertyId: "property-b",
                                      clientId: "buyer-a",
                                  },
                              ]
                            : [
                                  {
                                      id: "target-second",
                                      propertyId: "property-a",
                                      clientId: "buyer-a",
                                  },
                              ],
                };
            } else {
                assert.equal(config.method, "delete");
                deleted.push(config.url!);
            }
            return { data, status: 200, statusText: "OK", headers: {}, config };
        };
        await clientsApi.detachClientFromProperty("property-a", "buyer-a");
        assert.deepEqual(pages, ["1", "2"]);
        assert.deepEqual(deleted, ["/clients/leads/target", "/clients/leads/target-second"]);
    },
);

test(
    "detaching an already absent link does not delete anything",
    { skip: USE_MOCK_DATA },
    async (t) => {
        const previous = api.defaults.adapter;
        t.after(() => {
            api.defaults.adapter = previous;
        });
        api.defaults.adapter = async (config) => {
            assert.equal(config.method, "get");
            return {
                data: { items: [], totalPages: 1 },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };
        await clientsApi.detachClientFromProperty("property-a", "buyer-a");
    },
);

test(
    "detach failures propagate instead of reporting success",
    { skip: USE_MOCK_DATA },
    async (t) => {
        const previous = api.defaults.adapter;
        t.after(() => {
            api.defaults.adapter = previous;
        });
        api.defaults.adapter = async (config) => {
            if (config.method === "delete") throw new Error("Detach failed");
            return {
                data: {
                    items: [{ id: "target", propertyId: "property-a", clientId: "buyer-a" }],
                    totalPages: 1,
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };
        await assert.rejects(clientsApi.detachClientFromProperty("property-a", "buyer-a"));
    },
);
