import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "@/lib/api/client";
import type { BookableLead, BrokerVisit } from "@/lib/api/site-visits";

import {
    bookableDates,
    DURATION_CHIPS,
    EMPTY_DRAFT,
    getVisitActions,
    isTimeTaken,
    matchIntent,
    parseScheduleIntent,
    rescheduleDraft,
    resolveScheduleIntent,
    validateVisitDraft,
    visitErrorMessage,
    visitReminderAt,
    visitReminderLabel,
    visitReminders,
    visitState,
} from "@/features/new-site-visits/model";

// 2030-01-02 10:00 IST.
const START = "2030-01-02T04:30:00.000Z";
const END = "2030-01-02T05:15:00.000Z";
const before = Date.parse(START) - 60_000;

const visit: BrokerVisit = {
    id: "v1",
    leadId: "lead-1",
    clientId: "client-1",
    clientName: "Ravi",
    clientPhone: null,
    ownerName: null,
    ownerAvatarUrl: null,
    propertyId: "prop-1",
    propertyTitle: "Shanti Flat",
    locality: "Vesu",
    city: "Surat",
    isExclusive: true,
    startsAt: START,
    endsAt: END,
    durationMinutes: 45,
    status: "confirmed",
    notes: "",
    bookedAt: "2030-01-01T00:00:00.000Z",
    updatedAt: "2030-01-01T00:00:00.000Z",
};

const leads: BookableLead[] = [
    {
        leadId: "lead-1",
        clientId: "client-1",
        clientName: "Ravi",
        propertyId: "prop-1",
        propertyTitle: "Shanti Flat",
    },
    {
        leadId: "lead-2",
        clientId: "client-1",
        clientName: "Ravi",
        propertyId: "prop-2",
        propertyTitle: "Green Villa",
    },
];

test("a visit is Running from its start and Needs update from its end", () => {
    assert.equal(visitState(visit, before), "upcoming");
    assert.equal(visitState(visit, Date.parse(START)), "running");
    assert.equal(visitState(visit, Date.parse(END)), "needs_update");
});

test("a marked or cancelled visit keeps its state whatever the time", () => {
    assert.equal(visitState({ ...visit, status: "completed" }, before), "completed");
    assert.equal(visitState({ ...visit, status: "no_show" }, before), "not_attended");
    assert.equal(visitState({ ...visit, status: "cancelled" }, Date.parse(END)), "cancelled");
});

test("actions follow the visit's state", () => {
    assert.deepEqual(getVisitActions(visit, before), ["reschedule", "cancelled"]);
    assert.deepEqual(getVisitActions(visit, Date.parse(START)), [
        "completed",
        "not_attended",
        "reschedule",
        "cancelled",
    ]);
    assert.deepEqual(getVisitActions({ ...visit, status: "completed" }, before), ["not_attended"]);
    assert.deepEqual(getVisitActions({ ...visit, status: "no_show" }, before), ["completed"]);
    assert.deepEqual(getVisitActions({ ...visit, status: "cancelled" }, before), ["view"]);
});

test("visits on an owner's listing cannot be rescheduled", () => {
    assert.deepEqual(getVisitActions({ ...visit, isExclusive: false }, before), ["cancelled"]);
});

test("a length chip must be chosen", () => {
    const errors = validateVisitDraft(
        {
            ...EMPTY_DRAFT,
            leadId: "lead-1",
            clientId: "client-1",
            propertyId: "prop-1",
            date: "2030-01-02",
            startAt: START,
        },
        before,
    );
    assert.equal(errors.durationMinutes, "Choose how long the visit is.");
});

test("a new visit needs a client, property, date and start time", () => {
    const errors = validateVisitDraft(EMPTY_DRAFT, before);
    assert.equal(errors.clientId, "Choose a client.");
    assert.equal(errors.propertyId, "Choose a property.");
    assert.equal(errors.date, "Choose a visit date.");
    assert.equal(errors.startAt, "Choose a start time.");
});

test("a start time that has passed is rejected", () => {
    const errors = validateVisitDraft(
        { ...rescheduleDraft(visit, before), durationMinutes: 30 },
        Date.parse(START) + 1,
    );
    assert.equal(errors.startAt, "Pick a time in the future.");
});

test("a complete draft is valid", () => {
    assert.deepEqual(validateVisitDraft({ ...rescheduleDraft(visit, before) }, before), {});
});

test("reschedule starts from the visit's own length and time", () => {
    const draft = rescheduleDraft(visit, before);
    assert.equal(draft.durationMinutes, 45);
    assert.equal(draft.date, "2030-01-02");
    assert.equal(draft.startAt, START);
    assert.equal(draft.leadId, "lead-1");
});

test("length chips are 30 min, 45 min and 1 hour", () => {
    assert.deepEqual(
        DURATION_CHIPS.map((chip) => [chip.value, chip.label]),
        [
            [30, "30 min"],
            [45, "45 min"],
            [60, "1 hour"],
        ],
    );
});

test("the pipeline link opens scheduling only with schedule=1", () => {
    assert.deepEqual(parseScheduleIntent(new URLSearchParams("schedule=1&leadId=lead-1")), {
        leadId: "lead-1",
    });
    assert.equal(parseScheduleIntent(new URLSearchParams("leadId=lead-1")), null);
});

test("the pipeline link finds the deal by id, then by client and property", () => {
    assert.equal(matchIntent({ leadId: "lead-2" }, leads)?.propertyId, "prop-2");
    assert.equal(
        matchIntent({ clientId: "client-1", propertyId: "prop-2" }, leads)?.leadId,
        "lead-2",
    );
});

test("a deal that can't be booked here matches nothing", () => {
    assert.equal(matchIntent({ leadId: "closed-deal" }, leads), null);
    assert.equal(matchIntent({ clientId: "client-1" }, leads), null);
});

test("bookable dates are today and the next 13 IST days", () => {
    const dates = bookableDates(Date.parse("2030-01-01T20:00:00Z"));
    assert.equal(dates.length, 14);
    assert.equal(dates[0], "2030-01-02");
    assert.equal(dates[13], "2030-01-15");
});

test("multiple and custom visit reminders keep distinct IST instants and readable labels", () => {
    const reminders = visitReminders({ startsAt: START, reminders: [0, 15, 90, 1440, 90] });
    assert.deepEqual(
        reminders.map(({ minutes, at }) => ({ minutes, at })),
        [
            { minutes: 1440, at: "2030-01-01T04:30:00.000Z" },
            { minutes: 90, at: "2030-01-02T03:00:00.000Z" },
            { minutes: 15, at: "2030-01-02T04:15:00.000Z" },
            { minutes: 0, at: "2030-01-02T04:30:00.000Z" },
        ],
    );
    assert.equal(visitReminderLabel(90), "1 hour 30 minutes before");
    assert.equal(visitReminderLabel(0), "At visit time");
    assert.equal(visitReminderAt(START, -1), null);
    assert.equal(visitReminderAt("invalid", 30), null);
});

test("rescheduling an overdue visit from an earlier day starts on today with no time", () => {
    const draft = rescheduleDraft(visit, Date.parse("2030-01-05T04:30:00.000Z"));
    assert.equal(draft.date, "2030-01-05");
    assert.equal(draft.startAt, "");
    assert.equal(draft.durationMinutes, 45);
});

test("the pipeline link reschedules the deal's booked visit only when the deal is bookable", () => {
    assert.deepEqual(resolveScheduleIntent({ leadId: "lead-1" }, leads, visit), {
        kind: "reschedule",
        visit,
    });
    assert.deepEqual(resolveScheduleIntent({ leadId: "lead-1" }, leads, null), {
        kind: "schedule",
        intent: leads[0],
        intentMissed: false,
    });
    assert.deepEqual(resolveScheduleIntent({ leadId: "closed-deal" }, leads, visit), {
        kind: "schedule",
        intent: null,
        intentMissed: true,
    });
});

test("save errors never show server addresses or internal failures", () => {
    assert.equal(
        visitErrorMessage(new ApiError("Unable to reach the server at http://api.local", 0)),
        "You seem to be offline. Check your connection and try again.",
    );
    assert.equal(
        visitErrorMessage(new ApiError("Internal server error", 500)),
        "Something went wrong on our side. Try again in a minute.",
    );
    assert.equal(
        visitErrorMessage(new ApiError("That time on Flat is already booked", 400)),
        "That time on Flat is already booked",
    );
    assert.equal(
        visitErrorMessage(new Error("boom")),
        "That didn't save. Check your connection and try again.",
    );
});

test("only a taken time clears the chosen start", () => {
    assert.equal(isTimeTaken(new ApiError("That time on Flat is already booked", 400)), true);
    assert.equal(isTimeTaken(new ApiError("x", 400, { code: "BROKER_TIME_CONFLICT" })), true);
    assert.equal(isTimeTaken(new ApiError("Unable to reach the server", 0)), false);
});
