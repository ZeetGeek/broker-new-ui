import assert from "node:assert/strict";
import test from "node:test";

import { contactsApi } from "@/lib/api/contacts";
import { updateBuyerContact, updateOwnerContact } from "@/lib/contacts/contact-actions";

import type { BuyerRow, OwnerRow } from "@/features/contacts/types";

test("updating a client in the shared sidebar preserves spelling, requirements and linked properties", async (t) => {
    const previous = contactsApi.saveBuyer;
    t.after(() => {
        contactsApi.saveBuyer = previous;
    });
    const buyer = {
        id: "client-1",
        name: "rahul mehta",
        phoneDigits: "9876543210",
        email: "r@example.test",
        lookingFor: "buy",
        propertyKind: "apartment",
        preferredLocalities: ["Vesu"],
        budgetMaxInr: 9000000,
        attachedProperties: [{ id: "property-1" }],
        details: { notes: "Old note" },
    } as BuyerRow;
    contactsApi.saveBuyer = async (input, id) => {
        assert.equal(id, buyer.id);
        assert.equal(input.name, "rahul mehta");
        assert.deepEqual(input.preferredLocalities, ["Vesu"]);
        assert.equal(input.budgetMaxInr, 9000000);
        assert.equal(input.notes, "New note");
        return id;
    };
    const updated = await updateBuyerContact(buyer, { notes: "New note" });
    assert.equal(updated.notes, "New note");
    assert.equal(updated.attachedProperties, buyer.attachedProperties);
    assert.equal(buyer.details?.notes, "Old note");
});

test("shared owner updates preserve contact identity, consent origin and saved details", async (t) => {
    const previous = contactsApi.saveOwner;
    t.after(() => {
        contactsApi.saveOwner = previous;
    });
    const owner = {
        id: "owner-1",
        name: "bhavna shah",
        origin: "custom",
        phoneDigits: "9876543210",
        details: { city: "Surat", notes: "Old" },
    } as OwnerRow;
    contactsApi.saveOwner = async (values, id, origin) => {
        assert.equal(id, "owner-1");
        assert.equal(origin, "custom");
        assert.equal(values.city, "Surat");
        assert.equal(values.name, "bhavna shah");
        assert.equal(values.notes, "New");
        return { ...owner, notes: values.notes };
    };
    assert.equal((await updateOwnerContact(owner, { notes: "New" })).notes, "New");
});
