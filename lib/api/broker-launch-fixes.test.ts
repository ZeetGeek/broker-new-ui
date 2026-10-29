import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import assert from "node:assert/strict";
import test from "node:test";

import { brokerVisitsApi } from "@/lib/api/broker-visits";
import { mapShowingStatus } from "@/lib/api/broker-visits-map";
import { api } from "@/lib/api/client";
import { slotsQueryOptions } from "@/hooks/use-slots";

import {
    myListingInputToCreatePayload,
    myListingInputToUpdatePayload,
} from "@/features/properties/your-listings/map-my-listing";
import { MOCK_MY_LISTINGS_SEED } from "@/features/properties/your-listings/mock-my-listings";
import type { CreateMyListingInput } from "@/features/properties/your-listings/types";
import type {
    PersonSummary,
    PropertyWithSlots,
    VisitSlot,
} from "@/features/site-visits/broker/model";

test("property creation never copies a private address into public copy", () => {
    const input: CreateMyListingInput = {
        ...MOCK_MY_LISTINGS_SEED[0],
        subtype: MOCK_MY_LISTINGS_SEED[0].subtype ?? undefined,
        address: "Flat 23, private street",
        description: "  Bright home with a balcony.  ",
        nearbyPlaces: [],
        suitableFor: [],
        cabins: null,
        meetingRooms: null,
        workstations: null,
        ceilingHeightFt: null,
        videoUrl: "",
        virtualTourUrl: "",
        publish: true,
    };
    const payload = myListingInputToCreatePayload(input);
    assert.equal(payload.description, "Bright home with a balcony.");
    assert.equal(payload.address, input.locality);
    assert.equal(
        myListingInputToCreatePayload({ ...input, description: "" }).description,
        undefined,
    );
});

test("property edits keep private address changes independent of public copy", () => {
    const address = "Flat 23, private street";
    assert.equal(
        myListingInputToUpdatePayload({ address, description: "  Public description  " })
            .description,
        "Public description",
    );
    assert.equal("description" in myListingInputToUpdatePayload({ address }), false);
    assert.equal(
        myListingInputToUpdatePayload({ description: "Public description" }).description,
        "Public description",
    );
    assert.equal(
        myListingInputToUpdatePayload({ address, description: "" }).description,
        undefined,
    );
});

test("visit status follows the saved status regardless of the scheduled time", () => {
    for (const startsAt of ["2000-01-01T00:00:00Z", "2099-01-01T00:00:00Z"]) {
        assert.equal(mapShowingStatus("confirmed", startsAt), "confirmed");
        assert.equal(mapShowingStatus("scheduled", startsAt), "awaiting_owner");
        assert.equal(mapShowingStatus("completed", startsAt), "completed");
        assert.equal(mapShowingStatus("cancelled", startsAt), "cancelled_by_owner");
        assert.equal(mapShowingStatus("no_show", startsAt), "no_show");
    }
});

for (const source of ["platform", "exclusive"] as const) {
    test(`${source} slot queries load later pages, preserve filters, and stop at the last page`, async (t) => {
        const previous = api.defaults.adapter;
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        t.after(() => {
            api.defaults.adapter = previous;
            client.clear();
        });
        const pages: number[] = [];
        api.defaults.adapter = async (config) => {
            const url = new URL(config.url!, "https://qa.local");
            assert.equal(
                url.pathname,
                source === "exclusive" ? "/slots/broker/exclusive/open" : "/slots/broker/open",
            );
            assert.equal(url.searchParams.get("limit"), "1");
            assert.equal(url.searchParams.get("propertyId"), "qa-property");
            assert.equal(url.searchParams.get("search"), "Vesu");
            const page = Number(url.searchParams.get("page"));
            pages.push(page);
            return {
                data: {
                    items: [
                        {
                            property: {
                                id: `property-${page}`,
                                title: `Home ${page}`,
                                city: "Surat",
                            },
                            propertySource: source === "exclusive" ? "own_listing" : "marketplace",
                            access: "accepted",
                            owner: null,
                            slots: [],
                        },
                    ],
                    page,
                    limit: 1,
                    total: 2,
                    totalPages: 2,
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };
        const observer = new InfiniteQueryObserver(
            client,
            slotsQueryOptions(true, { limit: 1, propertyId: "qa-property", q: "Vesu" }, source),
        );
        await observer.refetch();
        assert.equal(observer.getCurrentResult().hasNextPage, true);
        const result = await observer.fetchNextPage();
        assert.deepEqual(pages, [1, 2]);
        assert.deepEqual(result.data?.pageParams, [1, 2]);
        assert.deepEqual(
            result.data?.pages.flatMap((page) => page.items.map((item) => item.property.id)),
            ["property-1", "property-2"],
        );
        assert.equal(result.hasNextPage, false);
        await observer.fetchNextPage();
        assert.deepEqual(pages, [1, 2]);
    });
}

test("a failed later slot page keeps loaded rows and can be retried", async (t) => {
    const previous = api.defaults.adapter;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    t.after(() => {
        api.defaults.adapter = previous;
        client.clear();
    });
    let fail = true;
    const pages: number[] = [];
    api.defaults.adapter = async (config) => {
        const page = Number(new URL(config.url!, "https://qa.local").searchParams.get("page"));
        pages.push(page);
        if (page === 2 && fail) throw new Error("Temporary slot loading failure");
        return {
            data: { items: [], page, limit: 1, total: 2, totalPages: 2 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    const observer = new InfiniteQueryObserver(client, slotsQueryOptions(true, {}, "exclusive"));
    await observer.refetch();
    const failed = await observer.fetchNextPage();
    assert.equal(failed.isFetchNextPageError, true);
    assert.deepEqual(failed.data?.pageParams, [1]);
    fail = false;
    const recovered = await observer.fetchNextPage();
    assert.equal(recovered.isError, false);
    assert.deepEqual(recovered.data?.pageParams, [1, 2]);
    assert.deepEqual(pages, [1, 2, 2]);
});

const booking = {
    item: {
        property: { id: "qa-property" },
        owner: { id: "qa-owner" },
        propertySource: "own_listing",
    } as PropertyWithSlots,
    slot: {
        id: "qa-slot",
        startsAt: "2099-01-01T05:00:00Z",
        endsAt: "2099-01-01T06:00:00Z",
    } as VisitSlot,
    buyers: [{ id: "qa-buyer", name: "Buyer" }] as PersonSummary[],
};

for (const match of [{ clientId: "qa-buyer" }, { client: { id: "qa-buyer" } }]) {
    test(`booking finds a buyer beyond the first 100 leads using ${"clientId" in match ? "clientId" : "nested client"}`, async (t) => {
        const previous = api.defaults.adapter;
        t.after(() => {
            api.defaults.adapter = previous;
        });
        const pages: number[] = [];
        const writes: Array<{ path: string; body: unknown }> = [];
        api.defaults.adapter = async (config) => {
            const url = new URL(config.url!, "https://qa.local");
            let data: unknown;
            if (config.method === "post") {
                writes.push({ path: url.pathname, body: JSON.parse(config.data) });
                data =
                    url.pathname === "/clients/leads"
                        ? {}
                        : {
                              showing: { id: "qa-booking", status: "confirmed" },
                          };
            } else {
                assert.equal(url.pathname, "/clients/leads");
                assert.equal(url.searchParams.get("propertyId"), "qa-property");
                assert.equal(url.searchParams.get("limit"), "100");
                const page = Number(url.searchParams.get("page"));
                pages.push(page);
                data = {
                    items:
                        page === 1
                            ? Array.from({ length: 100 }, (_, index) => ({
                                  id: `other-${index}`,
                                  clientId: `buyer-${index}`,
                              }))
                            : [{ id: "qa-lead", ...match }],
                    totalPages: 3,
                };
            }
            return { data, status: 200, statusText: "OK", headers: {}, config };
        };
        const visit = await brokerVisitsApi.book(booking);
        assert.equal(visit.id, "qa-booking");
        assert.deepEqual(pages, [1, 2]);
        assert.deepEqual(writes, [
            {
                path: "/clients/leads",
                body: { propertyId: "qa-property", clientIds: ["qa-buyer"] },
            },
            {
                path: "/slots/broker/exclusive/book",
                body: {
                    leadId: "qa-lead",
                    propertyId: "qa-property",
                    startAt: booking.slot.startsAt,
                    endAt: booking.slot.endsAt,
                },
            },
        ]);
    });
}

test("booking does not book a slot when the buyer is absent or a later lead page fails", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    for (const fail of [false, true]) {
        const pages: number[] = [];
        const writes: string[] = [];
        api.defaults.adapter = async (config) => {
            const url = new URL(config.url!, "https://qa.local");
            if (config.method === "post") {
                writes.push(url.pathname);
                return { data: {}, status: 200, statusText: "OK", headers: {}, config };
            }
            const page = Number(url.searchParams.get("page"));
            pages.push(page);
            if (fail && page === 2) throw new Error("Lead page unavailable");
            return {
                data: { items: [], totalPages: 2 },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };
        await assert.rejects(
            brokerVisitsApi.book(booking),
            fail ? /Lead page unavailable/ : /Could not link this client/,
        );
        assert.deepEqual(pages, [1, 2]);
        assert.deepEqual(writes, ["/clients/leads"]);
    }
});
