import assert from "node:assert/strict";
import test from "node:test";

import {
    draftTimes,
    EMPTY_DRAFT,
    notificationKind,
    type SiteVisit,
    validateDraft,
    visitState,
} from "@/features/new-site-visits/model";

const draft = {
    ...EMPTY_DRAFT,
    clientId: "client",
    propertyId: "property",
    date: "2030-01-02",
    startTime: "10:00",
    endTime: "11:00",
};
const now = Date.parse("2030-01-01T00:00:00Z");
const visit: SiteVisit = {
    id: "visit",
    clientId: "client",
    propertyId: "property",
    startsAt: "2030-01-02T04:30:00Z",
    endsAt: "2030-01-02T05:30:00Z",
    status: "scheduled",
    reminderMinutes: 30,
    notes: "",
    attendanceNote: "",
    history: [],
};

test("visit times use IST regardless of the device timezone", () => {
    assert.deepEqual(draftTimes(draft), {
        startsAt: "2030-01-02T04:30:00.000Z",
        endsAt: "2030-01-02T05:30:00.000Z",
    });
    assert.equal(draftTimes({ ...draft, date: "2030-02-30" }), null);
    assert.equal(draftTimes({ ...draft, startTime: "25:00" }), null);
});

test("clock boundaries derive running and needs-update without overwriting attendance", () => {
    assert.equal(visitState(visit, Date.parse(visit.startsAt) - 1), "upcoming");
    assert.equal(visitState(visit, Date.parse(visit.startsAt)), "running");
    assert.equal(visitState(visit, Date.parse(visit.endsAt)), "needs_update");
    for (const status of ["completed", "not_attended", "cancelled"] as const) {
        assert.equal(visitState({ ...visit, status }, Date.parse(visit.endsAt) + 1), status);
    }
    assert.equal(visit.status, "scheduled");
});

test("overlapping appointments block saves, but touching boundaries and rescheduling self do not", () => {
    assert.equal(validateDraft(draft, [visit], now).errors.conflict, "visit");
    assert.equal(
        validateDraft({ ...draft, startTime: "10:30", endTime: "11:30" }, [visit], now).valid,
        false,
    );
    assert.equal(
        validateDraft({ ...draft, startTime: "11:00", endTime: "12:00" }, [visit], now).valid,
        true,
    );
    assert.equal(validateDraft(draft, [visit], now, "visit").valid, true);
    for (const status of ["completed", "not_attended", "cancelled"] as const) {
        assert.equal(validateDraft(draft, [{ ...visit, status }], now).valid, true);
    }
});

test("incomplete, past and reversed times are rejected", () => {
    assert.equal(validateDraft(EMPTY_DRAFT, [], now).valid, false);
    assert.equal(validateDraft({ ...draft, endTime: "10:00" }, [], now).valid, false);
    assert.equal(validateDraft({ ...draft, endTime: "09:00" }, [], now).valid, false);
    assert.equal(validateDraft(draft, [], Date.parse(visit.startsAt)).valid, false);
});

test("optional reminder advances to start and attendance; terminal visits suppress notifications", () => {
    assert.equal(notificationKind(visit, Date.parse(visit.startsAt) - 31 * 60_000), null);
    assert.equal(notificationKind(visit, Date.parse(visit.startsAt) - 30 * 60_000), "reminder");
    assert.equal(
        notificationKind({ ...visit, reminderMinutes: 0 }, Date.parse(visit.startsAt) - 1),
        null,
    );
    assert.equal(notificationKind(visit, Date.parse(visit.startsAt)), "start");
    assert.equal(notificationKind(visit, Date.parse(visit.endsAt)), "attendance");
    for (const status of ["completed", "not_attended", "cancelled"] as const) {
        assert.equal(notificationKind({ ...visit, status }, Date.parse(visit.endsAt)), null);
    }
});
