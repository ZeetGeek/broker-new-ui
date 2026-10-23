import { z } from "zod";

import { formatDateIso } from "@/lib/format/date";
import { parseVideoEmbed } from "@/lib/media/embed-url";
import {
    MAX_DEPOSIT_MONTHS,
    MAX_PROPERTY_ADDRESS_LENGTH,
    MAX_PROPERTY_AGE_YEARS,
    MAX_PROPERTY_DESCRIPTION_LENGTH,
    MAX_PROPERTY_FLOORS,
    MIN_PROPERTY_DESCRIPTION_LENGTH,
} from "@/lib/properties/form-limits";
import { isUsablePropertyPhoto, MAX_PROPERTY_PHOTOS } from "@/lib/properties/form-media";
import { labelOf, missingRequiredFields } from "@/lib/visibility/rules";

import {
    BEDROOM_OPTIONS,
    FORM_STEPS,
    PAYMENT_MILESTONE_TEMPLATE,
    PROPERTY_TYPES,
    type PropertyFormStep,
} from "@/constants/property";

const optionalText = z.string().max(3000).optional().default("");
const optionalNumber = z.number().finite().nonnegative().nullable();
const optionalCount = z.number().finite().int("Enter a whole number").nonnegative().nullable();
const floorCount = z
    .number()
    .finite()
    .int("Enter a whole number of floors")
    .min(0)
    .max(MAX_PROPERTY_FLOORS, `Enter ${MAX_PROPERTY_FLOORS} floors or fewer`)
    .nullable();
const stringArray = z.array(z.string());
const todayIso = () => formatDateIso(new Date());
const isPastDate = (value: string) =>
    Boolean(value && (value.length === 7 ? value < todayIso().slice(0, 7) : value < todayIso()));

function isCalendarDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isWebUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return (
            (url.protocol === "http:" || url.protocol === "https:") &&
            Boolean(url.hostname) &&
            !url.username &&
            !url.password
        );
    } catch {
        return false;
    }
}

const videoUrlSchema = optionalText
    .transform((value) => value.trim())
    .refine(
        (value) => !value || (isWebUrl(value) && Boolean(parseVideoEmbed(value))),
        "Enter a full YouTube or Vimeo video link, or leave this blank",
    );
const tourUrlSchema = optionalText
    .transform((value) => value.trim())
    .refine(
        (value) => !value || isWebUrl(value),
        "Enter a full http:// or https:// tour link, or leave this blank",
    );

const listingCopySchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Enter a title")
        .max(120, "Keep the title under 120 characters"),
    description: z
        .string()
        .trim()
        .min(MIN_PROPERTY_DESCRIPTION_LENGTH, "Write at least 50 characters")
        .max(MAX_PROPERTY_DESCRIPTION_LENGTH, "Use 3,000 characters or fewer"),
});

/** Basics without title/description requirements — those belong on the Property step. */
const basicsStepSchema = z
    .object({
        listingFor: z.enum(["sell", "rent", "lease", "pg", "both"]),
        category: z.enum(["residential", "commercial", "land", "industrial", "agricultural"]),
        propertyType: z.string().min(1, "Choose a property type"),
        propertySubType: optionalText,
        transactionType: z.enum(["new_booking", "resale"]),
        title: z.string().trim().max(120, "Keep the title under 120 characters"),
        description: z
            .string()
            .trim()
            .max(MAX_PROPERTY_DESCRIPTION_LENGTH, "Use 3,000 characters or fewer"),
    })
    .superRefine((value, context) => {
        if (!PROPERTY_TYPES[value.category].includes(value.propertyType as never)) {
            context.addIssue({
                code: "custom",
                path: ["propertyType"],
                message: "Choose a type from this category",
            });
        }
    });

const basicsSchema = basicsStepSchema.superRefine((value, context) => {
    if (!value.title.trim()) {
        context.addIssue({
            code: "custom",
            path: ["title"],
            message: "Enter a title",
        });
    }
    if (
        value.description.length > 0 &&
        value.description.length < MIN_PROPERTY_DESCRIPTION_LENGTH
    ) {
        context.addIssue({
            code: "custom",
            path: ["description"],
            message: "Write at least 50 characters, or leave this blank",
        });
    }
});

const locationSchema = z.object({
    country: z.string().trim().min(1, "Choose a country"),
    state: z.string().trim().min(1, "Choose a state"),
    city: z.string().trim().min(1, "Choose a city"),
    locality: z.string().trim().min(1, "Enter the locality"),
    subLocality: optionalText,
    projectOrSociety: optionalText,
    towerOrBlock: optionalText,
    unitNumber: optionalText,
    streetOrRoad: optionalText,
    pincode: z.string().regex(/^[1-9]\d{5}$/, "Enter a valid 6 digit pincode"),
    fullAddress: z
        .string()
        .max(
            MAX_PROPERTY_ADDRESS_LENGTH,
            `Keep the full address to ${MAX_PROPERTY_ADDRESS_LENGTH} characters or fewer`,
        )
        .optional()
        .default(""),
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
    cabins: optionalCount,
    meetingRooms: optionalCount,
    workstations: optionalCount,
    seats: optionalCount,
    washroomType: optionalText,
    pantryType: optionalText,
    centralAc: z.boolean(),
    fireNoc: z.boolean(),
    occupancyCertificate: z.boolean(),
    ceilingHeightFt: optionalNumber,
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
        bedrooms: z
            .string()
            .refine(
                (value) => value === "" || BEDROOM_OPTIONS.some((option) => option.value === value),
                "Choose a valid BHK",
            ),
        bathrooms: z.number().int("Enter a whole number of bathrooms").min(0).max(10).nullable(),
        balconies: z.number().int("Enter a whole number of balconies").min(0).max(5).nullable(),
        floorNumber: floorCount,
        totalFloors: floorCount,
        facing: optionalText,
        roadWidthFt: optionalNumber,
        propertyAge: z
            .number()
            .finite()
            .int("Enter the age in whole years")
            .min(0)
            .max(MAX_PROPERTY_AGE_YEARS, `Enter ${MAX_PROPERTY_AGE_YEARS} years or fewer`)
            .nullable(),
        propertyCondition: optionalText,
        coveredParking: z
            .number()
            .int("Enter a whole number of parking spaces")
            .min(0)
            .max(10)
            .nullable(),
        openParking: optionalCount,
        electricityLoadKva: optionalNumber,
        commercial: commercialDetailsSchema,
        land: landDetailsSchema,
    })
    .superRefine((value, context) => {
        if (
            value.floorNumber != null &&
            value.totalFloors != null &&
            value.floorNumber > value.totalFloors
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
            value.plotArea != null &&
            value.carpetArea > value.plotArea
        ) {
            context.addIssue({
                code: "custom",
                path: ["carpetArea"],
                message: "Carpet area cannot be more than the total area",
            });
        }
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

const saleSchema = z.object({
    expectedPrice: z
        .number()
        .finite()
        .positive("Enter a valid price")
        .max(100_000_000_000, "Enter a valid price")
        .nullable(),
    pricePerSqft: optionalNumber,
    maintenanceCharge: optionalNumber,
    maintenanceFrequency: z.string(),
    parkingCharge: optionalNumber,
    plcCharge: optionalNumber,
    floorRiseCharge: optionalNumber,
    otherCharges: z.array(chargeSchema),
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
        // Hidden from the form; still accept legacy draft strings from the old select.
        agreementDurationMonths: z
            .union([z.number(), z.string(), z.null()])
            .optional()
            .transform((value) => {
                if (value == null || value === "") return null;
                const parsed = typeof value === "number" ? value : Number(value);
                return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
            }),
        rentEscalationPercent: optionalNumber,
        availableFrom: optionalText.refine(
            (value) => !value || isCalendarDate(value),
            "Choose a valid date",
        ),
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
            (!Number.isInteger(value.securityDeposit) || value.securityDeposit > MAX_DEPOSIT_MONTHS)
        ) {
            context.addIssue({
                code: "custom",
                path: ["securityDeposit"],
                message: `Deposit months must be a whole number between 0 and ${MAX_DEPOSIT_MONTHS}`,
            });
        }
        if (isCalendarDate(value.availableFrom ?? "") && isPastDate(value.availableFrom ?? "")) {
            context.addIssue({
                code: "custom",
                path: ["availableFrom"],
                message: "Pick today or a future date",
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
        // Picker removed — always percent; coerce legacy draft values.
        mode: z.preprocess(() => "percent" as const, z.literal("percent")),
        value: z.number().min(0).max(1_000_000_000).nullable(),
        paidBy: z.literal("owner"),
        ownerSharePercent: z.number().min(0).max(100),
        separateRates: z.boolean(),
        ownerPercent: optionalNumber,
        buyerPercent: optionalNumber,
        negotiable: z.boolean(),
        minAcceptable: optionalNumber,
        paymentMilestones: z.array(paymentMilestoneSchema),
    }),
    rent: z.object({
        // Picker removed — always flat INR; coerce legacy "months" drafts.
        mode: z.preprocess(() => "flat" as const, z.literal("flat")),
        value: z.number().min(0).max(1_000_000_000).nullable(),
        paidBy: z.literal("owner"),
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

const furnishingSchema = z.object({
    status: z.enum(["", "unfurnished", "semi_furnished", "fully_furnished"]),
    items: z.record(z.string(), z.number().int().min(0)),
    negotiable: z.boolean(),
    furnitureRentExtra: optionalNumber,
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
});

const constructionSchema = z
    .object({
        possessionType: optionalText,
        possessionDate: optionalText,
        builderName: optionalText,
        projectName: optionalText,
        paymentPlan: optionalText,
        paymentSchedule: z.array(
            z.object({
                id: z.string(),
                milestone: z.string(),
                percent: z.number(),
                dueOn: z.string(),
            }),
        ),
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
    photos: z
        .array(photoSchema)
        .max(MAX_PROPERTY_PHOTOS, `Add up to ${MAX_PROPERTY_PHOTOS} photos`),
    videoUploadName: optionalText,
    videoUrl: videoUrlSchema,
    virtualTourUrl: tourUrlSchema,
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
    /** Contacts owner id when attached from the broker book. Optional until owner contacts API is wired. */
    contactId: optionalText,
    listerType: z.string(),
    name: optionalText,
    phone: z.string(),
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

const attachedBuyerSchema = z.object({
    id: z.string(),
    name: z.string(),
    phoneDigits: z.string(),
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
    basics: z.object({ basics: basicsStepSchema, location: locationSchema }),
    details: z.object({
        basics: listingCopySchema,
        details: detailsSchema,
        area: areaSchema,
    }),
    pricing: z
        .object({
            basics: z.object({ listingFor: z.enum(["sell", "rent", "lease", "pg", "both"]) }),
            sale: saleSchema,
            rent: rentSchema,
            area: z.object({ areaSqft: z.number() }),
            commission: commissionSchema,
            deal: dealSchema,
        })
        .superRefine((value, context) => {
            if (value.basics.listingFor === "sell" || value.basics.listingFor === "both") {
                const sale = value.commission.sale;
                if (
                    sale.mode === "percent" &&
                    sale.value != null &&
                    ((sale.value > 0 && sale.value < 0.1) || sale.value > 10)
                ) {
                    context.addIssue({
                        code: "custom",
                        path: ["commission", "sale", "value"],
                        message: "Commission looks too high. Please check.",
                    });
                }
            }
            if (value.basics.listingFor !== "sell") {
                const rent = value.commission.rent;
                if (rent.value != null && rent.value < 0) {
                    context.addIssue({
                        code: "custom",
                        path: ["commission", "rent", "value"],
                        message: "Commission amount cannot be negative",
                    });
                }
            }
        }),
    furnishing: z.object({
        furnishing: furnishingSchema,
        amenities: amenitiesSchema,
        highlights: highlightsSchema,
        construction: constructionSchema,
    }),
    media: z
        .object({
            media: mediaSchema,
            documents: z.array(documentSchema),
            owner: ownerSchema,
            attachedBuyers: z.array(attachedBuyerSchema),
            publish: publishSchema,
        })
        .superRefine((value, context) => {
            const usable = value.media.photos.filter(isUsablePropertyPhoto);
            const hasCover = usable.some((photo) => photo.isCover);
            const galleryCount = usable.filter((photo) => !photo.isCover).length;

            if (!hasCover) {
                context.addIssue({
                    code: "custom",
                    path: ["media", "cover"],
                    message: "Add a cover image for the listing card",
                });
            }
            if (galleryCount < 3) {
                context.addIssue({
                    code: "custom",
                    path: ["media", "photos"],
                    message: "Add at least 3 property photos",
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

export const OWNER_SALE_COMMISSION_MIN = 0.1;
export const OWNER_SALE_COMMISSION_MAX = 5;

/**
 * Owner listings must state the commission they share: sale as 0.1–5 %, rent
 * as a fixed amount (0 = no commission). Broker listings skip this check.
 */
export function ownerCommissionIssues(
    values: PropertyDraftValues,
): { path: string; message: string }[] {
    const listingFor = values.basics.listingFor;
    const sells = listingFor === "sell" || listingFor === "both";
    const rents =
        listingFor === "rent" ||
        listingFor === "lease" ||
        listingFor === "pg" ||
        listingFor === "both";
    const issues: { path: string; message: string }[] = [];

    if (sells) {
        const value = values.commission.sale.value;
        if (value == null || !Number.isFinite(value)) {
            issues.push({
                path: "commission.sale.value",
                message: "Enter the sale commission you will share",
            });
        } else if (value < OWNER_SALE_COMMISSION_MIN || value > OWNER_SALE_COMMISSION_MAX) {
            issues.push({
                path: "commission.sale.value",
                message: `Sale commission must be between ${OWNER_SALE_COMMISSION_MIN}% and ${OWNER_SALE_COMMISSION_MAX}%`,
            });
        }
    }

    if (rents) {
        const value = values.commission.rent.value;
        if (value == null || !Number.isFinite(value)) {
            issues.push({
                path: "commission.rent.value",
                message: "Enter the rent commission. Put 0 for no commission",
            });
        } else if (value < 0) {
            issues.push({
                path: "commission.rent.value",
                message: "Rent commission cannot be negative",
            });
        }
    }

    return issues;
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
    media: mediaSchema,
    documents: z.array(documentSchema),
    owner: ownerSchema,
    attachedBuyers: z.array(attachedBuyerSchema),
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
    basics: ["basics", "location"],
    details: ["basics", "details", "area"],
    pricing: ["sale", "rent", "commission", "deal"],
    furnishing: ["furnishing", "amenities", "highlights", "construction"],
    media: ["media", "documents", "owner", "attachedBuyers", "publish"],
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
        floorNumber: null,
        totalFloors: null,
        facing: "",
        roadWidthFt: null,
        propertyAge: null,
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
        maintenanceCharge: null,
        maintenanceFrequency: "monthly",
        parkingCharge: null,
        plcCharge: null,
        floorRiseCharge: null,
        otherCharges: [],
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
            paidBy: "owner",
            ownerSharePercent: 100,
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
            mode: "flat",
            value: 0,
            paidBy: "owner",
            ownerSharePercent: 100,
            renewalFeeApplicable: false,
            renewalFeeValue: 0.5,
        },
        tax: { gstApplicable: false, gstMode: "exclusive", tdsApplicable: false, tdsRate: 2 },
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
    },
    amenities: {
        society: [],
        recreation: [],
        convenience: [],
        flatFeatures: [],
        commercial: [],
        land: [],
    },
    highlights: { chips: [] },
    construction: {
        possessionType: "",
        possessionDate: "",
        builderName: "",
        projectName: "",
        paymentPlan: "",
        paymentSchedule: [],
        bookingOpen: false,
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
        contactId: "",
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
    attachedBuyers: [],
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
