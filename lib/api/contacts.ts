import { apiFetch } from "@/lib/api/client";
import { listClientsPageWithLeadSummary, listClientsWithLeadSummary } from "@/lib/api/clients";
import type { InfinitePage } from "@/lib/pagination/infinite-page";

import type {
    BuyerRow,
    ContactsFilters,
    ContactsSummary,
    OwnerRow,
} from "@/features/contacts/types";
import { DEFAULT_CONTACTS_FILTERS } from "@/features/contacts/types";

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
    };
};

function digitsOnly(value: string | null | undefined): string {
    return (value ?? "").replace(/\D/g, "");
}

function toOwnerRow(item: ApiOwnerItem): OwnerRow {
    const phoneDigits = digitsOnly(item.phone);
    const normalized = phoneDigits.length > 10 ? phoneDigits.slice(-10) : phoneDigits;

    return {
        id: item.id,
        name: item.name?.trim() || "Owner",
        avatarUrl: item.avatarUrl ?? undefined,
        phoneDigits: item.hasActiveRepresentation && normalized ? normalized : undefined,
        hasActiveRepresentation: Boolean(item.hasActiveRepresentation),
        propertyCount: item.propertyCount ?? 0,
        propertyTitles: item.propertyTitles ?? [],
        localities: item.localities?.length ? item.localities : ["—"],
        totalValueInr: Number(item.totalValueInr) || 0,
        isAllRent: Boolean(item.isAllRent),
        liveDealCount: item.liveDealCount ?? 0,
    };
}

function toBuyerRow(
    client: Awaited<ReturnType<typeof listClientsWithLeadSummary>>[number],
): BuyerRow {
    return client;
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
    summary: Pick<ContactsSummary, "ownerCount" | "lapsedOwnerCount">;
}> {
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("search", filters.q.trim());
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
        };
    },

    /**
     * Buyers from `GET /clients`; owners from `GET /clients/owners`
     * (accepted representations + lapsed revoked/withdrawn).
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
            },
        };
    },
};
