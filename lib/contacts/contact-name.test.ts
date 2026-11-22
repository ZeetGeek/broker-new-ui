import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import assert from "node:assert/strict";
import test from "node:test";

import { ContactName } from "@/components/shared/contact-name";

test("two clients with the same display name keep different contact destinations", () => {
    const render = (id: string) =>
        renderToStaticMarkup(
            createElement(ContactName, {
                name: "rahul mehta",
                contactId: id,
                contactType: "buyer",
            }),
        );
    const first = render("client-one");
    const second = render("client-two");
    assert.match(first, /contact=client-one/);
    assert.match(second, /contact=client-two/);
    assert.match(first, />Rahul Mehta<\/a>/);
    assert.match(first, /data-person-link="true"/);
    assert.doesNotMatch(first, /contactName=/);
});

test("owner links and broker profiles keep the intended portal destination", () => {
    const owner = renderToStaticMarkup(
        createElement(ContactName, {
            name: "bhavna shah",
            contactId: "owner-1",
            contactType: "owner",
        }),
    );
    assert.match(owner, /tab=owners/);
    assert.match(owner, /contact=owner-1/);
    const broker = renderToStaticMarkup(
        createElement(ContactName, {
            name: "ramesh patel",
            href: "/owner/brokers?broker=broker-1",
        }),
    );
    assert.match(broker, /href="\/owner\/brokers\?broker=broker-1"/);
    assert.match(broker, />Ramesh Patel<\/a>/);
});

test("a form preview has formatted text without a misleading clickable affordance", () => {
    const preview = renderToStaticMarkup(createElement(ContactName, { name: "exclusive owner" }));
    assert.match(preview, />Exclusive Owner<\/span>/);
    assert.doesNotMatch(preview, /<a|<button|data-person-link/);
});
