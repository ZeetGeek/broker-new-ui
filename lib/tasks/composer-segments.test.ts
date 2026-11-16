import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSegments } from "@/features/tasks/composer-segments";

test("normalize keeps empty text slot after chip", () => {
    const segments = normalizeSegments([
        { id: "t1", type: "text", value: "hello" },
        { id: "c1", type: "chip", kind: "client", label: "Aarav", value: "id1" },
        { id: "t2", type: "text", value: "" },
    ]);
    assert.equal(segments.length, 3);
    assert.equal(segments[1].type, "chip");
    assert.equal(segments[2].type, "text");
    assert.equal((segments[2] as { value: string }).value, "");
    assert.equal(segments[2].id, "t2");
});

test("normalize ensures trailing slot after text with content", () => {
    const segments = normalizeSegments([{ id: "t1", type: "text", value: "only" }]);
    const texts = segments.filter((s) => s.type === "text");
    assert.equal(texts.length, 2);
    assert.equal(texts[0]?.value, "only");
    assert.equal(texts[1]?.value, "");
});
