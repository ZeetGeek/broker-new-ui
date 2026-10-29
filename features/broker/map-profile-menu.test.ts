import assert from "node:assert/strict";
import test from "node:test";

import { mapBrokerProfileMenuBroker } from "./map-profile-menu";

test("the header uses the loaded API profile for either supported verification shape", () => {
    for (const profile of [
        { verified: true, licenseNumber: "RERA-123" },
        { broker: { verified: true, licenseNumber: "RERA-123" } },
    ]) {
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
        { fullName: "Updated broker", verified: true, licenseNumber: "RERA-123" },
        "Old name",
    );
    assert.equal(menu.name, "Updated broker");
    assert.equal(menu.verificationState, "VERIFIED");
});

test("missing or cleared RERA numbers cannot display a stale verified badge", () => {
    for (const profile of [
        { verified: true },
        { verified: true, licenseNumber: "   " },
        {
            verified: true,
            licenseNumber: "old-value",
            broker: { verified: true, licenseNumber: "" },
        },
    ])
        assert.equal(
            mapBrokerProfileMenuBroker(profile, "Broker").verificationState,
            "PROFILE_INCOMPLETE",
        );
});

test("entering a RERA number alone does not grant verification", () => {
    assert.equal(
        mapBrokerProfileMenuBroker({ licenseNumber: "RERA-123", verified: false }, "Broker")
            .verificationState,
        "PENDING_VERIFICATION",
    );
});
