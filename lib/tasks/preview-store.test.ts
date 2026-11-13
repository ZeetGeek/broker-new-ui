import assert from "node:assert/strict";
import test from "node:test";

import { taskReminderAt, taskReminderKey, taskReminders } from "@/features/tasks/model";
import { sampleTasks, taskPreviewStore } from "@/features/tasks/preview-store";

test("mock task storage isolates accounts, preserves empty lists, and rejects damaged records", async () => {
    const values = new Map<string, string>();
    const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        },
    });
    try {
        const tasks = await taskPreviewStore.list("broker-a");
        await taskPreviewStore.save("broker-a", [{ ...tasks[0], startTime: "08:00" }]);
        assert.equal((await taskPreviewStore.list("broker-a"))[0].startTime, "08:00");
        await taskPreviewStore.save("broker-a", []);
        assert.deepEqual(await taskPreviewStore.list("broker-a"), []);
        assert.equal((await taskPreviewStore.list("broker-b")).length, tasks.length);
        await assert.rejects(taskPreviewStore.save("broker-a", [tasks[0], tasks[0]]));
        await assert.rejects(
            taskPreviewStore.save("broker-a", [{ ...tasks[0], clientId: "missing" }]),
        );
        values.set("crm.private-tasks.mock.v1.broker-a", "broken json");
        await assert.rejects(taskPreviewStore.list("broker-a"));
        assert.ok((await taskPreviewStore.reset("broker-a")).length > 0);
    } finally {
        if (original) Object.defineProperty(globalThis, "sessionStorage", original);
        else Reflect.deleteProperty(globalThis, "sessionStorage");
    }
});

test("reminder delivery merges into latest edits and survives a stale form save", async () => {
    const values = new Map<string, string>();
    const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        },
    });
    try {
        const tasks = sampleTasks(Date.parse("2030-01-01T04:00:00Z"));
        await taskPreviewStore.save("broker", tasks);
        const target = tasks.find((task) => task.id === "sample-task-3")!;
        const reminderKey = taskReminderKey(target, 15)!;
        const staleDraft = tasks.map((task) =>
            task.id === target.id ? { ...task, title: "Updated task" } : task,
        );
        await taskPreviewStore.update("broker", (latest) =>
            latest.map((task) =>
                task.id === target.id ? { ...task, deliveredReminderKeys: [reminderKey] } : task,
            ),
        );
        const result = await taskPreviewStore.save("broker", staleDraft);
        assert.equal(result.find((task) => task.id === target.id)?.title, "Updated task");
        assert.equal(
            result.find((task) => task.id === target.id)?.deliveredReminderKeys[0],
            reminderKey,
        );
        const newer = result.map((task) =>
            task.id === target.id ? { ...task, title: "Newest title" } : task,
        );
        await taskPreviewStore.save("broker", newer);
        const marked = await taskPreviewStore.update("broker", (latest) =>
            latest.map((task) =>
                task.id === target.id ? { ...task, deliveredReminderKeys: [reminderKey] } : task,
            ),
        );
        assert.equal(marked.find((task) => task.id === target.id)?.title, "Newest title");
    } finally {
        if (original) Object.defineProperty(globalThis, "sessionStorage", original);
        else Reflect.deleteProperty(globalThis, "sessionStorage");
    }
});

test("version one scalar tasks migrate without losing records or valid delivery markers", async () => {
    const values = new Map<string, string>();
    const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        },
    });
    try {
        const tasks = sampleTasks(Date.parse("2030-01-01T04:00:00Z"));
        const legacy = tasks.map(
            ({ reminders, deliveredReminderKeys: _deliveredReminderKeys, ...task }, index) => ({
                ...task,
                reminderMinutes: reminders.length ? reminders[0] : null,
                reminderDeliveredFor:
                    index === 0 && reminders.length ? taskReminderAt(task, reminders[0]) : null,
            }),
        );
        // A timed task can explicitly have no reminder; an old delivery marker is irrelevant.
        legacy[2] = {
            ...legacy[2],
            reminderMinutes: null,
            reminderDeliveredFor: taskReminderAt(tasks[2], 15),
        };
        // A delivery for a previous schedule must not suppress the current reminder.
        legacy[3] = { ...legacy[3], reminderDeliveredFor: "2029-01-01T00:00:00.000Z" };
        values.set(
            "crm.private-tasks.mock.v1.broker",
            JSON.stringify({ version: 1, tasks: legacy }),
        );
        const migrated = await taskPreviewStore.list("broker");
        assert.equal(migrated.length, tasks.length);
        assert.equal(migrated[0].title, tasks[0].title);
        assert.deepEqual(migrated[0].reminders, [legacy[0].reminderMinutes]);
        assert.deepEqual(migrated[0].deliveredReminderKeys, [
            taskReminderKey(migrated[0], migrated[0].reminders[0]),
        ]);
        assert.deepEqual(migrated[1].reminders, []);
        assert.deepEqual(migrated[1].deliveredReminderKeys, []);
        assert.equal(migrated[2].dueTime, tasks[2].dueTime);
        assert.deepEqual(migrated[2].reminders, []);
        assert.deepEqual(migrated[2].deliveredReminderKeys, []);
        assert.deepEqual(migrated[3].reminders, [legacy[3].reminderMinutes]);
        assert.deepEqual(migrated[3].deliveredReminderKeys, []);
        const stored = JSON.parse(values.get("crm.private-tasks.mock.v1.broker")!);
        assert.equal(stored.version, 3);
        assert.equal("reminderMinutes" in stored.tasks[0], false);
        assert.equal("reminderDeliveredFor" in stored.tasks[0], false);
        assert.deepEqual(await taskPreviewStore.list("broker"), migrated);
    } finally {
        if (original) Object.defineProperty(globalThis, "sessionStorage", original);
        else Reflect.deleteProperty(globalThis, "sessionStorage");
    }
});

test("removing or rescheduling reminders prunes obsolete delivery keys while preserving unchanged ones", async () => {
    const values = new Map<string, string>();
    const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        },
    });
    try {
        const task = {
            ...sampleTasks(Date.parse("2030-01-01T04:00:00Z"))[2],
            reminders: [0, 15, 90],
        };
        const allKeys = taskReminders(task).map((reminder) => reminder.key);
        await taskPreviewStore.save("broker", [{ ...task, deliveredReminderKeys: allKeys }]);
        const removed = await taskPreviewStore.save("broker", [
            { ...task, reminders: [0, 90], deliveredReminderKeys: [] },
        ]);
        assert.deepEqual(
            new Set(removed[0].deliveredReminderKeys),
            new Set([taskReminderKey(task, 0), taskReminderKey(task, 90)]),
        );
        const rescheduled = await taskPreviewStore.save("broker", [
            { ...removed[0], dueTime: "23:00" },
        ]);
        assert.deepEqual(rescheduled[0].deliveredReminderKeys, []);
        const cleared = await taskPreviewStore.save("broker", [
            { ...rescheduled[0], reminders: [] },
        ]);
        assert.deepEqual(cleared[0].deliveredReminderKeys, []);
    } finally {
        if (original) Object.defineProperty(globalThis, "sessionStorage", original);
        else Reflect.deleteProperty(globalThis, "sessionStorage");
    }
});
