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
    showFurnishing: boolean;
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
 * When category/type is unset, residential-ish dims stay available for discovery.
 */
export function ownerListingsFilterVisibility(input: {
    category: OwnerListingCategory | "";
    propertyType: OwnerListingPropertyType | string | "";
}): OwnerListingsFilterVisibility {
    const category = input.category;
    const subtype = input.propertyType;
    const isPlot =
        category === "land" ||
        category === "agricultural" ||
        (Boolean(subtype) && PLOT_SUBTYPES.has(subtype));

    const showBhk = !isPlot && (category === "" || category === "residential");
    const showFurnishing = !isPlot;
    const showReadyToMove = !isPlot;

    return { isPlot, showBhk, showFurnishing, showReadyToMove };
}

/**
 * Clear filter keys that cannot apply to the current category / property type.
 * Also drops a subtype that does not belong to the selected category.
 */
export function stripHiddenOwnerListingsFilters(
    filters: OwnerListingsFilters,
): OwnerListingsFilters {
    const next: OwnerListingsFilters = { ...filters };
    const visibility = ownerListingsFilterVisibility(next);

    if (next.category && next.propertyType) {
        const allowed = new Set(subtypesForCategory(next.category));
        // Keep legacy coarse chips that map into this category.
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
    if (!visibility.showFurnishing) next.furnishing = "";
    if (!visibility.showReadyToMove) next.readyToMove = false;

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

    // Browse API historically used short commercial/land keys.
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
