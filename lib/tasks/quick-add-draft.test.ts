import assert from "node:assert/strict";
import test from "node:test";

import { createPlannerTask } from "@/features/tasks/planner-model";
import {
    changeQuickAddText,
    diffText,
    insertQuickAddEntity,
    newQuickAddDraft,
    type QuickAddDraft,
    quickAddDraftFromTask,
    resolveQuickAddValues,
} from "@/features/tasks/quick-add-draft";
import { findQuickAddMention, parseQuickAdd } from "@/features/tasks/quick-add-parse";

const now = Date.parse("2030-11-16T09:00:00+05:30");
const catalogs = {
    clients: [{ id: "client-aarav", name: "Aarav Shah" }],
    owners: [{ id: "owner-rakesh", name: "Rakesh Shah" }],
    properties: [{ id: "prop-happy", title: "Happy Elegance", locality: "Vesu", city: "Surat" }],
};
const parse = (draft: QuickAddDraft) =>
    parseQuickAdd(draft.text, {
        now,
        baseDate: draft.base.date,
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

test("typed reminders wait for a time before they are saved", () => {
    const typed = type(newQuickAddDraft("2030-11-16"), "Call !30m").draft;
    const values = resolveQuickAddValues(typed, parse(typed));
    assert.deepEqual(values.reminders, []);
    assert.equal(values.remindersNeedTime, true);

    const timed = type(typed, "Call !30m 5pm").draft;
    const next = resolveQuickAddValues(timed, parse(timed));
    assert.deepEqual(next.reminders, [30]);
    assert.equal(next.remindersNeedTime, false);
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
    const saved = resolveQuickAddValues(typed, parse(typed));
    assert.equal(saved.title, title);
    assert.equal(saved.date, "2030-11-17");
    assert.equal(saved.time, "11:00");
    assert.equal(saved.priority, "urgent");
    assert.equal(saved.propertyId, "prop-happy");
    assert.equal(saved.clientId, "client-aarav");

    const task = createPlannerTask(saved.title, saved.date, now, "task-a", undefined, {
        dueTime: saved.time ?? undefined,
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
    const values = resolveQuickAddValues(lessened, parse(lessened));
    assert.equal(values.priority, null);
    assert.equal(values.clientId, null);
    assert.equal(values.propertyId, "prop-happy");
    assert.match(values.title, /#Happy Elegance/);
});

test("older stripped titles keep details on base without appending chips at the end", () => {
    const task = createPlannerTask(
        "Call about monday visit",
        "2030-11-18",
        now,
        "task-b",
        undefined,
        {
            dueTime: "11:00",
            priority: "high",
            repeat: { unit: "week", interval: 1, weekdays: [1], until: "2030-12-31" },
            clientId: "client-missing",
        },
    );
    const draft = quickAddDraftFromTask(task, now, catalogs);
    assert.equal(draft.text, "Call about monday visit");
    const values = resolveQuickAddValues(draft, parse(draft));
    assert.equal(values.title, "Call about monday visit");
    assert.equal(values.date, "2030-11-18");
    assert.equal(values.time, "11:00");
    assert.equal(values.priority, "high");
    assert.deepEqual(values.repeat, task.repeat);
    assert.equal(values.clientId, "client-missing");
});
