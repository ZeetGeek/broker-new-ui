import assert from "node:assert/strict";
import test from "node:test";

import {
    backfillTaskStart,
    EMPTY_TASK_DRAFT,
    isTaskDate,
    MAX_REMINDER_MINUTES,
    sortTasks,
    type Task,
    taskDueReminders,
    taskGroup,
    taskMatchesDueFilter,
    taskMatchesLinkFilter,
    taskMatchesTab,
    taskReminderAt,
    taskReminderDescription,
    taskReminderIsDue,
    taskReminderKey,
    taskReminderLabel,
    taskReminders,
    taskRemindersSummary,
    taskScheduleLabel,
    taskSchema,
    validateTaskDraft,
} from "@/features/tasks/model";

const now = Date.parse("2030-01-01T18:45:00Z"); // 2 January, 00:15 IST
const task: Task = {
    id: "task",
    title: "Call the Client",
    details: "",
    startDate: null,
    repeat: null,
    repeatAnchor: null,
    repeatFromId: null,
    ownerId: null,
    dueDate: "2030-01-02",
    dueTime: "10:00",
    reminders: [15],
    clientId: null,
    propertyId: null,
    completedAt: null,
    createdAt: "2030-01-01T00:00:00Z",
    updatedAt: "2030-01-01T00:00:00Z",
    priority: "medium",
    deliveredReminderKeys: [],
};

test("start date and time are required; invalid calendar and dependent fields are rejected", () => {
    assert.equal(validateTaskDraft({ ...EMPTY_TASK_DRAFT, title: "Call Aarav" }).valid, false);
    assert.equal(
        validateTaskDraft({
            ...EMPTY_TASK_DRAFT,
            title: "Call Aarav",
            startDate: "2030-01-02",
            startTime: "09:00",
        }).valid,
        true,
    );
    assert.equal(validateTaskDraft({ ...EMPTY_TASK_DRAFT, title: "  " }).valid, false);
    assert.equal(isTaskDate("2030-02-30"), false);
    assert.equal(isTaskDate("2032-02-29"), true);
    assert.equal(isTaskDate("2030-1-2"), false);
    assert.equal(
        validateTaskDraft({ ...EMPTY_TASK_DRAFT, title: "Call", dueTime: "10:00" }).valid,
        false,
    );
    assert.equal(
        validateTaskDraft({
            ...EMPTY_TASK_DRAFT,
            title: "Call",
            dueDate: "2030-01-02",
            reminders: [15],
        }).valid,
        false,
    );
    assert.equal(
        validateTaskDraft({
            ...EMPTY_TASK_DRAFT,
            title: "Call",
            dueDate: "2030-01-02",
            dueTime: "24:00",
        }).valid,
        false,
    );
});

test("required start times validate against the date and same-day deadline without breaking old records", () => {
    const draft = {
        ...EMPTY_TASK_DRAFT,
        title: "Call",
        startDate: "2030-01-02",
        startTime: "14:00",
        dueDate: "2030-01-02",
        dueTime: "15:00",
    };
    assert.equal(validateTaskDraft(draft).valid, true);
    assert.equal(validateTaskDraft({ ...draft, startDate: "" }).valid, false);
    assert.equal(validateTaskDraft({ ...draft, startTime: "" }).valid, false);
    assert.equal(validateTaskDraft({ ...draft, startTime: "24:00" }).valid, false);
    assert.equal(validateTaskDraft({ ...draft, dueTime: "13:00" }).valid, false);
    assert.equal(
        validateTaskDraft({ ...draft, dueDate: "2030-01-03", dueTime: "01:00" }).valid,
        true,
    );
    assert.equal(taskSchema.safeParse(task).success, true);
    assert.equal(taskSchema.safeParse({ ...task, startTime: "14:00" }).success, false);
    assert.equal(
        taskSchema.safeParse({
            ...task,
            startDate: draft.startDate,
            startTime: "14:00",
            dueDate: draft.dueDate,
            dueTime: "13:00",
        }).success,
        false,
    );
});

test("schedule labels show real time ranges, one selected time, and honest date-only schedules in IST", () => {
    const scheduled = {
        ...task,
        startDate: "2030-01-02",
        startTime: "14:00",
        dueDate: "2030-01-02",
        dueTime: "15:00",
    };
    assert.equal(taskScheduleLabel(scheduled, now), "Today, 2:00 PM – 3:00 PM IST");
    assert.equal(taskScheduleLabel({ ...scheduled, startTime: null }, now), "Today, 3:00 PM IST");
    assert.equal(
        taskScheduleLabel({ ...scheduled, dueDate: null, dueTime: null }, now),
        "Today, 2:00 PM IST",
    );
    assert.equal(taskScheduleLabel({ ...scheduled, startTime: null, dueTime: null }, now), "Today");
    assert.equal(
        taskScheduleLabel({ ...scheduled, dueDate: "2030-01-03" }, now),
        "Today, 2:00 PM – Tomorrow, 3:00 PM IST",
    );
    assert.equal(
        taskScheduleLabel({ ...scheduled, startTime: null, dueDate: "2030-01-03" }, now),
        "Today – Tomorrow, 3:00 PM IST",
    );
    assert.equal(
        taskScheduleLabel({ ...scheduled, startDate: null, startTime: null }, now),
        "Today, 3:00 PM IST",
    );
    assert.equal(
        taskScheduleLabel(
            { ...scheduled, startDate: null, startTime: null, dueDate: null, dueTime: null },
            now,
        ),
        "",
    );
});

test("next seven days spans India calendar dates inclusively, without including day eight", () => {
    const atMonthEnd = Date.parse("2030-01-31T18:45:00Z"); // 1 February in India
    for (const date of ["2030-02-01", "2030-02-03", "2030-02-07"])
        assert.equal(taskMatchesDueFilter({ dueDate: date }, "week", atMonthEnd), true);
    for (const date of ["2030-01-31", "2030-02-08", null])
        assert.equal(taskMatchesDueFilter({ dueDate: date }, "week", atMonthEnd), false);
    assert.equal(
        taskMatchesDueFilter({ dueDate: "2030-02-07" }, "week", atMonthEnd + 23 * 60 * 60_000),
        true,
    );
});

test("due filters apply to original due dates on completed tasks and intersect the current tab", () => {
    const completed = { ...task, completedAt: new Date(now).toISOString() };
    assert.equal(taskMatchesTab(completed, "completed"), true);
    assert.equal(taskMatchesDueFilter(completed, "today", now), true);
    assert.equal(taskMatchesDueFilter(completed, "overdue", now), false);
    assert.equal(
        taskMatchesDueFilter({ ...completed, dueDate: "2030-01-01" }, "overdue", now),
        true,
    );
    assert.equal(taskMatchesDueFilter({ ...completed, dueDate: null }, "undated", now), true);
    assert.equal(taskMatchesDueFilter({ ...completed, dueDate: null }, "today", now), false);
    assert.equal(taskMatchesDueFilter({ ...completed, dueDate: null }, "any", now), true);
    assert.equal(
        taskMatchesTab({ ...task, dueDate: "2030-01-01" }, "completed") &&
            taskMatchesDueFilter({ ...task, dueDate: "2030-01-01" }, "overdue", now),
        false,
    );
});

test("linked filters include dual-linked tasks in both record filters and exclude them from personal", () => {
    const linked = { ...task, clientId: "client", propertyId: "property" };
    assert.equal(taskMatchesLinkFilter(linked, "client"), true);
    assert.equal(taskMatchesLinkFilter(linked, "property"), true);
    assert.equal(taskMatchesLinkFilter(linked, "personal"), false);
    assert.equal(taskMatchesLinkFilter(task, "personal"), true);
    assert.equal(taskMatchesLinkFilter(task, "client"), false);
    assert.equal(taskMatchesLinkFilter({ ...task, propertyId: "property" }, "personal"), false);
    assert.equal(taskMatchesLinkFilter(linked, "any"), true);
});

test("task name sorting is case-insensitive and naturally orders numbered task names", () => {
    const tasks = [
        { ...task, id: "ten", title: "Call 10" },
        { ...task, id: "two", title: "call 2" },
        { ...task, id: "first", title: "Arrange visit" },
    ];
    assert.deepEqual(
        sortTasks(tasks, "title").map((item) => item.id),
        ["first", "two", "ten"],
    );
});

test("completed tasks honor explicit sorting while the default shows latest completion first", () => {
    const tasks: Task[] = [
        {
            ...task,
            id: "recently-completed",
            title: "Zebra paperwork",
            priority: "low",
            createdAt: "2029-12-01T00:00:00Z",
            completedAt: "2030-01-03T00:00:00Z",
        },
        {
            ...task,
            id: "priority",
            title: "Middle task",
            priority: "urgent",
            createdAt: "2029-12-03T00:00:00Z",
            completedAt: "2030-01-02T00:00:00Z",
        },
        {
            ...task,
            id: "newest",
            title: "Arrange visit",
            priority: "medium",
            createdAt: "2029-12-04T00:00:00Z",
            completedAt: "2030-01-01T00:00:00Z",
        },
    ];
    assert.deepEqual(
        sortTasks(tasks).map((item) => item.id),
        ["recently-completed", "priority", "newest"],
    );
    assert.deepEqual(
        sortTasks(tasks, "title").map((item) => item.id),
        ["newest", "priority", "recently-completed"],
    );
    assert.deepEqual(
        sortTasks(tasks, "priority").map((item) => item.id),
        ["priority", "newest", "recently-completed"],
    );
    assert.deepEqual(
        sortTasks(tasks, "newest").map((item) => item.id),
        ["newest", "priority", "recently-completed"],
    );
});

test("date-led groups use India midnight and keep today's timed tasks together", () => {
    assert.equal(taskGroup(task, now), "today");
    assert.equal(taskGroup(task, Date.parse("2030-01-02T12:00:00Z")), "today");
    assert.equal(taskGroup({ ...task, dueDate: "2030-01-01" }, now), "overdue");
    assert.equal(taskGroup({ ...task, dueDate: "2030-01-03" }, now), "upcoming");
    assert.equal(taskGroup({ ...task, dueDate: null, dueTime: null }, now), "undated");
    assert.equal(
        taskGroup({ ...task, completedAt: new Date(now).toISOString() }, now),
        "completed",
    );
    assert.equal(
        taskMatchesTab({ ...task, completedAt: new Date(now).toISOString() }, "all"),
        true,
    );
    assert.equal(taskMatchesTab({ ...task, dueDate: "2030-01-01" }, "completed"), false);
});

test("reminders use exact IST instants, fire at the boundary, and dedupe by schedule", () => {
    const at = "2030-01-02T04:15:00.000Z";
    const key = taskReminderKey(task, 15)!;
    assert.equal(taskReminderAt(task, 15), at);
    assert.equal(taskReminderIsDue(task, Date.parse(at) - 1), false);
    assert.equal(taskReminderIsDue(task, Date.parse(at)), true);
    assert.equal(
        taskReminderIsDue({ ...task, deliveredReminderKeys: [key] }, Date.parse(at)),
        false,
    );
    assert.equal(taskReminderIsDue({ ...task, completedAt: at }, Date.parse(at)), false);
    assert.equal(taskReminderIsDue({ ...task, reminders: [] }, Date.parse(at)), false);
    assert.equal(taskReminderAt(task, 0), "2030-01-02T04:30:00.000Z");
    assert.equal(
        taskReminderIsDue(
            { ...task, dueTime: "10:15", deliveredReminderKeys: [key] },
            Date.parse("2030-01-02T04:30:00Z"),
        ),
        true,
    );
});

test("multiple reminders deliver independently, in chronological order, with schedule-specific keys", () => {
    const multiple = { ...task, reminders: [0, 15, 90, 1440] };
    const reminders = taskReminders(multiple);
    assert.deepEqual(
        reminders.filter((reminder) => reminder.kind === "due").map((reminder) => reminder.minutes),
        [1440, 90, 15, 0],
    );
    assert.equal(taskDueReminders(multiple, Date.parse("2030-01-02T03:00:00Z")).length, 2);
    const delivered = {
        ...multiple,
        deliveredReminderKeys: reminders.slice(0, 2).map((r) => r.key),
    };
    assert.deepEqual(
        taskDueReminders(delivered, Date.parse("2030-01-02T04:15:00Z")).map((r) => r.minutes),
        [15],
    );
    assert.deepEqual(
        taskDueReminders(
            { ...delivered, reminders: [0, 1440] },
            Date.parse("2030-01-02T04:15:00Z"),
        ),
        [],
    );
    assert.equal(
        taskDueReminders(
            { ...multiple, completedAt: new Date(now).toISOString() },
            Date.parse("2030-01-03T00:00:00Z"),
        ).length,
        0,
    );
    assert.notEqual(
        taskReminderKey(multiple, 15),
        taskReminderKey({ ...multiple, dueTime: "10:15" }, 15),
    );
    // Same delivery instant from a different due time/offset still has its own key.
    assert.equal(
        taskReminderAt(multiple, 15),
        taskReminderAt({ ...multiple, dueTime: "10:15" }, 30),
    );
    assert.notEqual(
        taskReminderKey(multiple, 15),
        taskReminderKey({ ...multiple, dueTime: "10:15" }, 30),
    );
});

test("custom offsets validate whole-minute ranges and unique choices without a count cap", () => {
    const draft = {
        ...EMPTY_TASK_DRAFT,
        title: "Call",
        startDate: "2030-01-02",
        startTime: "09:00",
        dueDate: "2030-01-02",
        dueTime: "10:00",
    };
    for (const reminders of [
        [0, 17, 90, 1500],
        [MAX_REMINDER_MINUTES],
        Array.from({ length: 40 }, (_, index) => index),
    ])
        assert.equal(validateTaskDraft({ ...draft, reminders }).valid, true);
    for (const reminders of [
        [-1],
        [1.5],
        [Number.NaN],
        [Number.POSITIVE_INFINITY],
        [MAX_REMINDER_MINUTES + 1],
        [15, 15],
    ])
        assert.equal(validateTaskDraft({ ...draft, reminders }).valid, false);
    assert.equal(taskReminderAt(task, -1), null);
    assert.equal(taskReminderAt(task, MAX_REMINDER_MINUTES + 1), null);
    assert.equal(taskReminderLabel(0), "At due time");
    assert.equal(taskReminderLabel(17), "17 minutes before");
    assert.equal(taskReminderLabel(90), "1 hour 30 minutes before");
    assert.equal(taskReminderLabel(1501), "1 day 1 hour 1 minute before");
    assert.equal(taskRemindersSummary({ reminders: [] }), "At task start");
    assert.equal(taskRemindersSummary({ reminders: [90] }), "2 reminders");
    assert.equal(taskRemindersSummary({ reminders: [0, 15] }), "3 reminders");
});

test("every task includes an automatic start reminder that fires once and follows rescheduling", () => {
    const scheduled = { ...task, startDate: "2030-01-02", startTime: "09:00", reminders: [] };
    const [start] = taskReminders(scheduled);
    assert.equal(start.kind, "start");
    assert.equal(taskReminderDescription(start), "At task start");
    assert.equal(start.at, "2030-01-02T03:30:00.000Z");
    assert.equal(taskDueReminders(scheduled, Date.parse(start.at!) - 1).length, 0);
    assert.equal(taskDueReminders(scheduled, Date.parse(start.at!)).length, 1);
    const delivered = { ...scheduled, deliveredReminderKeys: [start.key] };
    assert.equal(taskDueReminders(delivered, Date.parse(start.at!)).length, 0);
    assert.notEqual(taskReminders({ ...delivered, startTime: "09:30" })[0].key, start.key);
    assert.equal(
        taskDueReminders({ ...scheduled, completedAt: start.at }, Date.parse(start.at!)).length,
        0,
    );
    const [pending] = taskReminders({ ...scheduled, startTime: null });
    assert.equal(pending.kind, "start");
    assert.equal(pending.at, null);
    assert.equal(taskDueReminders({ ...scheduled, startTime: null }, Date.now()).length, 0);
    assert.equal(taskReminders({ ...scheduled, reminders: [15, 0] }).length, 3);
});

test("date-only preview records get a stable India start time without replaying past start reminders", () => {
    const at = Date.parse("2030-01-02T08:40:35Z");
    const old = {
        ...task,
        startDate: "2030-01-02",
        startTime: null,
        dueDate: null,
        dueTime: null,
        reminders: [],
    };
    const upgraded = backfillTaskStart(old, at);
    assert.equal(upgraded.startDate, old.startDate);
    assert.equal(upgraded.startTime, "14:10");
    assert.equal(taskScheduleLabel(upgraded, at), "Today, 2:10 PM IST");
    assert.equal(backfillTaskStart(upgraded, at + 60 * 60_000), upgraded);
    assert.deepEqual(taskDueReminders(upgraded, at), []);
    assert.equal(upgraded.deliveredReminderKeys.length, 0);
    const earlierDue = backfillTaskStart({ ...old, dueDate: "2030-01-02", dueTime: "12:00" }, at);
    assert.equal(earlierDue.startTime, "12:00");
    assert.equal(taskScheduleLabel(earlierDue, at), "Today, 12:00 PM IST");
    const future = backfillTaskStart({ ...old, startDate: "2030-01-03" }, at);
    const [start] = taskReminders(future);
    assert.equal(taskDueReminders(future, Date.parse(start.at!)).length, 1);
    assert.equal(backfillTaskStart({ ...old, startTime: "09:00" }, at).startTime, "09:00");
});

test("sorting keeps undated tasks last and completion order uses completion date", () => {
    const tasks = [
        { ...task, id: "undated", dueDate: null, dueTime: null },
        { ...task, id: "later", dueTime: "11:00" },
        { ...task, id: "anytime", dueTime: null },
        { ...task, id: "first", dueDate: "2030-01-01" },
    ];
    assert.deepEqual(
        sortTasks(tasks).map((t) => t.id),
        ["first", "later", "anytime", "undated"],
    );
    assert.equal(tasks[0].id, "undated");
    const complete = [
        { ...task, id: "old", completedAt: "2030-01-01T00:00:00Z" },
        { ...task, id: "new", completedAt: "2030-01-02T00:00:00Z" },
    ];
    assert.equal(sortTasks(complete)[0].id, "new");
});
