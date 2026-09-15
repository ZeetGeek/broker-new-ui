import { z } from "zod";

export const propertyCategorySchema = z.enum(["residential", "commercial", "industrial", "land"]);

export const propertyTypeSchema = z.enum([
    "apartment",
    "villa",
    "independent_house",
    "builder_floor",
    "penthouse",
    "farmhouse",
    "flat",
    "shop",
    "office",
    "showroom",
    "warehouse",
    "factory",
    "plot",
    "agricultural",
]);

export const furnishingSchema = z.enum(["furnished", "semi", "unfurnished"]);

export const propertyConditionSchema = z.enum([
    "ready_to_move",
    "under_construction",
    "needs_renovation",
    "new_launch",
]);

export const facingSchema = z.enum([
    "north",
    "east",
    "south",
    "west",
    "north_east",
    "north_west",
    "south_east",
    "south_west",
]);

export const parkingSchema = z.enum(["none", "1", "2", "3plus"]);

export type PropertyCategory = z.infer<typeof propertyCategorySchema>;
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type PropertyFacing = z.infer<typeof facingSchema>;
export type PropertyParking = z.infer<typeof parkingSchema>;
export type PropertyCondition = z.infer<typeof propertyConditionSchema>;

export const PROPERTY_TYPES_BY_CATEGORY: Record<PropertyCategory, PropertyType[]> = {
    residential: [
        "apartment",
        "villa",
        "independent_house",
        "builder_floor",
        "penthouse",
        "farmhouse",
        "flat",
    ],
    commercial: ["shop", "office", "showroom"],
    industrial: ["warehouse", "factory"],
    land: ["plot", "agricultural"],
};

export const RESIDENTIAL_PROPERTY_TYPES = new Set<PropertyType>(
    PROPERTY_TYPES_BY_CATEGORY.residential,
);

export function categoryForPropertyType(propertyType: PropertyType): PropertyCategory {
    for (const [category, types] of Object.entries(PROPERTY_TYPES_BY_CATEGORY) as [
        PropertyCategory,
        PropertyType[],
    ][]) {
        if (types.includes(propertyType)) return category;
    }
    return "residential";
}

export function needsBhk(propertyType: PropertyType): boolean {
    return RESIDENTIAL_PROPERTY_TYPES.has(propertyType);
}

const optionalCount = (label: string, max: number) =>
    z
        .number()
        .int(`Enter ${label} as a whole number`)
        .min(0, `${label} cannot be negative`)
        .max(max, `Enter ${label} up to ${max}`)
        .nullable();

/** Photos a single listing can carry. */
export const MAX_LISTING_PHOTOS = 10;

/** Largest accepted upload per photo, in megabytes. */
export const MAX_PHOTO_SIZE_MB = 5;

/** ₹1 L — the floor below which a listing price is almost certainly a typo. */
const MIN_SALE_INR = 100_000;
/** ₹100 Cr. */
const MAX_SALE_INR = 1_000_000_000;
const MIN_RENT_INR = 1_000;
const MAX_RENT_INR = 10_000_000;

export const propertyFormSchema = z
    .object({
        transactionType: z.enum(["sale", "rent", "both"]),
        category: propertyCategorySchema,
        propertyType: propertyTypeSchema,
        bhk: z.number().int().min(0).max(10),
        title: z
            .string()
            .trim()
            .min(1, "Enter a title for this listing")
            .max(120, "Keep the title under 120 characters"),
        locality: z
            .string()
            .trim()
            .min(1, "Enter the property's locality")
            .max(80, "Keep the locality under 80 characters"),
        city: z
            .string()
            .trim()
            .min(1, "Enter the city")
            .max(80, "Keep the city under 80 characters"),
        state: z.string().trim().max(80, "Keep the state under 80 characters"),
        address: z.string().trim().max(200, "Keep the address under 200 characters"),
        society: z.string().trim().max(120, "Keep the society name under 120 characters"),
        flatNo: z.string().trim().max(40, "Keep the flat number under 40 characters"),
        landmark: z.string().trim().max(120, "Keep the landmark under 120 characters"),
        pinCode: z
            .string()
            .trim()
            .refine((value) => value === "" || /^\d{6}$/.test(value), {
                message: "PIN code should be 6 digits",
            }),
        saleAmountInr: z.number().nullable(),
        rentAmountInr: z.number().nullable(),
        areaSqft: z
            .number({ message: "Enter area in sq.ft." })
            .positive("Enter area in sq.ft.")
            .max(1_000_000, "Enter area up to 10,00,000 sq.ft."),
        carpetAreaSqft: z
            .number()
            .int("Enter carpet area as a whole number")
            .min(0, "Carpet area cannot be negative")
            .max(1_000_000, "Enter carpet area up to 10,00,000 sq.ft.")
            .nullable(),
        pricePerSqft: z
            .number()
            .int("Enter price per sq.ft as a whole number")
            .min(0, "Price per sq.ft cannot be negative")
            .max(10_000_000, "Enter a realistic price per sq.ft")
            .nullable(),
        furnishing: furnishingSchema,
        propertyAge: z.string().trim().max(40, "Keep property age under 40 characters"),
        propertyCondition: propertyConditionSchema.nullable(),
        // Drafts may have no photos; publish requires ≥1 via superRefine below.
        imageSrcs: z
            .array(z.string().min(1))
            .max(MAX_LISTING_PHOTOS, `Add up to ${MAX_LISTING_PHOTOS} photos`),
        bathrooms: optionalCount("bathrooms", 20),
        balconies: optionalCount("balconies", 20),
        floorNumber: optionalCount("the floor", 200),
        totalFloors: optionalCount("total floors", 200),
        facing: facingSchema.nullable(),
        parking: parkingSchema,
        maintenanceInr: z
            .number()
            .min(0, "Maintenance cannot be negative")
            .max(1_000_000, "Enter maintenance up to ₹10,00,000")
            .nullable(),
        availableFrom: z.string().nullable(),
        description: z.string().trim().max(2000, "Keep the description under 2000 characters"),
        amenities: z.array(z.string().trim().min(1)),
        publish: z.boolean(),
    })
    .superRefine((data, ctx) => {
        const allowed = PROPERTY_TYPES_BY_CATEGORY[data.category];
        if (!allowed.includes(data.propertyType)) {
            ctx.addIssue({
                code: "custom",
                path: ["propertyType"],
                message: "Pick a subtype that matches this category",
            });
        }

        if (needsBhk(data.propertyType) && data.bhk < 1) {
            ctx.addIssue({
                code: "custom",
                path: ["bhk"],
                message: "Pick a BHK for this property type",
            });
        }

        const needsSale = data.transactionType === "sale" || data.transactionType === "both";
        const needsRent = data.transactionType === "rent" || data.transactionType === "both";

        if (needsSale) {
            const sale = data.saleAmountInr;
            if (sale == null || sale <= 0) {
                ctx.addIssue({
                    code: "custom",
                    path: ["saleAmountInr"],
                    message: "Enter a price between ₹1 L and ₹100 Cr",
                });
            } else if (sale < MIN_SALE_INR || sale > MAX_SALE_INR) {
                ctx.addIssue({
                    code: "custom",
                    path: ["saleAmountInr"],
                    message: "Enter a price between ₹1 L and ₹100 Cr",
                });
            }
        }
        if (needsRent) {
            const rent = data.rentAmountInr;
            if (rent == null || rent <= 0) {
                ctx.addIssue({
                    code: "custom",
                    path: ["rentAmountInr"],
                    message: "Enter a monthly rent greater than ₹0",
                });
            } else if (rent < MIN_RENT_INR || rent > MAX_RENT_INR) {
                ctx.addIssue({
                    code: "custom",
                    path: ["rentAmountInr"],
                    message: "Enter a monthly rent between ₹1,000 and ₹1 Cr",
                });
            }
        }

        if (
            data.floorNumber != null &&
            data.totalFloors != null &&
            data.floorNumber > data.totalFloors
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["floorNumber"],
                message: "Floor cannot be higher than the total floors",
            });
        }

        if (
            data.publish &&
            data.description.trim().length > 0 &&
            data.description.trim().length < 20
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["description"],
                message: "Add at least 20 characters, or leave blank",
            });
        }

        if (data.publish && data.imageSrcs.length < 1) {
            ctx.addIssue({
                code: "custom",
                path: ["imageSrcs"],
                message: "Add at least one photo before publishing",
            });
        }
    });

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export type PropertyFormStep = "details" | "photos";

export const PROPERTY_FORM_STEPS: PropertyFormStep[] = ["details", "photos"];

export const PROPERTY_FORM_STEP_LABELS: Record<PropertyFormStep, string> = {
    details: "Listing",
    photos: "Photos",
};

export const PROPERTY_FORM_STEP_FIELDS: Record<PropertyFormStep, (keyof PropertyFormValues)[]> = {
    details: [
        "transactionType",
        "category",
        "propertyType",
        "bhk",
        "title",
        "locality",
        "city",
        "state",
        "address",
        "society",
        "flatNo",
        "landmark",
        "pinCode",
        "areaSqft",
        "carpetAreaSqft",
        "pricePerSqft",
        "saleAmountInr",
        "rentAmountInr",
        "furnishing",
        "propertyAge",
        "propertyCondition",
        "bathrooms",
        "balconies",
        "floorNumber",
        "totalFloors",
        "facing",
        "parking",
        "maintenanceInr",
        "availableFrom",
        "description",
        "amenities",
    ],
    photos: ["imageSrcs", "publish"],
};

export const DEFAULT_PROPERTY_FORM_VALUES: PropertyFormValues = {
    transactionType: "sale",
    category: "residential",
    propertyType: "apartment",
    bhk: 2,
    title: "",
    locality: "",
    city: "Surat",
    state: "",
    address: "",
    society: "",
    flatNo: "",
    landmark: "",
    pinCode: "",
    saleAmountInr: null,
    rentAmountInr: null,
    areaSqft: 1050,
    carpetAreaSqft: null,
    pricePerSqft: null,
    furnishing: "semi",
    propertyAge: "",
    propertyCondition: null,
    imageSrcs: [],
    bathrooms: null,
    balconies: null,
    floorNumber: null,
    totalFloors: null,
    facing: null,
    parking: "1",
    maintenanceInr: null,
    availableFrom: null,
    description: "",
    amenities: ["lift", "power_backup", "covered_parking"],
    publish: true,
};

export const PROPERTY_PHOTO_OPTIONS = [
    "/properties/1.jpg",
    "/properties/2.jpg",
    "/properties/3.jpg",
    "/properties/4.jpg",
    "/properties/5.jpg",
    "/properties/6.jpg",
] as const;

export const PROPERTY_CATEGORY_OPTIONS: {
    value: PropertyCategory;
    label: string;
}[] = [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "industrial", label: "Industrial" },
    { value: "land", label: "Land" },
];

export const PROPERTY_TYPE_OPTIONS: {
    value: PropertyType;
    label: string;
    category: PropertyCategory;
}[] = [
    { value: "apartment", label: "Apartment", category: "residential" },
    { value: "villa", label: "Villa", category: "residential" },
    { value: "independent_house", label: "Independent house", category: "residential" },
    { value: "builder_floor", label: "Builder floor", category: "residential" },
    { value: "penthouse", label: "Penthouse", category: "residential" },
    { value: "farmhouse", label: "Farm house", category: "residential" },
    { value: "flat", label: "Flat", category: "residential" },
    { value: "shop", label: "Shop", category: "commercial" },
    { value: "office", label: "Office", category: "commercial" },
    { value: "showroom", label: "Showroom", category: "commercial" },
    { value: "warehouse", label: "Warehouse", category: "industrial" },
    { value: "factory", label: "Factory", category: "industrial" },
    { value: "plot", label: "Plot", category: "land" },
    { value: "agricultural", label: "Agricultural", category: "land" },
];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = Object.fromEntries(
    PROPERTY_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<PropertyType, string>;

export const PROPERTY_BHK_OPTIONS = [
    { value: 1, label: "1 BHK" },
    { value: 2, label: "2 BHK" },
    { value: 3, label: "3 BHK" },
    { value: 4, label: "4 BHK" },
    { value: 5, label: "5+ BHK" },
] as const;

export const PROPERTY_FACING_OPTIONS: { value: PropertyFacing; label: string }[] = [
    { value: "north", label: "North" },
    { value: "east", label: "East" },
    { value: "south", label: "South" },
    { value: "west", label: "West" },
    { value: "north_east", label: "North-east" },
    { value: "north_west", label: "North-west" },
    { value: "south_east", label: "South-east" },
    { value: "south_west", label: "South-west" },
];

export const PROPERTY_PARKING_OPTIONS: { value: PropertyParking; label: string }[] = [
    { value: "none", label: "None" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3plus", label: "3+" },
];

export const PROPERTY_AGE_OPTIONS: { value: string; label: string }[] = [
    { value: "0-1 Year", label: "0–1 Year" },
    { value: "1-5 Years", label: "1–5 Years" },
    { value: "5-10 Years", label: "5–10 Years" },
    { value: "10+ Years", label: "10+ Years" },
];

export const PROPERTY_CONDITION_OPTIONS: { value: PropertyCondition; label: string }[] = [
    { value: "ready_to_move", label: "Ready to move" },
    { value: "under_construction", label: "Under construction" },
    { value: "needs_renovation", label: "Needs renovation" },
    { value: "new_launch", label: "New launch" },
];

export const PROPERTY_AMENITY_OPTIONS: { value: string; label: string }[] = [
    { value: "lift", label: "Lift" },
    { value: "power_backup", label: "Power backup" },
    { value: "covered_parking", label: "Covered parking" },
    { value: "gated_community", label: "Gated community" },
    { value: "security", label: "CCTV / Security" },
    { value: "gym", label: "Gym" },
    { value: "swimming_pool", label: "Swimming pool" },
    { value: "play_area", label: "Children's play area" },
    { value: "garden", label: "Park / Garden" },
    { value: "clubhouse", label: "Clubhouse" },
    { value: "water_supply", label: "24x7 water supply" },
    { value: "ev_charging", label: "EV charging" },
    { value: "parking", label: "Parking" },
];

export function amenityLabel(value: string): string {
    return (
        PROPERTY_AMENITY_OPTIONS.find((option) => option.value === value)?.label ??
        value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    );
}
