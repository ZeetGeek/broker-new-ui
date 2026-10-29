import assert from "node:assert/strict";
import test from "node:test";

import { StageOperationGate } from "@/lib/properties/stage-operation-gate";

test("overlapping writes cannot start until the first write settles", () => {
    const gate = new StageOperationGate();
    assert.equal(gate.begin("lead-a"), 1);
    assert.equal(gate.begin("lead-a"), null);
    assert.equal(gate.begin("lead-b"), null);
    gate.end();
    assert.equal(gate.begin("lead-b"), 1);
});

test("a newer edit retires an older Undo callback, including after failure", () => {
    const gate = new StageOperationGate();
    const first = gate.begin("lead");
    gate.end();
    const second = gate.begin("lead");
    gate.end();
    assert.equal(gate.begin("lead", first!), null);
    assert.equal(gate.begin("lead", second!), 3);
    gate.end();
    assert.equal(gate.begin("lead", second!), null);
});

test("list snapshots started before or during a mutation are stale after it settles", () => {
    const gate = new StageOperationGate();
    const before = gate.revision;
    gate.begin("lead");
    const during = gate.revision;
    gate.end();
    assert.notEqual(gate.revision, before);
    assert.notEqual(gate.revision, during);
});
