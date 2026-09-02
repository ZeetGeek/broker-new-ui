export type OwnerListingStatus = "active" | "pending";

export type OwnerListingFurnishing = "furnished" | "semi" | "unfurnished";

export type OwnerListingSort = "newest" | "price_asc" | "price_desc";

export type OwnerListingTransactionType = "sale" | "rent";

export type OwnerListingPropertyType =
    | "apartment"
    | "villa"
    | "penthouse"
    | "shop"
    | "office"
    | "plot";

export type OwnerListingItem = {
    id: string;
    configLabel: string;
    propertyTypeLabel: OwnerListingPropertyType;
    bhk: number;
    locality: string;
    city: string;
    /** Indian state or union territory. Supplied by API when available. */
    state?: string;
    /** ISO market country. Defaults to India in location helpers when absent. */
    country?: string;
    amountInr: number;
    isRent: boolean;
    areaSqft: number;
    furnishingLabel: string;
    furnishing: OwnerListingFurnishing;
    detailLabel?: string;
    listedHoursAgo: number;
    brokerRequestCount: number;
    brokerSlotsTotal: number;
    brokerSlotsOpen: number;
    commissionPercent: number;
    ownerName: string;
    ownerAvatarUrl?: string;
    photoCount: number;
    isNew: boolean;
    readyToMove: boolean;
    hasRequested: boolean;
    isBookmarked: boolean;
    imageSrc: string;
    status: OwnerListingStatus;
};

export type OwnerListingsFilters = {
    /** Sheet — free-text search */
    q: string;
    /** Band — multi-select localities */
    localities: string[];
    /** Band — multi-select BHK values */
    bhk: string[];
    /** Band — sale or rent */
    type: OwnerListingTransactionType | "";
    min: string;
    max: string;
    /** Sheet — furnishing */
    furnishing: OwnerListingFurnishing | "";
    /** Sheet — property type */
    propertyType: OwnerListingPropertyType | "";
    /** Quick chips — instant toggles */
    yourAreas: boolean;
    newToday: boolean;
    slotsOpen: boolean;
    commissionSet: boolean;
    readyToMove: boolean;
    sort: OwnerListingSort;
    cursor: string;
};

export type OwnerListingsBandFilters = Pick<
    OwnerListingsFilters,
    "localities" | "bhk" | "type" | "min" | "max" | "propertyType" | "furnishing"
>;

export type OwnerListingsSheetFilters = Pick<
    OwnerListingsFilters,
    "q" | "propertyType" | "furnishing" | "type" | "bhk"
>;

export type OwnerListingsFilterContext = {
    serviceAreas?: string[];
};

export type OwnerListingsResult = {
    items: OwnerListingItem[];
    totalCount: number;
    /** Sum of sale listing prices in the filtered set (excludes rent). */
    marketValueInr: number;
    nextCursor: string | null;
};

export const DEFAULT_OWNER_LISTINGS_FILTERS: OwnerListingsFilters = {
    q: "",
    localities: [],
    bhk: [],
    type: "",
    min: "",
    max: "",
    furnishing: "",
    propertyType: "",
    yourAreas: false,
    newToday: false,
    slotsOpen: false,
    commissionSet: false,
    readyToMove: false,
    sort: "newest",
    cursor: "",
};

export const OWNER_LISTING_PROPERTY_TYPES: { value: OwnerListingPropertyType; label: string }[] = [
    { value: "apartment", label: "Apartment" },
    { value: "villa", label: "Villa" },
    { value: "penthouse", label: "Penthouse" },
    { value: "shop", label: "Shop" },
    { value: "office", label: "Office" },
    { value: "plot", label: "Plot" },
];
