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
};

type RuleMap = Record<string, FieldRule>;
const required = (): FieldLevel => "required";
const recommended = (): FieldLevel => "recommended";
const optional = (): FieldLevel => "optional";
const visible = () => true;
const officeTypes = new Set(["office_space", "coworking_space", "business_center"]);
const pantryTypes = new Set([
    "office_space",
    "retail_space",
    "restaurant_space",
    "business_center",
]);
const tallCommercialTypes = new Set([
    "warehouse",
    "godown",
    "factory",
    "industrial_shed",
    "showroom",
]);
const frontageTypes = new Set(["shop", "showroom", "retail_space", "restaurant_space"]);
const shopTypes = new Set(["shop", "showroom", "retail_space"]);
const subtypeTypes = new Set(["apartment", "office_space"]);
const verifiedSiteStatuses = new Set(["site_visited", "docs_verified", "fully_verified"]);

export const FIELD_RULES = {
    "basics.listingFor": { level: required },
    "basics.category": { level: required },
    "basics.propertyType": { level: required },
    "basics.propertySubType": {
        visible: (_d, v) => subtypeTypes.has(v.basics.propertyType),
    },
    "basics.transactionType": { visible: (d) => d.isSell, level: required },
    "basics.title": { level: required },
    "basics.description": { level: recommended },
    "basics.listingSource": {},
    "basics.referredBy": {
        visible: (_d, v) => v.basics.listingSource === "reference",
        level: required,
    },

    "location.country": { level: required },
    "location.state": { level: required },
    "location.city": { level: required },
    "location.locality": { level: required },
    "location.subLocality": {},
    "location.projectOrSociety": {
        visible: (d, v) => !d.isPlot || v.details.land.gatedSociety,
        level: (d) => (d.isInBuilding ? "required" : "optional"),
    },
    "location.towerOrBlock": { visible: (d) => d.isInBuilding },
    "location.unitNumber": {
        label: (d) => (d.isPlot ? "Plot / Survey no." : "Flat / Unit no."),
    },
    "location.streetOrRoad": {},
    "location.pincode": { level: required },
    "location.fullAddress": {},
    "location.addressVisibility": { level: required },
    "location.landmark": { level: required },
    "location.nearbyPlaces": {
        visible: (d) => !d.isAgricultural,
        level: recommended,
    },
    "location.mapPinPlaced": { level: required, label: () => "Map pin" },
    "location.lat": { visible, level: optional },
    "location.lng": { visible, level: optional },
    "location.mapZoomHint": {},

    "details.bedrooms": {
        visible: (d) => d.isResidential && !d.isPlot,
        level: required,
        label: () => "BHK",
    },
    "details.bathrooms": {
        visible: (d) => !d.isPlot,
        level: (d) => (d.isResidential ? "required" : "optional"),
    },
    "details.balconies": { visible: (d) => d.isResidential && !d.isPlot },
    "details.additionalRooms": { visible: (d) => d.isResidential && !d.isPlot },
    "details.floorNumber": { visible: (d) => d.isInBuilding, level: required },
    "details.totalFloors": {
        visible: (d) => !d.isPlot,
        level: (d) => (d.isInBuilding ? "required" : "optional"),
        label: (d) => (d.isIndependent ? "Floors in the house" : "Total floors in the building"),
    },
    "details.land.constructionAllowedFloors": {
        visible: (d) => d.isPlot && !d.isAgricultural,
    },
    "details.facing": { level: (d) => (d.isPlot ? "recommended" : "optional") },
    "details.overlooking": { visible: (d) => !d.isAgricultural },
    "details.cornerProperty": { label: (d) => (d.isPlot ? "Corner plot" : "Corner property") },
    "details.roadWidthFt": {
        visible: (d) => d.isPlot || d.isCommercial || d.isIndependent,
        level: (d) => (d.isPlot ? "required" : "optional"),
    },
    "details.propertyAge": {
        visible: (d) => !d.isPlot && !d.isUnderConstruction,
        level: required,
    },
    "details.constructionYear": { visible: (d) => !d.isPlot && !d.isUnderConstruction },
    "details.ownershipType": { level: required },
    "details.propertyCondition": { visible: (d) => !d.isPlot, level: required },
    "details.coveredParking": { visible: (d) => !d.isPlot },
    "details.openParking": { visible: (d) => !d.isPlot },
    "details.waterSource": { level: (d) => (d.isAgricultural ? "required" : "optional") },
    "details.powerBackup": { visible: (d) => d.isInBuilding },
    "details.electricityLoadKva": {
        visible: (d) => d.isCommercial || d.isIndustrial,
        level: (d) => (d.isIndustrial ? "recommended" : "optional"),
    },
    "details.vastuCompliant": { visible: (d) => d.isResidential || d.isPlot },
    "details.wheelchairFriendly": { visible: (d) => !d.isPlot },
    "details.flooringType": { visible: (d) => !d.isPlot && !d.isUnderConstruction },

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
    "details.commercial.washroomType": { visible: (d) => d.isCommercial },
    "details.commercial.pantryType": {
        visible: (d, v) => d.isCommercial && pantryTypes.has(v.basics.propertyType),
    },
    "details.commercial.centralAc": { visible: (d) => d.isCommercial },
    "details.commercial.fireNoc": {
        visible: (d) => d.isCommercial || d.isIndustrial,
        level: recommended,
    },
    "details.commercial.occupancyCertificate": { visible: (d) => d.isCommercial },
    "details.commercial.ceilingHeightFt": {
        visible: (d, v) =>
            (d.isCommercial || d.isIndustrial) && tallCommercialTypes.has(v.basics.propertyType),
        level: required,
    },
    "details.commercial.shutterWidthFt": {
        visible: (d, v) => d.isCommercial && shopTypes.has(v.basics.propertyType),
    },
    "details.commercial.frontageFt": {
        visible: (d, v) => d.isCommercial && frontageTypes.has(v.basics.propertyType),
        level: required,
    },
    "details.commercial.suitableFor": { visible: (d) => d.isCommercial, level: recommended },
    "details.commercial.currentlyLeased": { visible: (d) => d.isCommercial && d.isSell },
    "details.commercial.existingTenantName": {
        visible: (d, v) => d.isCommercial && v.details.commercial.currentlyLeased,
        level: required,
    },
    "details.commercial.existingLeaseEndDate": {
        visible: (d, v) => d.isCommercial && v.details.commercial.currentlyLeased,
        level: required,
    },

    "details.land.plotLengthFt": {
        visible: (d) => d.isPlot && !d.isAgricultural,
        level: required,
    },
    "details.land.plotWidthFt": {
        visible: (d) => d.isPlot && !d.isAgricultural,
        level: required,
    },
    "details.land.openSides": { visible: (d) => d.isPlot, level: required },
    "details.land.boundaryWall": { visible: (d) => d.isPlot },
    "details.land.gatedSociety": { visible: (d) => d.isPlot && !d.isAgricultural },
    "details.land.zoningType": { visible: (d) => d.isPlot, level: required },
    "details.land.naOrderAvailable": {
        visible: (d) => d.isLandCategory && !d.isAgricultural,
        level: recommended,
    },
    "details.land.approvedBy": { visible: (d) => d.isPlot, level: recommended },
    "details.land.soilType": { visible: (d) => d.isAgricultural, level: recommended },
    "details.land.waterAvailability": {
        visible: (d) => d.isAgricultural,
        level: required,
        label: () => "Irrigation / water source",
    },

    "area.unit": { level: required },
    "area.carpetArea": { visible: (d) => !d.isPlot, level: required },
    "area.builtUpArea": { visible: (d) => !d.isPlot },
    "area.superBuiltUpArea": { visible: (d) => d.isInBuilding, level: recommended },
    "area.plotArea": {
        visible: (d) => d.isPlot || d.isIndependent,
        level: (d) => (d.isPlot ? "required" : "optional"),
        label: (d) => (d.isPlot ? "Plot area" : "Land area"),
    },
    "area.areaSqft": { visible: () => false },
    "area.loadingPercent": {
        visible: (_d, v) => Boolean(v.area.carpetArea && v.area.superBuiltUpArea),
    },

    "sale.expectedPrice": { visible: (d) => d.isSell, level: required },
    "sale.pricePerSqft": { visible: (d) => d.isSell && d.hasArea },
    "sale.priceNegotiable": { visible: (d) => d.isSell },
    "sale.allInclusivePrice": { visible: (d) => d.isSell },
    "sale.ownerMinimumPrice": { visible: (d) => d.isSell, level: recommended },
    "sale.tokenAmount": { visible: (d) => d.isSell },
    "sale.maintenanceCharge": { visible: (d) => d.isSell && !d.isPlot },
    "sale.maintenanceFrequency": { visible: (d) => d.isSell && !d.isPlot },
    "sale.stampDutyIncluded": { visible: (d) => d.isSell },
    "sale.registrationIncluded": { visible: (d) => d.isSell },
    "sale.gstOnProperty": { visible: (d) => d.isNewBooking || d.isUnderConstruction },
    "sale.gstOnPropertyPercent": {
        visible: (d, v) => (d.isNewBooking || d.isUnderConstruction) && v.sale.gstOnProperty,
    },
    "sale.parkingCharge": {
        visible: (d, v) => d.isSell && !d.isPlot && (v.details.coveredParking ?? 0) > 0,
    },
    "sale.clubMembershipCharge": { visible: (d) => d.isSell && d.isInBuilding },
    "sale.plcCharge": { visible: (d) => d.isSell && d.isNewBooking },
    "sale.floorRiseCharge": { visible: (d) => d.isSell && d.isNewBooking && d.isInBuilding },
    "sale.corpusFund": { visible: (d) => d.isSell && d.isInBuilding },
    "sale.legalCharge": { visible: (d) => d.isSell },
    "sale.otherCharges": { visible: (d, v) => d.isSell && !v.sale.allInclusivePrice },
    "sale.priceOnRequest": { visible: (d) => d.isSell },
    "sale.loanAvailable": { visible: (d) => d.isSell },
    "sale.approvedBanks": { visible: (d, v) => d.isSell && v.sale.loanAvailable },
    "sale.existingLoanOnProperty": { visible: (d) => d.isSell },
    "sale.existingLoanBank": {
        visible: (d, v) => d.isSell && v.sale.existingLoanOnProperty,
        level: required,
    },
    "sale.existingLoanOutstanding": {
        visible: (d, v) => d.isSell && v.sale.existingLoanOnProperty,
        level: required,
    },

    "rent.monthlyRent": { visible: (d) => d.isRentLike && !d.isPg, level: required },
    "rent.rentNegotiable": { visible: (d) => d.isRentLike },
    "rent.securityDepositMode": { visible: (d) => d.isRentLike, level: required },
    "rent.securityDeposit": { visible: (d) => d.isRentLike, level: required },
    "rent.maintenanceMode": { visible: (d) => d.isRentLike && !d.isPlot, level: required },
    "rent.maintenanceAmount": {
        visible: (d, v) => d.isRentLike && !d.isPlot && v.rent.maintenanceMode === "extra",
        level: required,
    },
    "rent.maintenanceFrequency": {
        visible: (d, v) => d.isRentLike && !d.isPlot && v.rent.maintenanceMode === "extra",
        level: required,
    },
    "rent.electricityBilling": { visible: (d) => d.isRentLike },
    "rent.waterCharges": { visible: (d) => d.isRentLike },
    "rent.lockInMonths": {
        visible: (d) => d.isRent || d.isLease,
        level: (d) => (d.isLease ? "required" : "optional"),
    },
    "rent.noticePeriodMonths": { visible: (d) => d.isRent || d.isLease },
    "rent.agreementDurationMonths": {
        visible: (d) => d.isRent || d.isLease,
        level: required,
    },
    "rent.rentEscalationPercent": {
        visible: (d, v) => d.isLease || (v.rent.agreementDurationMonths ?? 0) > 12,
        level: recommended,
    },
    "rent.availableFrom": { visible: (d) => d.isRentLike, level: required },
    "rent.preferredTenant": { visible: (d) => d.isResidential && d.isRentLike, level: required },
    "rent.nonVegAllowed": { visible: (d) => d.isResidential && d.isRentLike },
    "rent.petsAllowed": { visible: (d) => d.isResidential && d.isRentLike },
    "rent.smokingAllowed": { visible: (d) => d.isResidential && d.isRentLike },
    "rent.partyAllowed": { visible: (d) => d.isResidential && d.isRent },
    "rent.ownerMinimumRent": { visible: (d) => d.isRentLike, level: recommended },
    "rent.currentStatus": { visible: (d) => d.isRentLike, level: required },
    "rent.tenantVacatingOn": { visible: (d) => d.isTenantOccupied, level: required },
    "rent.pg.bedType": { visible: (d) => d.isPg, level: required },
    "rent.pg.genderAllowed": { visible: (d) => d.isPg, level: required },
    "rent.pg.foodIncluded": { visible: (d) => d.isPg, level: required },
    "rent.pg.perBedRent": { visible: (d) => d.isPg, level: required },
    "rent.pg.gateClosingTime": { visible: (d) => d.isPg },
    "rent.pg.housekeepingFrequency": { visible: (d) => d.isPg },
    "rent.pg.laundry": { visible: (d) => d.isPg },

    "commission.sale.mode": { visible: (d) => d.isSell, level: required },
    "commission.sale.value": { visible: (d) => d.isSell, level: required },
    "commission.sale.paidBy": { visible: (d) => d.isSell, level: required },
    "commission.sale.separateRates": {
        visible: (d, v) => d.isSell && v.commission.sale.paidBy === "both",
    },
    "commission.sale.ownerSharePercent": {
        visible: (d, v) =>
            d.isSell && v.commission.sale.paidBy === "both" && !v.commission.sale.separateRates,
        level: required,
    },
    "commission.sale.ownerPercent": {
        visible: (d, v) =>
            d.isSell && v.commission.sale.paidBy === "both" && v.commission.sale.separateRates,
        level: required,
    },
    "commission.sale.buyerPercent": {
        visible: (d, v) =>
            d.isSell && v.commission.sale.paidBy === "both" && v.commission.sale.separateRates,
        level: required,
    },
    "commission.sale.negotiable": { visible: (d) => d.isSell },
    "commission.sale.minAcceptable": {
        visible: (d, v) => d.isSell && v.commission.sale.negotiable,
    },
    "commission.sale.paymentMilestones": { visible: (d) => d.isSell, level: required, minItems: 1 },
    "commission.rent.mode": { visible: (d) => d.isRentLike, level: required },
    "commission.rent.value": { visible: (d) => d.isRentLike, level: required },
    "commission.rent.paidBy": { visible: (d) => d.isRentLike, level: required },
    "commission.rent.ownerSharePercent": {
        visible: (d, v) => d.isRentLike && v.commission.rent.paidBy === "both",
        level: required,
    },
    "commission.rent.renewalFeeApplicable": { visible: (d) => d.isRent || d.isLease },
    "commission.rent.renewalFeeValue": {
        visible: (d, v) => (d.isRent || d.isLease) && v.commission.rent.renewalFeeApplicable,
        level: required,
    },
    "commission.tax.gstApplicable": {},
    "commission.tax.gstMode": {
        visible: (_d, v) => v.commission.tax.gstApplicable,
        level: required,
    },
    "commission.tax.tdsApplicable": {},
    "commission.tax.tdsRate": {
        visible: (_d, v) => v.commission.tax.tdsApplicable,
        level: required,
    },
    "commission.notes": {},
    "deal.assignedAgentId": { level: required },
    "deal.coBrokerId": {},
    "deal.coBrokerSharePercent": { visible: (d) => d.hasCoBroker, level: required },
    "deal.mandateType": { level: required },
    "deal.mandateStartDate": {
        visible: (_d, v) => ["exclusive", "co_exclusive"].includes(v.deal.mandateType),
        level: required,
    },
    "deal.mandateEndDate": {
        visible: (_d, v) => ["exclusive", "co_exclusive"].includes(v.deal.mandateType),
        level: required,
    },
    "deal.mandateDocumentName": {
        visible: (_d, v) => v.deal.mandateType === "exclusive",
        level: recommended,
    },
    "deal.priority": {},
    "deal.expectedClosureDate": {},
    "deal.internalNotes": {},
    "deal.verificationStatus": { level: required },
    "deal.siteVisitedOn": {
        visible: (_d, v) => verifiedSiteStatuses.has(v.deal.verificationStatus),
        level: required,
    },

    "furnishing.status": { visible: (d) => !d.isPlot, level: required },
    "furnishing.items": {
        visible: (d, v) =>
            !d.isPlot && v.furnishing.status !== "unfurnished" && Boolean(v.furnishing.status),
        level: required,
        minItems: 1,
    },
    "furnishing.negotiable": { visible: (d) => d.isFurnished },
    "furnishing.furnitureRentExtra": { visible: (d) => d.isFurnished && d.isRentLike },
    "furnishing.kitchenType": {
        visible: (d, v) =>
            (d.isResidential && !d.isPlot) || v.basics.propertyType === "restaurant_space",
    },
    "amenities.society": { visible: (d) => d.isInBuilding, level: recommended },
    "amenities.recreation": { visible: (d) => d.isInBuilding && d.isResidential },
    "amenities.convenience": { visible: (d) => d.isInBuilding },
    "amenities.flatFeatures": { visible: (d) => d.isResidential && !d.isPlot, level: recommended },
    "amenities.commercial": {
        visible: (d) => d.isCommercial || d.isIndustrial,
        level: recommended,
    },
    "amenities.land": { visible: (d) => d.isPlot },

    "highlights.chips": { level: recommended, label: () => "Highlights" },
    "highlights.whyBuyThis": {},
    "highlights.uniqueSellingPoint": {},
    "construction.possessionType": { visible: (d) => d.isUnderConstruction, level: required },
    "construction.possessionDate": {
        visible: (d, v) => d.isUnderConstruction && v.construction.possessionType === "custom_date",
        level: required,
    },
    "construction.stage": { visible: (d) => d.isUnderConstruction && !d.isPlot, level: required },
    "construction.slabsDone": {
        visible: (d, v) => d.isUnderConstruction && v.construction.stage === "slab_casting",
        level: required,
    },
    "construction.totalSlabs": {
        visible: (d, v) => d.isUnderConstruction && v.construction.stage === "slab_casting",
        level: required,
    },
    "construction.progressPercent": { visible: (d) => d.isUnderConstruction, level: recommended },
    "construction.builderName": { visible: (d) => d.isNewBooking, level: required },
    "construction.projectName": { visible: (d) => d.isNewBooking, level: required },
    "construction.reraId": {
        visible: (d) => d.isNewBooking || d.isUnderConstruction,
        level: required,
    },
    "construction.reraPossessionDate": {
        visible: (_d, v) => Boolean(v.construction.reraId.trim()),
        level: required,
    },
    "construction.builderPromisedDate": { visible: (d) => d.isUnderConstruction },
    "construction.paymentPlan": { visible: (d) => d.isNewBooking, level: recommended },
    "construction.paymentSchedule": {
        visible: (_d, v) => v.construction.paymentPlan === "clp",
        level: required,
        minItems: 1,
    },
    "construction.ocCcExpectedDate": { visible: (d) => d.isUnderConstruction },
    "construction.bookingOpen": { visible: (d) => d.isNewBooking },
    "availability.visitDays": { level: recommended },
    "availability.visitTimeSlots": {
        visible: (_d, v) => v.availability.visitDays.length > 0,
        level: required,
        minItems: 1,
    },
    "availability.advanceNoticeHours": { visible: (_d, v) => v.availability.visitDays.length > 0 },
    "availability.keyHeldBy": { visible: (d) => !d.isPlot, level: required },
    "availability.caretakerName": {
        visible: (_d, v) => v.availability.keyHeldBy === "caretaker",
        level: required,
    },
    "availability.caretakerPhone": {
        visible: (_d, v) => v.availability.keyHeldBy === "caretaker",
        level: required,
    },
    "availability.showingContactPerson": { visible: (d) => !d.isPlot },

    "media.photos": { level: required, minItems: 3, label: () => "Property photos" },
    "media.videoUploadName": {},
    "media.videoUrl": {},
    "media.virtualTourUrl": { visible: (d) => !d.isPlot },
    "media.floorPlanFiles": {
        level: recommended,
        label: (d) => (d.isPlot ? "Layout plan" : "Floor plan"),
    },
    "media.brochureFileName": { visible: (d) => d.isNewBooking, level: recommended },
    "media.agencyWatermark": {},
    "media.autoBlurSensitiveDetails": {},
    documents: {},

    "owner.listerType": { level: required },
    "owner.name": { level: required, label: () => "Owner name" },
    "owner.phone": { level: required, label: () => "Mobile number" },
    "owner.whatsappSameAsPhone": {},
    "owner.whatsappNumber": { visible: (_d, v) => !v.owner.whatsappSameAsPhone },
    "owner.altPhone": {},
    "owner.email": { level: (_d, v) => (v.owner.isNri ? "required" : "recommended") },
    "owner.preferredContactTime": {},
    "owner.preferredLanguage": {},
    "owner.city": { visible: (_d, v) => v.owner.isNri, level: required },
    "owner.isNri": {},
    "owner.notes": {},
    "publish.status": { level: required },
    "publish.visibility": { level: required },
    "publish.contactDisplay": { level: required },
    "publish.featured": {},
    "publish.expiryDate": {},
    "publish.autoRenew": {},
    "publish.internalTags": {},
} satisfies RuleMap;

export const STEP_RULES: Record<PropertyFormStep, (d: DerivedPropertyFlags) => boolean> = {
    basics: () => true,
    location: () => true,
    details: () => true,
    area: () => true,
    pricing: () => true,
    commission: () => true,
    furnishing: (d) => !d.isPlot,
    highlights: () => true,
    media: () => true,
    publish: () => true,
};

export const STEP_FIELD_PATHS: Record<PropertyFormStep, readonly string[]> = {
    basics: Object.keys(FIELD_RULES).filter((path) => path.startsWith("basics.")),
    location: Object.keys(FIELD_RULES).filter((path) => path.startsWith("location.")),
    details: Object.keys(FIELD_RULES).filter((path) => path.startsWith("details.")),
    area: Object.keys(FIELD_RULES).filter((path) => path.startsWith("area.")),
    pricing: Object.keys(FIELD_RULES).filter(
        (path) => path.startsWith("sale.") || path.startsWith("rent."),
    ),
    commission: Object.keys(FIELD_RULES).filter(
        (path) => path.startsWith("commission.") || path.startsWith("deal."),
    ),
    furnishing: Object.keys(FIELD_RULES).filter(
        (path) => path.startsWith("furnishing.") || path.startsWith("amenities."),
    ),
    highlights: Object.keys(FIELD_RULES).filter(
        (path) =>
            path.startsWith("highlights.") ||
            path.startsWith("construction.") ||
            path.startsWith("availability."),
    ),
    media: Object.keys(FIELD_RULES).filter(
        (path) => path.startsWith("media.") || path === "documents",
    ),
    publish: Object.keys(FIELD_RULES).filter(
        (path) => path.startsWith("owner.") || path.startsWith("publish."),
    ),
};

export const RULE_DRIVER_PATHS = [
    "basics.listingFor",
    "basics.category",
    "basics.propertyType",
    "basics.transactionType",
    "basics.listingSource",
    "details.propertyCondition",
    "details.coveredParking",
    "details.commercial.currentlyLeased",
    "details.land.gatedSociety",
    "area.areaSqft",
    "area.carpetArea",
    "area.superBuiltUpArea",
    "sale.allInclusivePrice",
    "sale.gstOnProperty",
    "sale.loanAvailable",
    "sale.existingLoanOnProperty",
    "rent.maintenanceMode",
    "rent.agreementDurationMonths",
    "rent.currentStatus",
    "commission.sale.paidBy",
    "commission.sale.separateRates",
    "commission.sale.negotiable",
    "commission.rent.paidBy",
    "commission.rent.renewalFeeApplicable",
    "commission.tax.gstApplicable",
    "commission.tax.tdsApplicable",
    "deal.coBrokerId",
    "deal.mandateType",
    "deal.verificationStatus",
    "furnishing.status",
    "construction.possessionType",
    "construction.stage",
    "construction.reraId",
    "construction.paymentPlan",
    "availability.visitDays",
    "availability.keyHeldBy",
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
    return (
        ruleFor(path)?.label?.(derive(values), values) ?? fallback ?? path.split(".").at(-1) ?? path
    );
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
            if (!isEmptyFieldValue(valueAtPath(values, path), rule)) return [];
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
        if (!path.includes("*") && !isVisible(path, values)) deleteAtPath(stripped, path);
    }
    return stripped as unknown as PropertyDraftValues;
}
