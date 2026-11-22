import assert from "node:assert/strict";
import test from "node:test";

import reducer, { fetchBrokerDashboard, resetDashboard } from "@/store/slices/dashboard-slice";

test("workflow refresh keeps the dashboard mounted and ignores obsolete account requests", () => {
    const initial = reducer(undefined, { type: "init" });
    const loading = reducer(initial, fetchBrokerDashboard.pending("initial", undefined));
    const data = { data: null, profile: null } as unknown as Parameters<
        typeof fetchBrokerDashboard.fulfilled
    >[0];
    const ready = reducer(loading, fetchBrokerDashboard.fulfilled(data, "initial", undefined));
    const refreshing = reducer(
        ready,
        fetchBrokerDashboard.pending("refresh", { background: true }),
    );
    assert.equal(
        refreshing.status,
        "succeeded",
        "background refresh must not replace the page with its loading screen",
    );
    const offline = reducer(
        refreshing,
        fetchBrokerDashboard.rejected(new Error("Offline"), "refresh", { background: true }),
    );
    assert.equal(offline.status, "succeeded");
    assert.equal(offline.data, ready.data);
    const reset = reducer(refreshing, resetDashboard());
    const obsolete = reducer(
        reset,
        fetchBrokerDashboard.fulfilled(data, "refresh", { background: true }),
    );
    assert.equal(obsolete.status, "idle");
    assert.equal(obsolete.profile, null);
});
