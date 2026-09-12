import { isMockMode, paginateItems } from "@/lib/api/mock-mode";
import {
    type CreatePropertyInput,
    propertiesApi,
    type PropertyListQuery,
    type UpdatePropertyInput,
} from "@/lib/api/properties";

import {
    bhkValuesToApiConfig,
    mapPropertyListingToMyItem,
    myListingInputToCreatePayload,
    myListingInputToUpdatePayload,
    propertyTypeToApiFilters,
    urlsToPhotoFiles,
} from "@/features/properties/your-listings/map-my-listing";
import { MOCK_MY_LISTINGS_SEED } from "@/features/properties/your-listings/mock-my-listings";
import type {
    CreateMyListingInput,
    MyListingItem,
    MyListingsFilters,
    MyListingsResult,
    MyListingStatus,
    UpdateMyListingInput,
} from "@/features/properties/your-listings/types";
import { DEFAULT_MY_LISTINGS_FILTERS } from "@/features/properties/your-listings/types";

const PAGE_SIZE = 20;

let mockMyListings: MyListingItem[] = MOCK_MY_LISTINGS_SEED.map((item) => ({
    ...item,
    imageSrcs: [...item.imageSrcs],
    amenities: [...item.amenities],
}));

function filterMockMyListings(filters: MyListingsFilters): MyListingItem[] {
    const needle = filters.q.trim().toLowerCase();
    let items = mockMyListings.filter((item) => {
        if (needle) {
            const hay = [item.title, item.locality, item.city, item.configLabel]
                .join(" ")
                .toLowerCase();
            if (!hay.includes(needle)) return false;
        }
        if (filters.type === "sale" && item.transactionType === "rent") return false;
        if (filters.type === "rent" && item.transactionType === "sale") return false;
        if (filters.propertyType && item.propertyType !== filters.propertyType) return false;
        if (filters.bhk.length && !filters.bhk.includes(String(item.bhk))) return false;
        if (filters.status && item.status !== filters.status) return false;
        return true;
    });

    items = [...items].sort((a, b) => {
        const aAmount = a.saleAmountInr ?? a.rentAmountInr ?? 0;
        const bAmount = b.saleAmountInr ?? b.rentAmountInr ?? 0;
        if (filters.sort === "price_asc") return aAmount - bAmount;
        if (filters.sort === "price_desc") return bAmount - aAmount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return items;
}

function mockMyListingsSummary(): MyListingsSummary {
    return {
        total: mockMyListings.length,
        published: mockMyListings.filter((item) => item.status === "published").length,
        draft: mockMyListings.filter((item) => item.status === "draft").length,
        unpublished: mockMyListings.filter((item) => item.status === "unpublished").length,
        sale: mockMyListings.filter((item) => item.transactionType !== "rent").length,
        rent: mockMyListings.filter((item) => item.transactionType !== "sale").length,
    };
}

export type MyListingsSummary = {
    total: number;
    published: number;
    draft: number;
    unpublished: number;
    sale: number;
    rent: number;
};

function filtersToQuery(filters: MyListingsFilters): PropertyListQuery | null {
    // API only has draft | published — unpublished is a UI-only state with no rows.
    if (filters.status === "unpublished") {
        return null;
    }

    const typeFilters = propertyTypeToApiFilters(filters.propertyType);
    return {
        search: filters.q.trim() || undefined,
        transactionType: filters.type || undefined,
        ...typeFilters,
        bhkConfig: filters.bhk.length > 0 ? bhkValuesToApiConfig(filters.bhk) : undefined,
        publishStatus:
            filters.status === "draft" || filters.status === "published"
                ? filters.status
                : undefined,
        sort: filters.sort,
        page: filters.page,
        limit: PAGE_SIZE,
    };
}

export const myListingsApi = {
    async summary(): Promise<MyListingsSummary> {
        if (isMockMode()) {
            return mockMyListingsSummary();
        }
        const [options, salePage, rentPage] = await Promise.all([
            propertiesApi.options(),
            propertiesApi.list({ transactionType: "sale", limit: 1 }),
            propertiesApi.list({ transactionType: "rent", limit: 1 }),
        ]);

        return {
            total: options.counts.total,
            published: options.counts.published,
            draft: options.counts.draft,
            unpublished: 0,
            sale: salePage.total,
            rent: rentPage.total,
        };
    },

    async list(
        filters: Partial<MyListingsFilters> = {},
        signal?: AbortSignal,
    ): Promise<MyListingsResult> {
        const merged: MyListingsFilters = { ...DEFAULT_MY_LISTINGS_FILTERS, ...filters };
        if (isMockMode()) {
            const matched = filterMockMyListings(merged);
            const paged = paginateItems(matched, merged.page, PAGE_SIZE);
            return {
                items: paged.items,
                total: paged.total,
                page: paged.page,
                totalPages: paged.totalPages,
            };
        }
        const query = filtersToQuery(merged);
        if (!query) {
            return { items: [], total: 0, page: 1, totalPages: 1 };
        }

        const page = await propertiesApi.list(query, signal);
        return {
            items: page.items.map(mapPropertyListingToMyItem),
            total: page.total,
            page: page.page,
            totalPages: Math.max(1, page.totalPages),
        };
    },

    async get(propertyId: string): Promise<MyListingItem | null> {
        if (isMockMode()) {
            return mockMyListings.find((item) => item.id === propertyId) ?? null;
        }
        try {
            const listing = await propertiesApi.get(propertyId);
            return mapPropertyListingToMyItem(listing);
        } catch {
            return null;
        }
    },

    async create(input: CreateMyListingInput): Promise<MyListingItem> {
        if (isMockMode()) {
            const created: MyListingItem = {
                id: `ml_${Date.now()}`,
                title: input.title,
                configLabel: input.bhk > 0 ? `${input.bhk} BHK` : input.propertyType,
                category: input.category,
                propertyType: input.propertyType,
                propertyTypeLabel: input.propertyType,
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
                furnishingLabel:
                    input.furnishing === "furnished"
                        ? "Furnished"
                        : input.furnishing === "semi"
                          ? "Semi-furnished"
                          : "Unfurnished",
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
                status: input.publish ? "published" : "draft",
                inboundRequestCount: 0,
                listedDaysAgo: 0,
                photoCount: input.imageSrcs.length,
                imageSrc: input.imageSrcs[0] ?? "",
                imageSrcs: input.imageSrcs,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            mockMyListings = [created, ...mockMyListings];
            return created;
        }
        const photos = input.photoFiles?.length
            ? input.photoFiles
            : await urlsToPhotoFiles(input.imageSrcs.filter((src) => !src.startsWith("blob:")));
        const payload = myListingInputToCreatePayload(input) as CreatePropertyInput;
        const created = await propertiesApi.create({ ...payload, photos });
        return mapPropertyListingToMyItem(created);
    },

    async update(propertyId: string, input: UpdateMyListingInput): Promise<MyListingItem | null> {
        if (isMockMode()) {
            const index = mockMyListings.findIndex((item) => item.id === propertyId);
            if (index < 0) return null;
            const current = mockMyListings[index]!;
            const next: MyListingItem = {
                ...current,
                ...input,
                imageSrcs: input.imageSrcs ?? current.imageSrcs,
                imageSrc: (input.imageSrcs ?? current.imageSrcs)[0] ?? current.imageSrc,
                updatedAt: new Date().toISOString(),
            };
            mockMyListings[index] = next;
            return next;
        }
        try {
            const existing = await propertiesApi.get(propertyId);
            const existingPhotos = (existing.photos ?? []).filter(Boolean);
            const nextPhotos = input.imageSrcs;

            let photos: File[] | undefined;
            let deletePhotoUrls: string[] | undefined;

            if (nextPhotos) {
                const keptRemote = nextPhotos.filter((src) => existingPhotos.includes(src));
                deletePhotoUrls = existingPhotos.filter((src) => !keptRemote.includes(src));
                photos = input.photoFiles?.length
                    ? input.photoFiles
                    : await urlsToPhotoFiles(
                          nextPhotos.filter(
                              (src) => !existingPhotos.includes(src) && !src.startsWith("blob:"),
                          ),
                      );
            }

            const fields = myListingInputToUpdatePayload(input) as UpdatePropertyInput;
            const updated = await propertiesApi.update(propertyId, {
                ...fields,
                ...(photos?.length ? { photos } : {}),
                ...(deletePhotoUrls?.length ? { deletePhotoUrls } : {}),
            });
            return mapPropertyListingToMyItem(updated);
        } catch {
            return null;
        }
    },

    async setStatus(propertyId: string, status: MyListingStatus): Promise<MyListingItem | null> {
        if (isMockMode()) {
            return this.update(propertyId, { status });
        }
        try {
            const publishStatus = status === "published" ? "published" : "draft";
            const updated = await propertiesApi.setPublication(propertyId, publishStatus);
            return mapPropertyListingToMyItem(updated);
        } catch {
            return null;
        }
    },

    async remove(_propertyId: string): Promise<boolean> {
        // Inventory delete is not exposed by the API yet.
        return false;
    },
};
