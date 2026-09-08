import { attachedClientsFor } from "@/lib/api/clients";

import {
    filterInvites,
    sortInvites,
    summarizeInvites,
} from "@/features/properties/my-requests/filter-invites";
import type {
    InviteItem,
    InvitesFilters,
    InvitesResult,
    InvitesSummary,
} from "@/features/properties/my-requests/invite-types";
import { MOCK_INVITES } from "@/features/properties/my-requests/mock-invites";

/** Mutable in-memory copy so accept/decline survive within a session. */
let invites: InviteItem[] = MOCK_INVITES.map((item) => ({ ...item }));

function delay(ms = 240): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Buyers live in the clients store, so read them from there. */
function withClients(item: InviteItem): InviteItem {
    const attached = attachedClientsFor(item.propertyId);
    return {
        ...item,
        clientsAttached: attached.length,
        attachedClients: attached.map((client) => ({ id: client.id, name: client.name })),
    };
}

export const ownerInvitesApi = {
    async list(filters: InvitesFilters): Promise<InvitesResult> {
        await delay();

        const live = invites.map(withClients);
        const matched = sortInvites(filterInvites(live, filters), filters.sort);
        const totalPages = Math.max(1, Math.ceil(matched.length / filters.limit));
        const page = Math.min(Math.max(1, filters.page), totalPages);
        const start = (page - 1) * filters.limit;

        return {
            items: matched.slice(start, start + filters.limit),
            total: matched.length,
            page,
            totalPages,
        };
    },

    /** Summary is over the whole set, not the filtered page. */
    async summary(): Promise<InvitesSummary> {
        await delay(160);
        return summarizeInvites(invites);
    },

    /**
     * Take the owner up on their invite. The owner chose this broker, so
     * acceptance is immediate — there is no second approval step.
     */
    async accept(inviteId: string): Promise<void> {
        await delay(200);

        const target = invites.find((item) => item.id === inviteId);
        if (!target || target.stage !== "pending") return;

        invites = invites.map((item) =>
            item.id === inviteId
                ? {
                      ...item,
                      stage: "accepted" as const,
                      respondedAt: new Date().toISOString(),
                      daysWaiting: 0,
                      // Accepting is what unlocks the owner's number.
                      ownerPhoneDigits: item.ownerPhoneDigits ?? "9825000000",
                  }
                : item,
        );
    },

    /** Turn the invite down. The owner may invite another broker instead. */
    async decline(inviteId: string): Promise<void> {
        await delay(200);

        const target = invites.find((item) => item.id === inviteId);
        if (!target || target.stage !== "pending") return;

        invites = invites.map((item) =>
            item.id === inviteId
                ? {
                      ...item,
                      stage: "declined" as const,
                      respondedAt: new Date().toISOString(),
                      daysWaiting: 0,
                      ownerPhoneDigits: undefined,
                  }
                : item,
        );
    },
};
