import { offersRent, offersSale } from "@/lib/format/listing-availability";
import { formatPrice, formatRent } from "@/lib/format/price";
import { formatPropertyCardName } from "@/lib/format/property-card-name";

import type { BadgeColor } from "@/components/ui/badge";

/** Sale vs rent — same language as Looking for on marketplace filters. */
export type PropertyPickerLookingFor = "sale" | "rent";

export type PropertyPickerProperty = {
    id: string;
    /**
     * Fallback label when type/area cannot build a card name.
     * Prefer `propertyTypeLabel` + `areaSqft` / BHK for the info line.
     */
    title: string;
    imageUrl?: string;
    propertyTypeLabel?: string;
    areaSqft?: number | null;
    bhk?: number | null;
    bathrooms?: number | null;
    /** Area / locality — first part of the location line. */
    locality?: string;
    city?: string;
    state?: string;
    saleAmountInr?: number | null;
    rentAmountInr?: number | null;
    commissionPercent?: number | null;
    commissionAmountInr?: number | null;
    warning?: string | null;
    statusChips?: readonly { label: string; color: "emerald" | "amber" | "sky" | "stone" }[];
};

export const PROPERTY_LOOKING_FOR_BADGE: Record<
    PropertyPickerLookingFor,
    { label: string; color: BadgeColor }
> = {
    sale: { label: "Sale", color: "emerald" },
    rent: { label: "Rent", color: "orange" },
};

export function propertyLookingForLabel(lookingFor: PropertyPickerLookingFor): string {
    return PROPERTY_LOOKING_FOR_BADGE[lookingFor].label;
}

/** Amounts as `ListingAskPrices` expects (`null` when unset). */
export function propertyAskAmounts(property: PropertyPickerProperty): {
    saleAmountInr: number | null;
    rentAmountInr: number | null;
    commissionPercent: number | null;
    commissionAmount: number | null;
} {
    return {
        saleAmountInr: property.saleAmountInr ?? null,
        rentAmountInr: property.rentAmountInr ?? null,
        commissionPercent: property.commissionPercent ?? null,
        commissionAmount: property.commissionAmountInr ?? null,
    };
}

export function propertyOffersSale(property: PropertyPickerProperty): boolean {
    return offersSale(propertyAskAmounts(property));
}

export function propertyOffersRent(property: PropertyPickerProperty): boolean {
    return offersRent(propertyAskAmounts(property));
}

/** True when the listing matches a Sale / Rent tab filter. */
export function propertyMatchesLookingFor(
    property: PropertyPickerProperty,
    lookingFor: PropertyPickerLookingFor,
): boolean {
    return lookingFor === "sale" ? propertyOffersSale(property) : propertyOffersRent(property);
}

/** Card-style “what” line — type · BHK · bath · Sqft. Falls back to `title`. */
export function propertyInfoLine(property: PropertyPickerProperty): string {
    const fromCard = formatPropertyCardName(property.propertyTypeLabel ?? "", property.areaSqft, {
        bhk: property.bhk,
        bathrooms: property.bathrooms,
    });
    return fromCard || property.title;
}

/** Compact place line — area, city, state only. Never a street address. */
export function propertyPlaceLine(property: PropertyPickerProperty): string | undefined {
    const parts = [property.locality, property.city, property.state].filter(Boolean);
    return parts.length ? parts.join(", ") : undefined;
}

export function propertyLookingForBadges(
    property: PropertyPickerProperty,
): readonly { label: string; color: BadgeColor }[] {
    const badges: { label: string; color: BadgeColor }[] = [];
    if (propertyOffersSale(property)) badges.push(PROPERTY_LOOKING_FOR_BADGE.sale);
    if (propertyOffersRent(property)) badges.push(PROPERTY_LOOKING_FOR_BADGE.rent);
    return badges;
}

export function propertyMatchesQuery(property: PropertyPickerProperty, query: string): boolean {
    if (!query) return true;
    const amounts = propertyAskAmounts(property);
    const haystack = [
        property.title,
        propertyInfoLine(property),
        property.propertyTypeLabel ?? "",
        property.locality ?? "",
        property.city ?? "",
        property.state ?? "",
        propertyOffersSale(property) ? "sale" : "",
        propertyOffersRent(property) ? "rent" : "",
        amounts.saleAmountInr != null ? formatPrice(amounts.saleAmountInr) : "",
        amounts.rentAmountInr != null ? formatRent(amounts.rentAmountInr) : "",
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
}
