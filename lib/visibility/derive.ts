import type { PropertyDraftValues } from "@/lib/schemas/property";

const PLOT_TYPES = new Set([
    "residential_plot",
    "commercial_plot",
    "industrial_plot",
    "agricultural_land",
    "farm_land",
    "na_plot",
]);

const INDEPENDENT_TYPES = new Set([
    "independent_house",
    "villa",
    "row_house",
    "farm_house",
    "bungalow",
]);

export type DerivedPropertyFlags = ReturnType<typeof derive>;

export function derive(values: PropertyDraftValues) {
    const listingFor = values.basics.listingFor;
    const category = values.basics.category;
    const propertyType = values.basics.propertyType;
    const isPlot = PLOT_TYPES.has(propertyType);
    const isIndependent = INDEPENDENT_TYPES.has(propertyType);
    const isUnderConstruction = ["under_construction", "new_launch"].includes(
        values.details.propertyCondition,
    );
    const isBoth = listingFor === "both";

    return {
        isBoth,
        isSell: listingFor === "sell" || isBoth,
        isRentLike: listingFor !== "sell",
        isRent: listingFor === "rent" || isBoth,
        isLease: listingFor === "lease",
        isPg: listingFor === "pg",
        isResidential: category === "residential",
        isCommercial: category === "commercial",
        isIndustrial: category === "industrial",
        isAgricultural: category === "agricultural",
        isLandCategory: category === "land" || category === "agricultural",
        isPlot,
        isIndependent,
        isInBuilding: !isPlot && !isIndependent,
        isNewBooking: values.basics.transactionType === "new_booking",
        isResale: values.basics.transactionType === "resale",
        isUnderConstruction,
        isReadyToMove: values.details.propertyCondition === "ready_to_move",
        isFurnished:
            values.furnishing.status === "semi_furnished" ||
            values.furnishing.status === "fully_furnished",
        hasArea: values.area.areaSqft > 0,
        hasCoBroker: Boolean(values.deal.coBrokerId),
        isTenantOccupied: values.rent.currentStatus === "tenant_occupied",
    };
}
