import assert from "node:assert/strict";
import { test } from "node:test";

import { buildMyListingsSummaryLines } from "./my-listings-summary";

const base = {
    summary: { total: 15, published: 14, draft: 1, unpublished: 0, sale: 12, rent: 3 },
    resultTotal: 14,
    status: "published" as const,
    hasActiveFilters: false,
};

test("published heading describes the visible inventory and pending drafts", () => {
    assert.deepEqual(buildMyListingsSummaryLines(base), [
        "14 listings are published",
        "1 draft waiting to publish",
    ]);
});

test("draft heading uses the selected result count and correct grammar", () => {
    const lines = buildMyListingsSummaryLines({ ...base, status: "draft", resultTotal: 1 });
    assert.equal(lines[0], "1 draft waiting to publish");
    assert.ok(lines.every((line) => !line.includes("14")));
});

test("filtered headings do not rotate unrelated inventory counts", () => {
    assert.deepEqual(
        buildMyListingsSummaryLines({ ...base, hasActiveFilters: true, resultTotal: 1 }),
        ["1 listing matches your filters"],
    );
    assert.deepEqual(
        buildMyListingsSummaryLines({
            ...base,
            status: "draft",
            hasActiveFilters: true,
            resultTotal: 0,
        }),
        ["No drafts match your filters", "Try changing or clearing a filter"],
    );
});

test("empty draft tab and unavailable summary do not claim the inventory is empty", () => {
    assert.equal(
        buildMyListingsSummaryLines({ ...base, status: "draft", resultTotal: 0 })[0],
        "No drafts waiting to publish",
    );
    assert.equal(
        buildMyListingsSummaryLines({ ...base, summary: null })[0],
        "14 listings are published",
    );
    assert.equal(
        buildMyListingsSummaryLines({
            ...base,
            resultTotal: 0,
            summary: { total: 0, published: 0, draft: 0, unpublished: 0, sale: 0, rent: 0 },
        })[0],
        "Add your first property to get started",
    );
});
