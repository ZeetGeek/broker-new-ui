import type { PropertyListing } from "@/lib/api/properties";
import { buildPropertyTitle } from "@/lib/format/property-title";
import {
    categoryForPropertyType,
    needsBhk,
    PROPERTY_TYPE_LABELS,
    type PropertyType,
} from "@/lib/validation/property";

import type {
    CreateMyListingInput,
    MyListingCondition,
    MyListingFacing,
    MyListingFurnishing,
    MyListingItem,
    MyListingParking,
    MyListingPropertyType,
    MyListingStatus,
    MyListingTransactionType,
    UpdateMyListingInput,
} from "@/features/properties/your-listings/types";

const BHK_CONFIG_TO_NUMBER: Record<string, number> = {
    one_rk: 1,
    one_bhk: 1,
    two_bhk: 2,
    three_bhk: 3,
    four_bhk: 4,
    five_plus_bhk: 5,
};

const NUMBER_TO_BHK_CONFIG: Record<number, string> = {
    1: "one_bhk",
    2: "two_bhk",
    3: "three_bhk",
    4: "four_bhk",
    5: "five_plus_bhk",
};

const SUBTYPE_TO_UI: Record<string, MyListingPropertyType> = {
    apartment: "apartment",
    flat: "flat",
    villa: "villa",
    penthouse: "penthouse",
    independent_house: "independent_house",
    builder_floor: "builder_floor",
    farm_house: "farmhouse",
};

const UI_TO_SUBTYPE: Partial<Record<MyListingPropertyType, string>> = {
    apartment: "apartment",
    villa: "villa",
    independent_house: "independent_house",
    builder_floor: "builder_floor",
    penthouse: "penthouse",
    farmhouse: "farm_house",
    flat: "flat",
};

const FURNISHING_LABELS: Record<MyListingFurnishing, string> = {
    furnished: "Furnished",
    semi: "Semi-furnished",
    unfurnished: "Unfurnished",
};

const FACING_SET = new Set<MyListingFacing>([
    "north",
    "east",
    "south",
    "west",
    "north_east",
    "north_west",
    "south_east",
    "south_west",
]);

function toNumber(value: string | number | null | undefined): number {
    if (value == null) return 0;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function daysAgo(iso: string | null | undefined): number {
    if (!iso) return 0;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 0;
    return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

function mapFurnishing(value: string | null | undefined): MyListingFurnishing {
    if (value === "furnished" || value === "semi" || value === "unfurnished") {
        return value;
    }
    return "unfurnished";
}

function mapCondition(value: string | null | undefined): MyListingCondition | null {
    if (
        value === "ready_to_move" ||
        value === "under_construction" ||
        value === "needs_renovation" ||
        value === "new_launch"
    ) {
        return value;
    }
    return null;
}

function mapPropertyType(listing: PropertyListing): MyListingPropertyType {
    const subtype = listing.subtype?.trim().toLowerCase();
    if (subtype && SUBTYPE_TO_UI[subtype]) {
        return SUBTYPE_TO_UI[subtype];
    }

    const category = listing.propertyType?.trim().toLowerCase();
    if (category === "commercial") return "office";
    if (category === "industrial") return "warehouse";
    if (category === "land") return "plot";
    return "apartment";
}

function mapBhk(listing: PropertyListing): number {
    if (listing.bedrooms != null && listing.bedrooms > 0) {
        return listing.bedrooms;
    }
    const fromConfig = listing.bhkConfig ? BHK_CONFIG_TO_NUMBER[listing.bhkConfig] : undefined;
    return fromConfig ?? 0;
}

function configLabel(bhk: number, propertyType: MyListingPropertyType): string {
    if (!needsBhk(propertyType as PropertyType) || bhk <= 0) {
        return PROPERTY_TYPE_LABELS[propertyType as PropertyType] ?? propertyType;
    }
    return bhk >= 5 ? "5+ BHK" : `${bhk} BHK`;
}

function mapStatus(listing: PropertyListing): MyListingStatus {
    if (listing.publishStatus === "published" || listing.isDraft === false) {
        return "published";
    }
    return "draft";
}

function mapTransactionType(value: string | null | undefined): MyListingTransactionType {
    if (value === "rent" || value === "both" || value === "sale") return value;
    return "sale";
}

function mapFacing(value: string | null | undefined): MyListingFacing | null {
    if (!value) return null;
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
    if (FACING_SET.has(normalized as MyListingFacing)) {
        return normalized as MyListingFacing;
    }
    return null;
}

function mapParking(spaces: number | null | undefined): MyListingParking {
    if (spaces == null || spaces <= 0) return "none";
    if (spaces === 1) return "1";
    if (spaces === 2) return "2";
    return "3plus";
}

function parkingToSpaces(parking: MyListingParking | undefined): number | undefined {
    if (parking == null) return undefined;
    if (parking === "none") return 0;
    if (parking === "1") return 1;
    if (parking === "2") return 2;
    return 3;
}

function mapPricing(listing: PropertyListing): {
    saleAmountInr: number | null;
    rentAmountInr: number | null;
} {
    const saleRaw = toNumber(listing.salePrice);
    const rentRaw = toNumber(listing.monthlyRent);
    const saleAmountInr = saleRaw > 0 ? saleRaw : null;
    const rentAmountInr = rentRaw > 0 ? rentRaw : null;
    const type = listing.transactionType?.trim().toLowerCase();

    if (type === "sale") return { saleAmountInr, rentAmountInr: null };
    if (type === "rent") return { saleAmountInr: null, rentAmountInr };
    return { saleAmountInr, rentAmountInr };
}

export function bhkValuesToApiConfig(bhk: string[]): string[] {
    return bhk
        .map((value) => Number(value))
        .filter((n) => Number.isFinite(n) && n > 0)
        .map((n) => NUMBER_TO_BHK_CONFIG[n] ?? (n >= 5 ? "five_plus_bhk" : undefined))
        .filter((value): value is string => Boolean(value));
}

export function propertyTypeToApiFilters(propertyType: MyListingPropertyType | ""): {
    propertyType?: string;
    subtype?: string;
} {
    if (!propertyType) return {};
    const subtype = UI_TO_SUBTYPE[propertyType];
    if (subtype) return { subtype };

    if (propertyType === "shop" || propertyType === "office" || propertyType === "showroom") {
        return { propertyType: "commercial" };
    }
    if (propertyType === "warehouse" || propertyType === "factory") {
        return { propertyType: "industrial" };
    }
    if (propertyType === "plot" || propertyType === "agricultural") {
        return { propertyType: "land" };
    }
    return {};
}

export function mapPropertyListingToMyItem(listing: PropertyListing): MyListingItem {
    const propertyType = mapPropertyType(listing);
    const category = categoryForPropertyType(propertyType as PropertyType);
    const bhk = mapBhk(listing);
    const { saleAmountInr, rentAmountInr } = mapPricing(listing);
    const furnishing = mapFurnishing(listing.furnishingStatus);
    const photos = (listing.photos ?? []).filter((src): src is string => Boolean(src?.trim()));
    const locality = listing.address?.trim() || listing.city?.trim() || "Locality";
    const city = listing.city?.trim() || "City";
    const listedAt = listing.publishedAt ?? listing.createdAt;
    const title =
        listing.title?.trim() ||
        buildPropertyTitle({
            bhk,
            propertyType: propertyType as PropertyType,
            locality,
            city,
        });

    return {
        id: listing.id,
        title,
        configLabel: configLabel(bhk, propertyType),
        category,
        propertyType,
        propertyTypeLabel: PROPERTY_TYPE_LABELS[propertyType as PropertyType] ?? propertyType,
        bhk,
        locality,
        city,
        state: listing.state?.trim() || "",
        address: listing.address?.trim() || locality,
        society: listing.society?.trim() || "",
        flatNo: listing.flatNo?.trim() || "",
        landmark: listing.landmark?.trim() || "",
        pinCode: listing.postalCode?.trim() || "",
        transactionType: mapTransactionType(listing.transactionType),
        saleAmountInr,
        rentAmountInr,
        areaSqft: listing.areaSqft ?? 0,
        carpetAreaSqft: (() => {
            const raw = listing.carpetAreaSqft;
            return raw != null && raw > 0 ? raw : null;
        })(),
        pricePerSqft: (() => {
            const raw = listing.pricePerSqft;
            if (raw != null && raw > 0) return raw;
            if (saleAmountInr != null && (listing.areaSqft ?? 0) > 0) {
                return Math.round(saleAmountInr / (listing.areaSqft as number));
            }
            return null;
        })(),
        furnishing,
        furnishingLabel: FURNISHING_LABELS[furnishing],
        propertyAge: listing.propertyAge?.trim() || "",
        propertyCondition: mapCondition(listing.propertyCondition),
        bathrooms: listing.bathrooms ?? null,
        balconies: listing.balconyCount ?? null,
        floorNumber: listing.floorNumber ?? null,
        totalFloors: listing.totalFloors ?? null,
        facing: mapFacing(listing.facingDirection),
        parking: mapParking(listing.parkingSpaces),
        maintenanceInr: (() => {
            const raw = toNumber(listing.maintenanceCharges);
            return raw > 0 ? raw : null;
        })(),
        description: listing.description?.trim() || "",
        amenities: listing.amenities ?? [],
        availableFrom: listing.availableFrom ?? null,
        status: mapStatus(listing),
        inboundRequestCount: 0,
        listedDaysAgo: daysAgo(listedAt),
        photoCount: photos.length,
        imageSrc: photos[0] ?? "",
        imageSrcs: photos,
        createdAt: listing.createdAt ?? new Date().toISOString(),
        updatedAt: listing.updatedAt ?? listing.createdAt ?? new Date().toISOString(),
    };
}

export function myListingInputToCreatePayload(input: CreateMyListingInput) {
    const subtype = UI_TO_SUBTYPE[input.propertyType];
    const bhkConfig =
        needsBhk(input.propertyType as PropertyType) && input.bhk > 0
            ? (NUMBER_TO_BHK_CONFIG[input.bhk] ?? (input.bhk >= 5 ? "five_plus_bhk" : undefined))
            : undefined;

    const title =
        input.title.trim() ||
        buildPropertyTitle({
            bhk: input.bhk,
            propertyType: input.propertyType as PropertyType,
            locality: input.locality,
            city: input.city,
        });

    return {
        visibility: "public" as const,
        publishStatus: input.publish ? ("published" as const) : ("draft" as const),
        transactionType: input.transactionType,
        city: input.city.trim(),
        propertyType: input.category,
        ...(subtype ? { subtype } : {}),
        ...(bhkConfig ? { bhkConfig } : {}),
        title,
        bedrooms: needsBhk(input.propertyType as PropertyType) ? input.bhk : undefined,
        bathrooms: input.bathrooms ?? undefined,
        balconyCount: input.balconies ?? undefined,
        floorNumber: input.floorNumber ?? undefined,
        totalFloors: input.totalFloors ?? undefined,
        areaSqft: input.areaSqft,
        carpetAreaSqft: input.carpetAreaSqft ?? undefined,
        address: input.locality.trim(),
        state: input.state.trim() || undefined,
        society: input.society.trim() || undefined,
        flatNo: input.flatNo.trim() || undefined,
        landmark: input.landmark.trim() || undefined,
        postalCode: input.pinCode.trim() || undefined,
        country: "India",
        salePrice: input.saleAmountInr ?? undefined,
        monthlyRent: input.rentAmountInr ?? undefined,
        maintenanceCharges: input.maintenanceInr ?? undefined,
        pricePerSqft: input.pricePerSqft ?? undefined,
        furnishingStatus: input.furnishing,
        propertyAge: input.propertyAge.trim() || undefined,
        propertyCondition: input.propertyCondition ?? undefined,
        facingDirection: input.facing ?? undefined,
        parkingSpaces: parkingToSpaces(input.parking),
        availableFrom: input.availableFrom || undefined,
        description:
            [input.address.trim(), input.description.trim()].filter(Boolean).join("\n\n") ||
            undefined,
        amenities: input.amenities,
    };
}

export function myListingInputToUpdatePayload(input: UpdateMyListingInput) {
    const payload: Record<string, string | number | boolean | string[] | undefined> = {};

    if (input.transactionType != null) payload.transactionType = input.transactionType;
    if (input.category != null) payload.propertyType = input.category;
    if (input.propertyType != null) {
        const subtype = UI_TO_SUBTYPE[input.propertyType];
        if (subtype) payload.subtype = subtype;
    }
    if (input.bhk != null && input.propertyType != null) {
        if (needsBhk(input.propertyType as PropertyType)) {
            payload.bedrooms = input.bhk;
            payload.bhkConfig =
                NUMBER_TO_BHK_CONFIG[input.bhk] ?? (input.bhk >= 5 ? "five_plus_bhk" : undefined);
        }
    }
    if (input.title != null) payload.title = input.title.trim();
    if (input.locality != null) payload.address = input.locality.trim();
    if (input.city != null) payload.city = input.city.trim();
    if (input.state != null) payload.state = input.state.trim() || undefined;
    if (input.society != null) payload.society = input.society.trim() || undefined;
    if (input.flatNo != null) payload.flatNo = input.flatNo.trim() || undefined;
    if (input.landmark != null) payload.landmark = input.landmark.trim() || undefined;
    if (input.pinCode != null) payload.postalCode = input.pinCode.trim();
    if (input.areaSqft != null) payload.areaSqft = input.areaSqft;
    if (input.carpetAreaSqft !== undefined) {
        payload.carpetAreaSqft = input.carpetAreaSqft ?? undefined;
    }
    if (input.saleAmountInr !== undefined) payload.salePrice = input.saleAmountInr ?? undefined;
    if (input.rentAmountInr !== undefined) payload.monthlyRent = input.rentAmountInr ?? undefined;
    if (input.maintenanceInr !== undefined) {
        payload.maintenanceCharges = input.maintenanceInr ?? undefined;
    }
    if (input.pricePerSqft !== undefined) {
        payload.pricePerSqft = input.pricePerSqft ?? undefined;
    }
    if (input.furnishing != null) payload.furnishingStatus = input.furnishing;
    if (input.propertyAge != null) {
        payload.propertyAge = input.propertyAge.trim() || undefined;
    }
    if (input.propertyCondition !== undefined) {
        payload.propertyCondition = input.propertyCondition ?? undefined;
    }
    if (input.bathrooms !== undefined) payload.bathrooms = input.bathrooms ?? undefined;
    if (input.balconies !== undefined) payload.balconyCount = input.balconies ?? undefined;
    if (input.floorNumber !== undefined) payload.floorNumber = input.floorNumber ?? undefined;
    if (input.totalFloors !== undefined) payload.totalFloors = input.totalFloors ?? undefined;
    if (input.facing !== undefined) payload.facingDirection = input.facing ?? undefined;
    if (input.parking != null) payload.parkingSpaces = parkingToSpaces(input.parking);
    if (input.availableFrom !== undefined) payload.availableFrom = input.availableFrom || undefined;
    if (input.amenities != null) payload.amenities = input.amenities;
    if (input.publish != null) {
        payload.publishStatus = input.publish ? "published" : "draft";
    } else if (input.status === "published" || input.status === "draft") {
        payload.publishStatus = input.status;
    } else if (input.status === "unpublished") {
        payload.publishStatus = "draft";
    }

    if (input.address != null || input.description != null) {
        const street = input.address?.trim() ?? "";
        const description = input.description?.trim() ?? "";
        payload.description = [street, description].filter(Boolean).join("\n\n") || undefined;
    }

    return payload;
}

/** Best-effort: turn public/static photo URLs into uploadable files. */
export async function urlsToPhotoFiles(urls: string[]): Promise<File[]> {
    const files: File[] = [];
    for (const [index, url] of urls.entries()) {
        if (!url || url.startsWith("blob:")) continue;
        try {
            const response = await fetch(url);
            if (!response.ok) continue;
            const blob = await response.blob();
            const extension = blob.type.includes("png") ? "png" : "jpg";
            files.push(
                new File([blob], `photo-${index + 1}.${extension}`, {
                    type: blob.type || "image/jpeg",
                }),
            );
        } catch {
            // Skip unreadable assets; listing can still save without them.
        }
    }
    return files;
}
