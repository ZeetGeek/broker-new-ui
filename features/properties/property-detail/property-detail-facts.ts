import { formatAreaSqft } from "@/lib/format/area";
import { formatDateShort } from "@/lib/format/date";
import { formatPriceInr } from "@/lib/format/price";
import {
    PROPERTY_CONDITION_OPTIONS,
    PROPERTY_FACING_OPTIONS,
    PROPERTY_PARKING_OPTIONS,
} from "@/lib/validation/property";

import type { MyListingItem } from "@/features/properties/your-listings/types";

export type PropertyFact = {
    key: string;
    label: string;
    value: string;
};

function facingLabel(facing: MyListingItem["facing"]): string | null {
    if (!facing) return null;
    return PROPERTY_FACING_OPTIONS.find((option) => option.value === facing)?.label ?? null;
}

function parkingLabel(parking: MyListingItem["parking"]): string | null {
    if (parking === "none") return "None";
    return PROPERTY_PARKING_OPTIONS.find((option) => option.value === parking)?.label ?? null;
}

function conditionLabel(condition: MyListingItem["propertyCondition"]): string | null {
    if (!condition) return null;
    return PROPERTY_CONDITION_OPTIONS.find((option) => option.value === condition)?.label ?? null;
}

/**
 * `availableFrom` is a plain calendar date (`yyyy-mm-dd`), not an instant, so
 * it is parsed as local wall-clock rather than through `parseApiInstant`.
 */
function availableFromLabel(availableFrom: string | null): string | null {
    if (!availableFrom) return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(availableFrom.trim());
    if (!match) return availableFrom;

    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (Number.isNaN(date.getTime())) return availableFrom;

    return formatDateShort(date);
}

function floorLabel(item: MyListingItem): string | null {
    if (item.floorNumber == null) return null;
    const floor = item.floorNumber === 0 ? "Ground" : `${item.floorNumber}`;
    if (item.totalFloors == null) return floor;
    return `${floor} of ${item.totalFloors}`;
}

/** One-line address for detail headers — skips empty parts. */
export function formatListingAddressLine(item: MyListingItem): string {
    const parts = [
        item.flatNo.trim() ? `Flat ${item.flatNo.trim()}` : null,
        item.society.trim() || null,
        item.address.trim() || null,
        item.locality.trim() || null,
        item.landmark.trim() ? `Near ${item.landmark.trim()}` : null,
        item.city.trim() || null,
        item.state.trim() || null,
        item.pinCode.trim() || null,
    ].filter((part): part is string => Boolean(part));

    return parts.join(", ");
}

/**
 * The spec table under the gallery. Only facts the owner actually filled in
 * appear — an empty row reads as missing data, not as a neutral blank.
 */
export function buildPropertyFacts(item: MyListingItem): PropertyFact[] {
    const facts: PropertyFact[] = [];

    if (item.bhk > 0) {
        facts.push({ key: "bhk", label: "Configuration", value: item.configLabel });
    }
    if (item.bathrooms != null && item.bathrooms > 0) {
        facts.push({
            key: "bathrooms",
            label: "Bathrooms",
            value: String(item.bathrooms),
        });
    }
    if (item.balconies != null && item.balconies > 0) {
        facts.push({
            key: "balconies",
            label: "Balconies",
            value: String(item.balconies),
        });
    }

    facts.push({ key: "area", label: "Built-up area", value: formatAreaSqft(item.areaSqft) });
    if (item.carpetAreaSqft != null && item.carpetAreaSqft > 0) {
        facts.push({
            key: "carpet",
            label: "Carpet area",
            value: formatAreaSqft(item.carpetAreaSqft),
        });
    }
    facts.push({ key: "type", label: "Property type", value: item.propertyTypeLabel });
    facts.push({ key: "furnishing", label: "Furnishing", value: item.furnishingLabel });

    if (item.propertyAge.trim()) {
        facts.push({ key: "age", label: "Property age", value: item.propertyAge.trim() });
    }

    const condition = conditionLabel(item.propertyCondition);
    if (condition) {
        facts.push({ key: "condition", label: "Condition", value: condition });
    }

    if (item.society.trim()) {
        facts.push({ key: "society", label: "Society", value: item.society.trim() });
    }
    if (item.flatNo.trim()) {
        facts.push({ key: "flat", label: "Flat no.", value: item.flatNo.trim() });
    }
    if (item.landmark.trim()) {
        facts.push({ key: "landmark", label: "Landmark", value: item.landmark.trim() });
    }
    if (item.state.trim()) {
        facts.push({ key: "state", label: "State", value: item.state.trim() });
    }

    const floor = floorLabel(item);
    if (floor) facts.push({ key: "floor", label: "Floor", value: floor });

    const facing = facingLabel(item.facing);
    if (facing) facts.push({ key: "facing", label: "Facing", value: facing });

    const parking = parkingLabel(item.parking);
    if (parking) facts.push({ key: "parking", label: "Parking", value: parking });

    if (item.pricePerSqft != null && item.pricePerSqft > 0) {
        facts.push({
            key: "ppsqft",
            label: "Price / sq.ft",
            value: formatPriceInr(item.pricePerSqft),
        });
    }

    if (item.maintenanceInr != null && item.maintenanceInr > 0) {
        facts.push({
            key: "maintenance",
            label: "Maintenance",
            value: `${formatPriceInr(item.maintenanceInr)}/mo`,
        });
    }

    const availableFrom = availableFromLabel(item.availableFrom);
    if (availableFrom) {
        facts.push({ key: "available", label: "Available from", value: availableFrom });
    }

    return facts;
}

/** "Today" / "Yesterday" / "N days ago" for the listing age line. */
export function listedAgoLabel(listedDaysAgo: number): string {
    if (listedDaysAgo <= 0) return "Today";
    if (listedDaysAgo === 1) return "Yesterday";
    return `${listedDaysAgo} days ago`;
}

/**
 * Column count for the fact grid.
 *
 * The grid draws its separators as per-cell borders rather than as a coloured
 * background showing through `gap-px`. That matters because the column count
 * changes per breakpoint: any gap-based rule leaves a stray coloured cell at
 * whichever breakpoint the total does not divide into, and no single filler
 * count can satisfy 2, 3 and 4 columns at once.
 */
export function factColumnsClass(factCount: number): string {
    if (factCount % 4 === 0) return "sm:grid-cols-2 lg:grid-cols-4";
    if (factCount % 3 === 0) return "sm:grid-cols-3";
    return "sm:grid-cols-3";
}
