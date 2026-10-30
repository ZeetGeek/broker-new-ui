import { execFileSync } from "node:child_process";
import test from "node:test";

for (const deviceZone of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
    test(`India display, day boundaries and booking round trips on ${deviceZone} devices`, () => {
        execFileSync(
            process.execPath,
            [
                "--import",
                "tsx",
                "--input-type=module",
                "--eval",
                `
            import assert from 'node:assert/strict';
            import { formatDateIso, formatTime24, calendarDaysBetween, isSameCalendarDay, formatShowingWhen, activityDayGroup } from './lib/format/date.ts';
            import { parseApiDateOnly, toApiDateOnly, toApiInstantFromLocalParts, toApiUtcParts } from './lib/datetime/api.ts';
            import { APP_TIME_ZONE, getUserTimeZone, toUserZonedTime, fromUserZonedTime } from './lib/datetime/timezone.ts';
            import { formatVisitTime, formatVisitDayHeading, istDateKey, inputValueInIst, inputValueToUtc, visitWeekDays, addVisitDays } from './lib/visits/time.ts';
            import { VISITS_TIME_ZONE } from './lib/visits/constants.ts';
            const instant = new Date('2026-10-28T20:00:00.000Z');
            const before = new Date('2026-10-28T18:00:00.000Z');
            assert.equal(getUserTimeZone(), 'Asia/Kolkata');
            assert.equal(VISITS_TIME_ZONE, APP_TIME_ZONE);
            assert.equal(formatDateIso(instant), '2026-10-29');
            assert.equal(formatDateIso(instant), istDateKey(instant));
            assert.equal(formatTime24(instant), '01:30');
            assert.equal(formatVisitTime(instant), '1:30 AM');
            assert.equal(isSameCalendarDay(before, instant), false);
            assert.equal(calendarDaysBetween(before, instant), 1);
            assert.equal(activityDayGroup(before, instant), 'yesterday');
            assert.equal(formatShowingWhen(instant, before), 'Tomorrow, 1:30 AM');
            assert.equal(toApiInstantFromLocalParts('2026-10-29', '01:30'), instant.toISOString());
            assert.deepEqual(toApiUtcParts('2026-10-29', '01:30'), {date: '2026-10-28', time: '20:00'});
            assert.equal(inputValueToUtc(inputValueInIst(instant)), instant.toISOString());
            assert.equal(formatVisitDayHeading('2026-03-09T04:30:00Z', new Date('2026-03-07T20:00:00Z')), 'Tomorrow, Mon 9 Mar');
            assert.deepEqual(visitWeekDays('2026-03-08').map(istDateKey), ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07', '2026-03-08']);
            assert.equal(istDateKey(addVisitDays(parseApiDateOnly('2026-03-08'), 1)), '2026-03-09');
            for (const date of ['2026-01-01', '2026-03-08', '2026-11-01', '2026-12-31']) {
                assert.equal(toApiDateOnly(parseApiDateOnly(date)), date);
                assert.equal(parseApiDateOnly(date).toISOString(), new Date(date + 'T00:00:00+05:30').toISOString());
            }
            assert.equal(fromUserZonedTime(toUserZonedTime(instant)).toISOString(), instant.toISOString());
            assert.equal(toApiInstantFromLocalParts('2026-10-29', '01:30', 'UTC'), '2026-10-29T01:30:00.000Z');
        `,
            ],
            { env: { ...process.env, TZ: deviceZone }, encoding: "utf8" },
        );
    });
}
