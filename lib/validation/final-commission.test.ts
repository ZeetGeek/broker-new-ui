import assert from "node:assert/strict";
import test from "node:test";

import { resolveFinalCommission } from "./final-commission";

test("commission uses the final agreed sale price or monthly rent", () => {
    assert.equal(resolveFinalCommission("percent", "1.25", 8_000_000).amount, 100_000);
    assert.equal(resolveFinalCommission("percent", "50", 18_000).amount, 9_000);
    assert.equal(resolveFinalCommission("percent", "2.5", 12_345).amount, 309);
    assert.equal(resolveFinalCommission("amount", "25000", 8_000_000).amount, 25_000);
});

test("commission is optional and zero is an explicit valid commission", () => {
    assert.deepEqual(resolveFinalCommission("percent", "", 100), { amount: null, error: null });
    assert.equal(resolveFinalCommission("percent", "0", 100).amount, 0);
    assert.equal(resolveFinalCommission("amount", "0", 100).amount, 0);
});

test("invalid commission cannot be saved", () => {
    for (const value of ["-1", "101", "2.345", "Infinity", "1e2", "abc"]) {
        assert.ok(resolveFinalCommission("percent", value, 100).error, value);
    }
    for (const value of ["-100", "2.5", "100000000000"]) {
        assert.ok(resolveFinalCommission("amount", value, 100).error, value);
    }
});
