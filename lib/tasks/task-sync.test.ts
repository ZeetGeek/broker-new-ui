import assert from "node:assert/strict";
import test from "node:test";

import type { TaskDto, tasksApi } from "@/lib/api/tasks";

import { setTaskCompleted } from "@/features/tasks/lifecycle";
import type { Task } from "@/features/tasks/model";
import { movePlannerTask, setTaskDeleted } from "@/features/tasks/planner-model";
import { sampleTasks } from "@/features/tasks/preview-store";
import { applyTaskOps, diffTasks, taskFromDto } from "@/features/tasks/task-sync";

const NOW = Date.parse("2030-01-01T04:00:00Z");

function repeating(): Task[] {
    return sampleTasks(NOW).map((task) =>
        task.id === "sample-task-7"
            ? { ...task, dueDate: task.startDate, dueTime: null, reminders: [] }
            : task,
    );
}

test("completing a repeating task yields one complete op with nextId and no create", () => {
    const before = repeating();
    const after = setTaskCompleted(before, "sample-task-7", true, NOW, "next-7");
    assert.ok(after.some((task) => task.id === "next-7"));
    const ops = diffTasks(before, after);
    assert.deepEqual(ops, [{ kind: "complete", id: "sample-task-7", nextId: "next-7" }]);
});

test("reopening a repeating task yields one reopen op and no remove", () => {
    const start = repeating();
    const before = setTaskCompleted(start, "sample-task-7", true, NOW, "next-7");
    const after = setTaskCompleted(before, "sample-task-7", false, NOW + 1000);
    const ops = diffTasks(before, after);
    assert.deepEqual(ops, [{ kind: "reopen", id: "sample-task-7" }]);
});

test("deleting yields remove; restoring yields restore plus delivery bookkeeping", () => {
    const before = sampleTasks(NOW);
    const deleted = setTaskDeleted(before, "sample-task-4", true, NOW);
    assert.deepEqual(diffTasks(before, deleted), [{ kind: "remove", id: "sample-task-4" }]);
    const restored = setTaskDeleted(deleted, "sample-task-4", false, NOW + 60_000);
    const ops = diffTasks(deleted, restored);
    assert.equal(ops[0].kind, "restore");
    const patch = ops.find((op) => op.kind === "patch");
    assert.ok(patch && patch.kind === "patch");
    assert.deepEqual(Object.keys(patch.items[0]).sort(), ["id", "startReminderEnabledAt"]);
    assert.ok(ops.every((op) => op.kind !== "remove"));
});

test("a planner move yields a single patch op with only schedule and order keys", () => {
    const before = sampleTasks(NOW);
    const target = before.find((task) => task.id === "sample-task-5")!;
    const date = "2030-01-03";
    const after = movePlannerTask(before, target.id, date, undefined, NOW);
    const ops = diffTasks(before, after);
    assert.equal(ops.length, 1);
    const [op] = ops;
    assert.ok(op.kind === "patch");
    const allowed = new Set([
        "id",
        "plannerOrder",
        "startDate",
        "startTime",
        "dueDate",
        "dueTime",
        "reminders",
        "repeatAnchor",
        "startReminderEnabledAt",
        "deliveredReminderKeys",
        "listId",
    ]);
    for (const item of op.items) {
        for (const key of Object.keys(item)) assert.ok(allowed.has(key), key);
    }
    assert.equal(op.items.find((item) => item.id === target.id)?.startDate, date);
});

test("a reminder delivery yields one delivered op with only the new keys", () => {
    const before = sampleTasks(NOW);
    const after = before.map((task) =>
        task.id === "sample-task-3"
            ? { ...task, deliveredReminderKeys: [...task.deliveredReminderKeys, "k1"] }
            : task,
    );
    assert.deepEqual(diffTasks(before, after), [
        { kind: "delivered", id: "sample-task-3", keys: ["k1"] },
    ]);
});

test("an owner change always carries its type", () => {
    const before = sampleTasks(NOW);
    const after = before.map((task) =>
        task.id === "sample-task-5"
            ? { ...task, ownerId: "owner-9", ownerType: "exclusive" as const }
            : task,
    );
    assert.deepEqual(diffTasks(before, after), [
        {
            kind: "patch",
            items: [{ id: "sample-task-5", ownerId: "owner-9", ownerType: "exclusive" }],
        },
    ]);
});

test("a brand-new task yields create", () => {
    const before = sampleTasks(NOW);
    const fresh = { ...before[0], id: "fresh", repeatFromId: null };
    const ops = diffTasks(before, [...before, fresh]);
    assert.deepEqual(ops, [{ kind: "create", task: fresh }]);
});

test("updatedAt-only changes yield nothing", () => {
    const before = sampleTasks(NOW);
    const after = before.map((task) => ({ ...task, updatedAt: new Date(NOW).toISOString() }));
    assert.deepEqual(diffTasks(before, after), []);
});

function dto(task: Task, extra: Partial<TaskDto> = {}): TaskDto {
    return {
        ...task,
        startReminderEnabledAt: task.startReminderEnabledAt,
        repeatFromId: task.repeatFromId ?? null,
        ownerType: task.ownerType ?? null,
        listId: task.listId ?? null,
        priorityAt: task.priorityAt ?? null,
        deletedAt: task.deletedAt ?? null,
        client: null,
        owner: null,
        property: null,
        ...extra,
    } as TaskDto;
}

test("a complete the server already handled drops the local phantom successor", async () => {
    const before = repeating();
    const after = setTaskCompleted(before, "sample-task-7", true, NOW, "phantom");
    const completed = after.find((task) => task.id === "sample-task-7")!;
    const existing = { ...after.find((task) => task.id === "phantom")!, id: "server-next" };
    const api = {
        complete: async () => ({ tasks: [dto(completed), dto(existing)] }),
    } as unknown as typeof tasksApi;
    const result = await applyTaskOps(diffTasks(before, after), after, api);
    const ids = result.map((task) => task.id);
    assert.ok(!ids.includes("phantom"));
    assert.ok(ids.includes("server-next"));
});

test("server link summaries survive parsing and never reach a patch", () => {
    const base = sampleTasks(NOW)[0];
    const parsed = taskFromDto(dto(base, { client: { id: "c-1", name: "Aarav Shah" } }));
    assert.deepEqual(parsed.client, { id: "c-1", name: "Aarav Shah" });
    const renamed = { ...parsed, client: { id: "c-1", name: "Renamed" } };
    assert.deepEqual(diffTasks([parsed], [renamed]), []);
});

test("planner moves do not renumber completed tasks", () => {
    const tasks = sampleTasks(NOW);
    const date = tasks.find((task) => task.id === "sample-task-9")!.startDate!;
    const moving = tasks.find((task) => task.id === "sample-task-6")!;
    const after = movePlannerTask(tasks, moving.id, date, undefined, NOW);
    const completed = after.find((task) => task.id === "sample-task-9")!;
    assert.equal(
        completed.plannerOrder,
        tasks.find((task) => task.id === "sample-task-9")!.plannerOrder,
    );
});
