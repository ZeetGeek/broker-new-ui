import assert from "node:assert/strict";
import test from "node:test";

import {
    plannerColumnPickerOptions,
    resolvePlannerVisibleColumns,
} from "@/lib/tasks/planner-column-options";

test("column picker options appear only when there are more populated days than the step", () => {
    assert.deepEqual(plannerColumnPickerOptions(0, 7), []);
    assert.deepEqual(plannerColumnPickerOptions(1, 7), []);
    assert.deepEqual(plannerColumnPickerOptions(2, 7), [1]);
    assert.deepEqual(plannerColumnPickerOptions(6, 7), [1, 3, 5]);
    assert.deepEqual(plannerColumnPickerOptions(8, 7), [1, 3, 5, 7]);
    assert.deepEqual(plannerColumnPickerOptions(10, 3), [1, 3]);
});

test("visible columns clamp to viewport, populated days, and the chosen step", () => {
    assert.equal(resolvePlannerVisibleColumns(5, 8, 7, [1, 3, 5, 7]), 5);
    assert.equal(resolvePlannerVisibleColumns(7, 8, 7, [1, 3, 5, 7]), 7);
    assert.equal(resolvePlannerVisibleColumns(5, 3, 7, [1]), 1);
    assert.equal(resolvePlannerVisibleColumns(5, 0, 7, []), 5);
    assert.equal(resolvePlannerVisibleColumns(7, 2, 7, [1]), 1);
});
