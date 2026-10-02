export type OwnerListingStatus = "active" | "pending";

export type OwnerListingFurnishing = "furnished" | "semi" | "unfurnished";

export type OwnerListingSort = "newest" | "price_asc" | "price_desc";

export type OwnerListingTransactionType = "sale" | "rent";

export type OwnerListingPropertyType =
    "apartment" | "villa" | "penthouse" | "shop" | "office" | "plot";

export type OwnerListingItem = {
    id: string;
    title: string;
    configLabel: string;
    propertyTypeLabel: OwnerListingPropertyType;
    bhk: number;
    locality: string;
    city: string;
    /** Indian state or union territory. Supplied by API when available. */
    state?: string;
    /** ISO market country. Defaults to India in location helpers when absent. */
    country?: string;
    /** Sale ask in INR. Null when not offered for sale. */
    saleAmountInr: number | null;
    /** Monthly rent ask in INR. Null when not offered for rent. */
    rentAmountInr: number | null;
    areaSqft: number;
    furnishingLabel: string;
    furnishing: OwnerListingFurnishing;
    detailLabel?: string;
    listedHoursAgo: number;
    brokerRequestCount: number;
    brokerSlotsTotal: number;
    brokerSlotsOpen: number;
    commissionPercent: number;
    /** Fixed rent brokerage in INR. 0 when unset. */
    commissionAmount: number;
    ownerName: string;
    ownerAvatarUrl?: string;
    /** `users.id` for the listing owner — used to open their profile. */
    ownerUserId?: string;
    /** Where the owner is based, e.g. "Adajan, Surat". Absent until the API sends it. */
    ownerLocationLabel?: string;
    photoCount: number;
    isNew: boolean;
    readyToMove: boolean;
    /** Pending broker-initiated request — card shows Cancel request. */
    hasRequested: boolean;
    /** Owner already approved this broker. */
    isRepresenting?: boolean;
    /** Owner invited this broker. Card shows Accept / Cancel invitation. */
    isInvitePending?: boolean;
    /**
     * Pending owner-initiated invitation. Present while the broker can still
     * accept or cancel. May be missing even when `isInvitePending` is true.
     */
    pendingInvitationId?: string;
    /**
     * Pending broker-initiated representation. Present only while the request
     * can still be withdrawn. May be missing even when `hasRequested` is true.
     */
    pendingRepresentationId?: string;
    isBookmarked: boolean;
    imageSrc: string;
    /** Gallery URLs for card carousel. First entry should match `imageSrc`. */
    imageSrcs: string[];
    status: OwnerListingStatus;
};

export type OwnerListingsFilters = {
    /** Sheet — free-text search */
    q: string;
    /** Band — multi-select cities (from browse cities API) */
    cities: string[];
    /** Band — multi-select localities */
    localities: string[];
    /** Band — multi-select BHK values */
    bhk: string[];
    /** Band — sale or rent */
    type: OwnerListingTransactionType | "";
    min: string;
    max: string;
    /** Band — furnishing */
    furnishing: OwnerListingFurnishing | "";
    /** Band — property type */
    propertyType: OwnerListingPropertyType | "";
    /** Sheet — carpet / built-up area lower bound (sqft) */
    minAreaSqft: string;
    /** Sheet — carpet / built-up area upper bound (sqft) */
    maxAreaSqft: string;
    /** Sheet — listed within N days (`7` | `30` | "") */
    listedWithinDays: string;
    /** Sheet — minimum owner commission percent */
    minCommissionPercent: string;
    /** Quick chips / sheet — instant toggles */
    yourAreas: boolean;
    newToday: boolean;
    slotsOpen: boolean;
    commissionSet: boolean;
    readyToMove: boolean;
    /** Quick chip — listings the broker has bookmarked */
    bookmarked: boolean;
    sort: OwnerListingSort;
    /** 1-based page as string (URL `cursor`). Empty = page 1. */
    cursor: string;
    /** Rows per page (URL `limit`). */
    limit: number;
};

export type OwnerListingsBandFilters = Pick<
    OwnerListingsFilters,
    | "cities"
    | "localities"
    | "bhk"
    | "type"
    | "min"
    | "max"
    | "propertyType"
    | "furnishing"
    | "yourAreas"
>;

export type OwnerListingsSheetFilters = Pick<
    OwnerListingsFilters,
    | "minAreaSqft"
    | "maxAreaSqft"
    | "listedWithinDays"
    | "minCommissionPercent"
    | "yourAreas"
    | "newToday"
    | "slotsOpen"
    | "commissionSet"
    | "readyToMove"
    | "bookmarked"
>;

export type OwnerListingsFilterContext = {
    serviceAreas?: string[];
};

export type OwnerListingsResult = {
    items: OwnerListingItem[];
    totalCount: number;
    /** Sum of sale listing prices in the filtered set (excludes rent). */
    marketValueInr: number;
    /** Opaque keyset cursor for the next page; null when exhausted. */
    nextCursor: string | null;
    hasMore: boolean;
};

export const DEFAULT_OWNER_LISTINGS_FILTERS: OwnerListingsFilters = {
    q: "",
    cities: [],
    localities: [],
    bhk: [],
    type: "",
    min: "",
    max: "",
    furnishing: "",
    propertyType: "",
    minAreaSqft: "",
    maxAreaSqft: "",
    listedWithinDays: "",
    minCommissionPercent: "",
    /** Default Where → Serviceable areas. */
    yourAreas: true,
    newToday: false,
    slotsOpen: false,
    commissionSet: false,
    readyToMove: false,
    bookmarked: false,
    sort: "newest",
    cursor: "",
    limit: 10,
};

export const OWNER_LISTING_PROPERTY_TYPES: { value: OwnerListingPropertyType; label: string }[] = [
    { value: "apartment", label: "Apartment" },
    { value: "villa", label: "Villa" },
    { value: "penthouse", label: "Penthouse" },
    { value: "shop", label: "Shop" },
    { value: "office", label: "Office" },
    { value: "plot", label: "Plot" },
];
