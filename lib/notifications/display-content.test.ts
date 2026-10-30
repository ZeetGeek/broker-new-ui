import assert from "node:assert/strict";
import test from "node:test";

import { getNotificationDisplayContent } from "./display-content";

test("removes repeated visit title while preserving the API's scheduled details", () => {
    assert.deepEqual(
        getNotificationDisplayContent({
            type: "visit_approved",
            title: "Visit approved",
            body: "Visit approved — 12 Oct, 01:00 pm",
        }),
        { title: "Visit approved", body: "12 Oct, 01:00 pm" },
    );
});

test("does not remove distinct offer context or invent missing content", () => {
    assert.deepEqual(
        getNotificationDisplayContent({
            type: "offer_accepted",
            title: "Offer accepted",
            body: "The owner accepted your offer.",
        }),
        { title: "Offer accepted", body: "The owner accepted your offer." },
    );
    assert.deepEqual(
        getNotificationDisplayContent({ type: "system", title: "Update", body: null }),
        { title: "Update", body: null },
    );
});

test("removes exact duplicates but preserves longer words and event facts", () => {
    assert.equal(
        getNotificationDisplayContent({ type: "system", title: "Visit", body: "Visitor arrived" })
            .body,
        "Visitor arrived",
    );
    assert.equal(
        getNotificationDisplayContent({
            type: "system",
            title: "Offer accepted",
            body: "offer accepted",
        }).body,
        null,
    );
});

test("uses the API's deal event as the heading instead of generic congratulations", () => {
    assert.deepEqual(
        getNotificationDisplayContent({
            type: "deal_closed",
            title: "Congratulations",
            body: "Deal closed",
        }),
        { title: "Deal closed", body: null },
    );
});
