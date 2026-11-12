import assert from "node:assert/strict";
import test from "node:test";

import { propertyPublishAttachmentIssues } from "@/lib/properties/form-validation";
import { DEFAULT_PROPERTY_DRAFT } from "@/lib/schemas/property";

test("broker publishing requires a selected owner, not typed owner details", () => {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    assert.deepEqual(
        propertyPublishAttachmentIssues(values, "broker").map((issue) => issue.path),
        ["owner.contactId"],
    );
    values.owner.name = "Owner name without a selection";
    values.owner.phone = "9876543210";
    assert.equal(propertyPublishAttachmentIssues(values, "broker").length, 1);
    values.owner.contactId = "  ";
    assert.equal(propertyPublishAttachmentIssues(values, "broker").length, 1);
});

test("an owner alone is enough to publish; contacts are optional", () => {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    values.owner.contactId = "owner-1";
    assert.deepEqual(propertyPublishAttachmentIssues(values, "broker"), []);
    values.attachedBuyers = [{ id: "contact-1", name: "Contact", phoneDigits: "9876543210" }];
    assert.deepEqual(propertyPublishAttachmentIssues(values, "broker"), []);
});

test("owner portal publishing does not require broker-only attachments", () => {
    assert.deepEqual(
        propertyPublishAttachmentIssues(structuredClone(DEFAULT_PROPERTY_DRAFT), "owner"),
        [],
    );
});
