import assert from "node:assert/strict";
import test from "node:test";

import { setTaskCompleted } from "@/features/tasks/lifecycle";
import { taskDueReminders, taskMatchesTab, taskSchema } from "@/features/tasks/model";
import { addNotebookList, defaultNotebook } from "@/features/tasks/notebook-model";
import {
    createPlannerTask,
    movePlannerTask,
    plannerColumnTasks,
    plannerDate,
    setTaskDeleted,
    sortPlannerTasks,
} from "@/features/tasks/planner-model";

const now = Date.parse("2030-01-02T09:00:00Z");
const today = "2030-01-02";
const task = createPlannerTask("Call Aarav", today, now, "task-a");

test("drag preview reorders rows without changing saved task data, and cancellation restores order", () => {
    const notebook = defaultNotebook();
    const second = createPlannerTask("Share brochure", today, now, "task-b");
    const third = createPlannerTask("Confirm visit", today, now, "task-c");
    const tasks = [task, second, third];
    const saved = structuredClone(tasks);
    const projected = plannerColumnTasks(tasks, today, undefined, notebook, today, "due", {
        taskId: third.id,
        date: today,
        beforeId: second.id,
    });
    assert.deepEqual(
        projected.map((row) => row.id),
        [task.id, third.id, second.id],
    );
    assert.deepEqual(tasks, saved);
    assert.deepEqual(plannerColumnTasks(tasks, today, undefined, notebook, today, "due"), tasks);
});

test("drag preview moves into an empty day while preserving the original schedule and CRM record", () => {
    const notebook = defaultNotebook();
    const original = {
        ...task,
        details: "Owner consent",
        clientId: "client-1",
        propertyId: "property-1",
    };
    const tasks = [original];
    const preview = { taskId: task.id, date: "2030-01-03" };
    assert.deepEqual(
        plannerColumnTasks(tasks, today, undefined, notebook, today, "due", preview),
        [],
    );
    const target = plannerColumnTasks(
        tasks,
        preview.date,
        undefined,
        notebook,
        today,
        "due",
        preview,
    );
    assert.equal(target[0], original);
    assert.equal(original.dueDate, today);
    assert.equal(target[0].clientId, "client-1");
    assert.equal(target[0].propertyId, "property-1");
});

test("drag preview distinguishes unscheduled lists and places the task before the selected row", () => {
    const notebook = addNotebookList(defaultNotebook(), "my-lists", "Calls", "calls");
    const first = { ...task, dueDate: null, listId: "someday" };
    const second = { ...createPlannerTask("Another call", null, now, "task-b"), listId: "calls" };
    const tasks = [first, second];
    const preview = { taskId: first.id, date: null, listId: "calls", beforeId: second.id };
    assert.deepEqual(
        plannerColumnTasks(tasks, null, "someday", notebook, today, "due", preview),
        [],
    );
    assert.deepEqual(plannerColumnTasks(tasks, null, "calls", notebook, today, "due", preview), [
        first,
        second,
    ]);
    const saved = movePlannerTask(
        tasks,
        first.id,
        preview.date,
        preview.beforeId,
        now,
        preview.listId,
    );
    assert.deepEqual(
        plannerColumnTasks(saved, null, "calls", notebook, today, "due").map((row) => row.id),
        [first.id, second.id],
    );
});

test("All includes completed tasks, while Deleted is isolated from both active tabs", () => {
    const completed = { ...task, completedAt: new Date(now).toISOString() };
    assert.equal(taskMatchesTab(task, "all"), true);
    assert.equal(taskMatchesTab(completed, "all"), true);
    assert.equal(taskMatchesTab(completed, "completed"), true);
    assert.equal(taskMatchesTab(task, "completed"), false);
    const [deleted] = setTaskDeleted([completed], task.id, true, now);
    assert.equal(taskMatchesTab(deleted, "all"), false);
    assert.equal(taskMatchesTab(deleted, "completed"), false);
    assert.equal(taskMatchesTab(deleted, "deleted"), true);
    const [restored] = setTaskDeleted([deleted], task.id, false, now + 1);
    assert.equal(taskMatchesTab(restored, "completed"), true);
    assert.equal(restored.completedAt, completed.completedAt);
});

test("deleting and restoring preserve CRM context, schedule, priority and completed state", () => {
    const original = {
        ...task,
        details: "Confirm the main gate",
        clientId: "client-1",
        ownerId: "owner-1",
        propertyId: "property-1",
        priority: "urgent" as const,
    };
    const [deleted] = setTaskDeleted([original], task.id, true, now);
    assert.equal(deleted.deletedAt, new Date(now).toISOString());
    const [restored] = setTaskDeleted([deleted], task.id, false, now + 1000);
    for (const key of [
        "title",
        "details",
        "clientId",
        "ownerId",
        "propertyId",
        "dueDate",
        "priority",
        "completedAt",
    ] as const)
        assert.equal(restored[key], original[key]);
});

test("deleted tasks cannot complete or send reminders; restoring skips missed reminders", () => {
    const timed = {
        ...task,
        startDate: today,
        startTime: "10:00",
        startReminderEnabledAt: undefined,
        dueTime: "12:00",
        reminders: [15],
    };
    assert.ok(taskDueReminders(timed, now).length > 0);
    const [deleted] = setTaskDeleted([timed], task.id, true, now);
    assert.deepEqual(taskDueReminders(deleted, now), []);
    assert.deepEqual(setTaskCompleted([deleted], task.id, true, now), [deleted]);
    const [restored] = setTaskDeleted([deleted], task.id, false, now + 60_000);
    assert.deepEqual(taskDueReminders(restored, now + 60_000), []);
});

test("overdue tasks carry into today's view without silently changing the saved deadline", () => {
    const overdue = { ...task, dueDate: "2030-01-01" };
    assert.equal(plannerDate(overdue, today), today);
    assert.equal(overdue.dueDate, "2030-01-01");
    assert.equal(
        plannerDate({ ...overdue, completedAt: new Date(now).toISOString() }, today),
        "2030-01-01",
    );
    assert.equal(plannerDate({ ...task, dueDate: null }, today), null);
});

test("moving a task shifts its date range and keeps its times, reminders and linked records", () => {
    const original = {
        ...task,
        startDate: "2030-01-02",
        startTime: "09:00",
        dueDate: "2030-01-04",
        dueTime: "17:00",
        reminders: [15],
        deliveredReminderKeys: ["old"],
        clientId: "client-1",
    };
    const [moved] = movePlannerTask([original], task.id, "2030-01-06", undefined, now);
    assert.equal(moved.startDate, "2030-01-04");
    assert.equal(moved.dueDate, "2030-01-06");
    assert.equal(moved.startTime, "09:00");
    assert.equal(moved.dueTime, "17:00");
    assert.equal(moved.clientId, "client-1");
    assert.deepEqual(moved.reminders, [15]);
    assert.deepEqual(moved.deliveredReminderKeys, []);
    assert.ok(taskSchema.safeParse(moved).success);
});

test("reordering overdue work within Today preserves deadlines and delivered reminders", () => {
    const overdue = {
        ...task,
        dueDate: "2030-01-01",
        startDate: "2030-01-01",
        deliveredReminderKeys: ["existing"],
    };
    const other = createPlannerTask("Other task", today, now, "task-b");
    const changed = movePlannerTask([overdue, other], overdue.id, today, undefined, now);
    const moved = changed.find((item) => item.id === overdue.id)!;
    assert.equal(moved.dueDate, "2030-01-01");
    assert.deepEqual(moved.deliveredReminderKeys, ["existing"]);
    assert.deepEqual(
        sortPlannerTasks(changed, "due").map((item) => item.id),
        ["task-b", "task-a"],
    );
});

test("Someday moves clear due-time reminders, and a newly added task has a valid schedule", () => {
    const [moved] = movePlannerTask(
        [{ ...task, dueTime: "17:00", reminders: [15] }],
        task.id,
        null,
        undefined,
        now,
    );
    assert.equal(moved.dueDate, null);
    assert.equal(moved.dueTime, null);
    assert.deepEqual(moved.reminders, []);
    assert.ok(taskSchema.safeParse(moved).success);
    const someday = createPlannerTask("No deadline", null, now, "someday");
    assert.equal(plannerDate(someday, today), null);
    assert.equal(someday.repeat, null);
});

test("invalid repeat moves are rejected without mutating the original task", () => {
    const repeating = {
        ...task,
        repeat: { unit: "day" as const, interval: 1, weekdays: [], until: "2030-01-04" },
    };
    assert.throws(
        () => movePlannerTask([repeating], task.id, "2030-01-10", undefined, now),
        /conflicts/,
    );
    assert.equal(repeating.dueDate, today);
});
