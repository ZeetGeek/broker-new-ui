import { clientsApi } from "@/lib/api/clients";
import { pipelineApi } from "@/lib/api/pipeline";

import type { BuyerRow, ContactsFilters, ContactsSummary, OwnerRow } from "@/features/contacts/types";
import { type DealItem, DEFAULT_DEALS_FILTERS, isLiveStage } from "@/features/pipeline/types";

/** Owners have no id of their own yet, so derive a stable one from the name. */
function ownerIdFor(name: string): string {
    return `ow_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

function unique(values: string[]): string[] {
    return [...new Set(values)];
}

function matchesBuyer(row: BuyerRow, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return (
        row.name.toLowerCase().includes(needle) ||
        row.phoneDigits.includes(needle.replace(/\D/g, "")) ||
        row.preferredLocalities.some((area) => area.toLowerCase().includes(needle))
    );
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
                // Only carried while the relationship is live — see the note
                // on OwnerRow.phoneDigits.
                phoneDigits: deal.owner.isRepresentationActive
                    ? deal.owner.phoneDigits
                    : undefined,
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

        // The same owner can appear on several deals. Count each property once,
        // but count every live deal.
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
            // Mixed sale and rent means the total is not a rent figure, so the
            // /mo suffix would be wrong on it.
            isAllRent: existing.isAllRent && deal.property.isRent,
            liveDealCount: existing.liveDealCount + (isLive ? 1 : 0),
        });
    }

    return [...byOwner.values()];
}

export type ContactsResult = {
    buyers: BuyerRow[];
    owners: OwnerRow[];
    summary: ContactsSummary;
};

export const contactsApi = {
    /**
     * Both sides in one call. The two lists share a source — deals — so
     * fetching them separately would let the counts disagree mid-render.
     */
    async list(filters: ContactsFilters): Promise<ContactsResult> {
        const [clients, deals] = await Promise.all([
            clientsApi.list(),
            pipelineApi.list({ ...DEFAULT_DEALS_FILTERS }).then((result) => result.items),
        ]);

        const buyers: BuyerRow[] = clients.map((client) => {
            const own = deals.filter((deal) => deal.buyer.id === client.id);
            const live = own.filter((deal) => isLiveStage(deal.status));

            return {
                ...client,
                liveDealCount: live.length,
                closedDealCount: own.filter((deal) => deal.status === "closed").length,
                activePropertyTitles: unique(live.map((deal) => deal.property.title)),
            };
        });

        const owners = buildOwnerRows(deals);

        const summary: ContactsSummary = {
            buyerCount: buyers.length,
            ownerCount: owners.length,
            unmatchedBuyerCount: buyers.filter((row) => row.liveDealCount === 0).length,
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
            // Never-contacted buyers lead: they are the ones needing a call.
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
            buyers: sortBuyers(buyers.filter((row) => matchesBuyer(row, filters.q))),
            owners: sortOwners(owners.filter((row) => matchesOwner(row, filters.q))),
            summary,
        };
    },
};
