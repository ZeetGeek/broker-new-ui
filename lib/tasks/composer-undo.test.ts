import assert from "node:assert/strict";
import test from "node:test";

import {
    emptyComposerStacks,
    MAX_COMPOSER_UNDO,
    pushComposerPast,
    redoComposerState,
    undoComposerState,
} from "@/features/tasks/composer-undo";

type Seg = { id: string; value: string };

const snap = (segments: Seg[], activeId: string | null = null) => ({
    segments,
    activeId,
});

test("undo and redo round-trip", () => {
    let stacks = emptyComposerStacks<Seg>();
    const s0 = snap([{ id: "a", value: "" }]);
    const s1 = snap([{ id: "a", value: "hi" }]);
    stacks = pushComposerPast(stacks, s0);
    let applied = s1;
    const { stacks: uStacks, snapshot: undone } = undoComposerState(stacks, applied);
    assert.ok(undone);
    assert.equal(undone.segments[0].value, "");
    applied = undone;
    const { snapshot: redone } = redoComposerState(uStacks, applied);
    assert.ok(redone);
    assert.equal(redone.segments[0].value, "hi");
});

test("new edit clears redo stack", () => {
    let stacks = emptyComposerStacks<Seg>();
    const s0 = snap([{ id: "a", value: "" }]);
    const s1 = snap([{ id: "a", value: "one" }]);
    stacks = pushComposerPast(stacks, s0);
    const und = undoComposerState(stacks, s1);
    stacks = pushComposerPast(und.stacks, s1);
    assert.equal(stacks.future.length, 0);
});

test("push past is capped", () => {
    let stacks = emptyComposerStacks<Seg>();
    let current = snap([{ id: "a", value: "0" }]);
    for (let index = 1; index <= MAX_COMPOSER_UNDO + 5; index += 1) {
        stacks = pushComposerPast(stacks, current);
        current = snap([{ id: "a", value: String(index) }]);
    }
    assert.equal(stacks.past.length, MAX_COMPOSER_UNDO);
});
