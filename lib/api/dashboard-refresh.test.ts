import { QueryClient } from "@tanstack/react-query";
import assert from "node:assert/strict";
import test from "node:test";

import { refreshDashboardQueries } from "@/features/new-dashboard/dashboard-refresh";

test("a saved deal or client refreshes the earnings report behind the pipeline card", async () => {
    const client = new QueryClient();
    const invalidated: unknown[] = [];
    client.invalidateQueries = (async (filters?: { queryKey?: unknown }) => {
        invalidated.push(filters?.queryKey);
    }) as QueryClient["invalidateQueries"];
    await refreshDashboardQueries(client);
    assert.ok(
        invalidated.some((key) => JSON.stringify(key) === JSON.stringify(["broker", "earnings"])),
    );
    assert.ok(
        invalidated.some(
            (key) => JSON.stringify(key) === JSON.stringify(["broker-visits", "list"]),
        ),
    );
    assert.ok(
        invalidated.some(
            (key) => JSON.stringify(key) === JSON.stringify(["my-listings-summary", "broker"]),
        ),
    );
});
