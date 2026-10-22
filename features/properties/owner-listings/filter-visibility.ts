import {
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_TYPES,
    type PropertyCategory,
    type PropertyType,
} from "@/constants/property";

import type {
    OwnerListingCategory,
    OwnerListingPropertyType,
    OwnerListingsFilters,
} from "@/features/properties/owner-listings/types";

/** Plot / land subtypes from the Add Property form (`lib/visibility/derive.ts`). */
const PLOT_SUBTYPES = new Set<string>([
    "residential_plot",
    "commercial_plot",
    "industrial_plot",
    "agricultural_land",
    "farm_land",
    "na_plot",
    "plot",
    "agricultural",
]);

/** Independent homes — floor number is not an in-building dim (`derive.ts`). */
const INDEPENDENT_SUBTYPES = new Set<string>([
    "independent_house",
    "villa",
    "row_house",
    "farm_house",
    "bungalow",
]);

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
    const category = input.category;
    const subtype = input.propertyType;
    const isPlot =
        category === "land" ||
        category === "agricultural" ||
        (Boolean(subtype) && PLOT_SUBTYPES.has(subtype));
    const isIndependent = Boolean(subtype) && INDEPENDENT_SUBTYPES.has(subtype);
    const isInBuilding = !isPlot && !isIndependent;
    const underConstructionSelected = (input.propertyConditions ?? []).some(
        (value) => value === "under_construction" || value === "new_launch",
    );

    const showBhk = !isPlot && (category === "" || category === "residential");
    const showBathrooms = !isPlot;
    const showBalconies = !isPlot && (category === "" || category === "residential");
    const showParking = !isPlot;
    const showFloors = isInBuilding && (category === "" || !isPlot);
    const showFacing = true;
    const showFurnishing = !isPlot;
    const showPropertyCondition = !isPlot;
    const showPropertyAge = !isPlot && !underConstructionSelected;
    const showSuitableFor = category === "" || category === "commercial";
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
