import { buildPropertyTitle } from "@/lib/format/property-title";
import {
    categoryForPropertyType,
    needsBhk,
    PROPERTY_TYPE_LABELS,
    type PropertyType,
} from "@/lib/validation/property";

import type {
    BrokerRequestItem,
    BrokerRequestsResult,
    CreateMyListingInput,
    MyListingAmenity,
    MyListingCategory,
    MyListingFurnishing,
    MyListingItem,
    MyListingParking,
    MyListingPropertyType,
    MyListingStatus,
    UpdateMyListingInput,
} from "@/features/properties/your-listings/types";

const FURNISHING_LABELS: Record<MyListingFurnishing, string> = {
    furnished: "Furnished",
    semi: "Semi-furnished",
    unfurnished: "Unfurnished",
};

function daysAgoIso(days: number): string {
    return new Date(Date.now() - days * 86_400_000).toISOString();
}

function configLabelFor(bhk: number, propertyType: MyListingPropertyType): string {
    if (!needsBhk(propertyType as PropertyType)) {
        return PROPERTY_TYPE_LABELS[propertyType as PropertyType];
    }
    return bhk >= 5 ? "5+ BHK" : `${bhk} BHK`;
}

function resolveTitle(input: {
    title?: string;
    bhk: number;
    propertyType: MyListingPropertyType;
    locality: string;
    city: string;
}): string {
    const trimmed = input.title?.trim();
    if (trimmed) return trimmed;
    return buildPropertyTitle({
        bhk: input.bhk,
        propertyType: input.propertyType as PropertyType,
        locality: input.locality,
        city: input.city,
    });
}

export function listingFromCreateInput(
    id: string,
    input: CreateMyListingInput,
    now = new Date().toISOString(),
): MyListingItem {
    const imageSrcs = input.imageSrcs.length > 0 ? input.imageSrcs : ["/properties/1.jpg"];
    const status: MyListingStatus = input.publish ? "published" : "draft";
    const category: MyListingCategory =
        input.category ?? categoryForPropertyType(input.propertyType as PropertyType);

    return {
        id,
        title: resolveTitle(input),
        configLabel: configLabelFor(input.bhk, input.propertyType),
        category,
        propertyType: input.propertyType,
        propertyTypeLabel: PROPERTY_TYPE_LABELS[input.propertyType as PropertyType],
        bhk: input.bhk,
        locality: input.locality,
        city: input.city,
        address: input.address,
        pinCode: input.pinCode,
        transactionType: input.transactionType,
        saleAmountInr: input.saleAmountInr,
        rentAmountInr: input.rentAmountInr,
        areaSqft: input.areaSqft,
        furnishing: input.furnishing,
        furnishingLabel: FURNISHING_LABELS[input.furnishing],
        bathrooms: input.bathrooms,
        balconies: input.balconies,
        floorNumber: input.floorNumber,
        totalFloors: input.totalFloors,
        facing: input.facing,
        parking: input.parking,
        maintenanceInr: input.maintenanceInr,
        description: input.description,
        amenities: input.amenities,
        availableFrom: input.availableFrom,
        status,
        inboundRequestCount: 0,
        listedDaysAgo: 0,
        photoCount: imageSrcs.length,
        imageSrc: imageSrcs[0]!,
        imageSrcs,
        createdAt: now,
        updatedAt: now,
    };
}

export function applyListingUpdate(
    item: MyListingItem,
    input: UpdateMyListingInput,
): MyListingItem {
    const next: MyListingItem = { ...item };

    if (input.transactionType != null) next.transactionType = input.transactionType;
    if (input.category != null) next.category = input.category;
    if (input.propertyType != null) {
        next.propertyType = input.propertyType;
        next.propertyTypeLabel = PROPERTY_TYPE_LABELS[input.propertyType as PropertyType];
        if (input.category == null) {
            next.category = categoryForPropertyType(input.propertyType as PropertyType);
        }
    }
    if (input.bhk != null) next.bhk = input.bhk;
    if (input.locality != null) next.locality = input.locality;
    if (input.city != null) next.city = input.city;
    if (input.address != null) next.address = input.address;
    if (input.pinCode != null) next.pinCode = input.pinCode;
    if (input.saleAmountInr !== undefined) next.saleAmountInr = input.saleAmountInr;
    if (input.rentAmountInr !== undefined) next.rentAmountInr = input.rentAmountInr;
    if (input.areaSqft != null) next.areaSqft = input.areaSqft;
    if (input.furnishing != null) {
        next.furnishing = input.furnishing;
        next.furnishingLabel = FURNISHING_LABELS[input.furnishing];
    }
    if (input.imageSrcs != null) {
        next.imageSrcs = input.imageSrcs.length > 0 ? input.imageSrcs : ["/properties/1.jpg"];
        next.imageSrc = next.imageSrcs[0]!;
        next.photoCount = next.imageSrcs.length;
    }
    if (input.bathrooms !== undefined) next.bathrooms = input.bathrooms;
    if (input.balconies !== undefined) next.balconies = input.balconies;
    if (input.floorNumber !== undefined) next.floorNumber = input.floorNumber;
    if (input.totalFloors !== undefined) next.totalFloors = input.totalFloors;
    if (input.facing !== undefined) next.facing = input.facing;
    if (input.parking != null) next.parking = input.parking;
    if (input.maintenanceInr !== undefined) next.maintenanceInr = input.maintenanceInr;
    if (input.availableFrom !== undefined) next.availableFrom = input.availableFrom;
    if (input.description != null) next.description = input.description;
    if (input.amenities != null) next.amenities = input.amenities;
    if (input.status != null) next.status = input.status;
    else if (input.publish === true) next.status = "published";
    else if (input.publish === false && next.status === "published") next.status = "draft";

    next.configLabel = configLabelFor(next.bhk, next.propertyType);
    next.title = resolveTitle({
        title: input.title ?? next.title,
        bhk: next.bhk,
        propertyType: next.propertyType,
        locality: next.locality,
        city: next.city,
    });
    next.updatedAt = new Date().toISOString();

    return next;
}

const SEED_AMENITIES: MyListingAmenity[][] = [
    ["parking", "lift", "security"],
    ["parking", "lift", "power_backup", "gym"],
    ["parking", "garden"],
    ["parking", "lift", "security", "power_backup"],
    ["parking"],
    ["lift", "security"],
    ["parking", "lift", "gym", "garden"],
    ["parking", "security"],
];

type SeedDraft = Omit<
    MyListingItem,
    | "category"
    | "bathrooms"
    | "balconies"
    | "floorNumber"
    | "totalFloors"
    | "facing"
    | "parking"
    | "maintenanceInr"
> & {
    category?: MyListingCategory;
    bathrooms?: number | null;
    balconies?: number | null;
    floorNumber?: number | null;
    totalFloors?: number | null;
    facing?: MyListingItem["facing"];
    parking?: MyListingParking;
    maintenanceInr?: number | null;
};

function hydrateSeed(item: SeedDraft): MyListingItem {
    return {
        ...item,
        category: item.category ?? categoryForPropertyType(item.propertyType as PropertyType),
        parking: item.parking ?? "1",
        bathrooms: item.bathrooms ?? null,
        balconies: item.balconies ?? null,
        floorNumber: item.floorNumber ?? null,
        totalFloors: item.totalFloors ?? null,
        facing: item.facing ?? null,
        maintenanceInr: item.maintenanceInr ?? null,
    };
}

const SEED_DRAFTS: SeedDraft[] = [
    {
        id: "own_001",
        title: "3 BHK · Vesu",
        configLabel: "3 BHK",
        propertyType: "apartment",
        propertyTypeLabel: "Apartment",
        bhk: 3,
        locality: "Vesu",
        city: "Surat",
        address: "12 Green Avenue, Vesu",
        pinCode: "395007",
        transactionType: "sale",
        saleAmountInr: 11_500_000,
        rentAmountInr: null,
        areaSqft: 1680,
        furnishing: "semi",
        furnishingLabel: "Semi-furnished",
        description:
            "Spacious 3 BHK with balcony facing the society garden. Close to VR Mall and schools.",
        amenities: SEED_AMENITIES[0]!,
        availableFrom: null,
        status: "published",
        inboundRequestCount: 2,
        listedDaysAgo: 4,
        photoCount: 6,
        imageSrc: "/properties/1.jpg",
        imageSrcs: [
            "/properties/1.jpg",
            "/properties/2.jpg",
            "/properties/3.jpg",
            "/properties/4.jpg",
            "/properties/5.jpg",
            "/properties/6.jpg",
        ],
        createdAt: daysAgoIso(4),
        updatedAt: daysAgoIso(1),
        bathrooms: 3,
        balconies: 2,
        floorNumber: 6,
        totalFloors: 12,
        facing: "north_east",
        parking: "2",
    },
    {
        id: "own_002",
        title: "2 BHK rent · Adajan",
        configLabel: "2 BHK",
        propertyType: "apartment",
        propertyTypeLabel: "Apartment",
        bhk: 2,
        locality: "Adajan",
        city: "Surat",
        address: "B-402 Palm Heights, Adajan",
        pinCode: "395009",
        transactionType: "rent",
        saleAmountInr: null,
        rentAmountInr: 22_000,
        areaSqft: 1050,
        furnishing: "furnished",
        furnishingLabel: "Furnished",
        description:
            "Ready-to-move 2 BHK on a quiet lane near Pal Bridge. Ideal for a small family.",
        amenities: SEED_AMENITIES[1]!,
        availableFrom: daysAgoIso(-7).slice(0, 10),
        status: "published",
        inboundRequestCount: 1,
        listedDaysAgo: 9,
        photoCount: 5,
        imageSrc: "/properties/2.jpg",
        imageSrcs: [
            "/properties/2.jpg",
            "/properties/4.jpg",
            "/properties/6.jpg",
            "/properties/1.jpg",
            "/properties/3.jpg",
        ],
        createdAt: daysAgoIso(9),
        updatedAt: daysAgoIso(3),
        bathrooms: 2,
        balconies: 1,
        floorNumber: 4,
        totalFloors: 10,
        parking: "1",
        maintenanceInr: 2500,
    },
    {
        id: "own_003",
        title: "4 BHK · Piplod",
        configLabel: "4 BHK",
        propertyType: "villa",
        propertyTypeLabel: "Villa",
        bhk: 4,
        locality: "Piplod",
        city: "Surat",
        address: "Villa 7, Lakeview Estate, Piplod",
        pinCode: "395007",
        transactionType: "sale",
        saleAmountInr: 28_000_000,
        rentAmountInr: null,
        areaSqft: 3200,
        furnishing: "unfurnished",
        furnishingLabel: "Unfurnished",
        description: "Independent villa with private parking for two cars and a small lawn.",
        amenities: SEED_AMENITIES[2]!,
        availableFrom: null,
        status: "draft",
        inboundRequestCount: 0,
        listedDaysAgo: 1,
        photoCount: 5,
        imageSrc: "/properties/3.jpg",
        imageSrcs: [
            "/properties/3.jpg",
            "/properties/5.jpg",
            "/properties/1.jpg",
            "/properties/6.jpg",
            "/properties/2.jpg",
        ],
        createdAt: daysAgoIso(1),
        updatedAt: daysAgoIso(1),
        bathrooms: 4,
        balconies: 3,
        parking: "2",
    },
    {
        id: "own_004",
        title: "1 BHK · Pal",
        configLabel: "1 BHK",
        propertyType: "apartment",
        propertyTypeLabel: "Apartment",
        bhk: 1,
        locality: "Pal",
        city: "Surat",
        address: "A-110 Silver Nest, Pal",
        pinCode: "395009",
        transactionType: "sale",
        saleAmountInr: 4_200_000,
        rentAmountInr: null,
        areaSqft: 620,
        furnishing: "semi",
        furnishingLabel: "Semi-furnished",
        description: "Compact 1 BHK near Pal Gam circle. Good for first-time buyers.",
        amenities: SEED_AMENITIES[3]!,
        availableFrom: null,
        status: "published",
        inboundRequestCount: 0,
        listedDaysAgo: 14,
        photoCount: 4,
        imageSrc: "/properties/4.jpg",
        imageSrcs: [
            "/properties/4.jpg",
            "/properties/5.jpg",
            "/properties/2.jpg",
            "/properties/3.jpg",
        ],
        createdAt: daysAgoIso(14),
        updatedAt: daysAgoIso(5),
        bathrooms: 1,
        balconies: 1,
        floorNumber: 1,
        totalFloors: 7,
    },
    {
        id: "own_005",
        title: "Shop · Ring Road",
        configLabel: "Shop",
        propertyType: "shop",
        propertyTypeLabel: "Shop",
        bhk: 0,
        locality: "Ring Road",
        city: "Surat",
        address: "Shop 18, Textile Market, Ring Road",
        pinCode: "395002",
        transactionType: "both",
        saleAmountInr: 6_500_000,
        rentAmountInr: 45_000,
        areaSqft: 380,
        furnishing: "unfurnished",
        furnishingLabel: "Unfurnished",
        description: "Ground-floor shop with frontage on Ring Road. High footfall area.",
        amenities: SEED_AMENITIES[4]!,
        availableFrom: null,
        status: "unpublished",
        inboundRequestCount: 0,
        listedDaysAgo: 21,
        photoCount: 5,
        imageSrc: "/properties/5.jpg",
        imageSrcs: [
            "/properties/5.jpg",
            "/properties/6.jpg",
            "/properties/3.jpg",
            "/properties/4.jpg",
            "/properties/1.jpg",
        ],
        createdAt: daysAgoIso(21),
        updatedAt: daysAgoIso(2),
        category: "commercial",
        parking: "none",
        floorNumber: 0,
        totalFloors: 3,
    },
    {
        id: "own_006",
        title: "3 BHK rent · City Light",
        configLabel: "3 BHK",
        propertyType: "apartment",
        propertyTypeLabel: "Apartment",
        bhk: 3,
        locality: "City Light",
        city: "Surat",
        address: "C-801 Horizon Towers, City Light",
        pinCode: "395007",
        transactionType: "rent",
        saleAmountInr: null,
        rentAmountInr: 35_000,
        areaSqft: 1450,
        furnishing: "furnished",
        furnishingLabel: "Furnished",
        description: "Fully furnished flat with sea-facing balcony. Society has pool and gym.",
        amenities: SEED_AMENITIES[5]!,
        availableFrom: daysAgoIso(-3).slice(0, 10),
        status: "published",
        inboundRequestCount: 3,
        listedDaysAgo: 6,
        photoCount: 5,
        imageSrc: "/properties/6.jpg",
        imageSrcs: [
            "/properties/6.jpg",
            "/properties/1.jpg",
            "/properties/2.jpg",
            "/properties/5.jpg",
            "/properties/4.jpg",
        ],
        createdAt: daysAgoIso(6),
        updatedAt: daysAgoIso(0),
        bathrooms: 3,
        balconies: 2,
        floorNumber: 8,
        totalFloors: 14,
        facing: "west",
        parking: "2",
        maintenanceInr: 4500,
    },
    {
        id: "own_007",
        title: "2 BHK · Althan",
        configLabel: "2 BHK",
        propertyType: "apartment",
        propertyTypeLabel: "Apartment",
        bhk: 2,
        locality: "Althan",
        city: "Surat",
        address: "Flat 305, Riverfront Residency, Althan",
        pinCode: "395017",
        transactionType: "sale",
        saleAmountInr: 7_800_000,
        rentAmountInr: null,
        areaSqft: 1120,
        furnishing: "semi",
        furnishingLabel: "Semi-furnished",
        description: "Corner flat with cross ventilation. Near Althan canal road.",
        amenities: SEED_AMENITIES[6]!,
        availableFrom: null,
        status: "draft",
        inboundRequestCount: 0,
        listedDaysAgo: 0,
        photoCount: 4,
        imageSrc: "/properties/1.jpg",
        imageSrcs: [
            "/properties/1.jpg",
            "/properties/4.jpg",
            "/properties/6.jpg",
            "/properties/2.jpg",
        ],
        createdAt: daysAgoIso(0),
        updatedAt: daysAgoIso(0),
        bathrooms: 2,
        balconies: 1,
        floorNumber: 3,
        totalFloors: 9,
    },
    {
        id: "own_008",
        title: "Office · VIP Road",
        configLabel: "Office",
        propertyType: "office",
        propertyTypeLabel: "Office",
        bhk: 0,
        locality: "VIP Road",
        city: "Surat",
        address: "302 Business Hub, VIP Road",
        pinCode: "395007",
        transactionType: "rent",
        saleAmountInr: null,
        rentAmountInr: 55_000,
        areaSqft: 900,
        furnishing: "furnished",
        furnishingLabel: "Furnished",
        description: "Furnished office cabin with reception area. Covered parking included.",
        amenities: SEED_AMENITIES[7]!,
        availableFrom: null,
        status: "published",
        inboundRequestCount: 0,
        listedDaysAgo: 11,
        photoCount: 5,
        imageSrc: "/properties/3.jpg",
        imageSrcs: [
            "/properties/3.jpg",
            "/properties/4.jpg",
            "/properties/1.jpg",
            "/properties/5.jpg",
            "/properties/6.jpg",
        ],
        createdAt: daysAgoIso(11),
        updatedAt: daysAgoIso(4),
        category: "commercial",
        parking: "1",
        floorNumber: 3,
        totalFloors: 8,
        maintenanceInr: 8000,
    },
];

export const MOCK_MY_LISTINGS_SEED: MyListingItem[] = SEED_DRAFTS.map(hydrateSeed);

export const MOCK_BROKER_REQUESTS: BrokerRequestsResult = {
    counts: { approved: 3, pending: 4, declined: 2 },
    quota: { limit: 10, used: 8, remaining: 2, resetsOn: "2026-09-30" },
    items: [
        {
            id: "req_042",
            type: "approved_untouched",
            propertyId: "pr_108",
            title: "3 BHK · Vesu",
            amountInr: 11_500_000,
            isRent: false,
            approvedAt: "2026-09-05T09:10:00+05:30",
            daysSince: 2,
            note: "Approved 2 days ago · no client added yet",
            action: { label: "Open", href: "/broker/properties/pr_108" },
        },
        {
            id: "req_039",
            type: "approved",
            propertyId: "pr_099",
            title: "1 BHK · Pal",
            amountInr: 4_200_000,
            isRent: false,
            approvedAt: "2026-09-06T14:00:00+05:30",
            daysSince: 1,
            note: "Approved · 1 client attached",
            action: { label: "Open", href: "/broker/properties/pr_099" },
        },
        {
            id: "req_055",
            type: "approved",
            propertyId: "pr_088",
            title: "2 BHK rent · Piplod",
            amountInr: 28_000,
            isRent: true,
            approvedAt: "2026-09-03T11:20:00+05:30",
            daysSince: 4,
            note: "Approved · 2 clients attached",
            action: { label: "Open", href: "/broker/properties/pr_088" },
        },
        {
            id: "req_047",
            type: "pending_stale",
            propertyId: "pr_121",
            title: "2 BHK rent · Adajan",
            amountInr: 22_000,
            isRent: true,
            requestedAt: "2026-09-01T16:40:00+05:30",
            daysWaiting: 6,
            ownerSeen: false,
            note: "Waiting 6 days · owner hasn't opened",
            action: { label: "Nudge", href: "/broker/owner-listings" },
        },
        {
            id: "req_051",
            type: "pending",
            propertyId: "pr_130",
            title: "4 BHK · Vesu",
            amountInr: 18_500_000,
            isRent: false,
            requestedAt: "2026-09-05T10:00:00+05:30",
            daysWaiting: 2,
            ownerSeen: true,
            note: "Waiting on owner · viewed yesterday",
            action: { label: "View", href: "/broker/owner-listings" },
        },
        {
            id: "req_060",
            type: "pending",
            propertyId: "pr_140",
            title: "Shop · Ring Road",
            amountInr: 45_000,
            isRent: true,
            requestedAt: "2026-09-06T18:15:00+05:30",
            daysWaiting: 1,
            ownerSeen: false,
            note: "Sent yesterday · waiting for a reply",
            action: { label: "View", href: "/broker/owner-listings" },
        },
        {
            id: "req_061",
            type: "pending",
            propertyId: "pr_141",
            title: "3 BHK · City Light",
            amountInr: 12_200_000,
            isRent: false,
            requestedAt: "2026-09-07T08:30:00+05:30",
            daysWaiting: 0,
            ownerSeen: false,
            note: "Sent today · waiting for a reply",
            action: { label: "View", href: "/broker/owner-listings" },
        },
        {
            id: "req_033",
            type: "declined",
            propertyId: "pr_095",
            title: "2 BHK · Adajan",
            amountInr: 6_800_000,
            isRent: false,
            daysSince: 8,
            note: "Owner declined · no reason given",
            action: { label: "Browse similar", href: "/broker/owner-listings" },
        },
        {
            id: "req_028",
            type: "declined",
            propertyId: "pr_092",
            title: "3 BHK · Pal",
            amountInr: 9_200_000,
            isRent: false,
            daysSince: 12,
            note: "Owner declined · already has enough brokers",
            action: { label: "Browse similar", href: "/broker/owner-listings" },
        },
    ] satisfies BrokerRequestItem[],
};
