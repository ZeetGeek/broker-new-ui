import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

/** True when listing can be sold. */
export function offersSale(listing: {
    saleAmountInr: number | null;
}): boolean {
    return listing.saleAmountInr != null && listing.saleAmountInr > 0;
}

/** True when listing can be rented. */
export function offersRent(listing: {
    rentAmountInr: number | null;
}): boolean {
    return listing.rentAmountInr != null && listing.rentAmountInr > 0;
}

export function offersBoth(listing: {
    saleAmountInr: number | null;
    rentAmountInr: number | null;
}): boolean {
    return offersSale(listing) && offersRent(listing);
}

export type ListingPriceMode = "sale" | "rent";

/** Default price mode: sale if available, else rent. */
export function defaultPriceMode(listing: {
    saleAmountInr: number | null;
    rentAmountInr: number | null;
}): ListingPriceMode {
    return offersSale(listing) ? "sale" : "rent";
}

/** Amount used for sort/filter when a type preference is set. */
export function listingCompareAmountInr(
    listing: { saleAmountInr: number | null; rentAmountInr: number | null },
    prefer: ListingPriceMode | "",
): number {
    if (prefer === "sale" && listing.saleAmountInr != null) return listing.saleAmountInr;
    if (prefer === "rent" && listing.rentAmountInr != null) return listing.rentAmountInr;
    if (listing.saleAmountInr != null) return listing.saleAmountInr;
    if (listing.rentAmountInr != null) return listing.rentAmountInr;
    return 0;
}

export function toLegacyAmountFields(listing: {
    saleAmountInr: number | null;
    rentAmountInr: number | null;
}): { amountInr: number; isRent: boolean } {
    if (offersSale(listing) && !offersRent(listing)) {
        return { amountInr: listing.saleAmountInr!, isRent: false };
    }
    if (offersRent(listing) && !offersSale(listing)) {
        return { amountInr: listing.rentAmountInr!, isRent: true };
    }
    // Both: prefer sale as primary legacy amount.
    if (offersSale(listing)) {
        return { amountInr: listing.saleAmountInr!, isRent: false };
    }
    return { amountInr: 0, isRent: false };
}

export type OwnerListingPricing = Pick<OwnerListingItem, "saleAmountInr" | "rentAmountInr">;
