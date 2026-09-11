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
        try {
            const listing = await propertiesApi.get(propertyId);
            return mapPropertyListingToMyItem(listing);
        } catch {
            return null;
        }
    },

    async create(input: CreateMyListingInput): Promise<MyListingItem> {
        const photos = input.photoFiles?.length
            ? input.photoFiles
            : await urlsToPhotoFiles(input.imageSrcs.filter((src) => !src.startsWith("blob:")));
        const payload = myListingInputToCreatePayload(input) as CreatePropertyInput;
        const created = await propertiesApi.create({ ...payload, photos });
        return mapPropertyListingToMyItem(created);
    },

    async update(propertyId: string, input: UpdateMyListingInput): Promise<MyListingItem | null> {
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
