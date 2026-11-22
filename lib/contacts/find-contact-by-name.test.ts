import assert from "node:assert/strict";
import test from "node:test";

import { contactsApi } from "@/lib/api/contacts";
import { AmbiguousContactNameError, findContactByName } from "@/lib/contacts/find-contact-by-name";
import { brokerContactNameHref } from "@/lib/routes/broker";

import type { BuyerRow, OwnerRow } from "@/features/contacts/types";

test("name-only links escape names and keep clients separate from owners", () => {
    for (const type of ["buyer", "owner"] as const) {
        const name = "Ravi & Sons / A?contact=wrong";
        const url = new URL(brokerContactNameHref(name, type), "https://qa.local");
        assert.equal(url.searchParams.get("contactName"), name);
        assert.equal(url.searchParams.get("tab"), type === "buyer" ? "buyers" : "owners");
        assert.equal(url.searchParams.has("contact"), false);
    }
});

test("name fallback searches all result pages and only accepts an exact match", async (t) => {
    const previous = contactsApi.listBuyersPage;
    t.after(() => {
        contactsApi.listBuyersPage = previous;
    });
    const cursors: Array<string | null> = [];
    contactsApi.listBuyersPage = async (filters, cursor) => {
        assert.equal(filters.q, "rahul mehta");
        cursors.push(cursor);
        return {
            items: [
                { id: "similar", name: "Rahul Mehta Patel" } as BuyerRow,
                ...(cursor ? [{ id: "correct", name: "Rahul   Mehta" } as BuyerRow] : []),
            ],
            total: 3,
            nextCursor: cursor ? null : "2",
        };
    };
    assert.equal((await findContactByName("rahul mehta", "buyer"))?.row.id, "correct");
    assert.deepEqual(cursors, [null, "2"]);
});

test("duplicate names never open the first person's record", async (t) => {
    const previous = contactsApi.listBuyersPage;
    t.after(() => {
        contactsApi.listBuyersPage = previous;
    });
    contactsApi.listBuyersPage = async (_, cursor) => ({
        items: [{ id: cursor ? "second-person" : "first-person", name: "Rahul Mehta" } as BuyerRow],
        total: 2,
        nextCursor: cursor ? null : "2",
    });
    await assert.rejects(findContactByName("Rahul Mehta", "buyer"), AmbiguousContactNameError);
});

test("owner lookup is isolated and missing sample names stay unavailable", async (t) => {
    const previousOwners = contactsApi.listOwnersPage;
    const previousBuyers = contactsApi.listBuyersPage;
    t.after(() => {
        contactsApi.listOwnersPage = previousOwners;
        contactsApi.listBuyersPage = previousBuyers;
    });
    contactsApi.listBuyersPage = async () => {
        throw new Error("Wrong contact type");
    };
    contactsApi.listOwnersPage = async () => ({
        items: [{ id: "owner-1", name: "Bhavna Shah" } as OwnerRow],
        total: 1,
        nextCursor: null,
    });
    assert.equal((await findContactByName("bhavna shah", "owner"))?.row.id, "owner-1");
    assert.equal(await findContactByName("Not Saved", "owner"), null);
    assert.equal(await findContactByName(" ", "owner"), null);
    contactsApi.listOwnersPage = async () => {
        throw new Error("Offline");
    };
    await assert.rejects(findContactByName("Bhavna Shah", "owner"), /Offline/);
});
