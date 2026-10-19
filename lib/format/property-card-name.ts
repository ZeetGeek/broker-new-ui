import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/validation/property";

/** Area on property cards: `1,000 Sqft` (en-IN grouping). */
export function formatPropertyCardArea(areaSqft: number): string {
    return `${Math.round(Math.abs(areaSqft)).toLocaleString("en-IN")} Sqft`;
}

/**
 * Display label for a property type key or free text.
 * Keys like `office` → `Office`; already-pretty labels pass through cleaned.
 */
export function formatPropertyTypeDisplay(propertyTypeLabel: string): string {
    const trimmed = propertyTypeLabel.trim();
    if (!trimmed) return "";

    const key = trimmed.toLowerCase().replace(/[\s-]+/g, "_");
    if (Object.prototype.hasOwnProperty.call(PROPERTY_TYPE_LABELS, key)) {
        return PROPERTY_TYPE_LABELS[key as PropertyType];
    }

    return trimmed
        .replace(/_/g, " ")
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

function formatBhkLabel(bhk: number): string {
    if (bhk >= 5) return "5+ BHK";
    return `${Math.round(bhk)} BHK`;
}

const BHK_CONFIG_TO_NUMBER: Record<string, number> = {
    one_bhk: 1,
    two_bhk: 2,
    three_bhk: 3,
    four_bhk: 4,
    five_plus_bhk: 5,
};

/** Parse `2 BHK` / `5+ BHK` / `two_bhk` when no numeric bhk is on hand. */
export function bhkFromConfigLabel(configLabel: string | null | undefined): number | undefined {
    const text = configLabel?.trim();
    if (!text) return undefined;
    const fromKey = BHK_CONFIG_TO_NUMBER[text.toLowerCase().replace(/[\s-]+/g, "_")];
    if (fromKey) return fromKey;
    if (/^5\+\s*BHK$/i.test(text)) return 5;
    const match = text.match(/^(\d+)\s*BHK$/i);
    if (!match) return undefined;
    const value = Number(match[1]);
    return Number.isFinite(value) && value > 0 ? value : undefined;
}

function formatBathLabel(bathrooms: number): string {
    const count = Math.round(bathrooms);
    return count === 1 ? "1 Bath" : `${count} Bath`;
}

export type PropertyCardNameRooms = {
    bhk?: number | null;
    bathrooms?: number | null;
};

/**
 * Short card name: `Apartment · 2 BHK · 2 Bath · 1,000 Sqft`.
 * BHK / Bath only when present (> 0). Not the long listing title.
 */
export function formatPropertyCardName(
    propertyTypeLabel: string,
    areaSqft: number | null | undefined,
    rooms?: PropertyCardNameRooms,
): string {
    const type = formatPropertyTypeDisplay(propertyTypeLabel);
    const bhk =
        rooms?.bhk != null && Number.isFinite(rooms.bhk) && rooms.bhk > 0
            ? formatBhkLabel(rooms.bhk)
            : null;
    const bath =
        rooms?.bathrooms != null && Number.isFinite(rooms.bathrooms) && rooms.bathrooms > 0
            ? formatBathLabel(rooms.bathrooms)
            : null;
    const area =
        areaSqft != null && Number.isFinite(areaSqft) && areaSqft > 0
            ? formatPropertyCardArea(areaSqft)
            : null;
    return [type, bhk, bath, area].filter(Boolean).join(" · ");
}
