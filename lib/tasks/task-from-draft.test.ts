import assert from "node:assert/strict";
import test from "node:test";

import { draftFromTask, newTaskDraft } from "@/features/tasks/model";
import { taskFromDraft } from "@/features/tasks/task-from-draft";

const now = Date.parse("2030-11-16T09:00:00+05:30");
const catalogs = {
    clients: [{ id: "client-1", name: "Rahul Mehta" }],
    owners: [{ id: "owner-1", name: "Bhavna Shah" }],
    properties: [{ id: "property-1", title: "Green Meadows", locality: "Althan", city: "Surat" }],
};

test("task creation from any panel keeps CRM links, schedules and encoded title in sync", () => {
    const draft = {
        ...newTaskDraft(now),
        title: "Follow up",
        details: "  Bring plans  ",
        clientId: "client-1",
        ownerId: "owner-1",
        propertyId: "property-1",
        dueDate: "2030-11-17",
        dueTime: "12:00",
        reminders: [30],
    };
    const saved = taskFromDraft(draft, { mode: "create", now, catalogs, id: "task-new" });
    assert.equal(saved.id, "task-new");
    assert.equal(saved.details, "Bring plans");
    assert.equal(saved.clientId, "client-1");
    assert.equal(saved.ownerId, "owner-1");
    assert.equal(saved.propertyId, "property-1");
    assert.match(saved.title, /Follow up/);
    assert.match(saved.title, /Rahul Mehta/);
    assert.match(saved.title, /Green Meadows/);
    assert.deepEqual(saved.reminders, [30]);
    assert.notEqual(saved.reminders, draft.reminders);
});

test("editing details keeps recurrence ancestry, list placement, completion and delivered reminders", () => {
    const original = taskFromDraft(
        {
            ...newTaskDraft(now),
            title: "Check documents",
            repeat: { interval: 1, unit: "week", weekdays: [1], until: null },
            dueDate: "2030-11-18",
            dueTime: "12:00",
        },
        { mode: "create", now, catalogs, id: "existing" },
    );
    const editing = {
        ...original,
        repeatAnchor: "2030-11-01",
        repeatFromId: "previous-occurrence",
        plannerOrder: 5,
        listId: "documents",
        completedAt: "2030-11-16T07:00:00Z",
        deliveredReminderKeys: ["already-delivered"],
    };
    const next = taskFromDraft(
        { ...draftFromTask(editing), details: "Updated note" },
        { editing, mode: "edit", now: now + 1000, catalogs, id: "ignored" },
    );
    assert.equal(next.id, "existing");
    assert.equal(next.repeatAnchor, editing.repeatAnchor);
    assert.equal(next.repeatFromId, editing.repeatFromId);
    assert.equal(next.plannerOrder, 5);
    assert.equal(next.listId, "documents");
    assert.equal(next.completedAt, editing.completedAt);
    assert.deepEqual(next.deliveredReminderKeys, ["already-delivered"]);
    assert.equal(next.createdAt, editing.createdAt);
    assert.equal(next.details, "Updated note");
    assert.equal(editing.details, "");
});

test("rescheduling resets only the recurrence anchor and planner position, leaving title and links intact", () => {
    const editing = {
        ...taskFromDraft(
            {
                ...newTaskDraft(now),
                title: "Follow up",
                clientId: "client-1",
                repeat: { interval: 1, unit: "week", weekdays: [1], until: null },
                dueDate: "2030-11-18",
                dueTime: "12:00",
                reminders: [30],
            },
            { mode: "create", now, catalogs, id: "task-1" },
        ),
        plannerOrder: 4,
    };
    const draft = { ...draftFromTask(editing), dueDate: "2030-11-20", dueTime: "13:00" };
    const saved = taskFromDraft(draft, {
        editing,
        mode: "reschedule",
        now,
        catalogs,
        id: editing.id,
    });
    assert.equal(saved.title, editing.title);
    assert.equal(saved.clientId, editing.clientId);
    assert.equal(saved.repeatAnchor, "2030-11-20");
    assert.equal(saved.plannerOrder, undefined);
    const noDeadline = taskFromDraft(
        { ...draft, dueDate: "", dueTime: "" },
        { editing, mode: "reminder", now, catalogs, id: editing.id },
    );
    assert.deepEqual(noDeadline.reminders, []);
    assert.equal(noDeadline.dueTime, null);
});
