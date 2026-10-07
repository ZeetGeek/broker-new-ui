import { apiFetch } from "@/lib/api/client";
import { isMockMode, paginateItems } from "@/lib/api/mock-mode";
import type { BuyerPropertyKind, BuyerSource } from "@/lib/validation/buyer";

import { MOCK_CLIENTS, MOCK_PROPERTY_CLIENTS } from "@/features/clients/mock-clients";
import type { ClientItem, ClientLookingFor } from "@/features/clients/types";
import type { BuyerDocument } from "@/features/contacts/document-rules";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import { isLiveStage } from "@/features/pipeline/types";

export type PropertyClientsResult = {
    /** Every buyer on the broker's book. */
    clients: ClientItem[];
    /** Ids already attached to this property. */
    attachedIds: string[];
};

export type AttachedClientRef = {
    id: string;
    name: string;
};

/** Fields the broker types when adding a buyer. */
export type NewBuyerInput = {
    name: string;
    phoneDigits: string;
    email?: string | null;
    lookingFor: ClientLookingFor;
    propertyKind: BuyerPropertyKind;
    preferredLocalities: string[];
    budgetMinInr: number | null;
    budgetMaxInr: number | null;
    bhk: number | null;
    source: BuyerSource;
    notes?: string | null;
    documents?: BuyerDocument[];
};

/** Nested lead on `/clients` list items — active properties live here. */
export type ApiClientLead = {
    id: string;
    propertyId: string;
    stage?: string | null;
    offerAmount?: string | null;
    offerStatus?: string | null;
    listPrice?: string | null;
    closedAmount?: string | null;
    notes?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    property?: {
        id: string;
        title?: string | null;
        city?: string | null;
        address?: string | null;
        salePrice?: string | null;
        monthlyRent?: string | null;
        photos?: unknown;
    } | null;
};

type ApiClientContact = {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    clientType?: string | null;
    propertyKind?: string | null;
    preferredLocalities?: string[] | null;
    budgetMin?: string | null;
    budgetMax?: string | null;
    bhk?: number | null;
    source?: string | null;
    notes?: string | null;
    updatedAt?: string | null;
    leads?: ApiClientLead[];
};

export type ClientLeadDetail = {
    leadId: string;
    propertyId: string;
    title: string;
    city: string;
    stage: string;
    updatedAt: string | null;
    offerAmountInr: number | null;
    listPriceInr: number | null;
    closedAmountInr: number | null;
    isRent: boolean;
};

export type ClientLeadSummary = {
    liveDealCount: number;
    closedDealCount: number;
    activePropertyTitles: string[];
    attachedProperties: Array<{
        id: string;
        leadId: string;
        title: string;
        locality?: string;
        coverUrl?: string;
    }>;
    /** Every lead on this buyer, including closed/lost — for the view modal. */
    leads: ClientLeadDetail[];
};

/** Accept string urls or common `{ url | src }` photo objects from nested payloads. */
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

const propertyCoverCache = new Map<string, string | null>();

async function fetchPropertyCoverUrl(
    propertyId: string,
    signal?: AbortSignal,
): Promise<string | undefined> {
    if (propertyCoverCache.has(propertyId)) {
        return propertyCoverCache.get(propertyId) || undefined;
    }

    const endpoints = [`/properties/${propertyId}`, `/properties/browse/${propertyId}`] as const;
    for (const path of endpoints) {
        try {
            const listing = await apiFetch<{
                photos?: unknown;
                imageSrc?: string | null;
                coverUrl?: string | null;
            }>(path, { signal });
            const cover =
                coverFromPhotos(listing.photos) ||
                (typeof listing.imageSrc === "string" && listing.imageSrc.trim()
                    ? listing.imageSrc.trim()
                    : undefined) ||
                (typeof listing.coverUrl === "string" && listing.coverUrl.trim()
                    ? listing.coverUrl.trim()
                    : undefined);
            if (cover) {
                propertyCoverCache.set(propertyId, cover);
                return cover;
            }
        } catch {
            // Try the next endpoint (inventory vs public browse).
        }
    }

    propertyCoverCache.set(propertyId, null);
    return undefined;
}

function mockLeadSummary(clientId: string): ClientLeadSummary {
    const deals = MOCK_DEALS.filter((deal) => deal.buyer.id === clientId);
    const live = deals.filter((deal) => isLiveStage(deal.status));
    const closed = deals.filter((deal) => deal.status === "closed");
    const details: ClientLeadDetail[] = deals.map((deal) => ({
        leadId: deal.id,
        propertyId: deal.property.id,
        title: deal.property.title,
        city: deal.property.city,
        stage: deal.status,
        updatedAt: deal.lastContactedAt,
        offerAmountInr: deal.offerAmountInr,
        listPriceInr: deal.property.amountInr,
        closedAmountInr: deal.closedAmountInr,
        isRent: deal.property.isRent,
    }));

    return {
        liveDealCount: live.length,
        closedDealCount: closed.length,
        activePropertyTitles: [...new Set(live.map((deal) => deal.property.title))],
        attachedProperties: live.map((deal) => ({
            id: deal.property.id,
            leadId: deal.id,
            title: deal.property.title,
            locality: deal.property.locality,
            coverUrl: deal.property.imageSrc || undefined,
        })),
        leads: details,
    };
}

function mockClientsWithLeads(search?: string) {
    const needle = search?.trim().toLowerCase() ?? "";
    return MOCK_CLIENTS.filter((client) => {
        if (!needle) return true;
        return [client.name, client.phoneDigits, ...(client.preferredLocalities ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(needle);
    }).map((client) => ({ ...client, ...mockLeadSummary(client.id) }));
}

export type ClientsListResponse = {
    items: ApiClientContact[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type ClientListPageWithLeadSummary = {
    items: Array<ClientItem & ClientLeadSummary>;
    total: number;
    page: number;
    totalPages: number;
};

type ApiPropertyLead = {
    id: string;
    propertyId: string;
    clientId?: string | null;
    client?: { id: string; name: string; phone?: string } | null;
};

type LeadsListResponse = {
    items: ApiPropertyLead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

type AttachClientsResponse = {
    items: ApiPropertyLead[];
    attached: number;
    alreadyLinkedClientIds: string[];
    propertyId: string;
};

const PROPERTY_KINDS = new Set<BuyerPropertyKind>([
    "apartment",
    "villa",
    "plot",
    "shop",
    "office",
    "any",
]);

const SOURCES = new Set<BuyerSource>([
    "referral",
    "walk_in",
    "portal",
    "social",
    "repeat",
    "other",
]);

function digitsOnly(value: string): string {
    return value.replace(/\D/g, "");
}

function lookingForFromType(clientType: string | null | undefined): ClientLookingFor {
    if (clientType === "renter") return "rent";
    return "buy";
}

function clientTypeFromLookingFor(lookingFor: ClientLookingFor): "buyer" | "renter" {
    return lookingFor === "rent" ? "renter" : "buyer";
}

function asPropertyKind(value: string | null | undefined): BuyerPropertyKind {
    if (value && PROPERTY_KINDS.has(value as BuyerPropertyKind)) {
        return value as BuyerPropertyKind;
    }
    return "any";
}

function asSource(value: string | null | undefined): BuyerSource | null {
    if (value && SOURCES.has(value as BuyerSource)) return value as BuyerSource;
    return null;
}

function isClosedLead(lead: ApiClientLead): boolean {
    const stage = lead.stage?.toLowerCase();
    return stage === "closed_won" || stage === "closed";
}

function isLostLead(lead: ApiClientLead): boolean {
    const stage = lead.stage?.toLowerCase();
    return stage === "closed_lost" || stage === "lost";
}

function toMoney(value: string | number | null | undefined): number | null {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
}

function mapLeadDetail(lead: ApiClientLead): ClientLeadDetail | null {
    const propertyId = lead.property?.id ?? lead.propertyId;
    if (!propertyId) return null;

    const rent = toMoney(lead.property?.monthlyRent);
    const sale = toMoney(lead.property?.salePrice);
    const isRent = (rent ?? 0) > 0 && (sale ?? 0) <= 0;

    return {
        leadId: lead.id,
        propertyId,
        title: lead.property?.title?.trim() || "Property",
        city: lead.property?.city?.trim() || "",
        stage: (lead.stage ?? "new").toLowerCase(),
        updatedAt: lead.updatedAt ?? lead.createdAt ?? null,
        offerAmountInr: toMoney(lead.offerAmount),
        listPriceInr: toMoney(lead.listPrice) ?? sale ?? rent,
        closedAmountInr: toMoney(lead.closedAmount),
        isRent,
    };
}

/** Live leads (not closed/lost) — drives the property line on buyer cards. */
export function summarizeClientLeads(leads: ApiClientLead[] | undefined): ClientLeadSummary {
    const list = leads ?? [];
    const details = list
        .map(mapLeadDetail)
        .filter((item): item is ClientLeadDetail => item != null)
        // Newest activity first.
        .sort((a, b) => {
            const aAt = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bAt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bAt - aAt;
        });

    const live = list.filter((lead) => !isClosedLead(lead) && !isLostLead(lead));
    const closed = list.filter((lead) => isClosedLead(lead));
    const titles = [
        ...new Set(
            live
                .map((lead) => lead.property?.title?.trim())
                .filter((title): title is string => Boolean(title)),
        ),
    ];
    const attachedProperties = live
        .map((lead) => {
            const id = lead.property?.id ?? lead.propertyId;
            if (!id) return null;
            return {
                id,
                leadId: lead.id,
                title: lead.property?.title?.trim() || "Property",
                locality: lead.property?.city?.trim() || undefined,
                coverUrl: coverFromPhotos(lead.property?.photos),
            };
        })
        .filter((item): item is NonNullable<typeof item> => item != null)
        // Dedupe by property id (keep first).
        .filter((item, index, all) => all.findIndex((row) => row.id === item.id) === index);

    return {
        liveDealCount: live.length,
        closedDealCount: closed.length,
        activePropertyTitles: titles,
        attachedProperties,
        leads: details,
    };
}

function mapContact(contact: ApiClientContact): ClientItem {
    const phoneDigits = digitsOnly(contact.phone);
    // Keep last 10 digits for Indian mobiles stored as +91XXXXXXXXXX.
    const normalized = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;

    return {
        id: contact.id,
        name: contact.name,
        phoneDigits: normalized,
        email: contact.email?.trim() || null,
        lookingFor: lookingForFromType(contact.clientType),
        propertyKind: asPropertyKind(contact.propertyKind),
        preferredLocalities: contact.preferredLocalities ?? [],
        budgetMinInr: contact.budgetMin != null ? Number(contact.budgetMin) : null,
        budgetMaxInr: contact.budgetMax != null ? Number(contact.budgetMax) : null,
        bhk: contact.bhk ?? null,
        source: asSource(contact.source),
        notes: contact.notes ?? null,
        lastContactedAt: contact.updatedAt ?? null,
        attachedPropertyCount: contact.leads?.length ?? 0,
        documents: [],
    };
}

/**
 * When `/clients` nests property titles but omits `photos`, fill covers from
 * `GET /properties/:id` for the unique missing ids on this page only.
 */
async function enrichAttachedPropertyCovers<T extends ClientLeadSummary>(
    items: T[],
    signal?: AbortSignal,
): Promise<T[]> {
    const missingIds = [
        ...new Set(
            items.flatMap((item) =>
                item.attachedProperties
                    .filter((property) => !property.coverUrl)
                    .map((property) => property.id),
            ),
        ),
    ];
    if (missingIds.length === 0) return items;

    const coverById = new Map<string, string>();
    await Promise.all(
        missingIds.map(async (id) => {
            const cover = await fetchPropertyCoverUrl(id, signal);
            if (cover) coverById.set(id, cover);
        }),
    );

    // Pipeline leads nest photos more reliably than `/clients` — fill any leftovers.
    const stillMissing = missingIds.filter((id) => !coverById.has(id));
    if (stillMissing.length > 0) {
        const needed = new Set(stillMissing);
        try {
            let page = 1;
            let totalPages = 1;
            while (page <= totalPages && needed.size > 0 && page <= 5) {
                const qs = new URLSearchParams({ page: String(page), limit: "100" });
                const response = await apiFetch<{
                    items?: Array<{
                        propertyId?: string;
                        property?: { id?: string; photos?: unknown } | null;
                    }>;
                    totalPages?: number;
                }>(`/clients/leads?${qs}`, { signal });
                for (const lead of response.items ?? []) {
                    const id = lead.property?.id ?? lead.propertyId;
                    if (!id || !needed.has(id)) continue;
                    const cover = coverFromPhotos(lead.property?.photos);
                    if (cover) {
                        coverById.set(id, cover);
                        propertyCoverCache.set(id, cover);
                        needed.delete(id);
                    }
                }
                totalPages = Math.max(1, response.totalPages ?? 1);
                page += 1;
            }
        } catch {
            // Leave missing covers empty; tiles keep the designed placeholder.
        }
    }

    if (coverById.size === 0) return items;

    return items.map((item) => ({
        ...item,
        attachedProperties: item.attachedProperties.map((property) =>
            property.coverUrl ? property : { ...property, coverUrl: coverById.get(property.id) },
        ),
    }));
}

/**
 * Clients plus the lead summary from nested `/clients` leads. Contacts list
 * uses this so buyer cards show real active properties without joining pipeline.
 */
export async function listClientsWithLeadSummary(options?: {
    search?: string;
}): Promise<Array<ClientItem & ClientLeadSummary>> {
    if (isMockMode()) {
        return mockClientsWithLeads(options?.search);
    }
    const contacts = await fetchAllContacts(options);
    // Full-book fetches skip cover enrichment (too many property lookups).
    // Paginated contacts use listClientsPageWithLeadSummary instead.
    return contacts.map((contact) => ({
        ...mapContact(contact),
        ...summarizeClientLeads(contact.leads),
    }));
}

export async function listClientsPageWithLeadSummary(options: {
    search?: string;
    sort?: string;
    page: number;
    limit: number;
    signal?: AbortSignal;
}): Promise<ClientListPageWithLeadSummary> {
    if (isMockMode()) {
        const all = mockClientsWithLeads(options.search);
        const paged = paginateItems(all, options.page, options.limit);
        return {
            items: paged.items,
            total: paged.total,
            page: paged.page,
            totalPages: paged.totalPages,
        };
    }
    const qs = new URLSearchParams({
        page: String(options.page),
        limit: String(options.limit),
    });
    if (options.search?.trim()) qs.set("search", options.search.trim());
    if (options.sort) qs.set("sort", options.sort);

    const response = await apiFetch<ClientsListResponse>(`/clients?${qs}`, {
        signal: options.signal,
    });

    const items = await enrichAttachedPropertyCovers(
        (response.items ?? []).map((contact) => ({
            ...mapContact(contact),
            ...summarizeClientLeads(contact.leads),
        })),
        options.signal,
    );

    return {
        items,
        total: response.total ?? 0,
        page: response.page ?? options.page,
        totalPages: Math.max(1, response.totalPages ?? 1),
    };
}

async function fetchAllContacts(options?: { search?: string }): Promise<ApiClientContact[]> {
    const items: ApiClientContact[] = [];
    let page = 1;
    let totalPages = 1;
    const search = options?.search?.trim();

    while (page <= totalPages) {
        const qs = new URLSearchParams({
            page: String(page),
            limit: "100",
        });
        if (search) qs.set("search", search);
        const response = await apiFetch<ClientsListResponse>(`/clients?${qs}`);
        items.push(...(response.items ?? []));
        totalPages = Math.max(1, response.totalPages ?? 1);
        page += 1;
    }

    return items;
}

async function fetchLeadsForProperty(propertyId: string): Promise<ApiPropertyLead[]> {
    const items: ApiPropertyLead[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const qs = new URLSearchParams({
            propertyId,
            page: String(page),
            limit: "100",
        });
        const response = await apiFetch<LeadsListResponse>(`/clients/leads?${qs}`);
        items.push(...(response.items ?? []));
        totalPages = Math.max(1, response.totalPages ?? 1);
        page += 1;
    }

    return items;
}

async function fetchAllLeads(): Promise<ApiPropertyLead[]> {
    const items: ApiPropertyLead[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const qs = new URLSearchParams({
            page: String(page),
            limit: "100",
        });
        const response = await apiFetch<LeadsListResponse>(`/clients/leads?${qs}`);
        items.push(...(response.items ?? []));
        totalPages = Math.max(1, response.totalPages ?? 1);
        page += 1;
    }

    return items;
}

function leadClientRef(lead: ApiPropertyLead): AttachedClientRef | null {
    const id = lead.client?.id ?? lead.clientId;
    if (!id) return null;
    return {
        id,
        name: lead.client?.name?.trim() || "Buyer",
    };
}

/**
 * Buyers already linked to a property (from live leads). Used by request/invite cards.
 */
export async function attachedClientsFor(propertyId: string): Promise<AttachedClientRef[]> {
    if (isMockMode()) {
        const ids = MOCK_PROPERTY_CLIENTS[propertyId] ?? [];
        return MOCK_CLIENTS.filter((client) => ids.includes(client.id)).map((client) => ({
            id: client.id,
            name: client.name,
        }));
    }
    const leads = await fetchLeadsForProperty(propertyId);
    const seen = new Set<string>();
    const attached: AttachedClientRef[] = [];

    for (const lead of leads) {
        const ref = leadClientRef(lead);
        if (!ref || seen.has(ref.id)) continue;
        seen.add(ref.id);
        attached.push(ref);
    }

    return attached;
}

/**
 * Group attached buyers by property in one leads scan — avoids N+1 on list pages.
 */
export async function attachedClientsByProperty(): Promise<Map<string, AttachedClientRef[]>> {
    if (isMockMode()) {
        const map = new Map<string, AttachedClientRef[]>();
        for (const [propertyId, ids] of Object.entries(MOCK_PROPERTY_CLIENTS)) {
            map.set(
                propertyId,
                MOCK_CLIENTS.filter((client) => ids.includes(client.id)).map((client) => ({
                    id: client.id,
                    name: client.name,
                })),
            );
        }
        return map;
    }
    const leads = await fetchAllLeads();
    const map = new Map<string, AttachedClientRef[]>();

    for (const lead of leads) {
        const ref = leadClientRef(lead);
        if (!ref) continue;

        const list = map.get(lead.propertyId) ?? [];
        if (!list.some((item) => item.id === ref.id)) {
            list.push(ref);
            map.set(lead.propertyId, list);
        }
    }

    return map;
}

export const clientsApi = {
    /** Every buyer on the broker's book. */
    async list(options?: { search?: string }): Promise<ClientItem[]> {
        if (isMockMode()) {
            return mockClientsWithLeads(options?.search);
        }
        const contacts = await fetchAllContacts(options);
        return contacts.map(mapContact);
    },

    /**
     * Add a buyer. Backend rejects duplicate phones for the same broker scope.
     */
    async create(input: NewBuyerInput): Promise<ClientItem> {
        if (isMockMode()) {
            const created: ClientItem = {
                id: `cl_${Date.now()}`,
                name: input.name,
                phoneDigits: input.phoneDigits,
                email: input.email ?? null,
                lookingFor: input.lookingFor,
                propertyKind: input.propertyKind,
                preferredLocalities: input.preferredLocalities,
                budgetMinInr: input.budgetMinInr,
                budgetMaxInr: input.budgetMaxInr,
                bhk: input.bhk,
                source: input.source,
                notes: input.notes ?? null,
                lastContactedAt: new Date().toISOString(),
                attachedPropertyCount: 0,
                documents: input.documents ?? [],
            };
            MOCK_CLIENTS.unshift(created);
            return created;
        }
        const contact = await apiFetch<ApiClientContact>("/clients", {
            method: "POST",
            body: JSON.stringify(toClientPayload(input)),
        });
        return mapContact(contact);
    },

    /** Update an existing buyer contact. */
    async update(clientId: string, input: NewBuyerInput): Promise<ClientItem> {
        if (isMockMode()) {
            const index = MOCK_CLIENTS.findIndex((client) => client.id === clientId);
            if (index < 0) {
                return {
                    id: clientId,
                    name: input.name,
                    phoneDigits: input.phoneDigits,
                    email: input.email ?? null,
                    lookingFor: input.lookingFor,
                    propertyKind: input.propertyKind,
                    preferredLocalities: input.preferredLocalities,
                    budgetMinInr: input.budgetMinInr,
                    budgetMaxInr: input.budgetMaxInr,
                    bhk: input.bhk,
                    source: input.source,
                    notes: input.notes ?? null,
                    lastContactedAt: new Date().toISOString(),
                    attachedPropertyCount: 0,
                    documents: input.documents ?? [],
                };
            }
            const next: ClientItem = {
                ...MOCK_CLIENTS[index]!,
                name: input.name,
                phoneDigits: input.phoneDigits,
                email: input.email ?? null,
                lookingFor: input.lookingFor,
                propertyKind: input.propertyKind,
                preferredLocalities: input.preferredLocalities,
                budgetMinInr: input.budgetMinInr,
                budgetMaxInr: input.budgetMaxInr,
                bhk: input.bhk,
                source: input.source,
                notes: input.notes ?? null,
                lastContactedAt: new Date().toISOString(),
                documents: input.documents ?? MOCK_CLIENTS[index]!.documents,
            };
            MOCK_CLIENTS[index] = next;
            return next;
        }
        const contact = await apiFetch<ApiClientContact>(`/clients/${clientId}`, {
            method: "PATCH",
            body: JSON.stringify(toClientPayload(input)),
        });
        return mapContact(contact);
    },

    /** Remove a buyer from the broker's book. */
    async remove(clientId: string): Promise<void> {
        if (isMockMode()) {
            const index = MOCK_CLIENTS.findIndex((client) => client.id === clientId);
            if (index >= 0) MOCK_CLIENTS.splice(index, 1);
            return;
        }
        await apiFetch<void>(`/clients/${clientId}`, { method: "DELETE" });
    },

    /** Buyers plus who is already on this property, for the attach picker. */
    async listForProperty(propertyId: string): Promise<PropertyClientsResult> {
        if (isMockMode()) {
            const attachedIds = MOCK_PROPERTY_CLIENTS[propertyId] ?? [];
            return { clients: MOCK_CLIENTS, attachedIds };
        }
        const [contacts, leads] = await Promise.all([
            fetchAllContacts(),
            fetchLeadsForProperty(propertyId),
        ]);

        const attachedIds = [
            ...new Set(
                leads
                    .map((lead) => lead.client?.id ?? lead.clientId)
                    .filter((id): id is string => Boolean(id)),
            ),
        ];

        return {
            clients: contacts.map(mapContact),
            attachedIds,
        };
    },

    /**
     * Link the selected buyers to the property. Already-linked ids are skipped
     * server-side. Unchecking a previously linked buyer does not detach them
     * (no detach endpoint yet) — the next open still shows them as attached.
     */
    async setPropertyClients(propertyId: string, clientIds: string[]): Promise<void> {
        if (isMockMode()) return;
        if (clientIds.length === 0) return;

        await apiFetch<AttachClientsResponse>("/clients/leads", {
            method: "POST",
            body: JSON.stringify({
                propertyId,
                clientIds,
            }),
        });
    },

    /** Attach one buyer to one or more properties (skips already-linked pairs). */
    async attachClientToProperties(clientId: string, propertyIds: string[]): Promise<void> {
        if (isMockMode()) return;
        const unique = [...new Set(propertyIds.filter(Boolean))];
        if (unique.length === 0) return;

        await Promise.all(
            unique.map((propertyId) =>
                apiFetch<AttachClientsResponse>("/clients/leads", {
                    method: "POST",
                    body: JSON.stringify({
                        propertyId,
                        clientIds: [clientId],
                    }),
                }),
            ),
        );
    },

    /** Unlink a buyer from one property (deletes the lead). */
    async removeLead(leadId: string): Promise<void> {
        if (isMockMode()) {
            const deal = MOCK_DEALS.find((item) => item.id === leadId);
            if (deal) {
                deal.status = "lost";
                const propertyId = deal.property.id;
                const clientId = deal.buyer.id;
                const attached = MOCK_PROPERTY_CLIENTS[propertyId];
                if (attached) {
                    MOCK_PROPERTY_CLIENTS[propertyId] = attached.filter((id) => id !== clientId);
                    if (MOCK_PROPERTY_CLIENTS[propertyId]?.length === 0) {
                        delete MOCK_PROPERTY_CLIENTS[propertyId];
                    }
                }
                const client = MOCK_CLIENTS.find((item) => item.id === clientId);
                if (client && client.attachedPropertyCount > 0) {
                    client.attachedPropertyCount -= 1;
                }
            }
            return;
        }
        await apiFetch<void>(`/clients/leads/${leadId}`, { method: "DELETE" });
    },
};

function toClientPayload(input: NewBuyerInput) {
    return {
        name: input.name,
        phone: `+91${input.phoneDigits}`,
        email: input.email?.trim() || undefined,
        clientType: clientTypeFromLookingFor(input.lookingFor),
        propertyKind: input.propertyKind,
        preferredLocalities: input.preferredLocalities,
        budgetMin: input.budgetMinInr ?? undefined,
        budgetMax: input.budgetMaxInr ?? undefined,
        bhk: input.bhk ?? undefined,
        source: input.source,
        notes: input.notes?.trim() || undefined,
    };
}
