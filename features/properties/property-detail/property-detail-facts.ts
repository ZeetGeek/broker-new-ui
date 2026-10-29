import { formatAreaSqft } from "@/lib/format/area";
import { formatDateIn } from "@/lib/format/date";
import { formatPrice } from "@/lib/format/price";
import { normalizePropertySubtype } from "@/lib/properties/list-criteria";
import { DEFAULT_PROPERTY_DRAFT, type PropertyDraftValues } from "@/lib/schemas/property";
import { PROPERTY_FACING_OPTIONS, PROPERTY_PARKING_OPTIONS } from "@/lib/validation/property";
import { derive } from "@/lib/visibility/derive";
import { FIELD_RULES, type FieldRule } from "@/lib/visibility/rules";

import {
    PROPERTY_AGE_OPTIONS,
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_CONDITION_OPTIONS,
} from "@/constants/property";
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

/**
 * `availableFrom` is a plain calendar date (`yyyy-mm-dd`), not an instant, so
 * it is parsed as local wall-clock rather than through `parseApiInstant`.
 */
function availableFromLabel(availableFrom: string | null): string | null {
    if (!availableFrom) return null;

    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(availableFrom.trim());
    if (!match) return null;

    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== Number(year) ||
        date.getMonth() !== Number(month) - 1 ||
        date.getDate() !== Number(day)
    )
        return null;

    return formatDateIn(date);
}

function floorLabel(item: MyListingItem): string | null {
    if (item.floorNumber == null) return null;
    const floor = item.floorNumber === 0 ? "Ground" : `${item.floorNumber}`;
    if (item.totalFloors == null) return floor;
    return `${floor} of ${item.totalFloors}`;
}

/**
 * The spec table under the gallery. Only facts the owner actually filled in
 * appear — an empty row reads as missing data, not as a neutral blank.
 */
export function buildPropertyFacts(item: MyListingItem): PropertyFact[] {
    const facts: PropertyFact[] = [];
    const visible = (path: keyof typeof FIELD_RULES) => propertyDetailFieldVisible(item, path);

    if (visible("details.bedrooms") && item.bhk > 0) {
        facts.push({ key: "bhk", label: "Configuration", value: item.configLabel });
    }
    if (visible("details.bathrooms") && item.bathrooms != null && item.bathrooms > 0) {
        facts.push({
            key: "bathrooms",
            label: "Bathrooms",
            value: String(item.bathrooms),
        });
    }
    if (visible("details.balconies") && item.balconies != null && item.balconies >= 0) {
        facts.push({
            key: "balconies",
            label: "Balconies",
            value: item.balconies === 0 ? "None" : String(item.balconies),
        });
    }

    const category = PROPERTY_CATEGORY_OPTIONS.find(
        (option) => option.value === item.category,
    )?.label;
    if (category && item.categoryProvided !== false)
        facts.push({ key: "category", label: "Category", value: category });

    if (item.areaSqft > 0)
        facts.push({ key: "area", label: "Area", value: formatAreaSqft(item.areaSqft) });
    if (item.carpetAreaSqft != null && item.carpetAreaSqft > 0)
        facts.push({
            key: "carpetArea",
            label: "Carpet area",
            value: formatAreaSqft(item.carpetAreaSqft),
        });
    facts.push({ key: "type", label: "Property type", value: item.propertyTypeLabel });
    if (visible("furnishing.status") && item.furnishingLabel.trim())
        facts.push({ key: "furnishing", label: "Furnishing", value: item.furnishingLabel.trim() });

    const floor = floorLabel(item);
    if (visible("details.floorNumber") && floor)
        facts.push({ key: "floor", label: "Floor", value: floor });
    if (
        !visible("details.floorNumber") &&
        visible("details.totalFloors") &&
        item.totalFloors != null &&
        item.totalFloors > 0
    )
        facts.push({
            key: "totalFloors",
            label: "Floors in the property",
            value: String(item.totalFloors),
        });

    const facing = facingLabel(item.facing);
    if (facing) facts.push({ key: "facing", label: "Facing", value: facing });

    if (
        visible("details.propertyAge") &&
        item.propertyAge != null &&
        String(item.propertyAge).trim() !== ""
    ) {
        const numericAge = Number(item.propertyAge);
        const ageOption = PROPERTY_AGE_OPTIONS.find(
            (option) => option.value === String(item.propertyAge),
        )?.label;
        facts.push({
            key: "propertyAge",
            label: "Property age",
            value:
                Number.isFinite(numericAge) && numericAge >= 0
                    ? numericAge === 0
                        ? "New property"
                        : `${numericAge} ${numericAge === 1 ? "year" : "years"} old`
                    : (ageOption ?? String(item.propertyAge).replaceAll("_", " ")),
        });
    }

    if (visible("details.propertyCondition") && item.propertyCondition) {
        const condition =
            PROPERTY_CONDITION_OPTIONS.find((option) => option.value === item.propertyCondition)
                ?.label ?? item.propertyCondition.replaceAll("_", " ");
        facts.push({ key: "condition", label: "Property condition", value: condition });
    }

    const parking =
        item.parkingSpaces === null
            ? null
            : item.parkingSpaces != null
              ? item.parkingSpaces === 0
                  ? "None"
                  : String(item.parkingSpaces)
              : parkingLabel(item.parking);
    if (visible("details.coveredParking") && parking)
        facts.push({ key: "parking", label: "Parking", value: parking });

    if (
        (visible("sale.maintenanceCharge") || visible("rent.maintenanceAmount")) &&
        item.maintenanceInr != null &&
        item.maintenanceInr > 0
    ) {
        facts.push({
            key: "maintenance",
            label: "Maintenance",
            value: `${formatPrice(item.maintenanceInr)}/mo`,
        });
    }

    const availableFrom = availableFromLabel(item.availableFrom);
    if (visible("rent.availableFrom") && availableFrom) {
        facts.push({ key: "available", label: "Available from", value: availableFrom });
    }

    if (
        visible("rent.securityDeposit") &&
        item.securityDeposit != null &&
        item.securityDeposit > 0
    ) {
        facts.push({
            key: "securityDeposit",
            label: "Security deposit",
            value:
                item.securityDepositMode === "months_of_rent"
                    ? `${item.securityDeposit} ${item.securityDeposit === 1 ? "month" : "months"} of rent`
                    : formatPrice(item.securityDeposit),
        });
    }

    for (const [key, path, label, value] of [
        ["cabins", "details.commercial.cabins", "Cabins", item.cabins],
        ["meetingRooms", "details.commercial.meetingRooms", "Meeting rooms", item.meetingRooms],
        ["workstations", "details.commercial.workstations", "Workstations", item.workstations],
        [
            "ceilingHeight",
            "details.commercial.ceilingHeightFt",
            "Ceiling height",
            item.ceilingHeightFt,
        ],
    ] as const) {
        if (visible(path) && value != null && value > 0)
            facts.push({
                key,
                label,
                value: key === "ceilingHeight" ? `${value} ft` : String(value),
            });
    }

    return facts;
}

/** Headline facts follow exactly the same form visibility and missing-data rules. */
export function buildPropertyHeadlineFacts(item: MyListingItem): PropertyFact[] {
    const keys = new Set(["bhk", "area", "furnishing"]);
    return buildPropertyFacts(item).filter(
        (fact) => keys.has(fact.key) && fact.value.trim() && fact.value !== "—",
    );
}

/** Reuse form rules so stale fields never turn into impossible property facts. */
export function propertyDetailFieldVisible(item: MyListingItem, path: keyof typeof FIELD_RULES) {
    const propertyType = normalizePropertySubtype(item.subtype || item.propertyType);
    const values: PropertyDraftValues = {
        ...DEFAULT_PROPERTY_DRAFT,
        basics: {
            ...DEFAULT_PROPERTY_DRAFT.basics,
            category: item.category,
            propertyType,
            listingFor: item.transactionType === "sale" ? "sell" : item.transactionType,
        },
        details: {
            ...DEFAULT_PROPERTY_DRAFT.details,
            propertyAge:
                item.propertyAge != null && Number.isFinite(Number(item.propertyAge))
                    ? Number(item.propertyAge)
                    : null,
            propertyCondition: item.propertyCondition ?? "",
        },
    };
    const rule = FIELD_RULES[path] as FieldRule;
    return rule.visible?.(derive(values), values) ?? true;
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
