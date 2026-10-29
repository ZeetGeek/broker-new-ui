import assert from "node:assert/strict";
import test from "node:test";

import { contactsApi } from "@/lib/api/contacts";
import { brokerContactHref } from "@/lib/routes/broker";

import type { BuyerRow, OwnerRow } from "@/features/contacts/types";

test("duplicate links preserve contact identity and select the correct tab", () => {
    for (const type of ["buyer", "owner"] as const) {
        const id = "contact/one?&unexpected=value";
        const url = new URL(brokerContactHref(id, type), "https://qa.local");
        assert.equal(url.searchParams.get("contact"), id);
        assert.equal(url.searchParams.get("tab"), type === "buyer" ? "buyers" : "owners");
        assert.equal(url.searchParams.has("open"), false);
        assert.equal(url.searchParams.has("unexpected"), false);
    }
});

test("deep links find a buyer beyond the first page without inheriting list search", async (t) => {
    const previous = contactsApi.listBuyersPage;
    t.after(() => {
        contactsApi.listBuyersPage = previous;
    });
    const cursors: Array<string | null> = [];
    contactsApi.listBuyersPage = async (filters, cursor) => {
        assert.equal(filters.q, "");
        cursors.push(cursor);
        return {
            items: [{ id: cursor ? "target" : "first" } as BuyerRow],
            total: 2,
            nextCursor: cursor ? null : "2",
        };
    };
    const contact = await contactsApi.findContact("target", "buyer");
    assert.equal(contact?.type, "buyer");
    assert.equal(contact?.row.id, "target");
    assert.deepEqual(cursors, [null, "2"]);
});

test("owner lookup skips buyers and reports missing and network failures distinctly", async (t) => {
    const previousOwners = contactsApi.listOwnersPage;
    const previousBuyers = contactsApi.listBuyersPage;
    t.after(() => {
        contactsApi.listOwnersPage = previousOwners;
        contactsApi.listBuyersPage = previousBuyers;
    });
    contactsApi.listBuyersPage = async () => {
        throw new Error("Buyer lookup should not run");
    };
    contactsApi.listOwnersPage = async () => ({
        items: [{ id: "owner-contact" } as OwnerRow],
        total: 1,
        nextCursor: null,
    });
    assert.equal((await contactsApi.findContact("owner-contact", "owner"))?.type, "owner");
    assert.equal(await contactsApi.findContact("missing", "owner"), null);
    contactsApi.listOwnersPage = async () => {
        throw new Error("Offline");
    };
    await assert.rejects(contactsApi.findContact("owner-contact", "owner"), /Offline/);
});
