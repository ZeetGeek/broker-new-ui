import { MOCK_CLIENTS, MOCK_PROPERTY_CLIENTS } from "@/features/clients/mock-clients";
import { BUYERS_PER_PROPERTY_LIMIT, type ClientItem } from "@/features/clients/types";
import type { BuyerDocument } from "@/features/contacts/document-rules";

/** Mutable in-memory copies so attach/detach survive within a session. */
let clients: ClientItem[] = MOCK_CLIENTS.map((item) => ({ ...item }));
let propertyClients: Record<string, string[]> = Object.fromEntries(
    Object.entries(MOCK_PROPERTY_CLIENTS).map(([key, ids]) => [key, [...ids]]),
);

function delay(ms = 220): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export type PropertyClientsResult = {
    /** Every buyer on the broker's book. */
    clients: ClientItem[];
    /** Ids already attached to this property. */
    attachedIds: string[];
    limit: number;
};

/**
 * The buyers on one property, in the order the broker added them. The
 * requests API reads this so the card and the modal can never disagree.
 */
export function attachedClientsFor(propertyId: string): ClientItem[] {
    const ids = propertyClients[propertyId] ?? [];
    return ids
        .map((id) => clients.find((client) => client.id === id))
        .filter((client): client is ClientItem => client != null);
}

/** Fields the broker types when adding a buyer. */
export type NewBuyerInput = {
    name: string;
    phoneDigits: string;
    lookingFor: ClientItem["lookingFor"];
    preferredLocalities: string[];
    budgetMaxInr: number | null;
    bhk: number | null;
    documents?: BuyerDocument[];
};

export const clientsApi = {
    /** Every buyer on the broker's book. */
    async list(): Promise<ClientItem[]> {
        await delay();
        return clients.map((item) => ({ ...item }));
    },

    /**
     * Add a buyer. Rejects a duplicate phone number rather than silently
     * creating a second record — the same person entered twice is how a
     * pipeline stops being trustworthy.
     */
    async create(input: NewBuyerInput): Promise<ClientItem> {
        await delay(320);

        const exists = clients.some((item) => item.phoneDigits === input.phoneDigits);
        if (exists) {
            throw new Error("A buyer with this mobile number is already on your list.");
        }

        const created: ClientItem = {
            id: `cl_${Date.now().toString(36)}`,
            name: input.name,
            phoneDigits: input.phoneDigits,
            lookingFor: input.lookingFor,
            preferredLocalities: input.preferredLocalities,
            budgetMaxInr: input.budgetMaxInr,
            bhk: input.bhk,
            lastContactedAt: null,
            attachedPropertyCount: 0,
            documents: input.documents ?? [],
        };

        clients = [created, ...clients];
        return { ...created };
    },

    /** Buyers plus who is already on this property, for the attach picker. */
    async listForProperty(propertyId: string): Promise<PropertyClientsResult> {
        await delay();
        return {
            clients: clients.map((item) => ({ ...item })),
            attachedIds: [...(propertyClients[propertyId] ?? [])],
            limit: BUYERS_PER_PROPERTY_LIMIT,
        };
    },

    /**
     * Replace the buyer list for one property. Enforces the cap here as well
     * as in the UI — a disabled checkbox is a convenience, not the rule.
     */
    async setPropertyClients(propertyId: string, clientIds: string[]): Promise<void> {
        await delay();

        const nextIds = clientIds.slice(0, BUYERS_PER_PROPERTY_LIMIT);
        const previousIds = propertyClients[propertyId] ?? [];

        propertyClients = { ...propertyClients, [propertyId]: nextIds };

        // Keep each buyer's own counter in step with what they are attached to.
        const added = nextIds.filter((id) => !previousIds.includes(id));
        const removed = previousIds.filter((id) => !nextIds.includes(id));

        clients = clients.map((item) => {
            if (added.includes(item.id)) {
                return { ...item, attachedPropertyCount: item.attachedPropertyCount + 1 };
            }
            if (removed.includes(item.id)) {
                return {
                    ...item,
                    attachedPropertyCount: Math.max(0, item.attachedPropertyCount - 1),
                };
            }
            return item;
        });
    },
};
