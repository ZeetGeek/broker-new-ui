import {
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_TYPES,
    type PropertyCategory,
    type PropertyType,
} from "@/constants/property";
import { DEFAULT_PROPERTY_DRAFT } from "@/lib/schemas/property";
import { derive } from "@/lib/visibility/derive";
import { FIELD_RULES } from "@/lib/visibility/rules";

import type {
    OwnerListingCategory,
    OwnerListingPropertyType,
    OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";

const LEGACY_COARSE_TYPES = new Set<string>([
    "apartment",
    "villa",
    "penthouse",
    "shop",
    "office",
    "plot",
]);

const ALL_FORM_SUBTYPES = new Set<string>(
    Object.values(PROPERTY_TYPES).flatMap((types) => [...types]),
);

export type OwnerListingsFilterVisibility = {
    isPlot: boolean;
    showBhk: boolean;
    showBathrooms: boolean;
    showBalconies: boolean;
    showParking: boolean;
    showFloors: boolean;
    showFacing: boolean;
    showFurnishing: boolean;
    showPropertyCondition: boolean;
    showPropertyAge: boolean;
    showSuitableFor: boolean;
    /** @deprecated use showPropertyCondition — kept for quick-chip Ready to move */
    showReadyToMove: boolean;
};

export function isOwnerListingCategory(value: string): value is OwnerListingCategory {
    return PROPERTY_CATEGORY_OPTIONS.some((option) => option.value === value);
}

/** True when a subtype string is valid for browse filters (form + legacy coarse). */
export function isOwnerListingSubtype(value: string): boolean {
    return ALL_FORM_SUBTYPES.has(value) || LEGACY_COARSE_TYPES.has(value);
}

export function categoryForSubtype(subtype: string): OwnerListingCategory | "" {
    if (!subtype) return "";
    if (subtype === "plot" || subtype === "agricultural") return "land";
    if (subtype === "office") return "commercial";
    for (const option of PROPERTY_CATEGORY_OPTIONS) {
        const types = PROPERTY_TYPES[option.value] as readonly string[];
        if (types.includes(subtype)) return option.value;
    }
    return "";
}

export function subtypesForCategory(category: OwnerListingCategory | ""): string[] {
    if (!category) return [];
    return [...PROPERTY_TYPES[category as PropertyCategory]];
}

/**
 * Browse filter visibility — mirrors Add Property `FIELD_RULES` for the dims we expose.
 * When category/type is unset, discovery dims stay available where the form would allow them.
 */
export function ownerListingsFilterVisibility(input: {
    category: OwnerListingCategory | "";
    propertyType: OwnerListingPropertyType | string | "";
    propertyConditions?: string[];
}): OwnerListingsFilterVisibility {
    const aliases: Record<string, string> = {
        office: "office_space",
        plot: "residential_plot",
        agricultural: "agricultural_land",
        one_rk: "1rk",
    };
    const requestedSubtype = aliases[input.propertyType] ?? input.propertyType;
    const category =
        input.category || categoryForSubtype(requestedSubtype) || ("residential" as const);
    const allowedTypes = PROPERTY_TYPES[category as PropertyCategory] as readonly string[];
    const propertyType = allowedTypes.includes(requestedSubtype)
        ? requestedSubtype
        : (allowedTypes[0] ?? DEFAULT_PROPERTY_DRAFT.basics.propertyType);
    const propertyCondition =
        (input.propertyConditions ?? []).find((value) =>
            ["ready_to_move", "under_construction", "new_launch"].includes(value),
        ) ?? "";
    const values = {
        ...DEFAULT_PROPERTY_DRAFT,
        basics: {
            ...DEFAULT_PROPERTY_DRAFT.basics,
            category,
            propertyType,
        },
        details: {
            ...DEFAULT_PROPERTY_DRAFT.details,
            propertyCondition,
        },
    };
    const flags = derive(values);
    const isVisible = (path: keyof typeof FIELD_RULES) => {
        const rule = FIELD_RULES[path] as {
            visible?: (derived: typeof flags, draft: typeof values) => boolean;
        };
        return rule.visible?.(flags, values) ?? true;
    };

    const isPlot = flags.isPlot;
    const showBhk = isVisible("details.bedrooms");
    const showBathrooms = isVisible("details.bathrooms");
    const showBalconies = isVisible("details.balconies");
    const showParking = isVisible("details.coveredParking");
    const showFloors = isVisible("details.floorNumber");
    const showFacing = isVisible("details.facing");
    const showFurnishing = isVisible("furnishing.status");
    const showPropertyCondition = isVisible("details.propertyCondition");
    const showPropertyAge = isVisible("details.propertyAge");
    const showSuitableFor = isVisible("details.commercial.suitableFor");
    const showReadyToMove = showPropertyCondition;

    return {
        isPlot,
        showBhk,
        showBathrooms,
        showBalconies,
        showParking,
        showFloors,
        showFacing,
        showFurnishing,
        showPropertyCondition,
        showPropertyAge,
        showSuitableFor,
        showReadyToMove,
    };
}

/**
 * Clear filter keys that cannot apply to the current category / property type.
 * Also drops a subtype that does not belong to the selected category.
 */
export function stripHiddenOwnerListingsFilters(
    filters: OwnerListingsFilters,
): OwnerListingsFilters {
    const next: OwnerListingsFilters = { ...filters };
    const visibility = ownerListingsFilterVisibility({
        category: next.category,
        propertyType: next.propertyType,
        propertyConditions: next.propertyConditions,
    });

    if (next.category && next.propertyType) {
        const allowed = new Set(subtypesForCategory(next.category));
        if (next.category === "residential") {
            allowed.add("apartment");
            allowed.add("villa");
            allowed.add("penthouse");
        }
        if (next.category === "commercial") {
            allowed.add("shop");
            allowed.add("office");
        }
        if (next.category === "land" || next.category === "agricultural") {
            allowed.add("plot");
            allowed.add("agricultural");
        }
        if (!allowed.has(next.propertyType)) {
            next.propertyType = "";
        }
    }

    if (!visibility.showBhk) next.bhk = [];
    if (!visibility.showBathrooms) next.bathrooms = [];
    if (!visibility.showBalconies) next.balconies = [];
    if (!visibility.showParking) next.parking = [];
    if (!visibility.showFloors) next.floors = [];
    if (!visibility.showFurnishing) next.furnishing = "";
    if (!visibility.showPropertyCondition) {
        next.propertyConditions = [];
        next.readyToMove = false;
    }
    if (!visibility.showPropertyAge) next.propertyAges = [];
    if (!visibility.showSuitableFor) next.suitableFor = [];

    // Keep readyToMove in sync with Property condition when that chip is used.
    if (next.propertyConditions.includes("ready_to_move")) {
        next.readyToMove = true;
    }

    return next;
}

export function browseApiTypeFilters(
    category: OwnerListingCategory | "",
    subtype: string,
): {
    propertyType?: string;
    subtype?: string;
} {
    const resolvedCategory = category || categoryForSubtype(subtype) || undefined;
    let apiSubtype = subtype || undefined;

    if (apiSubtype === "office") apiSubtype = "office_space";
    if (apiSubtype === "plot") apiSubtype = undefined;
    if (apiSubtype === "1rk") apiSubtype = "one_rk";
    if (apiSubtype === "farm_house") apiSubtype = "farmhouse";

    return {
        ...(resolvedCategory ? { propertyType: resolvedCategory } : {}),
        ...(apiSubtype ? { subtype: apiSubtype } : {}),
    };
}

export type { PropertyType };
