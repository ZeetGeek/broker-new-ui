import type { PropertyDraftValues } from "@/lib/schemas/property";
import { derive, type DerivedPropertyFlags } from "@/lib/visibility/derive";

import type { PropertyFormStep } from "@/constants/property";

export type FieldLevel = "required" | "recommended" | "optional";
export type FieldRule = {
    visible?: (derived: DerivedPropertyFlags, values: PropertyDraftValues) => boolean;
    level?: (derived: DerivedPropertyFlags, values: PropertyDraftValues) => FieldLevel;
    label?: (derived: DerivedPropertyFlags, values: PropertyDraftValues) => string;
    help?: string;
    minItems?: number;
    keepWhenHidden?: boolean;
    /** When set, overrides the default empty check for required-field validation. */
    isEmpty?: (values: PropertyDraftValues) => boolean;
};

type RuleMap = Record<string, FieldRule>;
const required = (): FieldLevel => "required";
const recommended = (): FieldLevel => "recommended";
const optional = (): FieldLevel => "optional";
const officeTypes = new Set(["office_space", "coworking_space", "business_center"]);

export const FIELD_RULES = {
    "basics.listingFor": { level: required },
    "basics.category": { level: required },
    "basics.propertyType": { level: required },
    "basics.propertySubType": { visible: () => false },
    // Transaction field hidden in the form; keep the rule but never surface it.
    "basics.transactionType": { visible: () => false, level: required },
    "basics.title": { level: required },
    "basics.description": { level: required },

    "location.country": { level: required },
    "location.state": { level: required },
    "location.city": { level: required },
    "location.locality": { level: required },
    // Sub-locality field hidden in the form.
    "location.subLocality": { visible: () => false },
    "location.projectOrSociety": {
        visible: (d, v) => !d.isPlot || v.details.land.gatedSociety,
        level: (d) => (d.isInBuilding ? "required" : "optional"),
    },
    // Tower or block field hidden in the form.
    "location.towerOrBlock": { visible: () => false },
    "location.unitNumber": {
        label: (d) => (d.isPlot ? "Plot / Survey no." : "Flat / Unit no."),
    },
    "location.streetOrRoad": {},
    "location.pincode": { level: required },
    "location.fullAddress": {},
    "location.landmark": { level: required },
    "location.nearbyPlaces": {
        visible: (d) => !d.isAgricultural,
        level: recommended,
    },
    // Map pin section hidden in the form.
    "location.mapPinPlaced": { visible: () => false, level: required, label: () => "Map pin" },
    "location.lat": { visible: () => false, level: optional },
    "location.lng": { visible: () => false, level: optional },
    "location.mapZoomHint": { visible: () => false },

    "details.bedrooms": {
        visible: (d) => d.isResidential && !d.isPlot,
        level: required,
        label: () => "BHK",
        isEmpty: (values) => {
            const raw = String(values.details.bedrooms ?? "").trim();
            return !raw || raw === "0";
        },
    },
    "details.bathrooms": {
        visible: (d) => !d.isPlot,
        level: (d) => (d.isResidential ? "required" : "optional"),
    },
    "details.balconies": { visible: (d) => d.isResidential && !d.isPlot },
    "details.floorNumber": { visible: (d) => d.isInBuilding, level: required },
    "details.totalFloors": {
        visible: (d) => !d.isPlot,
        level: (d) => (d.isInBuilding ? "required" : "optional"),
        label: (d) => (d.isIndependent ? "Floors in the house" : "Total floors in the building"),
    },
    "details.facing": { level: (d) => (d.isPlot ? "recommended" : "optional") },
    "details.roadWidthFt": {
        visible: () => false,
    },
    "details.propertyAge": {
        visible: (d) => !d.isPlot && !d.isUnderConstruction,
        level: required,
    },
    "details.propertyCondition": { visible: (d) => !d.isPlot, level: required },
    "details.coveredParking": {
        visible: (d) => !d.isPlot,
        label: () => "No. of parking",
    },
    "details.openParking": { visible: () => false },
    "details.electricityLoadKva": {
        visible: () => false,
    },

    "details.commercial.cabins": {
        visible: (d, v) =>
            (d.isCommercial || d.isIndustrial) && officeTypes.has(v.basics.propertyType),
    },
    "details.commercial.meetingRooms": {
        visible: (d, v) =>
            (d.isCommercial || d.isIndustrial) && officeTypes.has(v.basics.propertyType),
    },
    "details.commercial.workstations": {
        visible: (d, v) =>
            (d.isCommercial || d.isIndustrial) && officeTypes.has(v.basics.propertyType),
    },
    "details.commercial.seats": {
        visible: (_d, v) => v.basics.propertyType === "coworking_space",
        level: required,
    },
    "details.commercial.washroomType": { visible: () => false },
    "details.commercial.pantryType": { visible: () => false },
    "details.commercial.centralAc": { visible: () => false },
    "details.commercial.fireNoc": { visible: () => false },
    "details.commercial.occupancyCertificate": { visible: () => false },
    "details.commercial.ceilingHeightFt": {
        visible: (d) => d.isIndustrial,
        level: recommended,
    },
    "details.commercial.suitableFor": { visible: (d) => d.isCommercial, level: recommended },
    "details.commercial.currentlyLeased": { visible: () => false },
    "details.commercial.existingTenantName": { visible: () => false },
    "details.commercial.existingLeaseEndDate": { visible: () => false },

    "details.land.plotLengthFt": { visible: () => false },
    "details.land.plotWidthFt": { visible: () => false },
    "details.land.openSides": { visible: () => false },
    "details.land.boundaryWall": { visible: () => false },
    "details.land.gatedSociety": { visible: () => false },
    "details.land.constructionAllowedFloors": { visible: () => false },
    "details.land.zoningType": { visible: () => false },
    "details.land.naOrderAvailable": { visible: () => false },
    "details.land.approvedBy": { visible: () => false },
    "details.land.soilType": { visible: () => false },
    "details.land.waterAvailability": { visible: () => false },

    // Always sq ft, so the picker is hidden; the value still ships with the listing.
    "area.unit": { visible: () => false, keepWhenHidden: true, level: required },
    "area.carpetArea": {
        visible: () => true,
        level: required,
        label: () => "Carpet area",
    },
    "area.builtUpArea": { visible: () => false },
    "area.superBuiltUpArea": { visible: () => false },
    "area.plotArea": {
        visible: () => true,
        level: required,
        label: () => "Area",
    },
    "area.areaSqft": { visible: () => false, keepWhenHidden: true },
    "area.loadingPercent": { visible: () => false },

    "sale.expectedPrice": { visible: (d) => d.isSell, level: required },
    "sale.pricePerSqft": { visible: (d) => d.isSell && d.hasArea },
    "sale.maintenanceCharge": { visible: (d) => d.isSell && !d.isPlot },
    "sale.maintenanceFrequency": { visible: (d) => d.isSell && !d.isPlot },
    "sale.parkingCharge": { visible: () => false },
    "sale.plcCharge": { visible: (d) => d.isSell && d.isNewBooking },
    "sale.floorRiseCharge": { visible: (d) => d.isSell && d.isNewBooking && d.isInBuilding },
    "sale.otherCharges": { visible: () => false },

    "rent.monthlyRent": { visible: (d) => d.isRentLike && !d.isPg, level: required },
    "rent.rentNegotiable": { visible: () => false },
    "rent.securityDepositMode": { visible: (d) => d.isRentLike, level: required },
    "rent.securityDeposit": { visible: (d) => d.isRentLike, level: required },
    "rent.maintenanceMode": { visible: () => false, keepWhenHidden: true },
    // One UI field only — shown under rent when rent-only; under sale when selling
    // (including sell+rent). Values stay mirrored in the form.
    "rent.maintenanceAmount": {
        visible: (d) => d.isRentLike && !d.isSell && !d.isPlot,
        keepWhenHidden: true,
    },
    "rent.maintenanceFrequency": { visible: () => false },
    "rent.electricityBilling": { visible: () => false },
    "rent.waterCharges": { visible: () => false },
    "rent.lockInMonths": { visible: () => false },
    "rent.noticePeriodMonths": { visible: () => false },
    "rent.agreementDurationMonths": { visible: () => false },
    "rent.rentEscalationPercent": { visible: () => false },
    "rent.availableFrom": { visible: (d) => d.isRentLike, level: required },
    "rent.preferredTenant": { visible: () => false },
    "rent.nonVegAllowed": { visible: () => false },
    "rent.petsAllowed": { visible: () => false },
    "rent.smokingAllowed": { visible: () => false },
    "rent.partyAllowed": { visible: () => false },
    "rent.ownerMinimumRent": { visible: () => false },
    "rent.currentStatus": { visible: () => false, keepWhenHidden: true },
    "rent.tenantVacatingOn": { visible: () => false },
    "rent.pg.bedType": { visible: (d) => d.isPg, level: required },
    "rent.pg.genderAllowed": { visible: (d) => d.isPg, level: required },
    "rent.pg.foodIncluded": { visible: (d) => d.isPg, level: required },
    "rent.pg.perBedRent": { visible: (d) => d.isPg, level: required },
    "rent.pg.gateClosingTime": { visible: (d) => d.isPg },
    "rent.pg.housekeepingFrequency": { visible: (d) => d.isPg },
    "rent.pg.laundry": { visible: (d) => d.isPg },

    // Always percentage; the picker is gone but the value still ships.
    "commission.sale.mode": {
        visible: () => false,
        keepWhenHidden: true,
        level: required,
        label: () => "Sale commission mode",
    },
    "commission.sale.value": { visible: (d) => d.isSell, level: required },
    // The owner always pays the full brokerage; both fields ship as fixed values.
    "commission.sale.paidBy": { visible: () => false, keepWhenHidden: true, level: required },
    "commission.sale.ownerSharePercent": {
        visible: () => false,
        keepWhenHidden: true,
        level: required,
    },
    // Always flat INR; the picker is gone but the value still ships.
    "commission.rent.mode": {
        visible: () => false,
        keepWhenHidden: true,
        level: required,
        label: () => "Rent brokerage mode",
    },
    "commission.rent.value": { visible: (d) => d.isRentLike, level: required },
    "commission.rent.paidBy": { visible: () => false, keepWhenHidden: true, level: required },
    "commission.rent.ownerSharePercent": {
        visible: () => false,
        keepWhenHidden: true,
        level: required,
    },
    "furnishing.status": { visible: (d) => !d.isPlot, level: required },
    "furnishing.items": { visible: () => false },
    "furnishing.negotiable": { visible: () => false },
    "furnishing.furnitureRentExtra": { visible: () => false },
    "amenities.society": { visible: (d) => d.isInBuilding, level: recommended },
    "amenities.recreation": { visible: (d) => d.isInBuilding && d.isResidential },
    "amenities.convenience": { visible: (d) => d.isInBuilding },
    "amenities.flatFeatures": { visible: (d) => d.isResidential && !d.isPlot, level: recommended },
    "amenities.commercial": {
        visible: (d) => !d.isPlot && (d.isCommercial || d.isIndustrial),
        level: recommended,
    },
    "amenities.land": { visible: () => false },

    // Highlights UI temporarily commented out in step-highlights.tsx
    // "highlights.chips": { level: recommended, label: () => "Highlights" },
    "highlights.chips": { visible: () => false, level: recommended, label: () => "Highlights" },
    "construction.possessionType": { visible: () => false },
    "construction.possessionDate": { visible: () => false },
    "construction.builderName": { visible: () => false },
    "construction.projectName": { visible: () => false },
    "construction.paymentPlan": { visible: () => false },
    "construction.paymentSchedule": { visible: () => false },
    "construction.bookingOpen": { visible: () => false },
    "media.cover": {
        level: required,
        label: () => "Cover image",
        keepWhenHidden: true,
        isEmpty: (values) =>
            !values.media.photos.some((photo) => photo.isCover && photo.status !== "error"),
    },
    "media.photos": {
        level: required,
        minItems: 3,
        label: () => "Property photos",
        isEmpty: (values) =>
            values.media.photos.filter((photo) => !photo.isCover && photo.status !== "error")
                .length < 3,
    },
    "media.videoUploadName": { visible: () => false },
    "media.videoUrl": {},
    "media.virtualTourUrl": { visible: (d) => !d.isPlot },
    "media.floorPlanFiles": { visible: () => false },
    "media.brochureFileName": { visible: () => false },
    "media.agencyWatermark": { visible: () => false },
    "media.autoBlurSensitiveDetails": { visible: () => false },
    // Private documents UI temporarily commented out in step-media.tsx
    // documents: {},
    documents: { visible: () => false },

    "owner.contactId": { level: optional, label: () => "Owner" },
    "owner.listerType": { visible: () => false },
    "owner.name": { visible: () => false, level: optional, label: () => "Owner" },
    "owner.phone": { visible: () => false },
    "owner.whatsappSameAsPhone": { visible: () => false },
    "owner.whatsappNumber": { visible: () => false },
    "owner.altPhone": { visible: () => false },
    "owner.email": { visible: () => false },
    "owner.preferredContactTime": { visible: () => false },
    "owner.preferredLanguage": { visible: () => false },
    "owner.city": { visible: () => false },
    "owner.isNri": { visible: () => false },
    "owner.notes": { visible: () => false },
    attachedBuyers: {},
    "publish.status": { visible: () => false, keepWhenHidden: true },
    "publish.visibility": { visible: () => false },
    "publish.contactDisplay": { visible: () => false },
    "publish.featured": { visible: () => false },
    "publish.expiryDate": { visible: () => false },
    "publish.autoRenew": { visible: () => false },
    "publish.internalTags": { visible: () => false },
} satisfies RuleMap;

export const STEP_RULES: Record<PropertyFormStep, (d: DerivedPropertyFlags) => boolean> = {
    basics: () => true,
    details: () => true,
    pricing: () => true,
    furnishing: () => true,
    media: () => true,
};

export const STEP_FIELD_PATHS: Record<PropertyFormStep, readonly string[]> = {
    basics: Object.keys(FIELD_RULES).filter(
        (path) =>
            (path.startsWith("basics.") || path.startsWith("location.")) &&
            path !== "basics.title" &&
            path !== "basics.description",
    ),
    details: Object.keys(FIELD_RULES).filter(
        (path) =>
            path.startsWith("details.") ||
            path.startsWith("area.") ||
            path === "basics.title" ||
            path === "basics.description",
    ),
    pricing: Object.keys(FIELD_RULES).filter(
        (path) =>
            path.startsWith("sale.") ||
            path.startsWith("rent.") ||
            path.startsWith("commission.") ||
            path.startsWith("deal."),
    ),
    furnishing: Object.keys(FIELD_RULES).filter(
        (path) =>
            path.startsWith("furnishing.") ||
            path.startsWith("amenities.") ||
            path.startsWith("highlights.") ||
            path.startsWith("construction."),
    ),
    media: Object.keys(FIELD_RULES).filter(
        (path) =>
            path.startsWith("media.") ||
            path === "documents" ||
            path.startsWith("owner.") ||
            path.startsWith("publish.") ||
            path === "attachedBuyers",
    ),
};

export const RULE_DRIVER_PATHS = [
    "basics.listingFor",
    "basics.category",
    "basics.propertyType",
    "basics.transactionType",
    "details.propertyCondition",
    "details.coveredParking",
    "details.land.gatedSociety",
    "area.areaSqft",
    "area.carpetArea",
    "area.plotArea",
    "commission.sale.paidBy",
    "commission.rent.paidBy",
    "furnishing.status",
    "owner.whatsappSameAsPhone",
    "owner.isNri",
] as const;

export const RESET_MAP = {
    "basics.category": [
        "basics.propertyType",
        "basics.propertySubType",
        "details.commercial",
        "details.land",
    ],
    "basics.propertyType": ["details.commercial", "details.land"],
    "area.unit": [],
} as const;

export function ruleFor(path: string): FieldRule | undefined {
    const normalised = path.replace(/\.\d+(?=\.|$)/g, ".*");
    const rules = FIELD_RULES as RuleMap;
    const exactRule = rules[normalised];
    if (exactRule) return exactRule;
    let candidate = normalised;
    while (candidate) {
        const rule = rules[candidate];
        if (rule) return { visible: rule.visible };
        const separator = candidate.lastIndexOf(".");
        if (separator < 0) break;
        candidate = candidate.slice(0, separator);
    }
    return undefined;
}

export function isVisible(path: string, values: PropertyDraftValues): boolean {
    const rule = ruleFor(path);
    return rule?.visible?.(derive(values), values) ?? true;
}

export function levelOf(path: string, values: PropertyDraftValues): FieldLevel {
    return ruleFor(path)?.level?.(derive(values), values) ?? "optional";
}

export function labelOf(path: string, values: PropertyDraftValues, fallback?: string): string {
    const leaf = path.split(".").at(-1) ?? path;
    const humanLeaf = leaf
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .replace(/^\w/, (character) => character.toUpperCase());
    return ruleFor(path)?.label?.(derive(values), values) ?? fallback ?? humanLeaf;
}

export function isStepVisible(step: PropertyFormStep, values: PropertyDraftValues): boolean {
    return STEP_RULES[step](derive(values));
}

export function valueAtPath(values: PropertyDraftValues, path: string): unknown {
    return path.split(".").reduce<unknown>((current, segment) => {
        if (current == null || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[segment];
    }, values);
}

export function isEmptyFieldValue(value: unknown, rule?: FieldRule): boolean {
    if (value == null || value === "") return true;
    if (typeof value === "number") return !Number.isFinite(value) || value <= 0;
    if (Array.isArray(value)) return value.length < (rule?.minItems ?? 1);
    if (typeof value === "object") {
        const populated = Object.values(value as Record<string, unknown>).filter((item) =>
            typeof item === "number" ? item > 0 : Boolean(item),
        );
        return populated.length < (rule?.minItems ?? 1);
    }
    return false;
}

export type MissingRequiredField = { path: string; label: string; step: PropertyFormStep };

export function missingRequiredFields(
    values: PropertyDraftValues,
    onlyStep?: PropertyFormStep,
): MissingRequiredField[] {
    const steps = onlyStep ? [onlyStep] : (Object.keys(STEP_FIELD_PATHS) as PropertyFormStep[]);
    return steps.flatMap((step) => {
        if (!isStepVisible(step, values)) return [];
        return STEP_FIELD_PATHS[step].flatMap((path) => {
            const rule = ruleFor(path);
            if (!isVisible(path, values) || levelOf(path, values) !== "required") return [];
            const empty = rule?.isEmpty
                ? rule.isEmpty(values)
                : isEmptyFieldValue(valueAtPath(values, path), rule);
            if (!empty) return [];
            return [{ path, label: labelOf(path, values), step }];
        });
    });
}

function deleteAtPath(target: Record<string, unknown>, path: string) {
    const segments = path.split(".");
    const leaf = segments.pop();
    const parent = segments.reduce<unknown>((current, segment) => {
        if (!current || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[segment];
    }, target);
    if (leaf && parent && typeof parent === "object")
        delete (parent as Record<string, unknown>)[leaf];
}

export function stripHidden(values: PropertyDraftValues): PropertyDraftValues {
    const stripped = structuredClone(values) as unknown as Record<string, unknown>;
    for (const path of Object.keys(FIELD_RULES as RuleMap)) {
        const rule = (FIELD_RULES as RuleMap)[path];
        if (!path.includes("*") && !rule?.keepWhenHidden && !isVisible(path, values))
            deleteAtPath(stripped, path);
    }
    return stripped as unknown as PropertyDraftValues;
}
