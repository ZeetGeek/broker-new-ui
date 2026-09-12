import { attachedClientsByProperty } from "@/lib/api/clients";
import { isMockMode } from "@/lib/api/mock-mode";
import {
    type RepresentationItem,
    type RepresentationListPage,
    representativeApi,
} from "@/lib/api/representative";

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
import { mapRepresentationToInviteItem } from "@/features/properties/my-requests/map-invite";
import { MOCK_INVITES } from "@/features/properties/my-requests/mock-invites";

function isPaged(
    value: RepresentationItem[] | RepresentationListPage,
): value is RepresentationListPage {
    return !Array.isArray(value) && Array.isArray(value.items);
}

async function fetchAllInvitations(): Promise<RepresentationItem[]> {
    // `all` so stage chips / summary see pending + decided + closed invites.
    const response = await representativeApi.brokerInvitationList({ status: "all" });
    return isPaged(response) ? response.items : response;
}

function withClients(
    item: InviteItem,
    attachedByProperty: Map<string, { id: string; name: string }[]>,
): InviteItem {
    const attached = attachedByProperty.get(item.propertyId) ?? [];
    return {
        ...item,
        clientsAttached: attached.length,
        attachedClients: attached.map((client) => ({ id: client.id, name: client.name })),
    };
}

async function loadInvites(): Promise<InviteItem[]> {
    const [rows, attachedByProperty] = await Promise.all([
        fetchAllInvitations(),
        attachedClientsByProperty(),
    ]);
    return rows
        .map((row) => mapRepresentationToInviteItem(row))
        .filter((item): item is InviteItem => item != null)
        .map((item) => withClients(item, attachedByProperty));
}

export const ownerInvitesApi = {
    async list(filters: InvitesFilters): Promise<InvitesResult> {
        if (isMockMode()) {
            const matched = sortInvites(filterInvites(MOCK_INVITES, filters), filters.sort);
            return {
                items: matched,
                total: matched.length,
                page: 1,
                totalPages: 1,
            };
        }
        const items = await loadInvites();
        const matched = sortInvites(filterInvites(items, filters), filters.sort);
        return {
            items: matched,
            total: matched.length,
            page: 1,
            totalPages: 1,
        };
    },

    /** Summary is over the whole invite inbox, not the filtered page. */
    async summary(): Promise<InvitesSummary> {
        if (isMockMode()) {
            return summarizeInvites(MOCK_INVITES);
        }
        const items = await loadInvites();
        return summarizeInvites(items);
    },

    async accept(_inviteId: string): Promise<void> {
        if (isMockMode()) return;
        await representativeApi.brokerRespond(_inviteId, { status: "accepted" });
    },

    async decline(_inviteId: string): Promise<void> {
        if (isMockMode()) return;
        await representativeApi.brokerRespond(_inviteId, { status: "rejected" });
    },
};
