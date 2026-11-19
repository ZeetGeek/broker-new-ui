import assert from "node:assert/strict";
import test from "node:test";

import type { TaskDraft } from "@/features/tasks/model";
import { createPlannerTask } from "@/features/tasks/planner-model";
import {
    bareTaskDraftTitle,
    changeQuickAddText,
    diffText,
    encodeTaskDraftTitle,
    insertQuickAddEntity,
    newQuickAddDraft,
    type QuickAddDraft,
    quickAddDraftFromTask,
    resolveQuickAddValues,
    syncQuickAddEntities,
} from "@/features/tasks/quick-add-draft";
import {
    entitiesFromCatalogText,
    findQuickAddMention,
    parseQuickAdd,
} from "@/features/tasks/quick-add-parse";

const now = Date.parse("2030-11-16T09:00:00+05:30");
const catalogs = {
    clients: [{ id: "client-aarav", name: "Aarav Shah" }],
    owners: [{ id: "owner-rakesh", name: "Rakesh Shah" }],
    properties: [{ id: "prop-happy", title: "Happy Elegance", locality: "Vesu", city: "Surat" }],
};
const parse = (draft: QuickAddDraft) =>
    parseQuickAdd(draft.text, {
        now,
        baseDate: draft.base.startDate,
        entities: draft.entities,
        dismissed: draft.dismissed,
    });
const type = (draft: QuickAddDraft, next: string, caret = next.length) =>
    changeQuickAddText(draft, next, {
        caret,
        previous: { start: draft.text.length, end: draft.text.length },
        atoms: parse(draft).atoms,
        composing: false,
    });
const backspace = (draft: QuickAddDraft, composing = false) => {
    const at = draft.text.length;
    return changeQuickAddText(draft, draft.text.slice(0, -1), {
        caret: at - 1,
        previous: { start: at, end: at },
        atoms: parse(draft).atoms,
        composing,
    });
};
/** Select `words` (and one neighbouring space) and delete. */
const cut = (draft: QuickAddDraft, words: string) => {
    const start = draft.text.indexOf(words);
    assert.ok(start >= 0, `“${words}” is in “${draft.text}”`);
    let end = start + words.length;
    if (draft.text[end] === " ") end++;
    else if (start > 0 && draft.text[start - 1] === " ") {
        return changeQuickAddText(draft, draft.text.slice(0, start - 1) + draft.text.slice(end), {
            caret: start - 1,
            previous: { start: start - 1, end },
            atoms: parse(draft).atoms,
            composing: false,
        }).draft;
    }
    return changeQuickAddText(draft, draft.text.slice(0, start) + draft.text.slice(end), {
        caret: start,
        previous: { start, end },
        atoms: parse(draft).atoms,
        composing: false,
    }).draft;
};
const pick = (draft: QuickAddDraft, id: string, label: string) => {
    const mention = findQuickAddMention(draft.text, draft.text.length);
    assert.ok(mention);
    return insertQuickAddEntity(draft, mention, {
        id,
        label,
        kind: mention.kind === "property" ? "property" : "client",
        detail: "",
    });
};

test("the caret pins edits inside repeated letters", () => {
    assert.deepEqual(diffText("aaa", "aaaa", 1), { start: 0, end: 0, inserted: "a" });
    assert.deepEqual(diffText("aaa", "aaaa", 2), { start: 1, end: 1, inserted: "a" });
    assert.deepEqual(diffText("abc", "ac", 1), { start: 1, end: 2, inserted: "" });
    assert.deepEqual(diffText("abc", "abXc"), { start: 2, end: 2, inserted: "X" });
});

test("picking a record swaps the search for an atomic token and a space", () => {
    const typed = type(newQuickAddDraft(null), "Visit #hap").draft;
    const { draft, caret } = pick(typed, "prop-happy", "Happy Elegance");
    assert.equal(draft.text, "Visit #Happy Elegance ");
    assert.equal(caret, draft.text.length);
    assert.deepEqual(draft.entities, [
        { kind: "property", refId: "prop-happy", label: "Happy Elegance", start: 6, end: 21 },
    ]);
    assert.equal(parse(draft).propertyId, "prop-happy");
    assert.equal(parse(draft).title, "Visit");

    const spaced = type(draft, `${draft.text}tomorrow`).draft;
    assert.equal(parse(spaced).date, "2030-11-17");

    const removedSpace = backspace(draft).draft;
    assert.equal(removedSpace.text, "Visit #Happy Elegance");
    const removedToken = backspace(removedSpace);
    assert.equal(removedToken.draft.text, "Visit ");
    assert.deepEqual(removedToken.draft.entities, []);
    assert.equal(removedToken.caret, 6);
});

test("typing before a token moves it; a second pick of the same kind replaces it", () => {
    const first = pick(
        type(newQuickAddDraft(null), "#ha").draft,
        "prop-happy",
        "Happy Elegance",
    ).draft;
    const prefixed = changeQuickAddText(first, `Go ${first.text}`, {
        caret: 3,
        previous: { start: 0, end: 0 },
        atoms: [],
        composing: false,
    }).draft;
    assert.deepEqual(
        prefixed.entities.map(({ start, end }) => [start, end]),
        [[3, 18]],
    );
    const second = pick(type(prefixed, `${prefixed.text}#ib`).draft, "prop-ibc", "IBC Tower").draft;
    assert.equal(second.text, "Go #IBC Tower ");
    assert.deepEqual(
        second.entities.map((entity) => entity.refId),
        ["prop-ibc"],
    );
});

test("Backspace at the end of a phrase turns it back into words first", () => {
    const typed = type(newQuickAddDraft(null), "Call tomorrow").draft;
    assert.equal(parse(typed).date, "2030-11-17");
    const dismissed = backspace(typed);
    assert.equal(dismissed.draft.text, "Call tomorrow");
    assert.equal(parse(dismissed.draft).date, null);
    assert.equal(parse(dismissed.draft).title, "Call tomorrow");

    const deleted = backspace(dismissed.draft).draft;
    assert.equal(deleted.text, "Call tomorro");
    assert.deepEqual(deleted.dismissed, []);
    const retyped = type(deleted, "Call tomorrow").draft;
    assert.equal(parse(retyped).date, "2030-11-17");

    assert.equal(backspace(typed, true).draft.text, "Call tomorro");
});

test("typed reminders wait for a due time before they are saved", () => {
    const typed = type(newQuickAddDraft("2030-11-16"), "Call !30m").draft;
    const values = resolveQuickAddValues(typed, parse(typed), now);
    assert.deepEqual(values.reminders, []);
    assert.equal(values.reminderError, "Reminders need a due time — add due 5pm (or similar).");
    assert.equal(values.reminderIssues[0]?.reason, "need-time");

    const timed = type(typed, "Call today 5pm due 6pm !30m").draft;
    const next = resolveQuickAddValues(timed, parse(timed), now);
    assert.deepEqual(next.reminders, [30]);
    assert.equal(next.startTime, "17:00");
    assert.equal(next.dueTime, "18:00");
    assert.equal(next.reminderError, "");
    assert.deepEqual(next.reminderIssues, []);
});

test("a due time that has already passed is flagged on the schedule chip", () => {
    const futureDraft = type(newQuickAddDraft("2030-11-16"), "Call today 5pm").draft;
    const future = resolveQuickAddValues(futureDraft, parse(futureDraft), now);
    assert.equal(future.schedulePassed, false);
    assert.equal(future.scheduleError, "");

    const pastDraft = type(newQuickAddDraft("2030-11-16"), "Call today 8am").draft;
    const past = resolveQuickAddValues(pastDraft, parse(pastDraft), now);
    assert.equal(past.schedulePassed, true);
    assert.equal(past.time, "08:00");
    assert.ok(past.scheduleIssues.length > 0);
    assert.equal(past.scheduleError, "That time has already passed. Pick a later time.");
});

test("reminder chips reject past offsets, duplicates, and more than five", () => {
    const past = type(newQuickAddDraft("2030-11-16"), "Call today 5pm due 11pm !1d").draft;
    const pastValues = resolveQuickAddValues(past, parse(past), now);
    assert.deepEqual(pastValues.reminders, []);
    assert.equal(pastValues.reminderIssues[0]?.reason, "already-passed");
    assert.match(pastValues.reminderError, /already passed/i);

    const dup = type(newQuickAddDraft("2030-11-16"), "Call today 5pm due 6pm !30m !30m").draft;
    const dupValues = resolveQuickAddValues(dup, parse(dup), now);
    assert.deepEqual(dupValues.reminders, [30]);
    assert.equal(dupValues.reminderIssues[0]?.reason, "duplicate");

    const many = type(
        newQuickAddDraft("2030-11-16"),
        "Call today 5pm due 11pm !30m !40m !1h !2h !3h !4h !5h",
    ).draft;
    const manyValues = resolveQuickAddValues(many, parse(many), now);
    assert.deepEqual(manyValues.reminders, [180, 120, 60, 40, 30]);
    assert.ok(manyValues.reminderIssues.every((issue) => issue.reason === "too-many"));
    assert.equal(manyValues.reminderIssues.length, 2);
    assert.equal(manyValues.reminderError, "You can add up to 5 reminders.");
});

test("due is optional, needs start date+time, and cannot be earlier than start", () => {
    const startOnly = type(newQuickAddDraft("2030-11-16"), "Call tomorrow 5pm").draft;
    const started = resolveQuickAddValues(startOnly, parse(startOnly), now);
    assert.equal(started.startDate, "2030-11-17");
    assert.equal(started.startTime, "17:00");
    assert.equal(started.dueDate, null);
    assert.equal(started.dueError, "");

    const ranged = type(startOnly, "Call tomorrow 5pm due friday 6pm").draft;
    const withDue = resolveQuickAddValues(ranged, parse(ranged), now);
    assert.equal(withDue.startDate, "2030-11-17");
    assert.equal(withDue.dueDate, "2030-11-22");
    assert.equal(withDue.dueTime, "18:00");
    assert.equal(withDue.dueError, "");

    const early = type(newQuickAddDraft("2030-11-16"), "Call tomorrow 5pm due today 4pm").draft;
    const invalid = resolveQuickAddValues(early, parse(early), now);
    assert.equal(invalid.dueDate, null);
    assert.equal(invalid.dueError, "Due must be on or after the start date and time.");

    const dueOnly = type(newQuickAddDraft("2030-11-16"), "Call due tomorrow 6pm").draft;
    const blocked = resolveQuickAddValues(dueOnly, parse(dueOnly), now);
    assert.equal(blocked.dueDate, null);
    assert.equal(blocked.dueError, "Add a start date and time before the due date.");
});

test("saved titles keep chips in place; edit opens them there, not at the end", () => {
    const title =
        "I've to show this @Aarav Shah client this #Happy Elegance property tomorrow at 11am p1";
    const typed = (() => {
        let draft = type(newQuickAddDraft("2030-11-16"), "I've to show this @aar").draft;
        draft = pick(draft, "client-aarav", "Aarav Shah").draft;
        draft = type(draft, `${draft.text}client this #hap`).draft;
        draft = pick(draft, "prop-happy", "Happy Elegance").draft;
        return type(draft, `${draft.text}property tomorrow at 11am p1`).draft;
    })();
    const saved = resolveQuickAddValues(typed, parse(typed), now);
    assert.equal(saved.title, title);
    assert.equal(saved.date, "2030-11-17");
    assert.equal(saved.time, "11:00");
    assert.equal(saved.priority, "urgent");
    assert.equal(saved.propertyId, "prop-happy");
    assert.equal(saved.clientId, "client-aarav");

    const task = createPlannerTask(saved.title, saved.startDate, now, "task-a", undefined, {
        startTime: saved.startTime,
        dueDate: saved.dueDate,
        dueTime: saved.dueTime,
        priority: saved.priority ?? "low",
        propertyId: saved.propertyId ?? undefined,
        clientId: saved.clientId ?? undefined,
    });
    const draft = quickAddDraftFromTask(task, now, catalogs);
    assert.equal(draft.text, title);
    assert.ok(draft.text.indexOf("@Aarav Shah") < draft.text.indexOf("client this"));
    assert.ok(draft.text.indexOf("#Happy Elegance") < draft.text.indexOf("property"));
    assert.deepEqual(
        draft.entities.map((entity) => entity.refId),
        ["client-aarav", "prop-happy"],
    );
    assert.deepEqual(
        draft.entities.map(({ start, end }) => draft.text.slice(start, end)),
        ["@Aarav Shah", "#Happy Elegance"],
    );

    const lessened = cut(cut(draft, "p1"), "@Aarav Shah");
    const values = resolveQuickAddValues(lessened, parse(lessened), now);
    assert.equal(values.priority, null);
    assert.equal(values.clientId, null);
    assert.equal(values.propertyId, "prop-happy");
    assert.match(values.title, /#Happy Elegance/);
});

test("pasting # / @ labels re-links catalog chips in place", () => {
    const pasted = "today at 11:30pm meeting with @Aarav Shah about #Happy Elegance p1";
    const draft = syncQuickAddEntities(
        changeQuickAddText(newQuickAddDraft("2030-11-16"), pasted, {
            caret: pasted.length,
            previous: { start: 0, end: 0 },
            atoms: [],
            composing: false,
        }).draft,
        catalogs,
    );
    assert.deepEqual(
        draft.entities.map((entity) => [
            entity.kind,
            entity.refId,
            draft.text.slice(entity.start, entity.end),
        ]),
        [
            ["client", "client-aarav", "@Aarav Shah"],
            ["property", "prop-happy", "#Happy Elegance"],
        ],
    );
    const values = resolveQuickAddValues(draft, parse(draft), now);
    assert.equal(values.clientId, "client-aarav");
    assert.equal(values.propertyId, "prop-happy");
    assert.equal(values.priority, "urgent");
    assert.equal(values.time, "23:30");
    assert.deepEqual(
        entitiesFromCatalogText("Call @Aarav Shah later", catalogs).map((entity) => entity.refId),
        ["client-aarav"],
    );
});

test("edit opens linked contacts as chips when the title has none", () => {
    const task = createPlannerTask("Follow up call", "2030-11-16", now, "linked", undefined, {
        clientId: "client-aarav",
        propertyId: "prop-happy",
        ownerId: "owner-rakesh",
    });
    const draft = quickAddDraftFromTask(task, now, catalogs);
    assert.equal(draft.text, "Follow up call #Happy Elegance @Aarav Shah @Rakesh Shah");
    assert.deepEqual(
        draft.entities.map((entity) => [entity.kind, entity.refId]),
        [
            ["property", "prop-happy"],
            ["client", "client-aarav"],
            ["owner", "owner-rakesh"],
        ],
    );
});

test("older stripped titles keep details on base without appending chips at the end", () => {
    const task = createPlannerTask(
        "Call about monday visit",
        "2030-11-18",
        now,
        "task-b",
        undefined,
        {
            startTime: "11:00",
            priority: "high",
            repeat: { unit: "week", interval: 1, weekdays: [1], until: "2030-12-31" },
            clientId: "client-missing",
        },
    );
    const draft = quickAddDraftFromTask(task, now, catalogs);
    assert.equal(draft.text, "Call about monday visit");
    const values = resolveQuickAddValues(draft, parse(draft), now);
    assert.equal(values.title, "Call about monday visit");
    assert.equal(values.startDate, "2030-11-18");
    assert.equal(values.startTime, "11:00");
    assert.equal(values.dueDate, null);
    assert.equal(values.priority, "high");
    assert.deepEqual(values.repeat, task.repeat);
    assert.equal(values.clientId, "client-missing");
});

test("modal save encodes fields as end-of-title chips like quick-add", () => {
    const draft: TaskDraft = {
        title: "I've a visit",
        details: "",
        startDate: "2030-11-16",
        startTime: "12:00",
        repeat: null,
        dueDate: "2030-11-16",
        dueTime: "18:00",
        reminders: [15],
        clientId: "client-aarav",
        ownerId: "",
        propertyId: "prop-happy",
        priority: "high",
    };
    const title = encodeTaskDraftTitle(draft, catalogs, now);
    assert.equal(title, "I've a visit today 12pm #Happy Elegance @Aarav Shah due 6pm p2 !15m");
    const entities = entitiesFromCatalogText(title, catalogs);
    const parsed = parseQuickAdd(title, { now, baseDate: draft.startDate, entities });
    assert.equal(parsed.startDate, "2030-11-16");
    assert.equal(parsed.startTime, "12:00");
    assert.equal(parsed.dueDate, "2030-11-16");
    assert.equal(parsed.dueTime, "18:00");
    assert.equal(parsed.priority, "high");
    assert.deepEqual(parsed.reminders, [15]);
    assert.equal(parsed.propertyId, "prop-happy");
    assert.equal(parsed.clientId, "client-aarav");
    assert.equal(
        bareTaskDraftTitle(
            title,
            {
                propertyId: draft.propertyId,
                clientId: draft.clientId,
                ownerId: draft.ownerId || null,
            },
            catalogs,
            now,
            draft.startDate,
        ),
        "I've a visit",
    );
});

test("modal keeps shortcut words in the name as plain text, not field chips", () => {
    const draft: TaskDraft = {
        title: "i'll meet this guy tomorrow 10am",
        details: "",
        startDate: "2030-11-16",
        startTime: "00:37",
        repeat: null,
        dueDate: "",
        dueTime: "",
        reminders: [],
        clientId: "",
        ownerId: "",
        propertyId: "",
        priority: "low",
    };
    const title = encodeTaskDraftTitle(draft, catalogs, now);
    assert.equal(title, `i'll meet this guy "tomorrow" "10am" today 12:37am`);
    const parsed = parseQuickAdd(title, { now, baseDate: draft.startDate });
    assert.equal(parsed.startDate, "2030-11-16");
    assert.equal(parsed.startTime, "00:37");
    assert.equal(
        bareTaskDraftTitle(
            title,
            { propertyId: null, clientId: null, ownerId: null },
            catalogs,
            now,
            draft.startDate,
        ),
        "i'll meet this guy tomorrow 10am",
    );
});

test("quoted shortcut words stay plain text in quick-add", () => {
    const text = `Call about "tomorrow" and "due 20m" today 5pm`;
    const parsed = parseQuickAdd(text, { now, baseDate: "2030-11-16" });
    assert.equal(parsed.startDate, "2030-11-16");
    assert.equal(parsed.startTime, "17:00");
    assert.equal(parsed.dueDate, null);
    assert.match(parsed.title, /tomorrow/);
    assert.match(parsed.title, /due 20m/);
    assert.ok(!parsed.atoms.some((atom) => text.slice(atom.start, atom.end) === "tomorrow"));
});
