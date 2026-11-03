import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import assert from "node:assert/strict";
import test from "node:test";

import { AttachedClientsSummary } from "@/components/shared/attached-clients-summary";

const clients = [
    { id: "1", name: "Ramesh Patel" },
    { id: "2", name: "Zeet Patel" },
    { id: "3", name: "Shivendra" },
];

test("a single attached client shows an avatar and their name", () => {
    const html = renderToStaticMarkup(
        createElement(AttachedClientsSummary, { clients: clients.slice(0, 1) }),
    );
    assert.ok(html.includes("Ramesh Patel"));
    assert.ok(!html.includes("1 client"));
    assert.equal((html.match(/<svg/g) ?? []).length, 1);
});

test("multiple attached clients show only two avatars and the full count", () => {
    for (const count of [2, 3]) {
        const html = renderToStaticMarkup(
            createElement(AttachedClientsSummary, { clients: clients.slice(0, count) }),
        );
        assert.ok(html.includes(`${count} clients`));
        assert.equal((html.match(/<svg/g) ?? []).length, 2);
        assert.ok(!html.includes("+1"));
    }
});

test("an empty client summary renders no avatars or misleading count", () => {
    assert.equal(renderToStaticMarkup(createElement(AttachedClientsSummary, { clients: [] })), "");
});
