import assert from "node:assert/strict";
import test from "node:test";

import {
    plannerColumnLabel,
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

test("column picker options are named as columns", () => {
    assert.deepEqual(plannerColumnLabel(1), { label: "1 Col", ariaLabel: "Show one column" });
    assert.deepEqual(plannerColumnLabel(3), { label: "3 Cols", ariaLabel: "Show 3 columns" });
});

test("the calendar planner always offers every column count that fits", () => {
    assert.deepEqual(plannerColumnPickerOptions(0, 7, true), [1, 3, 5, 7]);
    assert.deepEqual(plannerColumnPickerOptions(1, 7, true), [1, 3, 5, 7]);
    assert.deepEqual(plannerColumnPickerOptions(1, 3, true), [1, 3]);
    assert.deepEqual(plannerColumnPickerOptions(9, 1, true), []);
});

test("the calendar planner shows the chosen count even with few populated days", () => {
    assert.equal(resolvePlannerVisibleColumns(5, 1, 7, [1, 3, 5, 7], true), 5);
    assert.equal(resolvePlannerVisibleColumns(7, 0, 7, [1, 3, 5, 7], true), 7);
    assert.equal(resolvePlannerVisibleColumns(5, 1, 3, [1, 3], true), 3);
    assert.equal(resolvePlannerVisibleColumns(5, 4, 1, [], true), 1);
});
