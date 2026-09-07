import { z } from "zod";

export const propertyCategorySchema = z.enum([
    "residential",
    "commercial",
    "industrial",
    "land",
]);

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

const optionalNonNegInt = z.number().int().min(0).nullable();

export const propertyFormSchema = z
    .object({
        transactionType: z.enum(["sale", "rent", "both"]),
        category: propertyCategorySchema,
        propertyType: propertyTypeSchema,
        bhk: z.number().int().min(0).max(10),
        title: z.string().trim().min(1, "Enter a title for this listing"),
        locality: z.string().trim().min(1, "Enter the property's locality"),
        city: z.string().trim().min(1, "Enter the city"),
        address: z.string().trim(),
        pinCode: z
            .string()
            .trim()
            .refine((value) => value === "" || /^\d{6}$/.test(value), {
                message: "PIN code should be 6 digits",
            }),
        saleAmountInr: z.number().nullable(),
        rentAmountInr: z.number().nullable(),
        areaSqft: z.number().positive("Enter area in sq.ft."),
        furnishing: furnishingSchema,
        imageSrcs: z.array(z.string().min(1)).min(1, "Add at least one photo"),
        bathrooms: optionalNonNegInt,
        balconies: optionalNonNegInt,
        floorNumber: optionalNonNegInt,
        totalFloors: optionalNonNegInt,
        facing: facingSchema.nullable(),
        parking: parkingSchema,
        maintenanceInr: z.number().nullable(),
        availableFrom: z.string().nullable(),
        description: z.string().trim(),
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

        if (needsSale && (data.saleAmountInr == null || data.saleAmountInr <= 0)) {
            ctx.addIssue({
                code: "custom",
                path: ["saleAmountInr"],
                message: "Enter a price between ₹1 L and ₹100 Cr",
            });
        }
        if (needsRent && (data.rentAmountInr == null || data.rentAmountInr <= 0)) {
            ctx.addIssue({
                code: "custom",
                path: ["rentAmountInr"],
                message: "Enter a monthly rent greater than ₹0",
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
        "address",
        "pinCode",
        "areaSqft",
        "saleAmountInr",
        "rentAmountInr",
        "furnishing",
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
    address: "",
    pinCode: "",
    saleAmountInr: null,
    rentAmountInr: null,
    areaSqft: 1050,
    furnishing: "semi",
    imageSrcs: ["/properties/1.jpg"],
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
