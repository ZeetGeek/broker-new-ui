import assert from "node:assert/strict";
import test from "node:test";

import { buildPropertyShareText } from "@/lib/share/property";

import { APP_NAME } from "@/config";
import { toOwnedPropertyCardListing } from "@/features/properties/your-listings/to-owned-property-card";
import type { MyListingItem } from "@/features/properties/your-listings/types";

const share = (title: string, locality: string, city: string) =>
    buildPropertyShareText({ id: "1", title, locality, city, priceLabel: "₹50 L" });

test("share text names the place once when the title already has it", () => {
    assert.equal(
        share("Coworking Space in Bapunagar, Ahmedabad", "Bapunagar", "Ahmedabad"),
        `Coworking Space in Bapunagar, Ahmedabad · ₹50 L — view on ${APP_NAME}`,
    );
});

test("share text adds the place when the title lacks it, and skips blanks", () => {
    assert.equal(
        share("Sea-facing 2 BHK", "Bandra West", "Mumbai"),
        `Sea-facing 2 BHK · Bandra West, Mumbai · ₹50 L — view on ${APP_NAME}`,
    );
    assert.equal(share("Shop", "", "Pune"), `Shop · Pune · ₹50 L — view on ${APP_NAME}`);
    assert.equal(share("Shop", "", ""), `Shop · ₹50 L — view on ${APP_NAME}`);
});

test("owned card title never repeats or invents a broken place", () => {
    const item = (title: string, locality: string, city: string) =>
        ({
            id: "1",
            title,
            propertyType: "apartment",
            locality,
            city,
            transactionType: "sale",
            saleAmountInr: 5_000_000,
            rentAmountInr: null,
        }) as unknown as MyListingItem;

    assert.equal(
        toOwnedPropertyCardListing(
            item("Coworking Space in Bapunagar, Ahmedabad", "Bapunagar", "Ahmedabad"),
        ).title,
        "Coworking Space in Bapunagar, Ahmedabad",
    );
    assert.match(toOwnedPropertyCardListing(item("", "Baner", "Pune")).title, / in Baner, Pune$/);
    assert.doesNotMatch(toOwnedPropertyCardListing(item("", "", "")).title, / in |,/);
});
