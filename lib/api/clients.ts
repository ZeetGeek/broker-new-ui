import { apiFetch } from "@/lib/api/client";
import type { BuyerPropertyKind, BuyerSource } from "@/lib/validation/buyer";

import type { ClientItem, ClientLookingFor } from "@/features/clients/types";
import type { BuyerDocument } from "@/features/contacts/document-rules";

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

export type ClientLeadSummary = {
    liveDealCount: number;
    closedDealCount: number;
    activePropertyTitles: string[];
};

type ClientsListResponse = {
    items: ApiClientContact[];
    total: number;
    page: number;
    limit: number;
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
    if (stage === "closed") return true;
    return lead.closedAmount != null && String(lead.closedAmount).trim() !== "";
}

function isLostLead(lead: ApiClientLead): boolean {
    return lead.stage?.toLowerCase() === "lost";
}

/** Live leads (not closed/lost) — drives the property line on buyer cards. */
export function summarizeClientLeads(leads: ApiClientLead[] | undefined): ClientLeadSummary {
    const list = leads ?? [];
    const live = list.filter((lead) => !isClosedLead(lead) && !isLostLead(lead));
    const closed = list.filter((lead) => isClosedLead(lead));
    const titles = [
        ...new Set(
            live
                .map((lead) => lead.property?.title?.trim())
                .filter((title): title is string => Boolean(title)),
        ),
    ];

    return {
        liveDealCount: live.length,
        closedDealCount: closed.length,
        activePropertyTitles: titles,
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
 * Clients plus the lead summary from nested `/clients` leads. Contacts list
 * uses this so buyer cards show real active properties without joining pipeline.
 */
export async function listClientsWithLeadSummary(): Promise<
    Array<ClientItem & ClientLeadSummary & { leads: ApiClientLead[] }>
> {
    const contacts = await fetchAllContacts();
    return contacts.map((contact) => ({
        ...mapContact(contact),
        ...summarizeClientLeads(contact.leads),
        leads: contact.leads ?? [],
    }));
}

async function fetchAllContacts(): Promise<ApiClientContact[]> {
    const items: ApiClientContact[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const qs = new URLSearchParams({
            page: String(page),
            limit: "100",
        });
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
    async list(): Promise<ClientItem[]> {
        const contacts = await fetchAllContacts();
        return contacts.map(mapContact);
    },

    /**
     * Add a buyer. Backend rejects duplicate phones for the same broker scope.
     */
    async create(input: NewBuyerInput): Promise<ClientItem> {
        const contact = await apiFetch<ApiClientContact>("/clients", {
            method: "POST",
            body: JSON.stringify({
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
            }),
        });
        return mapContact(contact);
    },

    /** Buyers plus who is already on this property, for the attach picker. */
    async listForProperty(propertyId: string): Promise<PropertyClientsResult> {
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
        if (clientIds.length === 0) return;

        await apiFetch<AttachClientsResponse>("/clients/leads", {
            method: "POST",
            body: JSON.stringify({
                propertyId,
                clientIds,
            }),
        });
    },
};
