export type MyListingStatus = "draft" | "published" | "unpublished";

export type MyListingFurnishing = "furnished" | "semi" | "unfurnished";

export type MyListingSort = "newest" | "price_asc" | "price_desc";

export type MyListingTransactionType = "sale" | "rent" | "both";

export type MyListingCategory = "residential" | "commercial" | "industrial" | "land";

export type MyListingPropertyType =
    | "apartment"
    | "villa"
    | "independent_house"
    | "builder_floor"
    | "penthouse"
    | "farmhouse"
    | "flat"
    | "shop"
    | "office"
    | "showroom"
    | "warehouse"
    | "factory"
    | "plot"
    | "agricultural";

export type MyListingFacing =
    "north" | "east" | "south" | "west" | "north_east" | "north_west" | "south_east" | "south_west";

export type MyListingParking = "none" | "1" | "2" | "3plus";

/** Known amenity keys plus free-form custom labels. */
export type MyListingAmenity = string;

export type MyListingItem = {
    id: string;
    title: string;
    configLabel: string;
    category: MyListingCategory;
    propertyType: MyListingPropertyType;
    propertyTypeLabel: string;
    bhk: number;
    locality: string;
    city: string;
    address: string;
    pinCode: string;
    transactionType: MyListingTransactionType;
    saleAmountInr: number | null;
    rentAmountInr: number | null;
    areaSqft: number;
    furnishing: MyListingFurnishing;
    furnishingLabel: string;
    bathrooms: number | null;
    balconies: number | null;
    floorNumber: number | null;
    totalFloors: number | null;
    facing: MyListingFacing | null;
    parking: MyListingParking;
    maintenanceInr: number | null;
    description: string;
    amenities: MyListingAmenity[];
    availableFrom: string | null;
    status: MyListingStatus;
    inboundRequestCount: number;
    listedDaysAgo: number;
    photoCount: number;
    imageSrc: string;
    imageSrcs: string[];
    createdAt: string;
    updatedAt: string;
};

export type MyListingsFilters = {
    q: string;
    type: "" | "sale" | "rent";
    propertyType: MyListingPropertyType | "";
    bhk: string[];
    status: MyListingStatus | "";
    sort: MyListingSort;
    page: number;
};

export type MyListingsResult = {
    items: MyListingItem[];
    total: number;
    page: number;
    totalPages: number;
};

export const DEFAULT_MY_LISTINGS_FILTERS: MyListingsFilters = {
    q: "",
    type: "",
    propertyType: "",
    bhk: [],
    status: "",
    sort: "newest",
    page: 1,
};

export type BrokerRequestStatusFilter = "all" | "pending" | "approved" | "declined";

export type BrokerRequestRowType =
    "approved_untouched" | "approved" | "pending_stale" | "pending" | "declined";

export type BrokerRequestItem = {
    id: string;
    type: BrokerRequestRowType;
    propertyId: string;
    title: string;
    amountInr: number;
    isRent: boolean;
    note: string;
    action: { label: string; href: string; kind?: "remind" | "open" | "view" };
    /** Pending only — reminders already sent on this attempt. */
    reminderCount?: number;
    remindersRemaining?: number;
    canRemind?: boolean;
    approvedAt?: string;
    daysSince?: number;
    requestedAt?: string;
    daysWaiting?: number;
    ownerSeen?: boolean;
};

export type BrokerRequestsResult = {
    counts: { approved: number; pending: number; declined: number };
    quota: { limit: number; used: number; remaining: number; resetsOn: string };
    items: BrokerRequestItem[];
};

export type CreateMyListingInput = {
    transactionType: MyListingTransactionType;
    category: MyListingCategory;
    propertyType: MyListingPropertyType;
    bhk: number;
    title: string;
    locality: string;
    city: string;
    address: string;
    pinCode: string;
    saleAmountInr: number | null;
    rentAmountInr: number | null;
    areaSqft: number;
    furnishing: MyListingFurnishing;
    imageSrcs: string[];
    /** Newly picked files (blob previews in imageSrcs). */
    photoFiles?: File[];
    bathrooms: number | null;
    balconies: number | null;
    floorNumber: number | null;
    totalFloors: number | null;
    facing: MyListingFacing | null;
    parking: MyListingParking;
    maintenanceInr: number | null;
    availableFrom: string | null;
    description: string;
    amenities: MyListingAmenity[];
    publish: boolean;
};

export type UpdateMyListingInput = Partial<CreateMyListingInput> & {
    status?: MyListingStatus;
};
