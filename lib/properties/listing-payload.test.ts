import assert from "node:assert/strict";
import test from "node:test";

import {
    mapPropertyListingToMyItem,
    myListingInputToCreatePayload,
    myListingInputToUpdatePayload,
} from "@/features/properties/your-listings/map-my-listing";
import type { CreateMyListingInput } from "@/features/properties/your-listings/types";
import type { PropertyListing } from "@/lib/api/properties";

function input(overrides: Partial<CreateMyListingInput> = {}): CreateMyListingInput {
    return {
        transactionType: "sale",
        category: "residential",
        propertyType: "apartment",
        bhk: 2,
        title: "2 BHK in Adajan",
        locality: "Adajan",
        city: "Surat",
        address: "",
        pinCode: "395009",
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

test("a saved listing reads back flatNo and carpetAreaSqft from the API", () => {
    const item = mapPropertyListingToMyItem({
        id: "p1",
        title: "2 BHK in Adajan",
        city: "Surat",
        address: "Adajan",
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
