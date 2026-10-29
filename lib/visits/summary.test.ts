import assert from "node:assert/strict";
import test from "node:test";

import { buildVisitSummary } from "@/lib/visits/summary";

import type { BrokerSiteVisit, BrokerVisitStatus } from "@/features/site-visits/broker/model";

const now = new Date("2026-10-29T09:00:00Z");
const visit = (startsAt: string, status: BrokerVisitStatus) =>
    ({ startsAt, status }) as BrokerSiteVisit;

test("cancelled visits do not increase today's, tomorrow's or upcoming visit totals", () => {
    const visits = [
        visit("2026-10-29T10:00:00Z", "confirmed"),
        visit("2026-10-29T11:00:00Z", "cancelled_by_broker"),
        visit("2026-10-30T10:00:00Z", "cancelled_by_owner"),
    ];
    const summary = buildVisitSummary(visits, [], [], now);
    assert.equal(summary.today, 1);
    assert.equal(summary.tomorrow, 0);
    assert.equal(summary.weekTotal, 1);
    assert.equal(summary.cancelledThisWeek, 2);
    const cancelledOnly = buildVisitSummary(visits.slice(1), [], [], now);
    assert.equal(cancelledOnly.today, 0);
    assert.equal(cancelledOnly.weekTotal, 0);
});

test("cancelled-this-week uses scheduled dates in the Monday–Sunday IST week", () => {
    const summary = buildVisitSummary(
        [
            visit("2026-10-25T18:29:59Z", "cancelled_by_owner"),
            visit("2026-10-25T18:30:00Z", "cancelled_by_owner"),
            visit("2026-11-01T18:29:59Z", "cancelled_by_broker"),
            visit("2026-11-01T18:30:00Z", "cancelled_by_broker"),
        ],
        [],
        [],
        now,
    );
    assert.equal(summary.cancelledThisWeek, 2);
    assert.equal(summary.weekTotal, 0);
});
