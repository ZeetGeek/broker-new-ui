import { z } from "zod";

const propertyTypeSchema = z.enum([
    "apartment",
    "villa",
    "penthouse",
    "shop",
    "office",
    "plot",
]);

const furnishingSchema = z.enum(["furnished", "semi", "unfurnished"]);

const amenitySchema = z.enum([
    "parking",
    "lift",
    "power_backup",
    "security",
    "gym",
    "garden",
]);

export const propertyFormSchema = z
    .object({
        transactionType: z.enum(["sale", "rent", "both"]),
        propertyType: propertyTypeSchema,
        bhk: z.number().int().min(0).max(10),
        locality: z.string().trim().min(1, "Enter the property's locality"),
        city: z.string().trim().min(1, "Enter the city"),
        address: z.string().trim().min(1, "Enter the full address"),
        pinCode: z
            .string()
            .trim()
            .regex(/^\d{6}$/, "PIN code should be 6 digits"),
        saleAmountInr: z.number().nullable(),
        rentAmountInr: z.number().nullable(),
        areaSqft: z.number().positive("Enter area in sq.ft."),
        furnishing: furnishingSchema,
        imageSrcs: z.array(z.string().min(1)).min(1, "Add at least one photo"),
        availableFrom: z.string().nullable(),
        description: z
            .string()
            .trim()
            .min(20, "Add at least 20 characters so buyers know what to expect"),
        amenities: z.array(amenitySchema),
        publish: z.boolean(),
    })
    .superRefine((data, ctx) => {
        const residential = ["apartment", "villa", "penthouse"].includes(data.propertyType);
        if (residential && data.bhk < 1) {
            ctx.addIssue({
                code: "custom",
                path: ["bhk"],
                message: "Enter BHK for this property type",
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
    });

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export type PropertyFormStep = "basics" | "price_photos" | "extras";

export const PROPERTY_FORM_STEPS: PropertyFormStep[] = ["basics", "price_photos", "extras"];

export const PROPERTY_FORM_STEP_LABELS: Record<PropertyFormStep, string> = {
    basics: "Basics",
    price_photos: "Price & photos",
    extras: "Extras",
};

export const PROPERTY_FORM_STEP_FIELDS: Record<PropertyFormStep, (keyof PropertyFormValues)[]> = {
    basics: [
        "transactionType",
        "propertyType",
        "bhk",
        "locality",
        "city",
        "address",
        "pinCode",
    ],
    price_photos: ["saleAmountInr", "rentAmountInr", "areaSqft", "furnishing", "imageSrcs"],
    extras: ["availableFrom", "description", "amenities", "publish"],
};

export const DEFAULT_PROPERTY_FORM_VALUES: PropertyFormValues = {
    transactionType: "sale",
    propertyType: "apartment",
    bhk: 2,
    locality: "",
    city: "Surat",
    address: "",
    pinCode: "",
    saleAmountInr: null,
    rentAmountInr: null,
    areaSqft: 1000,
    furnishing: "semi",
    imageSrcs: ["/properties/1.jpg"],
    availableFrom: null,
    description: "",
    amenities: ["parking"],
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

export const PROPERTY_AMENITY_OPTIONS: {
    value: z.infer<typeof amenitySchema>;
    label: string;
}[] = [
    { value: "parking", label: "Parking" },
    { value: "lift", label: "Lift" },
    { value: "power_backup", label: "Power backup" },
    { value: "security", label: "Security" },
    { value: "gym", label: "Gym" },
    { value: "garden", label: "Garden" },
];

export const PROPERTY_TYPE_OPTIONS: {
    value: PropertyFormValues["propertyType"];
    label: string;
}[] = [
    { value: "apartment", label: "Apartment" },
    { value: "villa", label: "Villa" },
    { value: "penthouse", label: "Penthouse" },
    { value: "shop", label: "Shop" },
    { value: "office", label: "Office" },
    { value: "plot", label: "Plot" },
];
