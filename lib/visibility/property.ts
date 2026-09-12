import type { PropertyDraftValues } from "@/lib/schemas/property";

export type PropertyVisibilityRule = (values: PropertyDraftValues) => boolean;

const isRent = (values: PropertyDraftValues) => values.basics.listingFor !== "sell";
const isLand = (values: PropertyDraftValues) =>
    values.basics.category === "land" || values.basics.category === "agricultural";

export const PROPERTY_VISIBLE_WHEN = {
    salePricing: (values) => values.basics.listingFor === "sell",
    rentPricing: isRent,
    residentialDetails: (values) => values.basics.category === "residential",
    commercialDetails: (values) => values.basics.category === "commercial",
    landDetails: isLand,
    floorDetails: (values) =>
        ![
            "residential_plot",
            "commercial_plot",
            "industrial_plot",
            "agricultural_land",
            "farm_land",
            "na_plot",
            "independent_house",
        ].includes(values.basics.propertyType),
    furnishingItems: (values) =>
        values.furnishing.status === "semi_furnished" ||
        values.furnishing.status === "fully_furnished",
    construction: (values) =>
        ["under_construction", "new_launch"].includes(values.details.propertyCondition),
    rera: (values) =>
        values.basics.transactionType === "new_booking" ||
        values.details.propertyCondition === "under_construction",
    tenantVacating: (values) => values.rent.currentStatus === "tenant_occupied",
    caretaker: (values) => values.availability.keyHeldBy === "caretaker",
    saleSplit: (values) => values.commission.sale.paidBy === "both",
    rentSplit: (values) => values.commission.rent.paidBy === "both",
    renewal: (values) => isRent(values) && values.commission.rent.renewalFeeApplicable,
    existingLease: (values) => values.details.commercial.currentlyLeased,
    rentTerm: (values) =>
        values.basics.listingFor === "rent" || values.basics.listingFor === "lease",
    pg: (values) => values.basics.listingFor === "pg",
    propertyGst: (values) => values.basics.transactionType === "new_booking",
} satisfies Record<string, PropertyVisibilityRule>;

export type FieldVisibility = "public" | "private";

export const PRIVATE_FIELD_PREFIXES = [
    "basics.listingSource",
    "basics.referredBy",
    "location.unitNumber",
    "location.fullAddress",
    "location.mapZoomHint",
    "sale.ownerMinimumPrice",
    "sale.existingLoan",
    "rent.ownerMinimumRent",
    "rent.tenantVacatingOn",
    "commission",
    "deal",
    "documents",
    "owner",
    "availability.caretaker",
] as const;

export function visibilityForField(path: string): FieldVisibility {
    return PRIVATE_FIELD_PREFIXES.some((prefix) => path.startsWith(prefix)) ? "private" : "public";
}
