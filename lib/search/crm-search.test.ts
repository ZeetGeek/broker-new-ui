import assert from "node:assert/strict";
import test from "node:test";

import type { BrokerVisit } from "@/lib/api/site-visits";
import {
    matchesClientSearch,
    matchesCrmSearch,
    matchesDealSearch,
    matchesListingSearch,
    matchesOwnerSearch,
    matchesVisitSearch,
} from "@/lib/search/crm-search";

import { MOCK_CLIENTS } from "@/features/clients/mock-clients";
import { emptyOwnerForm } from "@/features/contacts/contact-form-model";
import type { BuyerRow, OwnerRow } from "@/features/contacts/types";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import { MOCK_MY_LISTINGS_SEED } from "@/features/properties/your-listings/mock-my-listings";

test("search combines words across fields and normalizes punctuation, case and BHK spacing", () => {
    assert.ok(matchesCrmSearch(" RAVI sector 62 2bhk ", ["Ravi Patel", "Sector-62", "2 BHK"]));
    assert.ok(matchesCrmSearch("રવિ સુરત", ["રવિ પટેલ", "સુરત"]));
    assert.ok(matchesCrmSearch("call Ravi", ["Call about keys", "Ravi Patel"]));
    assert.ok(matchesCrmSearch("  ", []));
    assert.equal(matchesCrmSearch("Ravi Pune", ["Ravi Patel", "Surat"]), false);
});

test("phone searches accept formatting, country codes, partial numbers and a name with a phone", () => {
    for (const phone of ["+91 98765-43210", "98765 43210", "54321", "Ravi +91 98765"]) {
        assert.ok(matchesCrmSearch(phone, ["Ravi Patel"], ["9876543210"]), phone);
    }
    assert.equal(matchesCrmSearch("9876543210", ["Ravi"], []), false);
});

test("client search includes email, notes and linked property titles", () => {
    const client: BuyerRow = {
        ...MOCK_CLIENTS[0],
        name: "Ravi Patel",
        email: "ravi@example.com",
        notes: "Needs lift",
        preferredLocalities: ["Andheri"],
        liveDealCount: 1,
        closedDealCount: 0,
        activePropertyTitles: ["Orchid Heights"],
        leads: [],
        attachedProperties: [
            { id: "p1", leadId: "l1", title: "Orchid Heights", locality: "Mumbai" },
        ],
    };
    assert.ok(matchesClientSearch(client, "ravi@example.com Orchid"));
    assert.ok(matchesClientSearch(client, "lift Mumbai"));
    assert.equal(matchesClientSearch(client, "unknown"), false);
});

test("owner search uses only the exposed phone and includes linked property and location context", () => {
    const owner: OwnerRow = {
        id: "o1",
        name: "Meera Shah",
        hasActiveRepresentation: false,
        origin: "platform",
        propertyCount: 1,
        propertyTitles: ["Orchid Heights"],
        localities: ["Andheri"],
        totalValueInr: 0,
        isAllRent: false,
        liveDealCount: 0,
        details: {
            ...emptyOwnerForm(),
            email: "meera@example.com",
            phone: "9876543210",
            city: "Mumbai",
        },
    };
    assert.ok(matchesOwnerSearch(owner, "Meera Orchid Mumbai"));
    assert.ok(matchesOwnerSearch(owner, "meera@example.com"));
    assert.equal(matchesOwnerSearch(owner, "9876543210"), false);
    assert.ok(matchesOwnerSearch({ ...owner, phoneDigits: "9876543210" }, "+91 98765 43210"));
});

test("listing and deal searches include the people and property details shown on their pages", () => {
    const listing = {
        ...MOCK_MY_LISTINGS_SEED[0],
        title: "Orchid Heights",
        ownerName: "Meera Shah",
        ownerPhoneDigits: "9876543210",
        society: "Green Acres",
        pinCode: "400053",
        attachedClients: [{ id: "c1", name: "Ravi Patel" }],
    };
    assert.ok(matchesListingSearch(listing, "Ravi Meera Orchid"));
    assert.ok(matchesListingSearch(listing, "Green Acres 400053"));
    assert.ok(matchesListingSearch(listing, "+91 98765 43210"));
    const deal = {
        ...MOCK_DEALS[0],
        note: "Bring documents",
        owner: { ...MOCK_DEALS[0].owner, name: "Meera Shah", phoneDigits: "9876543210" },
    };
    assert.ok(matchesDealSearch(deal, "Meera documents"));
    assert.ok(matchesDealSearch(deal, "+91 98765 43210"));
});

test("visit search includes owner, location and notes alongside the client phone", () => {
    const visit = {
        clientName: "Ravi Patel",
        clientPhone: "9876543210",
        ownerName: "Meera Shah",
        propertyTitle: "Orchid Heights",
        locality: "Andheri West",
        city: "Mumbai",
        notes: "Bring keys",
    } as BrokerVisit;
    assert.ok(matchesVisitSearch(visit, "Meera Andheri keys"));
    assert.ok(matchesVisitSearch(visit, "+91 98765-43210"));
    assert.equal(matchesVisitSearch(visit, "Pune"), false);
});
