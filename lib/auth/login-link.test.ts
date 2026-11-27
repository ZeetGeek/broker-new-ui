import assert from "node:assert/strict";
import { test } from "node:test";

import { decodeLoginLinkToken, encodeLoginLinkToken } from "./login-link";

test("round-trips email and password", () => {
    const credentials = { email: "test@example.com", password: "not-a-real-password" };
    const token = encodeLoginLinkToken(credentials);
    assert.deepEqual(decodeLoginLinkToken(token), credentials);
});

test("token does not contain the credentials in readable form", () => {
    const token = encodeLoginLinkToken({
        email: "test@example.com",
        password: "not-a-real-password",
    });
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    assert.ok(!token.includes("example"));
    assert.ok(!token.includes("password"));
});

test("rejects malformed tokens", () => {
    assert.equal(decodeLoginLinkToken("not-a-token"), null);
    assert.equal(decodeLoginLinkToken(""), null);
    assert.equal(decodeLoginLinkToken(btoa(JSON.stringify({ e: "x" }))), null);
});
