import { z } from "zod";

import { labelOf, missingRequiredFields } from "@/lib/visibility/rules";

import {
    FORM_STEPS,
    PAYMENT_MILESTONE_TEMPLATE,
    PROPERTY_TYPES,
    type PropertyFormStep,
} from "@/constants/property";

const optionalText = z.string().max(3000).optional().default("");
const optionalNumber = z.number().finite().nonnegative().nullable();
const stringArray = z.array(z.string());
const todayIso = () => new Date().toISOString().slice(0, 10);
const isPastDate = (value: string) =>
    Boolean(value && (value.length === 7 ? value < todayIso().slice(0, 7) : value < todayIso()));

const basicsSchema = z
    .object({
        listingFor: z.enum(["sell", "rent", "lease", "pg"]),
        category: z.enum(["residential", "commercial", "land", "industrial", "agricultural"]),
        propertyType: z.string().min(1, "Choose a property type"),
        propertySubType: optionalText,
        transactionType: z.enum(["new_booking", "resale"]),
        title: z
            .string()
            .trim()
            .min(1, "Enter a title")
            .max(120, "Keep the title under 120 characters"),
        description: z.string().trim().max(3000, "Keep the description under 3,000 characters"),
    })
    .superRefine((value, context) => {
        if (!PROPERTY_TYPES[value.category].includes(value.propertyType as never)) {
            context.addIssue({
                code: "custom",
                path: ["propertyType"],
                message: "Choose a type from this category",
            });
        }
        if (value.description.length > 0 && value.description.length < 50) {
            context.addIssue({
                code: "custom",
                path: ["description"],
                message: "Write at least 50 characters, or leave this blank",
            });
        }
    });

const locationSchema = z
    .object({
        country: z.string().min(1),
        state: z.string().min(1, "Choose a state"),
        city: z.string().min(1, "Choose a city"),
        locality: z.string().trim().min(1, "Enter the locality"),
        subLocality: optionalText,
        projectOrSociety: optionalText,
        towerOrBlock: optionalText,
        unitNumber: optionalText,
        streetOrRoad: optionalText,
        pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6 digit pincode"),
        fullAddress: optionalText,
        landmark: z.string().trim().min(1, "Add a nearby landmark"),
        nearbyPlaces: stringArray,
        lat: z.number().finite().min(-90).max(90).nullable(),
        lng: z.number().finite().min(-180).max(180).nullable(),
        mapPinPlaced: z.boolean(),
        mapZoomHint: z.number().min(1).max(22),
    });
// Map pin section is commented out in the form; this check would block submit forever.
// .superRefine((value, context) => {
//     if (!value.mapPinPlaced || value.lat == null || value.lng == null) {
//         context.addIssue({
//             code: "custom",
//             path: ["mapPinPlaced"],
//             message: "Drop a pin on the map",
//         });
//     }
// });

const commercialDetailsSchema = z.object({
    cabins: optionalNumber,
    meetingRooms: optionalNumber,
    workstations: optionalNumber,
    seats: optionalNumber,
    washroomType: optionalText,
    pantryType: optionalText,
    centralAc: z.boolean(),
    fireNoc: z.boolean(),
    occupancyCertificate: z.boolean(),
    ceilingHeightFt: optionalNumber,
    shutterWidthFt: optionalNumber,
    frontageFt: optionalNumber,
    currentlyLeased: z.boolean(),
    existingTenantName: optionalText,
    existingLeaseEndDate: optionalText,
    suitableFor: stringArray,
});

const landDetailsSchema = z.object({
    plotLengthFt: optionalNumber,
    plotWidthFt: optionalNumber,
    openSides: optionalText,
    boundaryWall: z.boolean(),
    gatedSociety: z.boolean(),
    constructionAllowedFloors: optionalNumber,
    naOrderAvailable: z.boolean(),
    zoningType: optionalText,
    approvedBy: stringArray,
    soilType: optionalText,
    waterAvailability: optionalText,
});

const detailsSchema = z
    .object({
        bedrooms: z.string(),
        bathrooms: optionalNumber,
        balconies: optionalNumber,
        floorNumber: optionalText,
        totalFloors: optionalNumber,
        facing: optionalText,
        roadWidthFt: optionalNumber,
        propertyAge: optionalText,
        propertyCondition: optionalText,
        coveredParking: optionalNumber,
        openParking: optionalNumber,
        electricityLoadKva: optionalNumber,
        commercial: commercialDetailsSchema,
        land: landDetailsSchema,
    })
    .superRefine((value, context) => {
        const numericFloor = Number(value.floorNumber);
        if (
            Number.isFinite(numericFloor) &&
            value.totalFloors != null &&
            numericFloor > value.totalFloors
        ) {
            context.addIssue({
                code: "custom",
                path: ["floorNumber"],
                message: "Floor number cannot be more than total floors",
            });
        }
    });

const areaSchema = z
    .object({
        unit: z.string().min(1),
        carpetArea: optionalNumber,
        builtUpArea: optionalNumber,
        superBuiltUpArea: optionalNumber,
        plotArea: optionalNumber,
        areaSqft: z.number().finite().nonnegative(),
        loadingPercent: optionalNumber,
    })
    .superRefine((value, context) => {
        if (
            value.carpetArea != null &&
            value.builtUpArea != null &&
            value.carpetArea > value.builtUpArea
        ) {
            context.addIssue({
                code: "custom",
                path: ["carpetArea"],
                message: "Carpet area cannot be more than built-up area",
            });
        }
        if (
            value.builtUpArea != null &&
            value.superBuiltUpArea != null &&
            value.builtUpArea > value.superBuiltUpArea
        ) {
            context.addIssue({
                code: "custom",
                path: ["builtUpArea"],
                message: "Built-up area cannot be more than super built-up area",
            });
        }
    });

const chargeSchema = z.object({
    id: z.string(),
    label: z.string(),
    amount: optionalNumber,
    paidBy: z.enum(["owner", "buyer"]),
});

const saleSchema = z
    .object({
        expectedPrice: z
            .number()
            .finite()
            .positive("Enter a valid price")
            .max(100_000_000_000, "Enter a valid price")
            .nullable(),
        pricePerSqft: optionalNumber,
        priceNegotiable: z.boolean(),
        allInclusivePrice: z.boolean(),
        ownerMinimumPrice: optionalNumber,
        tokenAmount: optionalNumber,
        maintenanceCharge: optionalNumber,
        maintenanceFrequency: z.string(),
        stampDutyIncluded: z.boolean(),
        registrationIncluded: z.boolean(),
        gstOnProperty: z.boolean(),
        gstOnPropertyPercent: optionalNumber,
        parkingCharge: optionalNumber,
        clubMembershipCharge: optionalNumber,
        plcCharge: optionalNumber,
        floorRiseCharge: optionalNumber,
        corpusFund: optionalNumber,
        legalCharge: optionalNumber,
        otherCharges: z.array(chargeSchema),
        priceOnRequest: z.boolean(),
        loanAvailable: z.boolean(),
        approvedBanks: stringArray,
        existingLoanOnProperty: z.boolean(),
        existingLoanBank: optionalText,
        existingLoanOutstanding: optionalNumber,
    })
    .superRefine((value, context) => {
        if (
            value.expectedPrice != null &&
            value.ownerMinimumPrice != null &&
            value.ownerMinimumPrice > value.expectedPrice
        ) {
            context.addIssue({
                code: "custom",
                path: ["ownerMinimumPrice"],
                message: "Minimum price cannot be more than the asking price",
            });
        }
    });

const rentSchema = z
    .object({
        monthlyRent: optionalNumber,
        rentNegotiable: z.boolean(),
        securityDepositMode: z.enum(["amount", "months_of_rent"]),
        securityDeposit: optionalNumber,
        maintenanceMode: z.enum(["included_in_rent", "extra"]),
        maintenanceAmount: optionalNumber,
        maintenanceFrequency: z.string(),
        electricityBilling: optionalText,
        waterCharges: optionalText,
        lockInMonths: optionalNumber,
        noticePeriodMonths: optionalNumber,
        agreementDurationMonths: optionalNumber,
        rentEscalationPercent: optionalNumber,
        availableFrom: optionalText,
        preferredTenant: stringArray,
        nonVegAllowed: z.boolean(),
        petsAllowed: z.boolean(),
        smokingAllowed: z.boolean(),
        partyAllowed: z.boolean(),
        ownerMinimumRent: optionalNumber,
        currentStatus: optionalText,
        tenantVacatingOn: optionalText,
        pg: z.object({
            bedType: optionalText,
            foodIncluded: z.boolean(),
            genderAllowed: optionalText,
            gateClosingTime: optionalText,
            laundry: z.boolean(),
            housekeepingFrequency: optionalText,
            perBedRent: optionalNumber,
        }),
    })
    .superRefine((value, context) => {
        if (
            value.securityDepositMode === "months_of_rent" &&
            value.securityDeposit != null &&
            value.securityDeposit > 24
        ) {
            context.addIssue({
                code: "custom",
                path: ["securityDeposit"],
                message: "Deposit months must be between 0 and 24",
            });
        }
        if (isPastDate(value.availableFrom ?? "")) {
            context.addIssue({
                code: "custom",
                path: ["availableFrom"],
                message: "Pick today or a future date",
            });
        }
    });

const pricingStepSchema = z
    .object({
        basics: z.object({ listingFor: z.enum(["sell", "rent", "lease", "pg"]) }),
        sale: saleSchema,
        rent: rentSchema,
    })
    .superRefine((value, context) => {
        if (
            value.rent.lockInMonths != null &&
            value.rent.agreementDurationMonths != null &&
            value.rent.lockInMonths > value.rent.agreementDurationMonths
        ) {
            context.addIssue({
                code: "custom",
                path: ["rent", "lockInMonths"],
                message: "Lock-in cannot be longer than the agreement",
            });
        }
    });

const paymentMilestoneSchema = z.object({
    id: z.string(),
    stage: z.string(),
    percent: z.number().min(0).max(100),
});

const commissionSchema = z.object({
    sale: z.object({
        mode: z.enum(["percent", "flat", "per_sqft"]),
        value: z.number().min(0).max(1_000_000_000),
        paidBy: z.enum(["owner", "buyer", "both"]),
        ownerSharePercent: z.number().min(0).max(100),
        separateRates: z.boolean(),
        ownerPercent: optionalNumber,
        buyerPercent: optionalNumber,
        negotiable: z.boolean(),
        minAcceptable: optionalNumber,
        paymentMilestones: z.array(paymentMilestoneSchema),
    }),
    rent: z.object({
        mode: z.enum([
            "months",
            "percent_annual",
            "percent_monthly",
            "flat",
            "percent_lease_value",
        ]),
        value: z.number().min(0).max(1_000_000_000),
        paidBy: z.enum(["owner", "tenant", "both"]),
        ownerSharePercent: z.number().min(0).max(100),
        renewalFeeApplicable: z.boolean(),
        renewalFeeValue: optionalNumber,
    }),
    tax: z.object({
        gstApplicable: z.boolean(),
        gstMode: z.enum(["exclusive", "inclusive"]),
        tdsApplicable: z.boolean(),
        tdsRate: z.number().min(0).max(20),
    }),
    notes: optionalText,
});

const dealSchema = z.object({
    assignedAgentId: optionalText,
    coBrokerId: optionalText,
    coBrokerSharePercent: z.number().min(0).max(100).nullable(),
    mandateType: optionalText,
    mandateStartDate: optionalText,
    mandateEndDate: optionalText,
    mandateDocumentName: optionalText,
    priority: optionalText,
    expectedClosureDate: optionalText,
    internalNotes: optionalText,
    verificationStatus: z.string(),
    siteVisitedOn: optionalText,
});

const commissionStepSchema = z
    .object({
        basics: z.object({ listingFor: z.enum(["sell", "rent", "lease", "pg"]) }),
        area: z.object({ areaSqft: z.number() }),
        commission: commissionSchema,
        deal: dealSchema,
    })
    .superRefine((value, context) => {
        const total = value.commission.sale.paymentMilestones.reduce(
            (sum, item) => sum + item.percent,
            0,
        );
        if (value.basics.listingFor === "sell" && Math.abs(total - 100) > 0.01) {
            context.addIssue({
                code: "custom",
                path: ["commission", "sale", "paymentMilestones"],
                message: "Milestones must add up to 100%",
            });
        }
        if (value.basics.listingFor === "sell") {
            const sale = value.commission.sale;
            if (sale.mode === "per_sqft" && value.area.areaSqft <= 0) {
                context.addIssue({
                    code: "custom",
                    path: ["commission", "sale", "mode"],
                    message: "Fill the area first",
                });
            }
            if (
                sale.mode === "percent" &&
                ((sale.value > 0 && sale.value < 0.1) || sale.value > 10)
            ) {
                context.addIssue({
                    code: "custom",
                    path: ["commission", "sale", "value"],
                    message: "Commission looks too high. Please check.",
                });
            }
            if (sale.separateRates && (sale.ownerPercent ?? 0) > 10) {
                context.addIssue({
                    code: "custom",
                    path: ["commission", "sale", "ownerPercent"],
                    message: "Owner rate must be 10% or less",
                });
            }
            if (sale.separateRates && (sale.buyerPercent ?? 0) > 10) {
                context.addIssue({
                    code: "custom",
                    path: ["commission", "sale", "buyerPercent"],
                    message: "Buyer rate must be 10% or less",
                });
            }
            if (sale.value === 0 && !value.commission.notes.trim()) {
                context.addIssue({
                    code: "custom",
                    path: ["commission", "notes"],
                    message: "Add a note explaining who pays the broker",
                });
            }
        } else {
            const rent = value.commission.rent;
            const percentageMode = rent.mode.startsWith("percent_");
            if (rent.mode === "months" && rent.value > 24) {
                context.addIssue({
                    code: "custom",
                    path: ["commission", "rent", "value"],
                    message: "Brokerage months must be between 0 and 24",
                });
            }
            if (percentageMode && rent.value > 100) {
                context.addIssue({
                    code: "custom",
                    path: ["commission", "rent", "value"],
                    message: "Brokerage percentage must be 100% or less",
                });
            }
        }
    });

const furnishingSchema = z.object({
    status: z.enum(["", "unfurnished", "semi_furnished", "fully_furnished"]),
    items: z.record(z.string(), z.number().int().min(0)),
    negotiable: z.boolean(),
    furnitureRentExtra: optionalNumber,
    kitchenType: optionalText,
});

const amenitiesSchema = z.object({
    society: stringArray,
    recreation: stringArray,
    convenience: stringArray,
    flatFeatures: stringArray,
    commercial: stringArray,
    land: stringArray,
});

const highlightsSchema = z.object({
    chips: z.array(z.string().max(40)).max(8),
    whyBuyThis: optionalText,
    uniqueSellingPoint: z.string().max(120),
});

const constructionSchema = z
    .object({
        possessionType: optionalText,
        possessionDate: optionalText,
        stage: optionalText,
        slabsDone: optionalNumber,
        totalSlabs: optionalNumber,
        progressPercent: z.number().min(0).max(100),
        builderName: optionalText,
        projectName: optionalText,
        reraId: optionalText,
        reraPossessionDate: optionalText,
        builderPromisedDate: optionalText,
        paymentPlan: optionalText,
        paymentSchedule: z.array(
            z.object({
                id: z.string(),
                milestone: z.string(),
                percent: z.number(),
                dueOn: z.string(),
            }),
        ),
        ocCcExpectedDate: optionalText,
        bookingOpen: z.boolean(),
    })
    .superRefine((value, context) => {
        if (isPastDate(value.possessionDate ?? "")) {
            context.addIssue({
                code: "custom",
                path: ["possessionDate"],
                message: "Pick today or a future date",
            });
        }
        if (
            value.reraId &&
            !/^(?:(?:PR|AA|CA)\/GJ\/[A-Z0-9 .&/-]{8,}|GJ[-/][A-Z0-9/-]{6,})$/i.test(
                value.reraId.trim(),
            )
        ) {
            context.addIssue({
                code: "custom",
                path: ["reraId"],
                message: "RERA ID does not look correct",
            });
        }
    });

const availabilitySchema = z.object({
    visitDays: stringArray,
    visitTimeSlots: z.array(z.object({ id: z.string(), from: z.string(), to: z.string() })),
    advanceNoticeHours: optionalNumber,
    keyHeldBy: optionalText,
    caretakerName: optionalText,
    caretakerPhone: optionalText,
    showingContactPerson: optionalText,
});

const photoSchema = z.object({
    id: z.string(),
    url: z.string(),
    name: z.string(),
    tag: z.string(),
    isCover: z.boolean(),
    order: z.number(),
    alt: z.string(),
    status: z.enum(["processing", "queued", "ready", "uploading", "error"]),
    errorMessage: z.string().optional(),
});

const mediaSchema = z.object({
    photos: z.array(photoSchema).max(30),
    videoUploadName: optionalText,
    videoUrl: optionalText,
    virtualTourUrl: optionalText,
    floorPlanFiles: z.array(z.string()),
    brochureFileName: optionalText,
    agencyWatermark: z.boolean(),
    autoBlurSensitiveDetails: z.boolean(),
});

const documentSchema = z.object({
    id: z.string(),
    type: z.string(),
    fileName: z.string(),
    uploadedOn: z.string(),
    verified: z.boolean(),
    verifiedBy: z.string(),
    expiryDate: z.string(),
    notes: z.string(),
});

const ownerSchema = z.object({
    listerType: z.string(),
    name: z.string().trim().min(1, "Enter the owner's name"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid mobile number"),
    phoneVerified: z.boolean(),
    whatsappSameAsPhone: z.boolean(),
    whatsappNumber: z.string(),
    altPhone: z.string(),
    email: z.string().email("Enter a valid email").or(z.literal("")),
    preferredContactTime: z.string(),
    preferredLanguage: stringArray,
    city: z.string(),
    isNri: z.boolean(),
    notes: z.string(),
});

const publishSchema = z.object({
    status: z.string(),
    visibility: z.enum(["public", "my_clients_only", "private"]),
    contactDisplay: z.enum(["show_owner_number", "route_through_broker"]),
    featured: z.boolean(),
    expiryDate: z.string(),
    autoRenew: z.boolean(),
    internalTags: stringArray,
    listingScore: z.number().min(0).max(100),
});

export const stepSchemas = {
    basics: z.object({ basics: basicsSchema }),
    location: z.object({ location: locationSchema }),
    details: z.object({ details: detailsSchema }),
    area: z.object({ area: areaSchema }),
    pricing: pricingStepSchema,
    commission: commissionStepSchema,
    furnishing: z.object({ furnishing: furnishingSchema, amenities: amenitiesSchema }),
    highlights: z.object({
        highlights: highlightsSchema,
        construction: constructionSchema,
        availability: availabilitySchema,
    }),
    media: z.object({ media: mediaSchema, documents: z.array(documentSchema) }),
    publish: z
        .object({ owner: ownerSchema, publish: publishSchema, media: mediaSchema })
        .superRefine((value, context) => {
            if (
                value.publish.status === "active" &&
                value.media.photos.filter((photo) => photo.status !== "error").length < 3
            ) {
                context.addIssue({
                    code: "custom",
                    path: ["media", "photos"],
                    message: "Add at least 3 photos to publish",
                });
            }
        }),
} satisfies Record<PropertyFormStep, z.ZodType>;

function makeFieldRuleSchema(step: PropertyFormStep) {
    return z
        .custom<PropertyDraftValues>((value) => Boolean(value && typeof value === "object"))
        .superRefine((values, context) => {
            for (const missing of missingRequiredFields(values, step)) {
                context.addIssue({
                    code: "custom",
                    path: missing.path.split("."),
                    message: `Enter ${labelOf(missing.path, values).toLowerCase()}`,
                });
            }
        });
}

export const fieldRuleSchemas = Object.fromEntries(
    FORM_STEPS.map((step) => [step.id, makeFieldRuleSchema(step.id)]),
) as unknown as Record<PropertyFormStep, z.ZodType<PropertyDraftValues>>;

export const propertyDraftSchema = z.object({
    basics: basicsSchema,
    location: locationSchema,
    details: detailsSchema,
    area: areaSchema,
    sale: saleSchema,
    rent: rentSchema,
    commission: commissionSchema,
    deal: dealSchema,
    furnishing: furnishingSchema,
    amenities: amenitiesSchema,
    highlights: highlightsSchema,
    construction: constructionSchema,
    availability: availabilitySchema,
    media: mediaSchema,
    documents: z.array(documentSchema),
    owner: ownerSchema,
    publish: publishSchema,
});

export type PropertyDraftValues = z.infer<typeof propertyDraftSchema>;

export type Property = PropertyDraftValues & {
    id: string;
    brokerId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    activity: {
        views: number;
        shortlists: number;
        enquiries: number;
        siteVisits: number;
        lastActivityAt?: string;
    };
};

export const STEP_ROOT_FIELDS: Record<PropertyFormStep, (keyof PropertyDraftValues)[]> = {
    basics: ["basics"],
    location: ["location"],
    details: ["details"],
    area: ["area"],
    pricing: ["sale", "rent"],
    commission: ["commission", "deal"],
    furnishing: ["furnishing", "amenities"],
    highlights: ["highlights", "construction", "availability"],
    media: ["media", "documents"],
    publish: ["owner", "publish"],
};

const ninetyDaysFromNow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString().slice(0, 10);
};

export const DEFAULT_PROPERTY_DRAFT: PropertyDraftValues = {
    basics: {
        listingFor: "sell",
        category: "residential",
        propertyType: "apartment",
        propertySubType: "",
        transactionType: "resale",
        title: "",
        description: "",
    },
    location: {
        country: "India",
        state: "Gujarat",
        city: "Surat",
        locality: "",
        subLocality: "",
        projectOrSociety: "",
        towerOrBlock: "",
        unitNumber: "",
        streetOrRoad: "",
        pincode: "",
        fullAddress: "",
        landmark: "",
        nearbyPlaces: [],
        lat: null,
        lng: null,
        mapPinPlaced: false,
        mapZoomHint: 13,
    },
    details: {
        bedrooms: "",
        bathrooms: null,
        balconies: null,
        floorNumber: "",
        totalFloors: null,
        facing: "",
        roadWidthFt: null,
        propertyAge: "",
        propertyCondition: "",
        coveredParking: null,
        openParking: null,
        electricityLoadKva: null,
        commercial: {
            cabins: null,
            meetingRooms: null,
            workstations: null,
            seats: null,
            washroomType: "",
            pantryType: "",
            centralAc: false,
            fireNoc: false,
            occupancyCertificate: false,
            ceilingHeightFt: null,
            shutterWidthFt: null,
            frontageFt: null,
            currentlyLeased: false,
            existingTenantName: "",
            existingLeaseEndDate: "",
            suitableFor: [],
        },
        land: {
            plotLengthFt: null,
            plotWidthFt: null,
            openSides: "",
            boundaryWall: false,
            gatedSociety: false,
            constructionAllowedFloors: null,
            naOrderAvailable: false,
            zoningType: "",
            approvedBy: [],
            soilType: "",
            waterAvailability: "",
        },
    },
    area: {
        unit: "sqft",
        carpetArea: null,
        builtUpArea: null,
        superBuiltUpArea: null,
        plotArea: null,
        areaSqft: 0,
        loadingPercent: null,
    },
    sale: {
        expectedPrice: null,
        pricePerSqft: null,
        priceNegotiable: true,
        allInclusivePrice: false,
        ownerMinimumPrice: null,
        tokenAmount: null,
        maintenanceCharge: null,
        maintenanceFrequency: "monthly",
        stampDutyIncluded: false,
        registrationIncluded: false,
        gstOnProperty: false,
        gstOnPropertyPercent: null,
        parkingCharge: null,
        clubMembershipCharge: null,
        plcCharge: null,
        floorRiseCharge: null,
        corpusFund: null,
        legalCharge: null,
        otherCharges: [],
        priceOnRequest: false,
        loanAvailable: false,
        approvedBanks: [],
        existingLoanOnProperty: false,
        existingLoanBank: "",
        existingLoanOutstanding: null,
    },
    rent: {
        monthlyRent: null,
        rentNegotiable: true,
        securityDepositMode: "months_of_rent",
        securityDeposit: null,
        maintenanceMode: "included_in_rent",
        maintenanceAmount: null,
        maintenanceFrequency: "monthly",
        electricityBilling: "separate_meter",
        waterCharges: "included",
        lockInMonths: null,
        noticePeriodMonths: null,
        agreementDurationMonths: null,
        rentEscalationPercent: null,
        availableFrom: "",
        preferredTenant: [],
        nonVegAllowed: true,
        petsAllowed: false,
        smokingAllowed: false,
        partyAllowed: false,
        ownerMinimumRent: null,
        currentStatus: "vacant",
        tenantVacatingOn: "",
        pg: {
            bedType: "single",
            foodIncluded: false,
            genderAllowed: "any",
            gateClosingTime: "",
            laundry: false,
            housekeepingFrequency: "weekly",
            perBedRent: null,
        },
    },
    commission: {
        sale: {
            mode: "percent",
            value: 2,
            paidBy: "both",
            ownerSharePercent: 50,
            separateRates: false,
            ownerPercent: 1,
            buyerPercent: 1,
            negotiable: true,
            minAcceptable: null,
            paymentMilestones: PAYMENT_MILESTONE_TEMPLATE.map((item, index) => ({
                ...item,
                id: `milestone-${index}`,
            })),
        },
        rent: {
            mode: "months",
            value: 1,
            paidBy: "tenant",
            ownerSharePercent: 50,
            renewalFeeApplicable: false,
            renewalFeeValue: 0.5,
        },
        tax: { gstApplicable: true, gstMode: "exclusive", tdsApplicable: true, tdsRate: 2 },
        notes: "",
    },
    deal: {
        assignedAgentId: "me",
        coBrokerId: "",
        coBrokerSharePercent: null,
        mandateType: "open",
        mandateStartDate: "",
        mandateEndDate: "",
        mandateDocumentName: "",
        priority: "warm",
        expectedClosureDate: "",
        internalNotes: "",
        verificationStatus: "unverified",
        siteVisitedOn: "",
    },
    furnishing: {
        status: "",
        items: {},
        negotiable: false,
        furnitureRentExtra: null,
        kitchenType: "",
    },
    amenities: {
        society: [],
        recreation: [],
        convenience: [],
        flatFeatures: [],
        commercial: [],
        land: [],
    },
    highlights: { chips: [], whyBuyThis: "", uniqueSellingPoint: "" },
    construction: {
        possessionType: "",
        possessionDate: "",
        stage: "",
        slabsDone: null,
        totalSlabs: null,
        progressPercent: 0,
        builderName: "",
        projectName: "",
        reraId: "",
        reraPossessionDate: "",
        builderPromisedDate: "",
        paymentPlan: "",
        paymentSchedule: [],
        ocCcExpectedDate: "",
        bookingOpen: false,
    },
    availability: {
        visitDays: [],
        visitTimeSlots: [],
        advanceNoticeHours: null,
        keyHeldBy: "",
        caretakerName: "",
        caretakerPhone: "",
        showingContactPerson: "",
    },
    media: {
        photos: [],
        videoUploadName: "",
        videoUrl: "",
        virtualTourUrl: "",
        floorPlanFiles: [],
        brochureFileName: "",
        agencyWatermark: false,
        autoBlurSensitiveDetails: true,
    },
    documents: [],
    owner: {
        listerType: "owner",
        name: "",
        phone: "",
        phoneVerified: false,
        whatsappSameAsPhone: true,
        whatsappNumber: "",
        altPhone: "",
        email: "",
        preferredContactTime: "anytime",
        preferredLanguage: ["gujarati", "hindi"],
        city: "Surat",
        isNri: false,
        notes: "",
    },
    publish: {
        status: "draft",
        visibility: "public",
        contactDisplay: "route_through_broker",
        featured: false,
        expiryDate: ninetyDaysFromNow(),
        autoRenew: true,
        internalTags: [],
        listingScore: 0,
    },
};

export const PROPERTY_FORM_STEPS = FORM_STEPS;
