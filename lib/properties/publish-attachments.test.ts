import assert from "node:assert/strict";
import test from "node:test";

import { propertyPublishAttachmentIssues } from "@/lib/properties/form-validation";
import { DEFAULT_PROPERTY_DRAFT } from "@/lib/schemas/property";

test("publishing reports both missing broker attachments", () => {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    assert.deepEqual(
        propertyPublishAttachmentIssues(values, "broker").map((issue) => issue.path),
        ["owner.contactId", "attachedBuyers"],
    );
    values.owner.name = "Owner name without a selection";
    values.owner.phone = "9876543210";
    assert.equal(propertyPublishAttachmentIssues(values, "broker").length, 2);
});

test("an owner alone or a contact alone cannot satisfy broker publishing", () => {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    values.owner.contactId = "owner-1";
    assert.deepEqual(
        propertyPublishAttachmentIssues(values, "broker").map((issue) => issue.path),
        ["attachedBuyers"],
    );
    values.owner.contactId = "";
    values.attachedBuyers = [{ id: "contact-1", name: "Contact", phoneDigits: "9876543210" }];
    assert.deepEqual(
        propertyPublishAttachmentIssues(values, "broker").map((issue) => issue.path),
        ["owner.contactId"],
    );
    values.owner.contactId = "owner-1";
    assert.deepEqual(propertyPublishAttachmentIssues(values, "broker"), []);
});

test("existing property contacts count when editing; blank ids do not", () => {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    values.owner.contactId = "owner-1";
    assert.deepEqual(propertyPublishAttachmentIssues(values, "broker", ["existing-contact"]), []);
    values.owner.contactId = "  ";
    values.attachedBuyers = [{ id: "  ", name: "Not a selection", phoneDigits: "" }];
    assert.equal(propertyPublishAttachmentIssues(values, "broker", [" "]).length, 2);
});

test("owner portal publishing does not require broker-only attachments", () => {
    assert.deepEqual(
        propertyPublishAttachmentIssues(structuredClone(DEFAULT_PROPERTY_DRAFT), "owner"),
        [],
    );
});
