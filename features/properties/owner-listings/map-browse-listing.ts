import type { PropertyBrowseCity, PropertyBrowseListing } from "@/lib/api/properties";

import type {
    OwnerListingFurnishing,
    OwnerListingItem,
    OwnerListingPropertyType,
} from "@/features/properties/owner-listings/types";

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

const SUBTYPE_TO_UI: Record<string, OwnerListingPropertyType> = {
    apartment: "apartment",
    flat: "apartment",
    villa: "villa",
    penthouse: "penthouse",
    independent_house: "villa",
    builder_floor: "apartment",
    farm_house: "villa",
};

const UI_TO_SUBTYPE: Partial<Record<OwnerListingPropertyType, string>> = {
    apartment: "apartment",
    villa: "villa",
    penthouse: "penthouse",
};

const DEFAULT_BROKER_SLOTS_TOTAL = 3;

function toNumber(value: string | number | null | undefined): number {
    if (value == null) return 0;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function hoursAgo(iso: string | null | undefined): number {
    if (!iso) return 0;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 0;
    return Math.max(0, Math.round((Date.now() - then) / (1000 * 60 * 60)));
}

function mapFurnishing(value: string | null | undefined): OwnerListingFurnishing {
    if (value === "furnished" || value === "semi" || value === "unfurnished") {
        return value;
    }
    return "unfurnished";
}

function furnishingLabel(value: OwnerListingFurnishing): string {
    if (value === "furnished") return "Furnished";
    if (value === "semi") return "Semi-furnished";
    return "Unfurnished";
}

function mapPropertyType(listing: PropertyBrowseListing): OwnerListingPropertyType {
    const subtype = listing.subtype?.trim().toLowerCase();
    if (subtype && SUBTYPE_TO_UI[subtype]) {
        return SUBTYPE_TO_UI[subtype];
    }

    const category = listing.propertyType?.trim().toLowerCase();
    if (category === "commercial") return "office";
    if (category === "land") return "plot";
    return "apartment";
}

function mapBhk(listing: PropertyBrowseListing): number {
    if (listing.bedrooms != null && listing.bedrooms > 0) {
        return listing.bedrooms;
    }
    const fromConfig = listing.bhkConfig ? BHK_CONFIG_TO_NUMBER[listing.bhkConfig] : undefined;
    return fromConfig ?? 0;
}

function configLabel(bhk: number, propertyType: OwnerListingPropertyType): string {
    if (bhk <= 0) {
        return propertyType.charAt(0).toUpperCase() + propertyType.slice(1);
    }
    return `${bhk} BHK`;
}

function isReadyToMove(availableFrom: string | null | undefined): boolean {
    if (!availableFrom) return true;
    const date = new Date(availableFrom);
    if (Number.isNaN(date.getTime())) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() <= today.getTime();
}

export function bhkValuesToApiConfig(bhk: string[]): string[] {
    return bhk
        .map((value) => Number(value))
        .filter((n) => Number.isFinite(n) && n > 0)
        .map((n) => NUMBER_TO_BHK_CONFIG[n] ?? (n >= 5 ? "five_plus_bhk" : undefined))
        .filter((value): value is string => Boolean(value));
}

export function propertyTypeToApiSubtype(
    propertyType: OwnerListingPropertyType | "",
): string | undefined {
    if (!propertyType) return undefined;
    return UI_TO_SUBTYPE[propertyType];
}

export function mapBrowseListingToOwnerItem(listing: PropertyBrowseListing): OwnerListingItem {
    const propertyTypeLabel = mapPropertyType(listing);
    const bhk = mapBhk(listing);
    const isRent =
        listing.transactionType === "rent" ||
        (listing.transactionType !== "sale" && toNumber(listing.monthlyRent) > 0);
    const amountInr = isRent ? toNumber(listing.monthlyRent) : toNumber(listing.salePrice);
    const furnishing = mapFurnishing(listing.furnishingStatus);
    const listedAt = listing.publishedAt ?? listing.createdAt;
    const listedHours = hoursAgo(listedAt);
    const hasRequested =
        listing.representation?.status === "pending" ||
        listing.representation?.status === "accepted";
    const photos = listing.photos ?? [];
    const locality = listing.address?.trim() || listing.city?.trim() || "Locality";
    const city = listing.city?.trim() || "City";
    const ownerName = listing.ownerName?.trim() || listing.organizationName?.trim() || "Owner";

    return {
        id: listing.id,
        configLabel: configLabel(bhk, propertyTypeLabel),
        propertyTypeLabel,
        bhk,
        locality,
        city,
        country: listing.country?.trim() || "India",
        amountInr,
        isRent,
        areaSqft: listing.areaSqft ?? 0,
        furnishingLabel: furnishingLabel(furnishing),
        furnishing,
        listedHoursAgo: listedHours,
        brokerRequestCount: hasRequested ? 1 : 0,
        brokerSlotsTotal: DEFAULT_BROKER_SLOTS_TOTAL,
        brokerSlotsOpen: hasRequested
            ? Math.max(0, DEFAULT_BROKER_SLOTS_TOTAL - 1)
            : DEFAULT_BROKER_SLOTS_TOTAL,
        commissionPercent: 0,
        ownerName,
        ownerAvatarUrl: listing.ownerAvatarUrl ?? undefined,
        photoCount: photos.length,
        isNew: listedHours <= 48,
        readyToMove: isReadyToMove(listing.availableFrom),
        hasRequested,
        isBookmarked: false,
        imageSrc: photos[0] ?? "",
        status: listing.representation?.status === "pending" ? "pending" : "active",
    };
}

/** Synthetic listings so the existing Where menu location tree keeps working. */
export function citiesToLocationListings(cities: PropertyBrowseCity[]): OwnerListingItem[] {
    const stubs: OwnerListingItem[] = [];

    for (const cityGroup of cities) {
        const localities =
            cityGroup.localities.length > 0
                ? cityGroup.localities
                : [{ name: cityGroup.city, listingCount: cityGroup.listingCount }];

        for (const locality of localities) {
            stubs.push({
                id: `${cityGroup.city}:${locality.name}`,
                configLabel: "Listing",
                propertyTypeLabel: "apartment",
                bhk: 0,
                locality: locality.name,
                city: cityGroup.city,
                country: "India",
                amountInr: 0,
                isRent: false,
                areaSqft: 0,
                furnishingLabel: "Unfurnished",
                furnishing: "unfurnished",
                listedHoursAgo: 0,
                brokerRequestCount: 0,
                brokerSlotsTotal: DEFAULT_BROKER_SLOTS_TOTAL,
                brokerSlotsOpen: DEFAULT_BROKER_SLOTS_TOTAL,
                commissionPercent: 0,
                ownerName: "Owner",
                photoCount: 0,
                isNew: false,
                readyToMove: true,
                hasRequested: false,
                isBookmarked: false,
                imageSrc: "",
                status: "active",
                // Carry API count through for the location tree.
                detailLabel: String(locality.listingCount),
            });
        }
    }

    return stubs;
}
