import assert from "node:assert/strict";
import test from "node:test";

import {
    applyListingUpdate,
    listingFromCreateInput,
    MOCK_MY_LISTINGS_SEED,
} from "@/features/properties/your-listings/mock-my-listings";

test("creating a listing without photos and clearing existing photos never inserts an unrelated stock cover", () => {
    const seed = MOCK_MY_LISTINGS_SEED[0];
    const created = listingFromCreateInput("test-no-photos", {
        ...seed,
        subtype: seed.subtype ?? undefined,
        imageSrcs: [],
        publish: false,
    });
    assert.equal(created.photoCount, 0);
    assert.equal(created.imageSrc, "");
    assert.deepEqual(created.imageSrcs, []);
    const updated = applyListingUpdate(seed, { imageSrcs: [] });
    assert.equal(updated.photoCount, 0);
    assert.equal(updated.imageSrc, "");
    assert.deepEqual(updated.imageSrcs, []);
});
