import type {
    PropertyBrowseCity,
    PropertyBrowseCountry,
    PropertyBrowseListing,
    PropertyRepresentationStanding,
} from "@/lib/api/properties";

import type {
    OwnerListingCategory,
    OwnerListingFurnishing,
    OwnerListingItem,
    OwnerListingPropertyType,
} from "@/features/properties/owner-listings/types";
import { isOwnerListingCategory } from "@/features/properties/owner-listings/filter-visibility";

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

const UI_TO_PROPERTY_TYPE: Partial<Record<OwnerListingPropertyType, string>> = {
    shop: "commercial",
    office: "commercial",
    plot: "land",
};

const DEFAULT_BROKER_SLOTS_TOTAL = 3;
/** Matches backend `PropertyService.NEW_LISTING_MAX_AGE_MS` (created within 7 days). */
const NEW_LISTING_MAX_AGE_HOURS = 7 * 24;

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

function resolveIsNew(listing: PropertyBrowseListing, listedHours: number): boolean {
    if (typeof listing.isNew === "boolean") return listing.isNew;
    // Fallback when older API responses omit `isNew`.
    return listedHours <= NEW_LISTING_MAX_AGE_HOURS;
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

/** API `subtype` / `propertyType` → the card type. Shared with My deals so both name a listing alike. */
export function mapApiPropertyType(
    subtypeRaw: string | null | undefined,
    propertyTypeRaw: string | null | undefined,
): OwnerListingPropertyType {
    const subtype = subtypeRaw?.trim().toLowerCase();
    if (subtype && SUBTYPE_TO_UI[subtype]) {
        return SUBTYPE_TO_UI[subtype];
    }
    if (subtype === "shop") return "shop";
    if (subtype === "office" || subtype === "office_space") return "office";
    if (subtype?.includes("plot") || subtype === "agricultural_land" || subtype === "farm_land") {
        return "plot";
    }

    const category = propertyTypeRaw?.trim().toLowerCase();
    if (category === "commercial") return "office";
    if (category === "land" || category === "agricultural") return "plot";
    return "apartment";
}

function mapPropertyType(listing: PropertyBrowseListing): OwnerListingPropertyType {
    return mapApiPropertyType(listing.subtype, listing.propertyType);
}

function mapCategory(listing: PropertyBrowseListing): OwnerListingCategory | "" {
    const raw = listing.propertyType?.trim().toLowerCase() ?? "";
    return isOwnerListingCategory(raw) ? raw : "";
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

function firstId(...values: Array<string | null | undefined>): string | undefined {
    for (const value of values) {
        const id = value?.trim();
        if (id) return id;
    }
    return undefined;
}

type BrowseListingExtras = PropertyBrowseListing & {
    hasRequested?: boolean;
    representationId?: string | null;
    representation_id?: string | null;
    representation?: PropertyRepresentationStanding & {
        representationId?: string | null;
        initiated_by?: string | null;
    };
};

function browseRepresentationStanding(listing: PropertyBrowseListing): {
    hasRequested: boolean;
    isRepresenting: boolean;
    isInvitePending: boolean;
    pendingRepresentationId?: string;
    pendingInvitationId?: string;
} {
    const extra = listing as BrowseListingExtras;
    const raw = extra.representation;
    const status = (raw?.status ?? "").trim().toLowerCase();
    const initiatedBy = String(raw?.initiatedBy ?? raw?.initiated_by ?? "")
        .trim()
        .toLowerCase();
    const id = firstId(
        raw?.id,
        raw?.representationId,
        extra.representationId,
        extra.representation_id,
    );
    const isRepresenting = status === "accepted";
    const isInvitePending = status === "pending" && initiatedBy === "owner";
    const hasRequested =
        !isRepresenting &&
        !isInvitePending &&
        (status === "pending" || extra.hasRequested === true);

    return {
        hasRequested,
        isRepresenting,
        isInvitePending,
        pendingRepresentationId: hasRequested ? id : undefined,
        pendingInvitationId: isInvitePending ? id : undefined,
    };
}

/** Prefer `users.id`; fall back to the owner profile row when that is all the API sends. */
function ownerUserIdFromBrowseListing(listing: PropertyBrowseListing): string | undefined {
    const nested = listing.owner;
    const snake = listing as PropertyBrowseListing & { owner_id?: string | null };
    return firstId(
        listing.ownerUserId,
        nested?.userId,
        listing.ownerProfileId,
        nested?.profileId,
        nested?.id,
        snake.owner_id,
    );
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

/** @deprecated Prefer `browseApiTypeFilters` from filter-visibility. */
export function propertyTypeToApiFilters(propertyType: OwnerListingPropertyType | ""): {
    propertyType?: string;
    subtype?: string;
} {
    if (!propertyType) return {};
    const subtype = UI_TO_SUBTYPE[propertyType];
    const category = UI_TO_PROPERTY_TYPE[propertyType];
    return {
        ...(subtype ? { subtype } : {}),
        ...(category ? { propertyType: category } : {}),
    };
}

function mapPricing(listing: PropertyBrowseListing): {
    saleAmountInr: number | null;
    rentAmountInr: number | null;
} {
    const saleRaw = toNumber(listing.salePrice);
    const rentRaw = toNumber(listing.monthlyRent);
    const saleAmountInr = saleRaw > 0 ? saleRaw : null;
    const rentAmountInr = rentRaw > 0 ? rentRaw : null;
    const type = listing.transactionType?.trim().toLowerCase();

    // Honour explicit transaction type when the API sends it; otherwise fall back
    // to whichever price fields are present (including both).
    if (type === "sale") {
        return { saleAmountInr, rentAmountInr: null };
    }
    if (type === "rent") {
        return { saleAmountInr: null, rentAmountInr };
    }
    if (type === "both") {
        return { saleAmountInr, rentAmountInr };
    }

    return { saleAmountInr, rentAmountInr };
}

export function mapBrowseListingToOwnerItem(listing: PropertyBrowseListing): OwnerListingItem {
    const propertyTypeLabel = mapPropertyType(listing);
    const category = mapCategory(listing);
    const subtype = listing.subtype?.trim().toLowerCase() || undefined;
    const bhk = mapBhk(listing);
    const { saleAmountInr, rentAmountInr } = mapPricing(listing);
    const furnishing = mapFurnishing(listing.furnishingStatus);
    // "New" is based on create time (API `isNew`); listed label prefers publish time.
    const listedAt = listing.publishedAt ?? listing.createdAt;
    const listedHours = hoursAgo(listing.createdAt ?? listedAt);
    const displayListedHours = hoursAgo(listedAt);
    const standing = browseRepresentationStanding(listing);
    const hasRequested = standing.hasRequested;
    const pendingRepresentationId = standing.pendingRepresentationId;
    const occupiesSlot = hasRequested || standing.isRepresenting || standing.isInvitePending;
    const photos = (listing.photos ?? []).filter((src): src is string => Boolean(src?.trim()));
    const locality = listing.address?.trim() || listing.city?.trim() || "Locality";
    const city = listing.city?.trim() || "City";
    const ownerName = listing.ownerName?.trim() || listing.organizationName?.trim() || "Owner";
    const ownerLocationLabel = [listing.ownerLocality?.trim(), listing.ownerCity?.trim()]
        .filter(Boolean)
        .join(", ");
    const imageSrc = photos[0] ?? "";

    return {
        id: listing.id,
        title: listing?.title as string,
        configLabel: configLabel(bhk, propertyTypeLabel),
        propertyTypeLabel,
        category,
        subtype,
        bhk,
        bathrooms: listing.bathrooms != null && listing.bathrooms > 0 ? listing.bathrooms : null,
        balconies: listing.balconyCount != null ? listing.balconyCount : null,
        parkingSpaces: listing.parkingSpaces != null ? listing.parkingSpaces : null,
        floorNumber: listing.floorNumber != null ? listing.floorNumber : null,
        facing: listing.facingDirection?.trim() || null,
        propertyCondition: listing.propertyCondition?.trim() || null,
        propertyAge:
            listing.propertyAge != null && String(listing.propertyAge).trim()
                ? String(listing.propertyAge).trim()
                : null,
        suitableFor: listing.suitableFor?.length ? listing.suitableFor : null,
        locality,
        city,
        country: listing.country?.trim() || "India",
        saleAmountInr,
        rentAmountInr,
        areaSqft: listing.areaSqft ?? 0,
        furnishingLabel: furnishingLabel(furnishing),
        furnishing,
        listedHoursAgo: displayListedHours,
        brokerRequestCount: occupiesSlot ? 1 : 0,
        brokerSlotsTotal: DEFAULT_BROKER_SLOTS_TOTAL,
        brokerSlotsOpen: occupiesSlot
            ? Math.max(0, DEFAULT_BROKER_SLOTS_TOTAL - 1)
            : DEFAULT_BROKER_SLOTS_TOTAL,
        commissionPercent: (() => {
            const raw = toNumber(listing.commissionPercent);
            return raw > 0 ? raw : 0;
        })(),
        commissionAmount: (() => {
            const raw = toNumber(listing.commissionAmount);
            return raw > 0 ? raw : 0;
        })(),
        ownerName,
        ownerAvatarUrl: listing.ownerAvatarUrl ?? undefined,
        ownerUserId: ownerUserIdFromBrowseListing(listing),
        ownerLocationLabel: ownerLocationLabel || undefined,
        photoCount: photos.length,
        isNew: resolveIsNew(listing, listedHours),
        readyToMove: isReadyToMove(listing.availableFrom),
        hasRequested,
        isRepresenting: standing.isRepresenting,
        isInvitePending: standing.isInvitePending,
        pendingRepresentationId,
        pendingInvitationId: standing.pendingInvitationId,
        isBookmarked: Boolean(listing.isBookmarked),
        imageSrc,
        imageSrcs: photos.length > 0 ? photos : imageSrc ? [imageSrc] : [],
        status: listing.representation?.status === "pending" ? "pending" : "active",
    };
}

/** Synthetic listings so the Where menu location tree is built from the API tree. */
export function locationTreeToListings(countries: PropertyBrowseCountry[]): OwnerListingItem[] {
    const stubs: OwnerListingItem[] = [];

    for (const countryGroup of countries) {
        for (const stateGroup of countryGroup.states) {
            for (const cityGroup of stateGroup.cities) {
                stubs.push(
                    ...cityToLocationStubs(cityGroup, stateGroup.state, countryGroup.country),
                );
            }
        }
    }

    return stubs;
}

function cityToLocationStubs(
    cityGroup: PropertyBrowseCity,
    state: string,
    country: string,
): OwnerListingItem[] {
    const stubs: OwnerListingItem[] = [];
    const localities =
        cityGroup.localities.length > 0
            ? cityGroup.localities
            : [{ name: cityGroup.city, listingCount: cityGroup.listingCount }];

    for (const locality of localities) {
        stubs.push({
            id: `${country}:${state}:${cityGroup.city}:${locality.name}`,
            configLabel: "Listing",
            propertyTypeLabel: "apartment",
            bhk: 0,
            locality: locality.name,
            city: cityGroup.city,
            state,
            country,
            saleAmountInr: null,
            rentAmountInr: null,
            areaSqft: 0,
            furnishingLabel: "Unfurnished",
            furnishing: "unfurnished",
            listedHoursAgo: 0,
            brokerRequestCount: 0,
            brokerSlotsTotal: DEFAULT_BROKER_SLOTS_TOTAL,
            brokerSlotsOpen: DEFAULT_BROKER_SLOTS_TOTAL,
            commissionPercent: 0,
            commissionAmount: 0,
            ownerName: "Owner",
            photoCount: 0,
            isNew: false,
            readyToMove: true,
            hasRequested: false,
            isRepresenting: false,
            isInvitePending: false,
            isBookmarked: false,
            imageSrc: "",
            imageSrcs: [],
            status: "active",
            // Carry API count through for the location tree.
            detailLabel: String(locality.listingCount),
        });
    }

    return stubs;
}
