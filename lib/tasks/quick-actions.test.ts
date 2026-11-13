import assert from "node:assert/strict";
import test from "node:test";

import type { Task } from "@/features/tasks/model";
import { createPlannerTask } from "@/features/tasks/planner-model";
import { changeTaskQuickly } from "@/features/tasks/quick-actions";

const now = Date.parse("2030-01-10T09:00:00Z");
const task: Task = {
    ...createPlannerTask("Call client", "2030-01-08", now, "quick-task"),
    startDate: "2030-01-07",
    startTime: "09:00",
    dueTime: "11:00",
    reminders: [15],
    clientId: "client-a",
    propertyId: "property-a",
    repeat: { unit: "day", interval: 1, weekdays: [], until: null },
    repeatAnchor: "2030-01-08",
};

test("quick reschedule of overdue work changes the actual deadline, range and repeat anchor", () => {
    const [next] = changeTaskQuickly([task], task.id, { dueDate: "2030-01-10" }, now);
    assert.equal(next.dueDate, "2030-01-10");
    assert.equal(next.startDate, "2030-01-09");
    assert.equal(next.repeatAnchor, "2030-01-10");
    assert.equal(next.dueTime, "11:00");
    assert.deepEqual(next.reminders, [15]);
    assert.equal(next.clientId, task.clientId);
    assert.equal(next.propertyId, task.propertyId);
    assert.equal(task.dueDate, "2030-01-08");
});
test("priority changes preserve the schedule and reminder delivery history", () => {
    const original = { ...task, deliveredReminderKeys: ["delivered"] };
    const [next] = changeTaskQuickly([original], task.id, { priority: "urgent" }, now);
    assert.equal(next.priority, "urgent");
    assert.deepEqual(next.deliveredReminderKeys, original.deliveredReminderKeys);
    assert.equal(next.dueDate, original.dueDate);
});
test("clearing time or date removes due reminders, while invalid changes leave the original intact", () => {
    assert.deepEqual(changeTaskQuickly([task], task.id, { dueTime: null }, now)[0].reminders, []);
    const [undated] = changeTaskQuickly([task], task.id, { dueDate: null }, now);
    assert.equal(undated.dueTime, null);
    assert.deepEqual(undated.reminders, []);
    assert.throws(() => changeTaskQuickly([task], task.id, { dueTime: "25:01" }, now));
    assert.equal(task.dueTime, "11:00");
    assert.throws(() =>
        changeTaskQuickly(
            [{ ...task, deletedAt: new Date(now).toISOString() }],
            task.id,
            { priority: "low" },
            now,
        ),
    );
});
