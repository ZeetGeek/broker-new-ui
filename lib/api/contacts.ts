import { apiFetch } from "@/lib/api/client";
import {
    clientsApi,
    listClientsPageWithLeadSummary,
    listClientsWithLeadSummary,
    type NewBuyerInput,
} from "@/lib/api/clients";
import {
    exclusiveOwnerPhoneDigits,
    exclusiveOwnersApi,
    type ExclusiveOwnerItem,
} from "@/lib/api/exclusive-owners";
import { isMockMode, paginateItems } from "@/lib/api/mock-mode";
import type { InfinitePage } from "@/lib/pagination/infinite-page";
import type { ExclusiveOwnerFormValues } from "@/lib/validation/exclusive-owner";

import {
    type BuyerContactForm,
    emptyBuyerForm,
    emptyOwnerForm,
    moneyToRupees,
    normalizeIndianPhone,
    type OwnerContactForm,
} from "@/features/contacts/contact-form-model";
import type {
    BuyerRow,
    ContactsFilters,
    ContactsSummary,
    OwnerRow,
} from "@/features/contacts/types";
import { DEFAULT_CONTACTS_FILTERS } from "@/features/contacts/types";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import { isLiveStage } from "@/features/pipeline/types";

type ApiOwnerItem = {
    id: string;
    name: string;
    avatarUrl?: string | null;
    phone?: string | null;
    hasActiveRepresentation: boolean;
    propertyCount: number;
    propertyTitles: string[];
    localities: string[];
    totalValueInr: number;
    isAllRent: boolean;
    liveDealCount: number;
    origin?: "platform" | "custom";
    property?: Record<string, unknown> | null;
    price?: Record<string, unknown> | null;
    dealTerms?: Record<string, unknown> | null;
    linkedListingId?: string | null;
    linkedListingTitle?: string | null;
    lastSpokeAt?: string | null;
    status?: string | null;
    tags?: string[] | null;
    notes?: string | null;
    properties?: OwnerRow["properties"];
};

type ApiOwnersResponse = {
    items: ApiOwnerItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
        ownerCount: number;
        lapsedOwnerCount: number;
        platformOwnerCount?: number;
        customOwnerCount?: number;
    };
};

type ApiBuyerItem = Partial<BuyerContactForm> & {
    id: string;
    name: string;
    phone?: string;
    phoneDigits?: string;
    email?: string | null;
    intent?: "buy" | "rent";
    createdAt?: string | null;
    updatedAt?: string | null;
    linkedListingIds?: string[];
};

type ApiBuyersResponse = {
    items: ApiBuyerItem[];
    total: number;
    page: number;
    totalPages: number;
};

const mockAdvancedBuyers = new Map<string, BuyerContactForm>();
const mockCustomOwners: OwnerRow[] = [];
const mockPlatformOwnerTracking = new Map<
    string,
    Pick<OwnerRow, "status" | "lastSpokeAt" | "tags" | "notes">
>();

function mockOwnerRows(): OwnerRow[] {
    const byName = new Map<string, OwnerRow>();
    for (const deal of MOCK_DEALS) {
        const existing = byName.get(deal.owner.name);
        if (!existing) {
            byName.set(deal.owner.name, {
                id: `owner_${deal.owner.name.toLowerCase().replace(/\s+/g, "_")}`,
                name: deal.owner.name,
                avatarUrl: deal.owner.avatarUrl,
                phoneDigits: deal.owner.phoneDigits,
                hasActiveRepresentation: deal.owner.isRepresentationActive,
                propertyCount: 1,
                propertyTitles: [deal.property.title],
                properties: [
                    {
                        id: deal.property.id,
                        title: deal.property.title,
                        locality: deal.property.locality,
                        coverUrl: deal.property.imageSrc,
                        propertyType: deal.property.propertyTypeLabel,
                        configuration: deal.property.configLabel,
                    },
                ],
                localities: [deal.property.locality],
                totalValueInr: deal.property.isRent ? 0 : deal.property.amountInr,
                isAllRent: deal.property.isRent,
                liveDealCount: isLiveStage(deal.status) ? 1 : 0,
                origin: "platform",
            });
            continue;
        }
        existing.propertyCount += 1;
        if (!existing.propertyTitles.includes(deal.property.title)) {
            existing.propertyTitles.push(deal.property.title);
            existing.properties?.push({
                id: deal.property.id,
                title: deal.property.title,
                locality: deal.property.locality,
                coverUrl: deal.property.imageSrc,
                propertyType: deal.property.propertyTypeLabel,
                configuration: deal.property.configLabel,
            });
        }
        if (!existing.localities.includes(deal.property.locality)) {
            existing.localities.push(deal.property.locality);
        }
        if (!deal.property.isRent) existing.totalValueInr += deal.property.amountInr;
        existing.isAllRent = existing.isAllRent && deal.property.isRent;
        if (isLiveStage(deal.status)) existing.liveDealCount += 1;
        existing.hasActiveRepresentation =
            existing.hasActiveRepresentation || deal.owner.isRepresentationActive;
    }
    return [...byName.values()].map((owner) => ({
        ...owner,
        ...mockPlatformOwnerTracking.get(owner.id),
    }));
}

function digitsOnly(value: string | null | undefined): string {
    return (value ?? "").replace(/\D/g, "");
}

function coverFromPhotos(photos: unknown): string | undefined {
    if (!Array.isArray(photos)) return undefined;
    for (const item of photos) {
        if (typeof item === "string" && item.trim()) return item.trim();
        if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            for (const key of ["url", "src", "path", "href"] as const) {
                const value = record[key];
                if (typeof value === "string" && value.trim()) return value.trim();
            }
        }
    }
    return undefined;
}

function toOwnerRow(item: ApiOwnerItem): OwnerRow {
    const phoneDigits = digitsOnly(item.phone);
    const normalized = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;

    const origin = item.origin ?? "platform";
    const details =
        origin === "custom"
            ? ({
                  ...emptyOwnerForm(),
                  ...(item as unknown as Partial<OwnerContactForm>),
                  ...(item.property ?? {}),
                  ...(item.price ?? {}),
                  ...(item.dealTerms ?? {}),
                  idProof: null,
                  photos: [],
                  documents: [],
              } as OwnerContactForm)
            : undefined;

    const properties = item.properties?.map((property) => {
        const photos = (property as { photos?: unknown }).photos;
        return {
            ...property,
            coverUrl: property.coverUrl || coverFromPhotos(photos),
        };
    });

    return {
        id: item.id,
        name: item.name?.trim() || "Owner",
        avatarUrl: item.avatarUrl ?? undefined,
        phoneDigits: item.hasActiveRepresentation && normalized ? normalized : undefined,
        hasActiveRepresentation: Boolean(item.hasActiveRepresentation),
        propertyCount: item.propertyCount ?? 0,
        propertyTitles: item.propertyTitles ?? [],
        properties,
        localities: item.localities?.length ? item.localities : ["—"],
        totalValueInr: Number(item.totalValueInr) || 0,
        isAllRent: Boolean(item.isAllRent),
        liveDealCount: item.liveDealCount ?? 0,
        origin,
        propertyIntent: item.property?.intent as OwnerRow["propertyIntent"],
        propertyType: item.property?.propertyType as string | undefined,
        configuration: item.property?.configuration as string | undefined,
        linkedListingId: item.linkedListingId,
        linkedListingTitle: item.linkedListingTitle,
        lastSpokeAt: item.lastSpokeAt,
        status: item.status ?? undefined,
        tags: item.tags ?? undefined,
        notes: item.notes ?? undefined,
        details,
    };
}

function toBuyerRow(
    client: Awaited<ReturnType<typeof listClientsWithLeadSummary>>[number],
): BuyerRow {
    return {
        ...client,
        attachedProperties: client.attachedProperties.map((property) => {
            const deal =
                MOCK_DEALS.find(
                    (item) => item.buyer.id === client.id && item.property.id === property.id,
                ) ?? MOCK_DEALS.find((item) => item.property.id === property.id);
            return {
                ...property,
                locality: property.locality ?? deal?.property.locality,
                coverUrl: property.coverUrl || deal?.property.imageSrc,
                propertyType: deal?.property.propertyTypeLabel,
            };
        }),
        details: mockAdvancedBuyers.get(client.id),
    };
}

function apiBuyerToRow(item: ApiBuyerItem): BuyerRow {
    const details: BuyerContactForm = { ...emptyBuyerForm(), ...item };
    const firstType = details.propertyTypes[0]?.toLowerCase();
    const propertyKind =
        firstType === "apartment" || firstType === "plot" || firstType === "office"
            ? firstType
            : firstType === "villa" || firstType === "row house" || firstType === "bungalow"
              ? "villa"
              : firstType === "shop" || firstType === "showroom" || firstType === "warehouse"
                ? "shop"
                : "any";
    const attachedProperties = (item.linkedListingIds ?? []).map((id) => ({
        id,
        leadId: `contact_${item.id}_${id}`,
        title: "Private listing",
    }));
    return {
        id: item.id,
        name: item.name,
        phoneDigits: normalizeIndianPhone(item.phoneDigits ?? item.phone ?? details.phone),
        email: item.email?.trim() || null,
        lookingFor: item.intent ?? details.intent,
        propertyKind,
        preferredLocalities: details.localities,
        budgetMinInr: moneyToRupees(
            details.budgetMin,
            details.intent === "buy" ? details.budgetUnit : undefined,
        ),
        budgetMaxInr: moneyToRupees(
            details.budgetMax,
            details.intent === "buy" ? details.budgetUnit : undefined,
        ),
        bhk: Number(details.configurations[0]?.match(/\d+/)?.[0] ?? 0) || null,
        source: details.source === "reference" ? "referral" : "other",
        notes: details.notes || null,
        lastContactedAt: details.lastSpokeAt || item.updatedAt || item.createdAt || null,
        attachedPropertyCount: attachedProperties.length,
        documents: [],
        liveDealCount: attachedProperties.length,
        closedDealCount: 0,
        activePropertyTitles: attachedProperties.map((property) => property.title),
        attachedProperties,
        leads: [],
        details,
    };
}

function exclusiveOwnerPropertyToCard(
    property: NonNullable<ExclusiveOwnerItem["properties"]>[number],
    fallbackLocality: string,
): NonNullable<OwnerRow["properties"]>[number] {
    return {
        id: property.id,
        title: property.title?.trim() || property.society?.trim() || "Property",
        locality:
            property.society?.trim() ||
            property.address?.trim() ||
            property.city?.trim() ||
            fallbackLocality ||
            "Surat",
        coverUrl: coverFromPhotos(property.photos),
        propertyType: property.propertyType ?? undefined,
        configuration: property.bhkConfig ?? undefined,
    };
}

function exclusiveOwnerToRow(item: ExclusiveOwnerItem): OwnerRow {
    const phoneDigits = exclusiveOwnerPhoneDigits(item.phone);
    const details: OwnerContactForm = {
        ...emptyOwnerForm(),
        name: item.fullName,
        phone: phoneDigits,
        email: item.email ?? "",
        ownerType: item.ownerType,
        societyName: item.society,
        locality: item.area ?? "",
        city: item.city ?? "",
        pincode: item.pincode ?? "",
        fullAddress: item.fullAddress ?? "",
        address: item.fullAddress ?? "",
        reraNumber: item.reraNumber ?? "",
        source: item.source ?? "",
        notes: item.notes ?? "",
        createPrivateListing: false,
    };

    const fallbackLocality = item.area?.trim() || item.city?.trim() || "Surat";
    const properties = (item.properties ?? [])
        .filter((property): property is NonNullable<typeof property> => Boolean(property?.id))
        .map((property) => exclusiveOwnerPropertyToCard(property, fallbackLocality));

    return {
        id: item.id,
        name: item.fullName,
        phoneDigits,
        hasActiveRepresentation: true,
        propertyCount: Math.max(item.propertyCount, properties.length),
        propertyTitles: properties.length
            ? properties.map((property) => property.title)
            : item.society
              ? [item.society]
              : [],
        properties: properties.length ? properties : undefined,
        localities: [item.area, item.city].filter((value): value is string => Boolean(value)),
        totalValueInr: 0,
        isAllRent: false,
        liveDealCount: 0,
        origin: "custom",
        notes: item.notes ?? undefined,
        details,
    };
}

/**
 * Exclusive-owner list often ships only `propertyCount`. Pull the broker’s
 * inventory rows so owner cards can show the same cover stack as buyers.
 */
async function attachExclusiveOwnerListings(
    owners: OwnerRow[],
    signal?: AbortSignal,
): Promise<OwnerRow[]> {
    const customIds = new Set(
        owners
            .filter(
                (owner) =>
                    owner.origin === "custom" &&
                    owner.propertyCount > 0 &&
                    (!owner.properties?.length ||
                        owner.properties.some((property) => !property.coverUrl)),
            )
            .map((owner) => owner.id),
    );
    if (customIds.size === 0) return owners;

    const byOwner = new Map<string, NonNullable<OwnerRow["properties"]>>();
    try {
        let page = 1;
        let totalPages = 1;
        while (page <= totalPages && page <= 5) {
            const response = await apiFetch<{
                items?: Array<{
                    id: string;
                    title?: string | null;
                    city?: string | null;
                    address?: string | null;
                    society?: string | null;
                    photos?: unknown;
                    propertyType?: string | null;
                    bhkConfig?: string | null;
                    exclusiveOwnerId?: string | null;
                    exclusiveOwner?: { id?: string | null } | null;
                }>;
                totalPages?: number;
            }>(`/properties?page=${page}&limit=100`, { signal });

            for (const listing of response.items ?? []) {
                const ownerId = listing.exclusiveOwnerId ?? listing.exclusiveOwner?.id ?? null;
                if (!ownerId || !customIds.has(ownerId)) continue;
                const next = exclusiveOwnerPropertyToCard(
                    {
                        id: listing.id,
                        title: listing.title,
                        city: listing.city,
                        address: listing.address,
                        society: listing.society,
                        photos: listing.photos,
                        propertyType: listing.propertyType,
                        bhkConfig: listing.bhkConfig,
                    },
                    listing.city?.trim() || "Surat",
                );
                const list = byOwner.get(ownerId) ?? [];
                if (!list.some((property) => property.id === next.id)) list.push(next);
                byOwner.set(ownerId, list);
            }

            totalPages = Math.max(1, response.totalPages ?? 1);
            page += 1;
        }
    } catch {
        return owners;
    }

    if (byOwner.size === 0) return owners;

    return owners.map((owner) => {
        const listings = byOwner.get(owner.id);
        if (!listings?.length) return owner;

        // Prefer fetched covers; keep any existing rows that already had photos.
        const existingById = new Map(
            (owner.properties ?? []).map((property) => [property.id, property]),
        );
        const merged = listings.map((listing) => {
            const existing = existingById.get(listing.id);
            return {
                ...listing,
                coverUrl: listing.coverUrl || existing?.coverUrl,
                title: listing.title || existing?.title || "Property",
            };
        });

        return {
            ...owner,
            propertyCount: Math.max(owner.propertyCount, merged.length),
            propertyTitles: merged.map((property) => property.title),
            properties: merged,
            localities: [
                ...new Set(
                    [
                        ...merged.map((property) => property.locality).filter(Boolean),
                        ...owner.localities,
                    ].filter((value): value is string => Boolean(value)),
                ),
            ],
        };
    });
}

async function listOwners(
    filters: ContactsFilters,
    page = 1,
    limit = 20,
    signal?: AbortSignal,
): Promise<{
    owners: OwnerRow[];
    total: number;
    page: number;
    totalPages: number;
    summary: Pick<
        ContactsSummary,
        "ownerCount" | "lapsedOwnerCount" | "platformOwnerCount" | "customOwnerCount"
    >;
}> {
    if (isMockMode()) {
        const needle = filters.q.trim().toLowerCase();
        const all = [...mockCustomOwners, ...mockOwnerRows()].filter((owner) => {
            if (filters.ownerOrigin !== "all" && owner.origin !== filters.ownerOrigin) return false;
            if (!needle) return true;
            return [owner.name, ...owner.localities, ...owner.propertyTitles]
                .join(" ")
                .toLowerCase()
                .includes(needle);
        });
        const paged = paginateItems(all, page, limit);
        return {
            owners: paged.items,
            total: paged.total,
            page: paged.page,
            totalPages: paged.totalPages,
            summary: {
                ownerCount: all.length,
                lapsedOwnerCount: all.filter(
                    (owner) => owner.origin === "platform" && !owner.hasActiveRepresentation,
                ).length,
                platformOwnerCount: mockOwnerRows().length,
                customOwnerCount: mockCustomOwners.length,
            },
        };
    }

    // Exclusive owners are the broker CRM list for the Owners tab.
    // Platform/represented owners remain available when explicitly filtered.
    if (filters.ownerOrigin === "platform") {
        const params = new URLSearchParams();
        if (filters.q.trim()) params.set("search", filters.q.trim());
        params.set("origin", "platform");
        params.set("sort", filters.sort);
        params.set("page", String(page));
        params.set("limit", String(limit));
        const qs = params.toString();
        const data = await apiFetch<ApiOwnersResponse>(`/clients/owners${qs ? `?${qs}` : ""}`, {
            signal,
        });
        return {
            owners: (data.items ?? []).map(toOwnerRow),
            total: data.total ?? 0,
            page: data.page ?? page,
            totalPages: Math.max(1, data.totalPages ?? 1),
            summary: {
                ownerCount: data.summary?.ownerCount ?? data.total ?? 0,
                lapsedOwnerCount: data.summary?.lapsedOwnerCount ?? 0,
                platformOwnerCount: data.summary?.platformOwnerCount ?? data.total ?? 0,
                customOwnerCount: data.summary?.customOwnerCount ?? 0,
            },
        };
    }

    const data = await exclusiveOwnersApi.list(
        {
            search: filters.q.trim() || undefined,
            sort: filters.sort === "name" ? "name" : "recent",
            page,
            limit,
        },
        signal,
    );

    const owners = await attachExclusiveOwnerListings(data.items.map(exclusiveOwnerToRow), signal);

    return {
        owners,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        summary: {
            ownerCount: data.total,
            lapsedOwnerCount: 0,
            platformOwnerCount: 0,
            customOwnerCount: data.total,
        },
    };
}

export type ContactsResult = {
    buyers: BuyerRow[];
    owners: OwnerRow[];
    summary: ContactsSummary;
};

export function sortBuyerRows(rows: BuyerRow[], sort: ContactsFilters["sort"]): BuyerRow[] {
    const sorted = [...rows];
    if (sort === "name") {
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === "most_active") {
        return sorted.sort((a, b) => b.liveDealCount - a.liveDealCount);
    }
    return sorted.sort((a, b) => {
        const aAt = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
        const bAt = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
        return bAt - aAt;
    });
}

export const contactsApi = {
    async listBuyersPage(
        filters: ContactsFilters,
        cursor: string | null,
        signal?: AbortSignal,
    ): Promise<InfinitePage<BuyerRow>> {
        const page = cursor ? Number(cursor) || 1 : 1;
        // Buyers are broker Client contacts — `GET /clients` (with lead summary).
        // There is no `/contacts/buyers` route on the API.
        const result = await listClientsPageWithLeadSummary({
            search: filters.q,
            sort: filters.sort,
            page,
            limit: 20,
            signal,
        });
        return {
            items: result.items.map(toBuyerRow),
            total: result.total,
            nextCursor: result.page < result.totalPages ? String(result.page + 1) : null,
        };
    },

    async listOwnersPage(
        filters: ContactsFilters,
        cursor: string | null,
        signal?: AbortSignal,
    ): Promise<InfinitePage<OwnerRow>> {
        const page = cursor ? Number(cursor) || 1 : 1;
        const result = await listOwners(filters, page, 20, signal);
        return {
            items: result.owners,
            total: result.total,
            nextCursor: result.page < result.totalPages ? String(result.page + 1) : null,
        };
    },

    async summary(signal?: AbortSignal): Promise<ContactsSummary> {
        const base = { ...DEFAULT_CONTACTS_FILTERS, q: "" };
        const [buyers, owners] = await Promise.all([
            listClientsPageWithLeadSummary({ page: 1, limit: 1, signal }),
            listOwners(base, 1, 1, signal),
        ]);
        return {
            buyerCount: buyers.total,
            ownerCount: owners.summary.ownerCount,
            unmatchedBuyerCount: 0,
            lapsedOwnerCount: owners.summary.lapsedOwnerCount,
            platformOwnerCount: owners.summary.platformOwnerCount,
            customOwnerCount: owners.summary.customOwnerCount,
        };
    },

    /**
     * Buyers from `GET /clients`; exclusive owners from `GET /exclusive-owners`.
     */
    async list(filters: ContactsFilters): Promise<ContactsResult> {
        const search = filters.q.trim();
        const [allClients, searchedClients, ownersResult] = await Promise.all([
            listClientsWithLeadSummary(),
            search ? listClientsWithLeadSummary({ search }) : Promise.resolve(null),
            listOwners(filters),
        ]);

        const buyersAll = allClients.map(toBuyerRow);
        const buyers = (searchedClients ?? allClients).map(toBuyerRow);

        return {
            buyers: sortBuyerRows(buyers, filters.sort),
            owners: ownersResult.owners,
            summary: {
                buyerCount: buyersAll.length,
                ownerCount: ownersResult.summary.ownerCount,
                unmatchedBuyerCount: buyersAll.filter((row) => row.liveDealCount === 0).length,
                lapsedOwnerCount: ownersResult.summary.lapsedOwnerCount,
                platformOwnerCount: ownersResult.summary.platformOwnerCount,
                customOwnerCount: ownersResult.summary.customOwnerCount,
            },
        };
    },

    async checkDuplicate(
        rawPhone: string,
    ): Promise<{ id: string; name: string; type: "buyer" | "owner" } | null> {
        const phone = normalizeIndianPhone(rawPhone);
        if (!/^[6-9]\d{9}$/.test(phone)) return null;
        const buyers = await clientsApi.list({ search: phone });
        const buyer = buyers.find((item) => item.phoneDigits === phone);
        if (buyer) return { id: buyer.id, name: buyer.name, type: "buyer" };
        if (isMockMode()) {
            const owner = [...mockCustomOwners, ...mockOwnerRows()].find(
                (item) => item.phoneDigits === phone,
            );
            return owner ? { id: owner.id, name: owner.name, type: "owner" } : null;
        }
        return null;
    },

    /** Create/update buyer via existing `POST|PATCH /clients` — no DB changes. */
    async saveBuyer(input: NewBuyerInput, buyerId?: string): Promise<string | undefined> {
        const saved = buyerId
            ? await clientsApi.update(buyerId, input)
            : await clientsApi.create(input);
        return saved.id;
    },

    async saveOwner(
        values: OwnerContactForm,
        ownerId?: string,
        origin?: "platform" | "custom",
    ): Promise<OwnerRow> {
        if (isMockMode()) {
            if (ownerId) {
                const customIndex = mockCustomOwners.findIndex((item) => item.id === ownerId);
                if (customIndex >= 0) {
                    const current = mockCustomOwners[customIndex]!;
                    const next = ownerRowFromValues(values, ownerId, current.linkedListingId);
                    mockCustomOwners[customIndex] = next;
                    return next;
                }
                const platform = mockOwnerRows().find((item) => item.id === ownerId);
                if (!platform) throw new Error("Owner not found");
                const tracking = {
                    status: values.status,
                    lastSpokeAt: values.lastSpokeAt,
                    tags: values.tags,
                    notes: values.notes,
                };
                mockPlatformOwnerTracking.set(ownerId, tracking);
                return { ...platform, ...tracking };
            }
            const created = ownerRowFromValues(values, `custom_owner_${Date.now()}`);
            mockCustomOwners.unshift(created);
            return created;
        }

        if (ownerId && origin === "platform") {
            const item = await apiFetch<ApiOwnerItem>(`/contacts/owners/${ownerId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: values.status,
                    lastSpokeAt: values.lastSpokeAt,
                    nextFollowUpAt: values.nextFollowUpAt || null,
                    tags: values.tags,
                    notes: values.notes.trim() || null,
                }),
            });
            return toOwnerRow(item);
        }

        // Create exclusive owner (broker CRM). Updates are not supported yet.
        if (ownerId) {
            throw new Error("Editing exclusive owners is not available yet.");
        }

        const payload: ExclusiveOwnerFormValues = {
            fullName: values.name.trim(),
            phone: normalizeIndianPhone(values.phone),
            email: values.email.trim(),
            ownerType:
                values.ownerType === "builder" || values.ownerType === "company"
                    ? values.ownerType
                    : "individual",
            society: values.societyName.trim(),
            area: values.locality.trim(),
            city: values.city.trim(),
            pincode: values.pincode.trim(),
            fullAddress: values.fullAddress.trim() || values.address.trim(),
            reraNumber: values.reraNumber.trim(),
            source: (values.source as ExclusiveOwnerFormValues["source"]) || "",
            notes: values.notes.trim(),
        };
        const created = await exclusiveOwnersApi.create(payload);
        return exclusiveOwnerToRow(created);
    },

    linkMockOwnerListing(ownerId: string, listingId: string, title: string): void {
        if (!isMockMode()) return;
        const owner = mockCustomOwners.find((item) => item.id === ownerId);
        if (!owner) return;
        owner.linkedListingId = listingId;
        owner.linkedListingTitle = title;
    },

    /** Remove a broker-added exclusive owner from contacts. */
    async removeOwner(ownerId: string): Promise<void> {
        if (isMockMode()) {
            const index = mockCustomOwners.findIndex((item) => item.id === ownerId);
            if (index >= 0) mockCustomOwners.splice(index, 1);
            mockPlatformOwnerTracking.delete(ownerId);
            await exclusiveOwnersApi.remove(ownerId);
            return;
        }
        await exclusiveOwnersApi.remove(ownerId);
    },
};

function ownerPayload(values: OwnerContactForm) {
    return {
        name: values.name.trim(),
        phone: normalizeIndianPhone(values.phone),
        whatsapp: values.whatsappSame
            ? normalizeIndianPhone(values.phone)
            : normalizeIndianPhone(values.whatsapp),
        altPhone: normalizeIndianPhone(values.altPhone),
        email: values.email.trim() || null,
        ownerType: values.ownerType,
        address: values.address.trim() || null,
        property: {
            intent: values.intent,
            propertyType: values.propertyType,
            configuration: values.configuration || null,
            societyName: values.societyName.trim(),
            locality: values.locality,
            fullAddress: values.fullAddress.trim() || null,
            city: values.city.trim() || "Surat",
            pincode: values.pincode || null,
            lat: values.lat ? Number(values.lat) : null,
            lng: values.lng ? Number(values.lng) : null,
            carpetArea: Number(values.carpetArea),
            builtUpArea: values.builtUpArea ? Number(values.builtUpArea) : null,
            superBuiltUpArea: values.superBuiltUpArea ? Number(values.superBuiltUpArea) : null,
            plotArea: values.plotArea ? Number(values.plotArea) : null,
            areaUnit: values.areaUnit,
            floorNumber: values.floorNumber ? Number(values.floorNumber) : null,
            totalFloors: values.totalFloors ? Number(values.totalFloors) : null,
            bathrooms: values.bathrooms ? Number(values.bathrooms) : null,
            balconies: values.balconies ? Number(values.balconies) : null,
            parkingType: values.parkingType,
            parkingCount: Number(values.parkingCount) || 0,
            facing: values.facing || null,
            propertyAge: values.propertyAge || null,
            availableFrom: values.availableFrom || null,
            furnishing: values.furnishing || null,
            amenities: values.amenities,
            reraNumber: values.reraNumber.trim() || null,
        },
        price: {
            expectedPrice:
                values.intent === "sell"
                    ? moneyToRupees(values.expectedPrice, values.priceUnit)
                    : null,
            expectedRent: values.intent !== "sell" ? moneyToRupees(values.expectedRent) : null,
            deposit: moneyToRupees(values.deposit),
            maintenance: moneyToRupees(values.maintenance),
            negotiable: values.negotiable,
        },
        dealTerms: {
            exclusive: values.exclusive,
            agreementValidTill: values.agreementValidTill || null,
            brokerageType: values.brokerageType,
            brokerageValue: Number(values.brokerageValue) || 0,
            brokeragePaidBy: values.brokeragePaidBy,
            visitDays: values.visitDays,
            visitFrom: values.visitFrom || null,
            visitTo: values.visitTo || null,
        },
        source: values.source,
        status: values.status,
        lastSpokeAt: values.lastSpokeAt,
        nextFollowUpAt: values.nextFollowUpAt || null,
        tags: values.tags,
        notes: values.notes.trim() || null,
    };
}

function ownerRowFromValues(
    values: OwnerContactForm,
    id: string,
    linkedListingId: string | null = null,
): OwnerRow {
    const amount =
        values.intent === "sell"
            ? moneyToRupees(values.expectedPrice, values.priceUnit)
            : moneyToRupees(values.expectedRent);
    return {
        id,
        name: values.name.trim(),
        phoneDigits: normalizeIndianPhone(values.phone),
        hasActiveRepresentation: true,
        propertyCount: 1,
        propertyTitles: [values.societyName.trim()],
        localities: [values.locality],
        totalValueInr: amount,
        isAllRent: values.intent !== "sell",
        liveDealCount: 0,
        origin: "custom",
        propertyIntent: values.intent,
        propertyType: values.propertyType,
        configuration: values.configuration,
        linkedListingId,
        linkedListingTitle: values.societyName.trim(),
        lastSpokeAt: values.lastSpokeAt,
        status: values.status,
        tags: values.tags,
        notes: values.notes,
        details: { ...values },
    };
}
