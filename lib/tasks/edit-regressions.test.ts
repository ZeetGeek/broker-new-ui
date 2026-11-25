import assert from "node:assert/strict";
import test from "node:test";

import type { TaskDto } from "@/lib/api/tasks";

import { setTaskCompleted } from "@/features/tasks/lifecycle";
import { draftFromTask, newTaskDraft } from "@/features/tasks/model";
import { createPlannerTask } from "@/features/tasks/planner-model";
import {
    changeQuickAddText,
    dismissQuickAddRange,
    encodeTaskDraftTitle,
    newQuickAddDraft,
    type QuickAddDraft,
    quickAddDraftFromTask,
    resolveQuickAddValues,
} from "@/features/tasks/quick-add-draft";
import { parseQuickAdd, taskRowTitle } from "@/features/tasks/quick-add-parse";
import { taskFromDraft } from "@/features/tasks/task-from-draft";
import {
    applyTaskOps,
    diffTasks,
    taskFromDto,
    withTaskOwnerTypes,
} from "@/features/tasks/task-sync";

const now = Date.parse("2030-11-16T04:30:00Z");
const catalogs = { clients: [], owners: [], properties: [] };
const values = (draft: QuickAddDraft, at = now) =>
    resolveQuickAddValues(
        draft,
        parseQuickAdd(draft.text, {
            now: at,
            baseDate: draft.base.startDate,
            entities: draft.entities,
            dismissed: draft.dismissed,
        }),
        at,
    );

test("opening relative words on a later day preserves the saved date, including a name edit", () => {
    const task = createPlannerTask("Call tomorrow 5pm", "2030-11-17", now, "relative", undefined, {
        startTime: "17:00",
    });
    const later = now + 86400000;
    const draft = quickAddDraftFromTask(task, later, catalogs);
    assert.equal(values(draft, later).startDate, task.startDate);
    const changed = changeQuickAddText(draft, "Phone tomorrow 5pm", {
        caret: 5,
        previous: { start: 0, end: 4 },
        atoms: parseQuickAdd(draft.text, { now: later }).atoms,
        composing: false,
    }).draft;
    assert.equal(values(changed, later).startDate, task.startDate);
});

test("unchanged repeat chips preserve custom weekdays and the series end date", () => {
    const repeat = { unit: "week" as const, interval: 2, weekdays: [1, 3], until: "2030-12-31" };
    const draft = { ...newTaskDraft(now), title: "Call", repeat };
    const task = createPlannerTask(
        encodeTaskDraftTitle(draft, catalogs, now),
        draft.startDate,
        now,
        "repeat",
        undefined,
        { startTime: draft.startTime, repeat },
    );
    assert.deepEqual(values(quickAddDraftFromTask(task, now, catalogs)).repeat, repeat);
});

test("adding an explicit date to an existing time-only title changes its date", () => {
    const task = createPlannerTask("Call 5pm", "2030-11-16", now, "time-only", undefined, {
        startTime: "17:00",
    });
    const draft = quickAddDraftFromTask(task, now, catalogs);
    const text = `${draft.text} tomorrow`;
    const changed = changeQuickAddText(draft, text, {
        caret: text.length,
        previous: { start: draft.text.length, end: draft.text.length },
        atoms: parseQuickAdd(draft.text, { now }).atoms,
        composing: false,
    }).draft;
    assert.equal(values(changed).startDate, "2030-11-17");
});

test("editing after reminder delivery retains configured offsets", () => {
    const task = createPlannerTask(
        "Call 16 Nov 2030 5pm due 6pm !1h",
        "2030-11-16",
        now,
        "reminder",
        undefined,
        { startTime: "17:00", dueDate: "2030-11-16", dueTime: "18:00", reminders: [60] },
    );
    const later = Date.parse("2030-11-16T12:00:00Z");
    const result = values(quickAddDraftFromTask(task, later, catalogs), later);
    assert.deepEqual(result.reminders, [60]);
    assert.equal(result.reminderError, "");
});

test("dismissed date words persist as literal task text", () => {
    const draft = { ...newQuickAddDraft("2030-11-16"), text: "Call tomorrow" };
    const parsed = parseQuickAdd(draft.text, { now });
    const result = values(
        dismissQuickAddRange(
            draft,
            parsed.atoms.find((atom) => atom.kind === "date")!,
        ),
    );
    assert.equal(
        taskRowTitle(
            result.title,
            { clientId: null, ownerId: null, propertyId: null },
            catalogs,
            now,
            result.startDate,
        ),
        "Call tomorrow",
    );
});

test("oversized protected names reject saving instead of silently truncating", () => {
    const title = "Call tomorrow " + "x".repeat(146);
    assert.equal(title.length, 160);
    assert.throws(
        () => encodeTaskDraftTitle({ ...newTaskDraft(now), title }, catalogs, now),
        /Shorten it slightly/,
    );
});

test("no-op successor saves retain its edit marker and allow reopening the parent", () => {
    const parent = createPlannerTask("Call daily", "2030-11-16", now, "parent", undefined, {
        repeat: { unit: "day", interval: 1, weekdays: [], until: null },
    });
    const tasks = setTaskCompleted([parent], parent.id, true, now, "next");
    const child = tasks.find((task) => task.id === "next")!;
    const next = taskFromDraft(draftFromTask(child), {
        editing: child,
        mode: "reschedule",
        catalogs,
        now: now + 1000,
        id: child.id,
    });
    assert.equal(next, child);
    assert.doesNotThrow(() =>
        setTaskCompleted(
            tasks.map((task) => (task.id === child.id ? next : task)),
            parent.id,
            false,
            now + 2000,
        ),
    );
});

test("owner type survives unavailable catalogs and unrelated form edits", () => {
    const task = {
        ...createPlannerTask("Call", "2030-11-16", now, "owner"),
        ownerId: "owner-1",
        ownerType: "exclusive" as const,
    };
    const edited = taskFromDraft(
        { ...draftFromTask(task), details: "Notes" },
        { editing: task, mode: "edit", catalogs, now: now + 1000, id: task.id },
    );
    const [next] = withTaskOwnerTypes([task], [edited], undefined);
    assert.equal(next.ownerType, "exclusive");
    assert.ok(!JSON.stringify(diffTasks([task], [next])).includes('"ownerType":null'));
});

test("nullable API fields parse and no-op operations keep canonical server metadata", async () => {
    const task = createPlannerTask("Call", "2030-11-16", now, "nullable");
    const parsed = taskFromDto({
        ...task,
        plannerOrder: null,
        startReminderEnabledAt: null,
    } as TaskDto);
    assert.equal(parsed.plannerOrder, undefined);
    assert.equal(parsed.startReminderEnabledAt, undefined);
    assert.deepEqual(await applyTaskOps([], [task]), [task]);
});

test("changing owners resolves the new owner's type instead of carrying the old type", () => {
    const task = {
        ...createPlannerTask("Call", "2030-11-16", now, "owner-change"),
        ownerId: "old-owner",
        ownerType: "exclusive" as const,
    };
    const changed = { ...task, ownerId: "new-owner" };
    const [next] = withTaskOwnerTypes([task], [changed], {
        clients: [],
        properties: [],
        owners: [{ id: "new-owner", name: "Owner", type: "platform" }],
    });
    assert.equal(next.ownerType, "platform");
    const [unknown] = withTaskOwnerTypes([task], [changed], undefined);
    assert.equal(unknown.ownerType, null);
});
