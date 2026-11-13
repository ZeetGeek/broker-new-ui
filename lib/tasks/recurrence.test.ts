import assert from "node:assert/strict";
import test from "node:test";

import { nextTaskDates, setTaskCompleted } from "@/features/tasks/lifecycle";
import {
    draftFromTask,
    newTaskDraft,
    taskGroup,
    taskMatchesLinkFilter,
    validateTaskDraft,
} from "@/features/tasks/model";
import { sampleTasks, TASK_OWNERS, taskPreviewStore } from "@/features/tasks/preview-store";
import { nextRepeatDate, type TaskRepeat } from "@/features/tasks/recurrence";

const now = Date.parse("2030-01-01T18:45:00Z"); // 2 Jan in India
const rule = (unit: TaskRepeat["unit"], interval = 1, weekdays: number[] = []): TaskRepeat => ({
    unit,
    interval,
    weekdays,
    until: null,
});

test("new tasks start today in India; start/due and repeat validation agree", () => {
    const draft = { ...newTaskDraft(now), title: "Collect consent" };
    assert.equal(draft.startDate, "2030-01-02");
    assert.equal(validateTaskDraft(draft).valid, true);
    assert.equal(validateTaskDraft({ ...draft, dueDate: "2030-01-01" }).valid, false);
    assert.equal(validateTaskDraft({ ...draft, repeat: rule("day") }).valid, true);
    assert.equal(validateTaskDraft({ ...draft, startDate: "", repeat: rule("day") }).valid, false);
    assert.equal(validateTaskDraft({ ...draft, repeat: rule("week", 1, []) }).valid, false);
    assert.equal(validateTaskDraft({ ...draft, repeat: rule("day", 0) }).valid, false);
    assert.equal(
        validateTaskDraft({ ...draft, repeat: { ...rule("day"), until: "2030-01-01" } }).valid,
        false,
    );
    const task = {
        ...sampleTasks(now)[0],
        startDate: "2030-01-03",
        dueDate: null,
        dueTime: null,
        reminders: [],
    };
    assert.equal(taskGroup(task, now), "upcoming");
    assert.equal(taskGroup({ ...task, startDate: "2030-01-02" }, now), "today");
    assert.equal(taskGroup({ ...task, startDate: "2030-01-01" }, now), "undated");
});

test("calendar repeats retain anchor through short months and leap years", () => {
    assert.equal(nextRepeatDate("2030-01-31", "2030-01-31", rule("month")), "2030-02-28");
    assert.equal(nextRepeatDate("2030-01-31", "2030-02-28", rule("month")), "2030-03-31");
    assert.equal(nextRepeatDate("2028-02-29", "2031-02-28", rule("year")), "2032-02-29");
    assert.equal(nextRepeatDate("2030-12-31", "2030-12-31", rule("day")), "2031-01-01");
    assert.equal(nextRepeatDate("2030-01-01", "2030-01-10", rule("day", 3)), "2030-01-13");
    assert.equal(nextRepeatDate("9999-12-31", "9999-12-31", rule("day")), null);
});

test("weekday and custom weekly schedules honor selected days, intervals and end date", () => {
    assert.equal(
        nextRepeatDate("2030-01-04", "2030-01-04", rule("week", 1, [1, 2, 3, 4, 5])),
        "2030-01-07",
    ); // Fri → Mon
    assert.equal(nextRepeatDate("2030-01-07", "2030-01-08", rule("week", 2, [1, 3])), "2030-01-09");
    assert.equal(nextRepeatDate("2030-01-07", "2030-01-09", rule("week", 2, [1, 3])), "2030-01-21");
    assert.equal(
        nextRepeatDate("2030-01-07", "2030-01-09", {
            ...rule("week", 2, [1, 3]),
            until: "2030-01-20",
        }),
        null,
    );
    assert.equal(
        nextRepeatDate("2030-01-07", "2030-01-09", {
            ...rule("week", 2, [1, 3]),
            until: "2030-01-21",
        }),
        "2030-01-21",
    );
});

test("completion creates one successor with shifted dates, links and fresh reminder history", () => {
    const task = {
        ...sampleTasks(now)[0],
        startDate: "2030-01-01",
        startTime: "09:00",
        dueDate: "2030-01-02",
        dueTime: "10:00",
        repeat: rule("day"),
        ownerId: TASK_OWNERS[0].id,
        reminders: [60, 15],
        deliveredReminderKeys: ["old"],
    };
    const completed = setTaskCompleted([task], task.id, true, now, "next");
    assert.equal(completed.length, 2);
    assert.ok(completed[0].completedAt);
    const next = completed[1];
    assert.equal(next.startDate, "2030-01-02");
    assert.equal(next.startTime, "09:00");
    assert.equal(next.dueDate, "2030-01-03");
    assert.equal(next.dueTime, "10:00");
    assert.equal(next.repeatFromId, task.id);
    assert.equal(next.ownerId, task.ownerId);
    assert.equal(next.clientId, task.clientId);
    assert.equal(next.propertyId, task.propertyId);
    assert.deepEqual(next.reminders, [60, 15]);
    assert.deepEqual(next.deliveredReminderKeys, []);
    assert.equal(setTaskCompleted(completed, task.id, true, now, "duplicate").length, 2);
    const reopened = setTaskCompleted(completed, task.id, false, now);
    assert.equal(reopened.length, 1);
    assert.equal(reopened[0].completedAt, null);
    assert.throws(
        () =>
            setTaskCompleted(
                [completed[0], { ...next, updatedAt: "2030-01-03T00:00:00Z" }],
                task.id,
                false,
                now,
            ),
        /next occurrence/,
    );
    assert.throws(
        () =>
            setTaskCompleted(
                [completed[0], { ...next, completedAt: "2030-01-03T00:00:00Z" }],
                task.id,
                false,
                now,
            ),
        /next occurrence/,
    );
});

test("late completion skips missed dates without losing start-to-due span or month anchor", () => {
    const task = {
        ...sampleTasks(now)[0],
        startDate: "2030-01-29",
        dueDate: "2030-01-31",
        repeat: rule("month"),
        repeatAnchor: "2030-01-31",
    };
    const dates = nextTaskDates(task, Date.parse("2030-02-10T00:00:00Z"));
    assert.deepEqual(dates, {
        startDate: "2030-02-26",
        dueDate: "2030-02-28",
        repeatAnchor: "2030-01-31",
    });
    assert.equal(
        nextTaskDates({ ...task, ...dates }, Date.parse("2030-02-28T00:00:00Z"))?.dueDate,
        "2030-03-31",
    );
    const ended = { ...task, repeat: { ...rule("month"), until: "2030-01-31" } };
    assert.equal(setTaskCompleted([ended], ended.id, true, now, "next").length, 1);
});

test("owner attachments participate in filters and survive version two migration", async () => {
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
            ...sampleTasks(now)[0],
            ownerId: TASK_OWNERS[0].id,
            priority: "urgent" as const,
        };
        assert.equal(taskMatchesLinkFilter(task, "owner"), true);
        assert.equal(
            taskMatchesLinkFilter({ ...task, clientId: null, propertyId: null }, "personal"),
            false,
        );
        const saved = await taskPreviewStore.save("owners", [task]);
        assert.equal(draftFromTask(saved[0]).ownerId, TASK_OWNERS[0].id);
        assert.equal(saved[0].priority, "urgent");
        await assert.rejects(
            taskPreviewStore.save("owners", [{ ...task, ownerId: "missing-owner" }]),
        );
        const legacy = sampleTasks(now).map(
            ({
                ownerId: _owner,
                startDate: _start,
                repeat: _repeat,
                repeatAnchor: _anchor,
                repeatFromId: _parent,
                ...t
            }) => t,
        );
        values.set(
            "crm.private-tasks.mock.v1.legacy",
            JSON.stringify({ version: 2, tasks: legacy }),
        );
        const migrated = await taskPreviewStore.list("legacy");
        assert.equal(migrated.length, legacy.length);
        assert.equal(migrated[0].title, legacy[0].title);
        assert.deepEqual(migrated[0].reminders, legacy[0].reminders);
        assert.equal(migrated[0].ownerId, null);
        assert.equal(migrated[0].repeat, null);
        assert.equal(migrated[0].startDate, null);
        assert.equal(JSON.parse(values.get("crm.private-tasks.mock.v1.legacy")!).version, 3);
    } finally {
        if (original) Object.defineProperty(globalThis, "sessionStorage", original);
        else Reflect.deleteProperty(globalThis, "sessionStorage");
    }
});
