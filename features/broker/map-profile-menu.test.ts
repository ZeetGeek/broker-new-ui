import assert from "node:assert/strict";
import test from "node:test";

import { mapBrokerProfileMenuBroker } from "./map-profile-menu";

test("the header uses the loaded API profile for either supported verification shape", () => {
    for (const profile of [{ verified: true }, { broker: { verified: true } }]) {
        const menu = mapBrokerProfileMenuBroker(profile, "Broker");
        assert.equal(menu.verificationState, "VERIFIED");
    }
});

test("missing account data never invents a verified status", () => {
    const menu = mapBrokerProfileMenuBroker(null, "Broker");
    assert.equal(menu.verificationState, "PROFILE_INCOMPLETE");
    assert.equal(menu.name, "Broker");
});

test("the refreshed API profile updates both the verification status and identity", () => {
    const menu = mapBrokerProfileMenuBroker(
        { fullName: "Updated broker", verified: true },
        "Old name",
    );
    assert.equal(menu.name, "Updated broker");
    assert.equal(menu.verificationState, "VERIFIED");
});
