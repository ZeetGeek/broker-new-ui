import assert from "node:assert/strict";
import test from "node:test";

import { propertyPublishAttachmentIssues } from "@/lib/properties/form-validation";
import { DEFAULT_PROPERTY_DRAFT } from "@/lib/schemas/property";

const CLIENT = { id: "contact-1", name: "Contact", phoneDigits: "9876543210" };

test("broker publishing requires a selected owner, not typed owner details", () => {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    values.attachedBuyers = [CLIENT];
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

test("broker publishing requires at least one attached client", () => {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    values.owner.contactId = "owner-1";
    assert.deepEqual(
        propertyPublishAttachmentIssues(values, "broker").map((issue) => issue.path),
        ["attachedBuyers"],
    );
    values.attachedBuyers = [{ ...CLIENT, id: "  " }];
    assert.equal(propertyPublishAttachmentIssues(values, "broker").length, 1);
    values.attachedBuyers = [CLIENT];
    assert.deepEqual(propertyPublishAttachmentIssues(values, "broker"), []);
});

test("clients already linked to a saved listing satisfy the client requirement", () => {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    values.owner.contactId = "owner-1";
    assert.deepEqual(
        propertyPublishAttachmentIssues(values, "broker", { existingClientCount: 2 }),
        [],
    );
});

test("an empty form reports both owner and client issues", () => {
    assert.deepEqual(
        propertyPublishAttachmentIssues(structuredClone(DEFAULT_PROPERTY_DRAFT), "broker").map(
            (issue) => issue.path,
        ),
        ["owner.contactId", "attachedBuyers"],
    );
});

test("owner portal publishing does not require broker-only attachments", () => {
    assert.deepEqual(
        propertyPublishAttachmentIssues(structuredClone(DEFAULT_PROPERTY_DRAFT), "owner"),
        [],
    );
});
