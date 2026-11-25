import assert from "node:assert/strict";
import test from "node:test";

import { groupTaskHistory } from "@/features/tasks/history-model";
import { setTaskCompleted } from "@/features/tasks/lifecycle";
import { type Task } from "@/features/tasks/model";
import { createPlannerTask, setTaskDeleted } from "@/features/tasks/planner-model";

const base = createPlannerTask(
    "Call the Client",
    "2030-11-20",
    Date.parse("2030-11-01T09:00:00Z"),
    "base",
);
const task = (id: string, patch: Partial<Task> = {}): Task => ({ ...base, id, ...patch });

test("undated Someday and custom-list tasks appear in history on the date completed or deleted", () => {
    const created = Date.parse("2030-11-01T09:00:00Z");
    const records = [
        createPlannerTask("Someday task", null, created, "someday-task", "someday"),
        createPlannerTask("Custom list task", null, created, "custom-task", "custom-list"),
    ];
    for (const tab of ["completed", "deleted"] as const) {
        const change = tab === "completed" ? setTaskCompleted : setTaskDeleted;
        let changed = change(records, "someday-task", true, Date.parse("2030-11-15T12:00:00Z"));
        changed = change(changed, "custom-task", true, Date.parse("2030-11-17T12:00:00Z"));
        const days = groupTaskHistory(changed, tab);
        assert.deepEqual(
            days.map((day) => day.date),
            ["2030-11-15", "2030-11-17"],
        );
        assert.deepEqual(
            days.flatMap((day) => day.tasks.map((task) => [task.id, task.listId, task.dueDate])),
            [
                ["someday-task", "someday", null],
                ["custom-task", "custom-list", null],
            ],
        );
    }
});

test("completion columns follow event dates in chronological order and skip empty days", () => {
    const records = [
        task("seventeenth", { completedAt: "2030-11-17T08:00:00Z" }),
        task("fifteenth-early", { completedAt: "2030-11-15T06:00:00Z" }),
        task("fifteenth-late", { completedAt: "2030-11-15T12:00:00Z" }),
    ];
    const days = groupTaskHistory(records, "completed");
    assert.deepEqual(
        days.map((day) => day.date),
        ["2030-11-15", "2030-11-17"],
    );
    assert.deepEqual(
        days[0].tasks.map((task) => task.id),
        ["fifteenth-late", "fifteenth-early"],
    );
    assert.equal(days[1].tasks[0].startDate, "2030-11-20");
    assert.equal(records[0].id, "seventeenth", "grouping must not mutate input order");
});

test("completion and deletion group at India midnight rather than device or UTC midnight", () => {
    const records = [
        task("before", { completedAt: "2030-11-15T18:29:59Z", deletedAt: "2030-11-17T18:29:59Z" }),
        task("after", { completedAt: "2030-11-15T18:30:00Z", deletedAt: "2030-11-17T18:30:00Z" }),
    ];
    assert.deepEqual(
        groupTaskHistory(
            records.map((record) => ({ ...record, deletedAt: null })),
            "completed",
        ).map((day) => day.date),
        ["2030-11-15", "2030-11-16"],
    );
    assert.deepEqual(
        groupTaskHistory(records, "deleted").map((day) => day.date),
        ["2030-11-17", "2030-11-18"],
    );
});

test("deleted tasks use deletion dates even when previously completed; reopened/restored tasks leave history", () => {
    const records = [
        task("open"),
        task("completed", { completedAt: "2030-11-15T08:00:00Z" }),
        task("deleted-after-completion", {
            completedAt: "2030-11-15T08:00:00Z",
            deletedAt: "2030-11-17T08:00:00Z",
        }),
        task("deleted-open", { deletedAt: "2030-11-19T08:00:00Z" }),
    ];
    assert.deepEqual(
        groupTaskHistory(records, "completed").flatMap((day) => day.tasks.map((task) => task.id)),
        ["completed"],
    );
    assert.deepEqual(
        groupTaskHistory(records, "deleted").map((day) => day.date),
        ["2030-11-17", "2030-11-19"],
    );
    const restored = records.map((record) => ({ ...record, deletedAt: null }));
    assert.deepEqual(groupTaskHistory(restored, "deleted"), []);
    assert.deepEqual(
        groupTaskHistory(
            records.map((record) => ({ ...record, completedAt: null })),
            "completed",
        ),
        [],
    );
});

test("overdue columns follow the task schedule date in chronological order", () => {
    const now = Date.parse("2030-11-20T12:00:00Z");
    const records = [
        task("later", { dueDate: "2030-11-18", startDate: "2030-11-18" }),
        task("earlier", { dueDate: "2030-11-10", startDate: "2030-11-10" }),
        task("middle", { dueDate: "2030-11-15", startDate: "2030-11-15" }),
        task("undated-list", {
            dueDate: null,
            startDate: "2030-11-12",
            listId: "calls",
        }),
    ];
    const days = groupTaskHistory(records, "overdue", "due", now);
    assert.deepEqual(
        days.map((day) => day.date),
        ["2030-11-10", "2030-11-12", "2030-11-15", "2030-11-18"],
    );
    assert.deepEqual(
        days.flatMap((day) => day.tasks.map((row) => row.id)),
        ["earlier", "undated-list", "middle", "later"],
    );
});

test("explicit sorting changes tasks within a day while preserving chronological day columns", () => {
    const records = [
        task("later", { title: "Alpha", completedAt: "2030-11-17T08:00:00Z" }),
        task("zulu", { title: "Zulu", completedAt: "2030-11-15T12:00:00Z", priority: "urgent" }),
        task("alpha", { title: "Alpha", completedAt: "2030-11-15T08:00:00Z", priority: "low" }),
    ];
    const byTitle = groupTaskHistory(records, "completed", "title");
    assert.deepEqual(
        byTitle.map((day) => day.date),
        ["2030-11-15", "2030-11-17"],
    );
    assert.deepEqual(
        byTitle[0].tasks.map((task) => task.id),
        ["alpha", "zulu"],
    );
    assert.deepEqual(
        groupTaskHistory(records, "completed", "priority")[0].tasks.map((task) => task.id),
        ["zulu", "alpha"],
    );
    assert.deepEqual(groupTaskHistory([], "completed"), []);
});
