import assert from "node:assert/strict";
import test from "node:test";

import { photoOrderForUpdate } from "@/features/properties/your-listings/map-my-listing";

const A = "https://cdn.test/a.jpg";
const B = "https://cdn.test/b.jpg";
const C = "https://cdn.test/c.jpg";

test("a replaced cover is sent first", () => {
    assert.deepEqual(photoOrderForUpdate(["blob:new", B, C], [A, B, C], 1), ["new:0", B, C]);
});

test("a new photo placed between kept ones keeps its place", () => {
    assert.deepEqual(photoOrderForUpdate([A, "blob:new", B], [A, B], 1), [A, "new:0", B]);
});

test("kept photos in a new order are sent", () => {
    assert.deepEqual(photoOrderForUpdate([C, A, B], [A, B, C], 0), [C, A, B]);
});

test("nothing is sent when the server's own order already matches", () => {
    // No change.
    assert.equal(photoOrderForUpdate([A, B, C], [A, B, C], 0), undefined);
    // New photos added at the end.
    assert.equal(photoOrderForUpdate([A, B, "blob:1", "blob:2"], [A, B], 2), undefined);
    // A gallery photo removed.
    assert.equal(photoOrderForUpdate([A, C], [A, B, C], 0), undefined);
    // The cover removed and not replaced.
    assert.equal(photoOrderForUpdate([B, C], [A, B, C], 0), undefined);
});

test("nothing is sent when new files cannot be matched to the form's photos", () => {
    // One new photo in the form, but its file could not be prepared.
    assert.equal(photoOrderForUpdate(["blob:new", B, C], [A, B, C], 0), undefined);
});
