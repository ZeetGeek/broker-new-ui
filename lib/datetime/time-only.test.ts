import assert from "node:assert/strict";
import test from "node:test";

import { dateToTimeOnly, timeOnlyToDate } from "./time-only";

test("the Material clock preserves midnight, noon and PM times in each device timezone", () => {
    const previous = process.env.TZ;
    try {
        for (const timezone of ["Asia/Kolkata", "America/Los_Angeles", "Pacific/Auckland"]) {
            process.env.TZ = timezone;
            for (const value of ["00:00", "12:00", "19:05", "23:59"]) {
                const date = timeOnlyToDate(value);
                assert.ok(date);
                assert.equal(dateToTimeOnly(date), value);
                assert.equal(date.getHours(), Number(value.slice(0, 2)));
            }
        }
    } finally {
        if (previous === undefined) delete process.env.TZ;
        else process.env.TZ = previous;
    }
});

test("time-only values support seconds and reject invalid or incomplete clock input", () => {
    assert.equal(dateToTimeOnly(timeOnlyToDate("07:09:03")!, true), "07:09:03");
    for (const value of [
        "",
        "7:00",
        "24:00",
        "12:60",
        "12:00:60",
        "garbage",
        "2026-01-01T12:00Z",
    ]) {
        assert.equal(timeOnlyToDate(value), null);
    }
});
