import assert from "node:assert/strict";
import test from "node:test";

import type { ApiShowing } from "@/lib/api/broker-visits-map";
import { mapShowing, visitListParams } from "@/lib/api/site-visits";

function showing(extra: Partial<ApiShowing> = {}): ApiShowing {
    return {
        id: "v1",
        leadId: "lead-1",
        propertyId: "p1",
        visitSlotId: null,
        scheduledDate: "2026-11-19T04:30:00.000Z",
        endAt: "2026-11-19T05:15:00.000Z",
        status: "confirmed",
        notes: null,
        createdAt: "2026-11-18T04:30:00.000Z",
        updatedAt: "2026-11-18T05:00:00.000Z",
        listingSource: "exclusive",
        property: {
            id: "p1",
            title: "Shanti Flat",
            city: "Surat",
            address: "Vesu, Near Park",
        } as ApiShowing["property"],
        client: { id: "c1", name: "Ravi", phone: "9876543210" },
        ...extra,
    };
}

test("visitListParams sends only the filters that are set, with search trimmed", () => {
    const params = visitListParams({ tab: "upcoming", search: "  ravi ", clientId: "", page: 2 });
    assert.equal(params.toString(), "tab=upcoming&search=ravi&page=2");
});

test("visitListParams sends client, property, dates and sort when chosen", () => {
    const params = visitListParams({
        tab: "completed",
        clientId: "c1",
        propertyId: "p1",
        from: "2026-11-01",
        to: "2026-11-18",
        sort: "booked_desc",
    });
    assert.equal(params.get("clientId"), "c1");
    assert.equal(params.get("propertyId"), "p1");
    assert.equal(params.get("from"), "2026-11-01");
    assert.equal(params.get("to"), "2026-11-18");
    assert.equal(params.get("sort"), "booked_desc");
});

test("mapShowing reads the visit length from its end time", () => {
    const visit = mapShowing(showing());
    assert.equal(visit.durationMinutes, 45);
    assert.equal(visit.startsAt, "2026-11-19T04:30:00.000Z");
    assert.equal(visit.endsAt, "2026-11-19T05:15:00.000Z");
});

test("mapShowing names the client and the property's area", () => {
    const visit = mapShowing(showing());
    assert.equal(visit.clientName, "Ravi");
    assert.equal(visit.clientPhone, "9876543210");
    assert.equal(visit.locality, "Vesu");
    assert.equal(visit.isExclusive, true);
});

test("mapShowing preserves the owner's ID for opening the correct contact", () => {
    const visit = mapShowing(showing({ owner: { id: "owner-42", fullName: "Bhavna Shah" } }));
    assert.equal(visit.ownerId, "owner-42");
    assert.equal(visit.ownerName, "Bhavna Shah");
    assert.equal(mapShowing(showing({ owner: null })).ownerId, null);
});

test("mapShowing falls back when the client or end time is missing", () => {
    const visit = mapShowing(showing({ client: null, endAt: null, listingSource: "platform" }));
    assert.equal(visit.clientName, "Client");
    assert.equal(visit.durationMinutes, 30);
    assert.equal(visit.isExclusive, false);
});

test("mapShowing falls back to the city when there is no address", () => {
    const visit = mapShowing(
        showing({
            property: {
                id: "p1",
                title: null,
                city: "Pune",
                address: null,
            } as ApiShowing["property"],
        }),
    );
    assert.equal(visit.locality, "Pune");
    assert.equal(visit.propertyTitle, "Property");
});
