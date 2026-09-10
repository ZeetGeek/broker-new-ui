import { apiFetch } from "@/lib/api/client";
import { listClientsWithLeadSummary } from "@/lib/api/clients";

import type {
    BuyerRow,
    ContactsFilters,
    ContactsSummary,
    OwnerRow,
} from "@/features/contacts/types";

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

async function listOwners(filters: ContactsFilters): Promise<{
    owners: OwnerRow[];
    summary: Pick<ContactsSummary, "ownerCount" | "lapsedOwnerCount">;
}> {
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("search", filters.q.trim());
    params.set("sort", filters.sort);
    params.set("limit", "100");

    const qs = params.toString();
    const data = await apiFetch<ApiOwnersResponse>(`/clients/owners${qs ? `?${qs}` : ""}`);

    return {
        owners: (data.items ?? []).map(toOwnerRow),
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

export const contactsApi = {
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

        const sortBuyers = (rows: BuyerRow[]): BuyerRow[] => {
            const sorted = [...rows];
            if (filters.sort === "name") {
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            }
            if (filters.sort === "most_active") {
                return sorted.sort((a, b) => b.liveDealCount - a.liveDealCount);
            }
            return sorted.sort((a, b) => {
                const aAt = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
                const bAt = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
                return bAt - aAt;
            });
        };

        return {
            buyers: sortBuyers(buyers),
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
