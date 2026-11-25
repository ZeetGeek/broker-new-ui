import { ApiError, apiFetch } from "@/lib/api/client";
import { type AttachedClientRef, attachedClientsByProperty } from "@/lib/api/clients";
import { isMockMode, paginateItems } from "@/lib/api/mock-mode";
import type { PropertyListing } from "@/lib/api/properties";
import {
    type CreatePropertyInput,
    propertiesApi,
    type PropertyListQuery,
    type UpdatePropertyInput,
} from "@/lib/api/properties";
import {
    collectPropertyPages,
    matchesPropertyCriteria,
    propertyCriteriaCount,
} from "@/lib/properties/list-criteria";
import { collectPeopleFilterOptions, matchesPeopleFilters } from "@/lib/properties/people-filters";
import { pinnedPropertiesFirst } from "@/lib/properties/pinned-properties";
import { matchesListingSearch } from "@/lib/search/crm-search";
import { withTestNetwork } from "@/lib/testing/test-network";

import type { OwnerContactForm } from "@/features/contacts/contact-form-model";
import { moneyToRupees } from "@/features/contacts/contact-form-model";
import {
    bhkValuesToApiConfig,
    mapPropertyListingToMyItem,
    myListingInputToCreatePayload,
    myListingInputToUpdatePayload,
    photoOrderForUpdate,
    propertyTypeToApiFilters,
    urlsToPhotoFiles,
} from "@/features/properties/your-listings/map-my-listing";
import {
    applyListingUpdate,
    MOCK_MY_LISTINGS_SEED,
} from "@/features/properties/your-listings/mock-my-listings";
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
    nearbyPlaces: [...(item.nearbyPlaces ?? [])],
    suitableFor: [...(item.suitableFor ?? [])],
    cabins: item.cabins ?? null,
    meetingRooms: item.meetingRooms ?? null,
    workstations: item.workstations ?? null,
    ceilingHeightFt: item.ceilingHeightFt ?? null,
}));

/** Shared sample inventory for property pickers and detail pages. */
export function getMockMyListings(): MyListingItem[] {
    return mockMyListings;
}

function filterMyListings(filters: MyListingsFilters, source = mockMyListings): MyListingItem[] {
    let items = source.filter((item) => {
        if (!matchesListingSearch(item, filters.q)) return false;
        if (filters.type === "sale" && item.transactionType === "rent") return false;
        if (filters.type === "rent" && item.transactionType === "sale") return false;
        if (
            filters.propertyType &&
            item.propertyType !== filters.propertyType &&
            item.subtype !== filters.propertyType
        ) {
            return false;
        }
        if (filters.bhk.length && !filters.bhk.includes(String(item.bhk))) return false;
        if (filters.status === "deleted") {
            if (!item.deletedAt) return false;
        } else {
            if (item.deletedAt) return false;
            if (filters.status === "sold") {
                if (!item.isSold) return false;
            } else if (filters.status) {
                if (item.isSold || item.status !== filters.status) return false;
            }
        }
        if (
            !matchesPeopleFilters(
                item.exclusiveOwnerId ?? item.ownerId,
                item.attachedClients ?? [],
                filters,
            )
        )
            return false;
        if (!matchesListingCriteria(item, filters)) return false;
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

function matchesListingCriteria(item: MyListingItem, filters: MyListingsFilters) {
    return matchesPropertyCriteria(
        {
            ...item,
            propertyAge: item.propertyAge == null ? null : String(item.propertyAge),
            listedAt: item.publishedAt ?? item.createdAt,
            parkingSpaces:
                item.parkingSpaces ??
                (item.parking === "3plus" ? 3 : item.parking === "none" ? 0 : Number(item.parking)),
        },
        { ...filters.propertyFilters, type: filters.type },
    );
}

function mockMyListingsSummary(): MyListingsSummary {
    const live = mockMyListings.filter((item) => !item.deletedAt);
    return {
        total: live.length,
        published: live.filter((item) => item.status === "published" && !item.isSold).length,
        draft: live.filter((item) => item.status === "draft" && !item.isSold).length,
        unpublished: live.filter((item) => item.status === "unpublished").length,
        sold: live.filter((item) => item.isSold).length,
        deleted: mockMyListings.length - live.length,
        sale: live.filter((item) => item.transactionType !== "rent").length,
        rent: live.filter((item) => item.transactionType !== "sale").length,
    };
}

export type MyListingsSummary = {
    total: number;
    published: number;
    draft: number;
    unpublished: number;
    sold: number;
    deleted?: number;
    sale: number;
    rent: number;
};

/** Fetch only pins, with bounded concurrency; ignore ones that no longer exist. */
export async function loadPinnedProperties(ids: readonly string[], signal?: AbortSignal) {
    const items: PropertyListing[] = [];
    const uniqueIds = [...new Set(ids)];
    for (let offset = 0; offset < uniqueIds.length; offset += 4) {
        signal?.throwIfAborted();
        const batch = await Promise.all(
            uniqueIds.slice(offset, offset + 4).map(async (id) => {
                try {
                    return await propertiesApi.get(id, signal);
                } catch (error) {
                    if (error instanceof ApiError && error.status === 404) return null;
                    throw error;
                }
            }),
        );
        items.push(...batch.filter((item): item is PropertyListing => item !== null));
    }
    return items;
}

function filtersToQuery(filters: MyListingsFilters): PropertyListQuery | null {
    const typeFilters = propertyTypeToApiFilters(filters.propertyType);
    return {
        // Searched on the server: title, address, owner, attached clients, PIN, phone.
        search: filters.q.trim() || undefined,
        transactionType: filters.type || undefined,
        ...typeFilters,
        bhkConfig: filters.bhk.length > 0 ? bhkValuesToApiConfig(filters.bhk) : undefined,
        publishStatus:
            filters.status === "draft" || filters.status === "published"
                ? filters.status
                : undefined,
        status: filters.status === "sold" ? "sold" : undefined,
        excludeSold:
            filters.status === "published" || filters.status === "draft" ? true : undefined,
        deleted: filters.status === "deleted" ? "only" : undefined,
        sort: filters.sort,
        page: filters.page,
        limit: PAGE_SIZE,
    };
}

export const myListingsApi = withTestNetwork({
    async summary(): Promise<MyListingsSummary> {
        if (isMockMode()) {
            return mockMyListingsSummary();
        }
        const [published, draft, sold, deleted, salePage, rentPage] = await Promise.all([
            propertiesApi.list({ publishStatus: "published", excludeSold: true, limit: 1 }),
            propertiesApi.list({ publishStatus: "draft", excludeSold: true, limit: 1 }),
            propertiesApi.list({ status: "sold", limit: 1 }),
            propertiesApi.list({ deleted: "only", limit: 1 }),
            propertiesApi.list({ transactionType: "sale", limit: 1 }),
            propertiesApi.list({ transactionType: "rent", limit: 1 }),
        ]);
        return {
            total: published.total + draft.total + sold.total,
            published: published.total,
            draft: draft.total,
            unpublished: 0,
            sold: sold.total,
            deleted: deleted.total,
            sale: salePage.total,
            rent: rentPage.total,
        };
    },

    async list(
        filters: Partial<MyListingsFilters> = {},
        signal?: AbortSignal,
        /** Owners have no buyer book, so skip the leads scan for them. */
        options: {
            withAttachedClients?: boolean;
            attachedClients?: () => Promise<Map<string, AttachedClientRef[]>>;
            propertyCollection?: (query: PropertyListQuery) => Promise<PropertyListing[]>;
            pinnedProperties?: () => Promise<PropertyListing[]>;
            /** Browser-local inventory pins, applied before pagination. */
            pinnedIds?: readonly string[];
        } = {},
    ): Promise<MyListingsResult> {
        const { withAttachedClients = true } = options;
        const merged: MyListingsFilters = { ...DEFAULT_MY_LISTINGS_FILTERS, ...filters };
        const attachedPromise = (
            withAttachedClients || merged.clientId
                ? (options.attachedClients ?? attachedClientsByProperty)()
                : Promise.resolve(new Map<string, AttachedClientRef[]>())
        ).then(
            (clients) => ({ clients, unavailable: false }),
            (error: unknown) => {
                if (merged.clientId || signal?.aborted) throw error;
                return { clients: new Map<string, AttachedClientRef[]>(), unavailable: true };
            },
        );
        const attach = (
            item: MyListingItem,
            attached: Map<string, AttachedClientRef[]>,
        ): MyListingItem => ({
            ...item,
            attachedClients: (attached.get(item.id) ?? []).map((client) => ({ ...client })),
        });
        if (isMockMode()) {
            const attached = await attachedPromise;
            const matched = filterMyListings(
                merged,
                mockMyListings.map((item) => attach(item, attached.clients)),
            );
            const paged = paginateItems(
                pinnedPropertiesFirst(matched, options.pinnedIds ?? []),
                merged.page,
                PAGE_SIZE,
            );
            return {
                items: paged.items,
                total: paged.total,
                page: paged.page,
                totalPages: paged.totalPages,
                clientsUnavailable: attached.unavailable,
            };
        }
        const query = filtersToQuery(merged)!;
        // Search runs on the server; only filters the API cannot apply yet
        // still need every page collected and filtered here.
        const filterLocally =
            propertyCriteriaCount(merged.propertyFilters) > 0 ||
            Boolean(merged.ownerId || merged.clientId);
        const pinnedIds = merged.status === "deleted" ? [] : (options.pinnedIds ?? []);
        const pinsPromise =
            !filterLocally && pinnedIds.length
                ? (
                      options.pinnedProperties ?? (() => loadPinnedProperties(pinnedIds, signal))
                  )().then(
                      (items) => ({ items, unavailable: false }),
                      (error: unknown) => {
                          if (signal?.aborted) throw error;
                          return { items: [] as PropertyListing[], unavailable: true };
                      },
                  )
                : Promise.resolve({ items: [] as PropertyListing[], unavailable: false });
        const [source, attached, pins] = await Promise.all([
            filterLocally
                ? (options.propertyCollection
                      ? options.propertyCollection({ ...query, page: 1 })
                      : collectPropertyPages((page) =>
                            propertiesApi.list({ ...query, page }, signal),
                        )
                  ).then((items) => ({
                      items,
                      total: items.length,
                      page: merged.page,
                      totalPages: 1,
                  }))
                : propertiesApi.list(query, signal),
            attachedPromise,
            pinsPromise,
        ]);
        const items = source.items
            .map(mapPropertyListingToMyItem)
            .map((item) => attach(item, attached.clients));
        if (filterLocally) {
            // Join people before filtering and paginate only after every API page has been checked.
            const matched = items.filter(
                (item) =>
                    matchesListingCriteria(item, merged) &&
                    matchesPeopleFilters(
                        item.exclusiveOwnerId ?? item.ownerId,
                        item.attachedClients ?? [],
                        merged,
                    ),
            );
            return {
                ...paginateItems(
                    pinnedPropertiesFirst(matched, options.pinnedIds ?? []),
                    merged.page,
                    PAGE_SIZE,
                ),
                clientsUnavailable: attached.unavailable,
            };
        }
        const pinned = filterMyListings(
            merged,
            pins.items
                .map(mapPropertyListingToMyItem)
                .map((item) => attach(item, attached.clients)),
        );
        const pinnedSet = new Set(pinned.map((item) => item.id));
        return {
            // Pins are prepended once. Later server pages omit them; normal pagination
            // and totals stay unchanged, without downloading intervening pages.
            items: [
                ...(merged.page === 1 ? pinned : []),
                ...items.filter((item) => !pinnedSet.has(item.id)),
            ],
            total: source.total,
            page: source.page,
            totalPages: Math.max(1, source.totalPages),
            clientsUnavailable: attached.unavailable,
            pinsUnavailable: pins.unavailable,
        };
    },

    async peopleOptions(signal?: AbortSignal) {
        const attached = await attachedClientsByProperty(signal);
        const listings = isMockMode()
            ? mockMyListings
            : (
                  await Promise.all([
                      collectPropertyPages((page) =>
                          propertiesApi.list({ page, limit: 100 }, signal),
                      ),
                      collectPropertyPages((page) =>
                          propertiesApi.list({ deleted: "only", page, limit: 100 }, signal),
                      ),
                  ])
              )
                  .flat()
                  .map(mapPropertyListingToMyItem);
        return collectPeopleFilterOptions(
            listings.map((item) => {
                const id = item.exclusiveOwnerId ?? item.ownerId;
                return {
                    owner: id && item.ownerName ? { id, name: item.ownerName } : null,
                    clients: attached.get(item.id) ?? [],
                };
            }),
        );
    },

    async get(propertyId: string): Promise<MyListingItem | null> {
        if (isMockMode()) {
            return mockMyListings.find((item) => item.id === propertyId) ?? null;
        }
        try {
            const listing = await propertiesApi.get(propertyId);
            return mapPropertyListingToMyItem(listing);
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) return null;
            throw error;
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
                subtype: input.subtype ?? null,
                propertyTypeLabel: input.propertyType,
                bhk: input.bhk,
                locality: input.locality,
                city: input.city,
                address: input.address,
                pinCode: input.pinCode,
                landmark: input.landmark ?? "",
                society: input.society ?? "",
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
                          : input.furnishing === "unfurnished"
                            ? "Unfurnished"
                            : "",
                bathrooms: input.bathrooms,
                balconies: input.balconies,
                floorNumber: input.floorNumber,
                totalFloors: input.totalFloors,
                facing: input.facing,
                parking: input.parking,
                maintenanceInr: input.maintenanceInr,
                commissionPercent: input.commissionPercent ?? null,
                commissionAmount: input.commissionAmount ?? null,
                securityDeposit: input.securityDeposit ?? null,
                securityDepositMode: input.securityDepositMode ?? null,
                description: input.description,
                amenities: input.amenities,
                nearbyPlaces: input.nearbyPlaces ?? [],
                suitableFor: input.suitableFor ?? [],
                cabins: input.cabins ?? null,
                meetingRooms: input.meetingRooms ?? null,
                workstations: input.workstations ?? null,
                ceilingHeightFt: input.ceilingHeightFt ?? null,
                videoUrl: input.videoUrl ?? "",
                virtualTourUrl: input.virtualTourUrl ?? "",
                availableFrom: input.availableFrom,
                status: input.publish ? "published" : "draft",
                inboundRequestCount: 0,
                listedDaysAgo: 0,
                photoCount: input.imageSrcs.length,
                imageSrc: input.imageSrcs[0] ?? "",
                imageSrcs: input.imageSrcs,
                publishedAt: input.publish ? new Date().toISOString() : null,
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

    async createPrivateFromOwner(
        owner: OwnerContactForm,
        ownerId: string,
        ownerName: string,
    ): Promise<MyListingItem> {
        const rawType = owner.propertyType.toLowerCase();
        const propertyType =
            rawType === "row house" || rawType === "bungalow"
                ? "independent_house"
                : rawType === "apartment" ||
                    rawType === "villa" ||
                    rawType === "plot" ||
                    rawType === "office" ||
                    rawType === "shop" ||
                    rawType === "showroom" ||
                    rawType === "warehouse"
                  ? rawType
                  : "apartment";
        const category =
            propertyType === "plot"
                ? "land"
                : ["office", "shop", "showroom"].includes(propertyType)
                  ? "commercial"
                  : propertyType === "warehouse"
                    ? "industrial"
                    : "residential";
        const input: CreateMyListingInput = {
            transactionType: owner.intent === "sell" ? "sale" : "rent",
            category,
            propertyType,
            bhk: Number(owner.configuration.match(/\d+/)?.[0] ?? 0),
            title: owner.societyName,
            locality: owner.locality,
            city: owner.city || "",
            address: owner.fullAddress,
            pinCode: owner.pincode,
            landmark: "",
            society: owner.societyName || "",
            saleAmountInr:
                owner.intent === "sell"
                    ? moneyToRupees(owner.expectedPrice, owner.priceUnit)
                    : null,
            rentAmountInr: owner.intent !== "sell" ? moneyToRupees(owner.expectedRent) : null,
            areaSqft: Number(owner.carpetArea) || 0,
            furnishing:
                owner.furnishing === "Fully furnished"
                    ? "furnished"
                    : owner.furnishing === "Semi-furnished"
                      ? "semi"
                      : "unfurnished",
            imageSrcs: owner.photos.map((file) => URL.createObjectURL(file)),
            photoFiles: owner.photos,
            bathrooms: Number(owner.bathrooms) || null,
            balconies: Number(owner.balconies) || null,
            floorNumber: Number(owner.floorNumber) || null,
            totalFloors: Number(owner.totalFloors) || null,
            facing: null,
            parking:
                owner.parkingType === "none"
                    ? "none"
                    : Number(owner.parkingCount) >= 3
                      ? "3plus"
                      : owner.parkingCount === "2"
                        ? "2"
                        : "1",
            maintenanceInr: moneyToRupees(owner.maintenance) || null,
            availableFrom: owner.availableFrom || null,
            description: owner.notes,
            amenities: owner.amenities,
            nearbyPlaces: [],
            suitableFor: [],
            cabins: null,
            meetingRooms: null,
            workstations: null,
            ceilingHeightFt: null,
            videoUrl: "",
            virtualTourUrl: "",
            securityDeposit: moneyToRupees(owner.deposit) || null,
            securityDepositMode: moneyToRupees(owner.deposit) ? "amount" : null,
            commissionPercent: null,
            commissionAmount: null,
            publish: false,
        };

        if (isMockMode()) {
            const created = await this.create(input);
            const linked: MyListingItem = {
                ...created,
                ownerId,
                ownerOrigin: "custom",
                ownerName,
                visibility: "private",
                interestedBuyerIds: [],
            };
            const index = mockMyListings.findIndex((item) => item.id === created.id);
            if (index >= 0) mockMyListings[index] = linked;
            return linked;
        }

        const form = new FormData();
        form.set(
            "payload",
            JSON.stringify({
                ...input,
                photoFiles: undefined,
                imageSrcs: undefined,
                ownerId,
                ownerOrigin: "custom",
                visibility: "private",
                interestedBuyerIds: [],
            }),
        );
        owner.photos.forEach((file) => form.append("photos", file));
        const listing = await apiFetch<PropertyListing>("/listings/private", {
            method: "POST",
            body: form,
        });
        return {
            ...mapPropertyListingToMyItem(listing),
            ownerId,
            ownerOrigin: "custom",
            ownerName,
            visibility: "private",
            interestedBuyerIds: [],
        };
    },

    async update(propertyId: string, input: UpdateMyListingInput): Promise<MyListingItem | null> {
        if (isMockMode()) {
            const index = mockMyListings.findIndex((item) => item.id === propertyId);
            if (index < 0) return null;
            const next = applyListingUpdate(mockMyListings[index]!, input);
            mockMyListings[index] = next;
            return next;
        }

        const existing = await propertiesApi.get(propertyId);
        const existingPhotos = (existing.photos ?? []).filter(Boolean);
        const nextPhotos = input.imageSrcs;

        let photos: File[] | undefined;
        let deletePhotoUrls: string[] | undefined;
        let photoOrder: string[] | undefined;

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
            // Keeps the form's cover and order, e.g. a replaced cover stays first.
            photoOrder = photoOrderForUpdate(nextPhotos, existingPhotos, photos.length);
        }

        const fields = myListingInputToUpdatePayload(input) as UpdatePropertyInput;
        const updated = await propertiesApi.update(propertyId, {
            ...fields,
            ...(photos?.length ? { photos } : {}),
            ...(deletePhotoUrls?.length ? { deletePhotoUrls } : {}),
            ...(photoOrder ? { photoOrder } : {}),
        });
        return mapPropertyListingToMyItem(updated);
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

    /** Clear sold availability so the listing can show again. */
    async markAvailable(propertyId: string): Promise<MyListingItem | null> {
        if (isMockMode()) {
            const index = mockMyListings.findIndex((item) => item.id === propertyId);
            if (index < 0) return null;
            const next: MyListingItem = {
                ...mockMyListings[index],
                isSold: false,
                soldAt: null,
                soldReason: null,
                status: "published",
                updatedAt: new Date().toISOString(),
            };
            mockMyListings = [
                ...mockMyListings.slice(0, index),
                next,
                ...mockMyListings.slice(index + 1),
            ];
            return next;
        }
        try {
            const updated = await propertiesApi.markAvailable(propertyId);
            return mapPropertyListingToMyItem(updated);
        } catch {
            return null;
        }
    },

    async restore(propertyId: string): Promise<void> {
        if (isMockMode()) {
            const item = mockMyListings.find((item) => item.id === propertyId && item.deletedAt);
            if (!item) throw new Error("Deleted property not found");
            item.deletedAt = null;
            item.status = "draft";
            return;
        }
        await propertiesApi.restore(propertyId);
    },

    async removePermanently(propertyId: string): Promise<void> {
        if (isMockMode()) {
            const item = mockMyListings.find((item) => item.id === propertyId && item.deletedAt);
            if (!item) throw new Error("Deleted property not found");
            mockMyListings = mockMyListings.filter((item) => item.id !== propertyId);
            return;
        }
        await propertiesApi.removePermanently(propertyId);
    },

    async remove(propertyId: string): Promise<void> {
        if (isMockMode()) {
            mockMyListings = mockMyListings.map((item) =>
                item.id === propertyId ? { ...item, deletedAt: new Date().toISOString() } : item,
            );
            if (!mockMyListings.some((item) => item.id === propertyId)) {
                throw new Error("Property not found");
            }
            return;
        }
        await propertiesApi.moveToDeleted(propertyId);
    },
});
