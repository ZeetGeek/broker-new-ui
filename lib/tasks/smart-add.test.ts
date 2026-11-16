import assert from "node:assert/strict";
import test from "node:test";

import {
    clearSmartKind,
    filterSmartContacts,
    filterSmartProperties,
    parseSmartAdd,
    resolveTimeToken,
    smartDateChipLabel,
    splitSmartInlineParts,
    stripSmartTokens,
} from "@/features/tasks/smart-add";

const now = Date.parse("2030-11-16T09:00:00+05:30"); // Saturday
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

test("priority tokens map p1–p4 and the last match wins", () => {
    assert.equal(parseSmartAdd("Call Aarav p2", now).priority, "high");
    assert.equal(parseSmartAdd("Call Aarav p1", now).priority, "urgent");
    assert.equal(parseSmartAdd("Call Aarav p4 then p3", now).priority, "medium");
    assert.equal(parseSmartAdd("Call Aarav", now).priority, null);
    assert.equal(parseSmartAdd("Call Aarav p1", now).title, "Call Aarav");
});

test("date words resolve on the India calendar, including weekdays and dd/mm/yyyy", () => {
    assert.equal(parseSmartAdd("Follow up today", now).dueDate, "2030-11-16");
    assert.equal(parseSmartAdd("Follow up tomorrow", now).dueDate, "2030-11-17");
    assert.equal(parseSmartAdd("Follow up day after tomorrow", now).dueDate, "2030-11-18");
    assert.equal(parseSmartAdd("Follow up dayaftertomorrow", now).dueDate, "2030-11-18");
    assert.equal(parseSmartAdd("Follow up next week", now).dueDate, "2030-11-23");
    assert.equal(parseSmartAdd("Follow up monday", now).dueDate, "2030-11-18");
    assert.equal(parseSmartAdd("Follow up saturday", now).dueDate, "2030-11-16");
    assert.equal(parseSmartAdd("Follow up next saturday", now).dueDate, "2030-11-23");
    assert.equal(parseSmartAdd("Follow up 21/11/2030", now).dueDate, "2030-11-21");
    assert.equal(parseSmartAdd("Follow up 31/11/2030", now).hasDueDate, false);
    assert.equal(parseSmartAdd("today then tomorrow", now).dueDate, "2030-11-17");
});

test("open # and @ mentions are detected at the end and stripped from the saved title", () => {
    const property = parseSmartAdd("Visit #hap", now);
    assert.deepEqual(property.mention, { kind: "property", start: 6, query: "hap" });
    assert.equal(property.title, "Visit");

    const contact = parseSmartAdd("Call @aa", now);
    assert.deepEqual(contact.mention, { kind: "contact", start: 5, query: "aa" });
    assert.equal(contact.title, "Call");

    assert.equal(parseSmartAdd("#", now).mention?.kind, "property");
    assert.equal(parseSmartAdd("@", now).mention?.kind, "contact");
    assert.equal(parseSmartAdd("Visit #hap done", now).mention, null);
});

test("property and contact filters search catalogs and keep both Clients and Owners", () => {
    assert.deepEqual(
        filterSmartProperties(catalogs, "vesu").map((item) => item.id),
        ["prop-happy"],
    );
    assert.deepEqual(
        filterSmartProperties(catalogs, "office").map((item) => item.id),
        ["prop-ibc"],
    );
    assert.deepEqual(
        filterSmartContacts(catalogs, "rakesh").map((item) => [item.kind, item.id]),
        [["owner", "owner-rakesh"]],
    );
    assert.deepEqual(
        filterSmartContacts(catalogs, "aarav").map((item) => [item.kind, item.id]),
        [["client", "client-aarav"]],
    );
    assert.equal(filterSmartContacts(catalogs, "").length, 4);
});

test("time tokens parse 12h clock forms into HH:mm", () => {
    assert.equal(resolveTimeToken("12:00pm"), "12:00");
    assert.equal(resolveTimeToken("1am"), "01:00");
    assert.equal(resolveTimeToken("9am"), "09:00");
    assert.equal(resolveTimeToken("10:12pm"), "22:12");
    assert.equal(resolveTimeToken("12am"), "00:00");
    assert.equal(resolveTimeToken("9:30 AM"), "09:30");
    assert.equal(resolveTimeToken("13pm"), null);
    assert.equal(parseSmartAdd("Visit 9am", now).dueTime, "09:00");
    assert.equal(parseSmartAdd("Visit 10:12pm then 1am", now).dueTime, "01:00");
    assert.equal(parseSmartAdd("Visit 9am today p1", now).title, "Visit");
    assert.equal(stripSmartTokens("Visit 9am today"), "Visit");
    assert.equal(clearSmartKind("Visit 9am today", "time"), "Visit today");
});

test("clearing date or priority tokens leaves the remaining title intact", () => {
    assert.equal(clearSmartKind("Call Aarav today p1", "date"), "Call Aarav p1");
    assert.equal(clearSmartKind("Call Aarav today p1", "priority"), "Call Aarav today");
    assert.equal(parseSmartAdd("Call Aarav today p1 #vesu", now).title, "Call Aarav");
    assert.equal(stripSmartTokens("Call Aarav today p1"), "Call Aarav");
    assert.equal(smartDateChipLabel("2030-11-16", now), "Today");
    assert.equal(smartDateChipLabel("2030-11-21", now), "21 Nov 2030");
});

test("inline split turns date and priority tokens into chip parts while keeping surrounding words", () => {
    const { parts, mention } = splitSmartInlineParts("Ask Aarav tomorrow p1 about Vesu", now);
    assert.equal(mention, null);
    assert.deepEqual(
        parts.map((part) =>
            part.type === "text" ? ["text", part.value] : [part.type, part.label, part.value],
        ),
        [
            ["text", "Ask Aarav "],
            ["date", "Tomorrow", "2030-11-17"],
            ["text", " "],
            ["priority", "P1", "urgent"],
            ["text", " about Vesu"],
        ],
    );
    assert.equal(splitSmartInlineParts("Call @aa", now).mention?.kind, "contact");
});

test("inline split turns time tokens into chips", () => {
    const { parts } = splitSmartInlineParts("Call 9am p1", now);
    assert.deepEqual(
        parts.map((part) =>
            part.type === "text" ? ["text", part.value] : [part.type, part.label, part.value],
        ),
        [
            ["text", "Call "],
            ["time", "9:00 AM", "09:00"],
            ["text", " "],
            ["priority", "P1", "urgent"],
        ],
    );
});
