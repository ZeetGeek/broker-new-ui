import { format } from "date-fns";
import assert from "node:assert/strict";
import test from "node:test";

import {
    type CommissionMonths,
    commissionMonths,
    commissionSelection,
    maxCommissionPage,
} from "@/features/new-dashboard/commission-window";

const day = (date: Date | null | undefined) => (date ? format(date, "yyyy-MM-dd") : null);
const NOW = new Date("2026-11-23T09:30:00Z"); // 23 Nov 2026, 3:00 pm IST

test("6 months, page 0 covers Jun to the end of Nov 2026", () => {
    const s = commissionSelection(6, 0, NOW);
    assert.equal(s.preset, "custom");
    assert.equal(day(s.customFrom), "2026-06-01");
    assert.equal(day(s.customTo), "2026-11-30");
});

test("6 months, page 1 covers Dec 2025 to May 2026", () => {
    const s = commissionSelection(6, 1, NOW);
    assert.equal(day(s.customFrom), "2025-12-01");
    assert.equal(day(s.customTo), "2026-05-31");
});

test("12 months, page 1 covers Dec 2024 to Nov 2025", () => {
    const s = commissionSelection(12, 1, NOW);
    assert.equal(day(s.customFrom), "2024-12-01");
    assert.equal(day(s.customTo), "2025-11-30");
});

test("the current month is the IST month: 1 Dec 00:15 IST is December", () => {
    const s = commissionSelection(3, 0, new Date("2026-11-30T18:45:00Z"));
    assert.equal(day(s.customFrom), "2026-10-01");
    assert.equal(day(s.customTo), "2026-12-31");
});

test("paging back stops at 24 months", () => {
    assert.deepEqual(
        ([3, 6, 12] as CommissionMonths[]).map((months) => maxCommissionPage(months)),
        [7, 3, 1],
    );
});

test("early in a month the window still spans whole months, so bars stay monthly", () => {
    const s = commissionSelection(3, 0, new Date("2026-11-30T18:45:00Z"));
    const days = (s.customTo!.getTime() - s.customFrom!.getTime()) / 86_400_000;
    assert.ok(days > 62, `window is ${days} days; 62 or fewer switches the API to weekly buckets`);
});

const bucket = (
    start: string,
    saleInr: number,
    rentInr: number,
    closed: number,
    isToDate = false,
) => ({
    key: start,
    label: "",
    longLabel: "",
    saleInr,
    rentInr,
    totalInr: saleInr + rentInr,
    closed,
    lost: 0,
    lostInr: 0,
    lostReasonCounts: {},
    isToDate,
});

test("monthly buckets become chart months keyed by their India-time month", () => {
    const months = commissionMonths([
        bucket("2026-09-30T18:30:00.000Z", 1_10_000, 40_000, 4),
        bucket("2026-10-31T18:30:00.000Z", 1_25_000, 55_000, 5, true),
    ]);
    assert.deepEqual(months, [
        {
            monthKey: "2026-10",
            sale: 1_10_000,
            rent: 40_000,
            total: 1_50_000,
            deals: 4,
            isToDate: false,
        },
        {
            monthKey: "2026-11",
            sale: 1_25_000,
            rent: 55_000,
            total: 1_80_000,
            deals: 5,
            isToDate: true,
        },
    ]);
});

test("a month with no closes is a zero bar, not a gap", () => {
    const [month] = commissionMonths([bucket("2026-05-31T18:30:00.000Z", 0, 0, 0)]);
    assert.deepEqual(month, {
        monthKey: "2026-06",
        sale: 0,
        rent: 0,
        total: 0,
        deals: 0,
        isToDate: false,
    });
});

test("a month with no closes says so instead of showing 0", async () => {
    const { closedDealsLabel } = await import("@/features/new-dashboard/commission-window");
    assert.equal(closedDealsLabel(0), "No deals closed yet");
    assert.equal(closedDealsLabel(1), "1 deal closed");
    assert.equal(closedDealsLabel(5), "5 deals closed");
});
