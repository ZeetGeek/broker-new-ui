import assert from "node:assert/strict";
import test from "node:test";

import {
    findQuickAddMention,
    parseQuickAdd,
    quickAddContactOptions,
    type QuickAddEntity,
    quickAddPropertyOptions,
    taskRowTitle,
} from "@/features/tasks/quick-add-parse";

// Saturday 16 Nov 2030, 9:00 am IST.
const now = Date.parse("2030-11-16T09:00:00+05:30");
const parse = (text: string, options: Partial<Parameters<typeof parseQuickAdd>[1]> = {}) =>
    parseQuickAdd(text, { now, ...options });

const catalogs = {
    clients: [
        { id: "client-aarav", name: "Aarav Shah" },
        { id: "client-nisha", name: "Nisha Mehta" },
    ],
    owners: [
        { id: "owner-rakesh", name: "Rakesh Shah" },
        { id: "owner-sunita", name: "Sunita Patel" },
    ],
    properties: [
        {
            id: "prop-happy",
            title: "Happy Elegance",
            locality: "Vesu",
            city: "Surat",
            configLabel: "3 BHK apartment",
            address: "VIP Road, Vesu",
        },
        {
            id: "prop-ibc",
            title: "IBC Tower",
            locality: "Adajan",
            city: "Surat",
            configLabel: "Office",
        },
    ],
};

test("date, time and priority become fields and leave the title", () => {
    const result = parse("Call Aarav tomorrow 5pm p1");
    assert.equal(result.title, "Call Aarav");
    assert.equal(result.startDate, "2030-11-17");
    assert.equal(result.startTime, "17:00");
    assert.equal(result.dueDate, null);
    assert.equal(result.priority, "urgent");
    assert.deepEqual(
        result.highlights.map(({ kind, start, end }) => [kind, start, end]),
        [
            ["schedule", 11, 23],
            ["priority", 24, 26],
        ],
    );
});

test("an explicit due clause sets the optional end schedule", () => {
    const result = parse("Site visit today 5pm due tomorrow 6pm");
    assert.equal(result.title, "Site visit");
    assert.equal(result.startDate, "2030-11-16");
    assert.equal(result.startTime, "17:00");
    assert.equal(result.dueDate, "2030-11-17");
    assert.equal(result.dueTime, "18:00");
    assert.ok(result.highlights.some((highlight) => highlight.kind === "due"));
});

test("relative dates resolve on the India calendar", () => {
    assert.equal(parse("today").date, "2030-11-16");
    assert.equal(parse("tmrw").date, "2030-11-17");
    assert.equal(parse("day after tomorrow").date, "2030-11-18");
    assert.equal(parse("monday").date, "2030-11-18");
    assert.equal(parse("saturday").date, "2030-11-16");
    assert.equal(parse("next saturday").date, "2030-11-23");
    assert.equal(parse("on fri").date, "2030-11-22");
    assert.equal(parse("next week").date, "2030-11-18");
    assert.equal(parse("next month").date, "2030-12-01");
    assert.equal(parse("this weekend").date, "2030-11-16");
    assert.equal(parse("next weekend").date, "2030-11-23");
    assert.equal(parse("in 3 days").date, "2030-11-19");
    assert.equal(parse("in two weeks").date, "2030-11-30");
    assert.equal(parse("in 3 months").date, "2031-02-16");
});

test("calendar dates read dd/mm and month names, rolling a past day to next year", () => {
    assert.equal(parse("Registry 25/12/2030").date, "2030-12-25");
    assert.equal(parse("Registry 25-12-30").date, "2030-12-25");
    assert.equal(parse("Registry by 5/12").date, "2030-12-05");
    assert.equal(parse("16 nov").date, "2030-11-16");
    assert.equal(parse("15 nov").date, "2031-11-15");
    assert.equal(parse("dec 1").date, "2030-12-01");
    assert.equal(parse("1st jan 2031").date, "2031-01-01");
    assert.equal(parse("31/02/2031").date, null);
});

test("property words are not mistaken for dates or times", () => {
    const flat = parse("Show 2/3 BHK flat");
    assert.equal(flat.date, null);
    assert.equal(flat.title, "Show 2/3 BHK flat");
    assert.equal(parse("Check sun deck").date, null);
    assert.equal(parse("Offer at 3 bhk rate").time, null);
    assert.equal(parse("Quote at 2 cr").time, null);
    assert.equal(parse("Meet at 5 amenities desk").time, "17:00");
    assert.equal(parse("Visit sector p10").priority, null);
});

test("times read 12h, 24h and bare working hours", () => {
    assert.equal(parse("at 10am").time, "10:00");
    assert.equal(parse("4:30 pm").time, "16:30");
    assert.equal(parse("12am").time, "00:00");
    assert.equal(parse("12pm").time, "12:00");
    assert.equal(parse("16:00").time, "16:00");
    assert.equal(parse("09:30").time, "09:30");
    assert.equal(parse("9:30").time, "09:30");
    assert.equal(parse("5:30").time, "17:30");
    assert.equal(parse("at 5").time, "17:00");
    assert.equal(parse("at 10").time, "10:00");
    assert.equal(parse("noon").time, "12:00");
    assert.equal(parse("13pm").time, null);
});

test("a time alone lands on the composer's day, or today / tomorrow by the clock", () => {
    assert.equal(parse("Call 5pm").date, "2030-11-16");
    assert.equal(parse("Call 8am").date, "2030-11-17");
    assert.equal(parse("Call 8am", { baseDate: "2030-11-20" }).date, "2030-11-20");
});

test("repeats become rules and fill in a date that matches the rule", () => {
    const rent = parse("Pay rent every month");
    assert.equal(rent.title, "Pay rent");
    assert.deepEqual(rent.repeat, { unit: "month", interval: 1, weekdays: [], until: null });
    assert.equal(rent.date, "2030-11-16");

    const visits = parse("Site visits every monday and friday at 10am");
    assert.deepEqual(visits.repeat, { unit: "week", interval: 1, weekdays: [1, 5], until: null });
    assert.equal(visits.date, "2030-11-18");
    assert.equal(visits.time, "10:00");
    assert.equal(visits.highlights.length, 1);

    assert.deepEqual(parse("every weekday").repeat?.weekdays, [1, 2, 3, 4, 5]);
    assert.deepEqual(parse("every weekend").repeat?.weekdays, [0, 6]);
    assert.deepEqual(parse("every other week").repeat, {
        unit: "week",
        interval: 2,
        weekdays: [6],
        until: null,
    });
    assert.equal(parse("every 3 days").repeat?.interval, 3);
    assert.equal(parse("daily standup").title, "standup");
    assert.equal(parse("everyday").repeat?.unit, "day");
    assert.equal(parse("yearly renewal").repeat?.unit, "year");
});

test("reminders read !30m, !1h before and !at time; repeats are merged", () => {
    const result = parse("Call !30m !1h before !30 min");
    assert.deepEqual(result.reminders, [60, 30]);
    assert.equal(result.title, "Call");
    assert.deepEqual(parse("!1d").reminders, [1440]);
    assert.deepEqual(parse("!at time").reminders, [0]);
    assert.deepEqual(parse("wow!30m").reminders, []);
});

test("the first date, time and priority win; later ones stay in the title", () => {
    const result = parse("Call p2 tomorrow then p3 monday");
    assert.equal(result.priority, "high");
    assert.equal(result.date, "2030-11-17");
    assert.equal(result.title, "Call then p3 monday");
});

test("dismissed phrases and picked records are never parsed", () => {
    const dismissed = parse("Discuss tomorrow plan", { dismissed: [{ start: 8, end: 16 }] });
    assert.equal(dismissed.date, null);
    assert.equal(dismissed.title, "Discuss tomorrow plan");

    const text = "Visit #Monday Plaza tomorrow";
    const entity: QuickAddEntity = {
        kind: "property",
        refId: "prop-monday",
        label: "Monday Plaza",
        start: 6,
        end: 19,
    };
    const result = parse(text, { entities: [entity] });
    assert.equal(result.date, "2030-11-17");
    assert.equal(result.propertyId, "prop-monday");
    assert.equal(result.title, "Visit");
    assert.deepEqual(
        result.highlights.map((item) => item.kind),
        ["property", "schedule"],
    );
});

test("an open # / @ search is a query, not task words", () => {
    const mention = findQuickAddMention("Call @tod", 9);
    assert.deepEqual(mention, { kind: "contact", start: 5, end: 9, query: "tod" });
    assert.equal(parse("Call @tod", { mention }).date, null);
    assert.equal(findQuickAddMention("mail me@site", 12), null);
    assert.equal(findQuickAddMention("Call @ aa", 9), null);
    assert.equal(findQuickAddMention("Call #ha", 8, [], 5), null);
    assert.equal(findQuickAddMention("Call #ha", 8)?.kind, "property");
    assert.equal(parse("Call #").title, "Call");
});

test("titles keep their punctuation tidy after phrases are removed", () => {
    assert.equal(parse("Call Aarav, tomorrow, about papers").title, "Call Aarav, about papers");
    assert.equal(parse("tomorrow - send brochure").title, "send brochure");
});

test("record search covers property details and both Clients and Owners", () => {
    assert.deepEqual(
        quickAddPropertyOptions(catalogs, "vesu").map((item) => item.id),
        ["prop-happy"],
    );
    assert.equal(quickAddPropertyOptions(catalogs, "office")[0].detail, "Office · Adajan · Surat");
    assert.deepEqual(
        quickAddContactOptions(catalogs, "shah").map((item) => [item.kind, item.id]),
        [
            ["client", "client-aarav"],
            ["owner", "owner-rakesh"],
        ],
    );
    assert.equal(quickAddContactOptions(catalogs, "").length, 4);
});

test("saved row titles are plain: no chips, no #/@, no date or priority words", () => {
    const text =
        "I've to show this @Aarav Shah client this #Happy Elegance property today at 11am and this is very urgent p1";
    const links = {
        propertyId: "prop-happy",
        clientId: "client-aarav",
        ownerId: null as string | null,
    };
    assert.equal(
        taskRowTitle(text, links, catalogs, now, "2030-11-16"),
        "I've to show this Aarav Shah client this Happy Elegance property at 11am and this is very urgent",
    );
});
