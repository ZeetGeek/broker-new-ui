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

/**
 * Short card name used on every property card: `Office · 1,000 Sqft`.
 * Not the long listing title from the form.
 */
export function formatPropertyCardName(
    propertyTypeLabel: string,
    areaSqft: number | null | undefined,
): string {
    const type = formatPropertyTypeDisplay(propertyTypeLabel);
    const area =
        areaSqft != null && Number.isFinite(areaSqft) && areaSqft > 0
            ? formatPropertyCardArea(areaSqft)
            : null;
    return [type, area].filter(Boolean).join(" · ");
}
