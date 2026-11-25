import assert from "node:assert/strict";
import test from "node:test";

import type { PropertyListing } from "@/lib/api/properties";
import { formatPropertyCardName } from "@/lib/format/property-card-name";
import { matchesPropertyCriteria } from "@/lib/properties/list-criteria";

import {
    mapPropertyListingToMyItem,
    myListingInputToCreatePayload,
    myListingInputToUpdatePayload,
} from "@/features/properties/your-listings/map-my-listing";
import {
    applyListingUpdate,
    listingFromCreateInput,
} from "@/features/properties/your-listings/mock-my-listings";
import { toOwnedPropertyCardListing } from "@/features/properties/your-listings/to-owned-property-card";
import type { CreateMyListingInput } from "@/features/properties/your-listings/types";

function input(overrides: Partial<CreateMyListingInput> = {}): CreateMyListingInput {
    return {
        transactionType: "sale",
        category: "residential",
        propertyType: "apartment",
        bhk: 2,
        title: "2 BHK in Baner",
        locality: "Baner",
        city: "Mumbai",
        address: "",
        pinCode: "411045",
        landmark: "",
        society: "",
        saleAmountInr: 5_000_000,
        rentAmountInr: null,
        areaSqft: 1200,
        furnishing: "unfurnished",
        imageSrcs: [],
        bathrooms: null,
        balconies: null,
        floorNumber: null,
        totalFloors: null,
        facing: null,
        parking: "none",
        maintenanceInr: null,
        commissionPercent: 2,
        commissionAmount: null,
        securityDeposit: null,
        securityDepositMode: null,
        availableFrom: null,
        description: "",
        amenities: [],
        nearbyPlaces: [],
        suitableFor: [],
        cabins: null,
        meetingRooms: null,
        workstations: null,
        ceilingHeightFt: null,
        videoUrl: "",
        virtualTourUrl: "",
        publish: true,
        ...overrides,
    } as CreateMyListingInput;
}

test("inventory cards retain specific property types in their headlines", () => {
    for (const [category, subtype, expected] of [
        ["industrial", "cold_storage", "Cold storage"],
        ["residential", "studio", "Studio"],
        ["residential", "row_house", "Row house"],
        ["commercial", "restaurant_space", "Restaurant space"],
        ["land", "commercial_plot", "Commercial plot"],
    ] as const) {
        const listing = mapPropertyListingToMyItem({
            id: subtype,
            propertyType: category,
            subtype,
            areaSqft: 1200,
        });
        const card = toOwnedPropertyCardListing(listing);
        assert.equal(card.propertyTypeLabel, subtype);
        assert.equal(
            formatPropertyCardName(card.propertyTypeLabel, card.areaSqft),
            `${expected} · 1,200 Sqft`,
        );
    }
    const legacy = mapPropertyListingToMyItem({ id: "legacy", propertyType: "industrial" });
    assert.equal(toOwnedPropertyCardListing(legacy).propertyTypeLabel, "warehouse");
});

test("sample listings preserve publication dates and specific types when creating and publishing", () => {
    const old = new Date(Date.now() - 40 * 86_400_000).toISOString();
    const draft = listingFromCreateInput(
        "draft",
        input({
            publish: false,
            category: "industrial",
            propertyType: "warehouse",
            subtype: "cold_storage",
            bhk: 0,
        }),
        old,
    );
    assert.equal(draft.publishedAt, null);
    assert.equal(toOwnedPropertyCardListing(draft).propertyTypeLabel, "cold_storage");
    const published = applyListingUpdate(draft, { status: "published" });
    assert.equal(published.publishedAt, published.updatedAt);
    assert.equal(published.createdAt, old);
    assert.equal(published.listedDaysAgo, 0);
    assert.equal(listingFromCreateInput("published", input(), old).publishedAt, old);
});

test("saving incomplete furnishing data does not invent an unfurnished answer", () => {
    const empty = input({ furnishing: "" });
    assert.equal(myListingInputToCreatePayload(empty).furnishingStatus, undefined);
    assert.equal(myListingInputToUpdatePayload({ furnishing: "" }).furnishingStatus, undefined);
    const sample = listingFromCreateInput("empty-furnishing", empty);
    assert.equal(sample.furnishing, "");
    assert.equal(sample.furnishingLabel, "");
});

const details = {
    unitNumber: " B-402 ",
    carpetAreaSqft: 950,
    propertyAge: 5,
    propertyCondition: "ready_to_move",
};

test("create sends unit number, carpet area, age and condition in API field names", () => {
    const payload = myListingInputToCreatePayload(input(details));
    assert.equal(payload.flatNo, "B-402");
    assert.equal(payload.carpetAreaSqft, 950);
    assert.equal(payload.propertyAge, "5");
    assert.equal(payload.propertyCondition, "ready_to_move");
});

test("create leaves blank details out of the request", () => {
    const payload = myListingInputToCreatePayload(
        input({ unitNumber: "", carpetAreaSqft: null, propertyAge: null, propertyCondition: "" }),
    );
    assert.equal(payload.flatNo, undefined);
    assert.equal(payload.carpetAreaSqft, undefined);
    assert.equal(payload.propertyAge, undefined);
    assert.equal(payload.propertyCondition, undefined);
});

test("update sends the same four details", () => {
    const payload = myListingInputToUpdatePayload(details);
    assert.equal(payload.flatNo, "B-402");
    assert.equal(payload.carpetAreaSqft, 950);
    assert.equal(payload.propertyAge, "5");
    assert.equal(payload.propertyCondition, "ready_to_move");
});

test("create and update send the picked state", () => {
    assert.equal(
        myListingInputToCreatePayload(input({ state: " Uttar Pradesh " })).state,
        "Uttar Pradesh",
    );
    assert.equal(myListingInputToCreatePayload(input({ state: "" })).state, undefined);
    assert.equal(myListingInputToUpdatePayload({ state: "Uttar Pradesh" }).state, "Uttar Pradesh");
    assert.equal("state" in myListingInputToUpdatePayload({}), false);
});

test("a saved listing reads back flatNo and carpetAreaSqft from the API", () => {
    const item = mapPropertyListingToMyItem({
        id: "p1",
        title: "2 BHK in Baner",
        city: "Mumbai",
        address: "Baner",
        flatNo: "B-402",
        carpetAreaSqft: 950,
        propertyAge: "5",
        propertyCondition: "ready_to_move",
    } as PropertyListing);
    assert.equal(item.unitNumber, "B-402");
    assert.equal(item.carpetAreaSqft, 950);
    assert.equal(item.propertyAge, "5");
    assert.equal(item.propertyCondition, "ready_to_move");
});

test("inventory category filters retain API categories for subtypes shared across categories", () => {
    for (const [category, subtype] of [
        ["commercial", "warehouse"],
        ["industrial", "industrial_plot"],
        ["agricultural", "farm_land"],
        ["land", "agricultural_land"],
    ] as const) {
        const item = mapPropertyListingToMyItem({ id: subtype, propertyType: category, subtype });
        assert.equal(item.category, category);
        assert.equal(item.subtype, subtype);
        assert.equal(
            matchesPropertyCriteria(
                {
                    ...item,
                    propertyAge: item.propertyAge == null ? null : String(item.propertyAge),
                },
                { category, propertyType: subtype },
            ),
            true,
        );
    }
    assert.equal(
        mapPropertyListingToMyItem({ id: "old", subtype: "warehouse" }).category,
        "industrial",
    );
});
