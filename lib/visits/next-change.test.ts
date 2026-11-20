import assert from "node:assert/strict";
import test from "node:test";

import { msUntil } from "@/lib/visits/next-change";

test("no next change means no timer", () => {
    assert.equal(msUntil(null, 0), null);
    assert.equal(msUntil("not a date", 0), null);
});

test("the timer fires just after the next visit starts or ends", () => {
    assert.equal(msUntil(new Date(5000).toISOString(), 0), 6000);
});

test("a moment the server hasn't reached yet is retried every five seconds", () => {
    assert.equal(msUntil(new Date(0).toISOString(), 10_000), 5000);
});

test("far-off changes stay inside the browser's timer limit", () => {
    assert.equal(msUntil(new Date(60 * 86_400_000).toISOString(), 0), 2_147_483_000);
});
