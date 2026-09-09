import { listClientsWithLeadSummary } from "@/lib/api/clients";
import { pipelineApi } from "@/lib/api/pipeline";

import type {
    BuyerRow,
    ContactsFilters,
    ContactsSummary,
    OwnerRow,
} from "@/features/contacts/types";
import { type DealItem, DEFAULT_DEALS_FILTERS, isLiveStage } from "@/features/pipeline/types";

/** Owners have no id of their own yet, so derive a stable one from the name. */
function ownerIdFor(name: string): string {
    return `ow_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

function unique(values: string[]): string[] {
    return [...new Set(values)];
}

function matchesOwner(row: OwnerRow, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return (
        row.name.toLowerCase().includes(needle) ||
        (row.phoneDigits ?? "").includes(needle.replace(/\D/g, "")) ||
        row.localities.some((area) => area.toLowerCase().includes(needle)) ||
        row.propertyTitles.some((title) => title.toLowerCase().includes(needle))
    );
}

/**
 * Owners assembled from the properties the broker represents. One row per
 * owner even when they own several properties, because the broker thinks in
 * people here, not listings.
 */
function buildOwnerRows(deals: DealItem[]): OwnerRow[] {
    const byOwner = new Map<string, OwnerRow>();

    for (const deal of deals) {
        const id = ownerIdFor(deal.owner.name);
        const existing = byOwner.get(id);
        const isLive = isLiveStage(deal.status);

        if (!existing) {
            byOwner.set(id, {
                id,
                name: deal.owner.name,
                avatarUrl: deal.owner.avatarUrl,
                phoneDigits: deal.owner.isRepresentationActive ? deal.owner.phoneDigits : undefined,
                hasActiveRepresentation: deal.owner.isRepresentationActive,
                propertyCount: 1,
                propertyTitles: [deal.property.title],
                localities: [deal.property.locality],
                totalValueInr: deal.property.amountInr,
                isAllRent: deal.property.isRent,
                liveDealCount: isLive ? 1 : 0,
            });
            continue;
        }

        const isNewProperty = !existing.propertyTitles.includes(deal.property.title);

        byOwner.set(id, {
            ...existing,
            phoneDigits:
                existing.phoneDigits ??
                (deal.owner.isRepresentationActive ? deal.owner.phoneDigits : undefined),
            hasActiveRepresentation:
                existing.hasActiveRepresentation || deal.owner.isRepresentationActive,
            propertyCount: isNewProperty ? existing.propertyCount + 1 : existing.propertyCount,
            propertyTitles: isNewProperty
                ? [...existing.propertyTitles, deal.property.title]
                : existing.propertyTitles,
            localities: unique([...existing.localities, deal.property.locality]),
            totalValueInr: isNewProperty
                ? existing.totalValueInr + deal.property.amountInr
                : existing.totalValueInr,
            isAllRent: existing.isAllRent && deal.property.isRent,
            liveDealCount: existing.liveDealCount + (isLive ? 1 : 0),
        });
    }

    return [...byOwner.values()];
}

function toBuyerRow(
    client: Awaited<ReturnType<typeof listClientsWithLeadSummary>>[number],
): BuyerRow {
    return client;
}

export type ContactsResult = {
    buyers: BuyerRow[];
    owners: OwnerRow[];
    summary: ContactsSummary;
};

export const contactsApi = {
    /**
     * Both sides in one call. Buyer search goes to `GET /clients?search=`;
     * summary counts stay based on the full buyer book so tab chips do not
     * shrink while typing.
     */
    async list(filters: ContactsFilters): Promise<ContactsResult> {
        const search = filters.q.trim();
        const [allClients, searchedClients, deals] = await Promise.all([
            listClientsWithLeadSummary(),
            search ? listClientsWithLeadSummary({ search }) : Promise.resolve(null),
            pipelineApi.list({ ...DEFAULT_DEALS_FILTERS }).then((result) => result.items),
        ]);

        const buyersAll = allClients.map(toBuyerRow);
        const buyers = (searchedClients ?? allClients).map(toBuyerRow);
        const owners = buildOwnerRows(deals);

        const summary: ContactsSummary = {
            buyerCount: buyersAll.length,
            ownerCount: owners.length,
            unmatchedBuyerCount: buyersAll.filter((row) => row.liveDealCount === 0).length,
            lapsedOwnerCount: owners.filter((row) => !row.hasActiveRepresentation).length,
        };

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

        const sortOwners = (rows: OwnerRow[]): OwnerRow[] => {
            const sorted = [...rows];
            if (filters.sort === "name") {
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            }
            if (filters.sort === "most_active") {
                return sorted.sort((a, b) => b.liveDealCount - a.liveDealCount);
            }
            return sorted.sort((a, b) => b.totalValueInr - a.totalValueInr);
        };

        return {
            buyers: sortBuyers(buyers),
            owners: sortOwners(owners.filter((row) => matchesOwner(row, filters.q))),
            summary,
        };
    },
};
