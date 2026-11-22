import assert from "node:assert/strict";
import test from "node:test";

import { openPersonDetails, personDetailsTarget } from "@/lib/contacts/person-details-target";
import {
    brokerContactHref,
    brokerContactNameHref,
    brokerOwnerProfileHref,
} from "@/lib/routes/broker";
import { ownerBrokerProfileHref } from "@/lib/routes/owner";

test("dashboard, pipeline and visit links resolve to the same contact without a page destination change", () => {
    const id = "contact/one?other=value&name=wrong";
    assert.deepEqual(personDetailsTarget(brokerContactHref(id, "buyer"), "Rahul", "broker"), {
        kind: "contact",
        id,
        name: "Rahul",
        type: "buyer",
    });
    assert.deepEqual(
        personDetailsTarget(brokerContactHref("owner-1", "owner"), "Bhavna", "broker"),
        {
            kind: "contact",
            id: "owner-1",
            name: "Bhavna",
            type: "owner",
        },
    );
    assert.deepEqual(
        personDetailsTarget(brokerContactNameHref("Bhavna Shah", "owner"), "Bhavna Shah", "broker"),
        {
            kind: "contact",
            id: undefined,
            name: "Bhavna Shah",
            type: "owner",
        },
    );
});

test("public owner and broker profiles use their existing consent-aware APIs", () => {
    assert.deepEqual(personDetailsTarget(brokerOwnerProfileHref("owner-1"), "Bhavna", "broker"), {
        kind: "owner-profile",
        id: "owner-1",
        name: "Bhavna",
    });
    assert.deepEqual(personDetailsTarget(ownerBrokerProfileHref("broker/1?&"), "Ramesh", "owner"), {
        kind: "broker-profile",
        id: "broker/1?&",
        name: "Ramesh",
    });
    assert.equal(
        personDetailsTarget(brokerContactHref("client-1", "buyer"), "Rahul", "owner"),
        null,
    );
    assert.equal(personDetailsTarget(ownerBrokerProfileHref("broker-1"), "Ramesh", "broker"), null);
    assert.equal(
        personDetailsTarget("https://other.test/broker/contacts?contact=1", "Rahul", "broker"),
        null,
    );
    assert.equal(personDetailsTarget("/broker/pipeline", "Rahul", "broker"), null);
});

test("ordinary name clicks open the shared panel while Contacts' local panel keeps precedence", () => {
    const opened: string[] = [];
    const shared = (href: string, name: string) => {
        opened.push(`${name}:${href}`);
        return true;
    };
    const href = brokerContactHref("client-1", "buyer");
    assert.equal(openPersonDetails(href, "Rahul", undefined, shared), true);
    assert.deepEqual(opened, [`Rahul:${href}`]);
    assert.equal(
        openPersonDetails(href, "Rahul", () => opened.push("local"), shared),
        true,
    );
    assert.deepEqual(opened, [`Rahul:${href}`, "local"]);
    assert.equal(openPersonDetails(href, "Rahul", undefined, null), false);
    assert.equal(
        openPersonDetails("/other", "Rahul", undefined, () => false),
        false,
    );
});

test("contact collections, creation actions and malformed URLs never open a person panel", () => {
    for (const href of [
        "/broker/contacts",
        "/broker/contacts?tab=owners",
        "/broker/contacts?add=buyer",
        "/broker/contacts?contactName=+",
        "/owner/brokers",
        "http://[invalid",
    ]) {
        assert.equal(personDetailsTarget(href, "Contacts", "broker"), null, href);
    }
});
