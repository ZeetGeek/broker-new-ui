import assert from "node:assert/strict";
import test from "node:test";

import {
    isPinnedPropertyIds,
    pinnedPropertiesFirst,
    togglePinnedProperty,
} from "./pinned-properties";

test("pins lead without changing the selected order within either group", () => {
    const items = [{ id: "low" }, { id: "middle" }, { id: "high" }, { id: "highest" }];
    assert.deepEqual(
        pinnedPropertiesFirst(items, ["highest", "middle", "missing"]).map((item) => item.id),
        ["middle", "highest", "low", "high"],
    );
    assert.deepEqual(
        items.map((item) => item.id),
        ["low", "middle", "high", "highest"],
    );
    assert.deepEqual(pinnedPropertiesFirst(items, []), items);
});

test("unpinning restores the selected order and removes duplicate stored pins", () => {
    assert.deepEqual(togglePinnedProperty(["a", "b", "a"], "a"), ["b"]);
    assert.deepEqual(togglePinnedProperty(["b"], "a"), ["b", "a"]);
    assert.deepEqual(togglePinnedProperty(togglePinnedProperty([], "a"), "a"), []);
    assert.equal(isPinnedPropertyIds(["a", "b"]), true);
    for (const value of [null, {}, "a", [1], [""]]) {
        assert.equal(isPinnedPropertyIds(value), false);
    }
});
