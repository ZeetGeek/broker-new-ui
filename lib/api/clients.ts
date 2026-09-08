import { apiFetch } from "@/lib/api/client";

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
    lookingFor: ClientLookingFor;
    preferredLocalities: string[];
    budgetMaxInr: number | null;
    bhk: number | null;
    documents?: BuyerDocument[];
};

type ApiClientContact = {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    clientType?: string | null;
    budgetMin?: string | null;
    budgetMax?: string | null;
    notes?: string | null;
    updatedAt?: string | null;
    leads?: Array<{ id: string; propertyId: string }>;
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

function parseLocalitiesFromNotes(notes: string | null | undefined): string[] {
    if (!notes) return [];
    const match = notes.match(/Areas?:\s*(.+?)(?:\.|$)/i);
    if (!match?.[1]) return [];
    return match[1]
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
}

function parseBhkFromNotes(notes: string | null | undefined): number | null {
    if (!notes) return null;
    const match = notes.match(/BHK:\s*(\d+)/i);
    if (!match?.[1]) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
}

function buildCreateNotes(input: NewBuyerInput): string | undefined {
    const parts: string[] = [];
    if (input.preferredLocalities.length > 0) {
        parts.push(`Areas: ${input.preferredLocalities.join(", ")}`);
    }
    if (input.bhk != null) {
        parts.push(`BHK: ${input.bhk}`);
    }
    return parts.length > 0 ? parts.join(". ") : undefined;
}

function mapContact(contact: ApiClientContact): ClientItem {
    const phoneDigits = digitsOnly(contact.phone);
    // Keep last 10 digits for Indian mobiles stored as +91XXXXXXXXXX.
    const normalized = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;

    return {
        id: contact.id,
        name: contact.name,
        phoneDigits: normalized,
        lookingFor: lookingForFromType(contact.clientType),
        preferredLocalities: parseLocalitiesFromNotes(contact.notes),
        budgetMaxInr: contact.budgetMax != null ? Number(contact.budgetMax) : null,
        bhk: parseBhkFromNotes(contact.notes),
        lastContactedAt: contact.updatedAt ?? null,
        attachedPropertyCount: contact.leads?.length ?? 0,
        documents: [],
    };
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
                clientType: clientTypeFromLookingFor(input.lookingFor),
                budgetMax: input.budgetMaxInr ?? undefined,
                notes: buildCreateNotes(input),
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
