import assert from "node:assert/strict";
import test from "node:test";

import { MOCK_COMMISSION } from "../features/new-dashboard/mock-commission";

import { formatCommissionPeriod } from "./format/commission";
import { type CommissionPeriodMonths, getCommissionWindow } from "./commission-period";

test("default six-month view preserves the approved earnings and latest month", () => {
    const view = getCommissionWindow(MOCK_COMMISSION, 6, 0);
    assert.equal(view.data[0].monthKey, "2026-06");
    assert.equal(view.data.at(-1)?.monthKey, "2026-11");
    assert.equal(
        view.data.reduce((sum, month) => sum + month.total, 0),
        690_000,
    );
    assert.equal(view.hasNext, false);
    assert.equal(view.hasPrevious, true);
});

test("three-month navigation moves exactly one whole period and returns to latest", () => {
    const current = getCommissionWindow(MOCK_COMMISSION, 3, 0);
    const previous = getCommissionWindow(MOCK_COMMISSION, 3, current.pageIndex + 1);
    assert.deepEqual(
        current.data.map((month) => month.monthKey),
        ["2026-09", "2026-10", "2026-11"],
    );
    assert.deepEqual(
        previous.data.map((month) => month.monthKey),
        ["2026-06", "2026-07", "2026-08"],
    );
    assert.equal(previous.hasNext, true);
    assert.deepEqual(
        getCommissionWindow(MOCK_COMMISSION, 3, previous.pageIndex - 1).data,
        current.data,
    );
});

test("all range sizes traverse history without duplicating or losing months", () => {
    for (const months of [3, 6, 12] as CommissionPeriodMonths[]) {
        const pages = Array.from({ length: MOCK_COMMISSION.length / months }, (_, page) =>
            getCommissionWindow(MOCK_COMMISSION, months, page),
        );
        assert.deepEqual(
            pages.reverse().flatMap((page) => page.data),
            MOCK_COMMISSION,
        );
        assert.equal(pages[0].hasPrevious, false);
        assert.equal(pages.at(-1)?.hasNext, false);
    }
});

test("bounds clamp at available history and retain a partial earliest period", () => {
    const history = MOCK_COMMISSION.slice(0, 8);
    const earliest = getCommissionWindow(history, 6, 99);
    assert.equal(earliest.pageIndex, 1);
    assert.deepEqual(earliest.data, history.slice(0, 2));
    assert.equal(earliest.hasPrevious, false);
    assert.equal(getCommissionWindow(history, 6, -1).pageIndex, 0);
    assert.deepEqual(getCommissionWindow([], 12, 0).data, []);
});

test("period labels show both years across a year boundary", () => {
    assert.equal(formatCommissionPeriod("2026-06", "2026-11"), "June–November 2026");
    assert.equal(formatCommissionPeriod("2025-12", "2026-11"), "December 2025–November 2026");
});
