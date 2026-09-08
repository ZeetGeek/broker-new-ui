import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import {
    DEAL_STAGE_ORDER,
    type DealItem,
    type DealLostReason,
    type DealsFilters,
    type DealsResult,
    type DealsSummary,
    type DealStage,
    isLiveStage,
    type StageCounts,
    STALLED_AFTER_DAYS,
} from "@/features/pipeline/types";

/** Mutable in-memory copy so stage moves survive within a session. */
let deals: DealItem[] = MOCK_DEALS.map((item) => ({ ...item }));

function delay(ms = 220): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const DAY_MS = 86_400_000;

export function daysSince(iso: string | null): number | null {
    if (!iso) return null;
    return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

/**
 * A deal nobody has touched in two weeks. Deliberately based on last contact
 * rather than stage age — a deal can sit in Negotiation for a month and be
 * perfectly healthy as long as the broker is still talking to the buyer.
 */
export function isStalled(deal: DealItem): boolean {
    if (!isLiveStage(deal.status)) return false;
    const since = daysSince(deal.lastContactedAt ?? deal.stageEnteredAt);
    return since != null && since >= STALLED_AFTER_DAYS;
}

export function hasUpcomingVisit(deal: DealItem): boolean {
    if (!deal.nextVisitAt) return false;
    return new Date(deal.nextVisitAt).getTime() >= Date.now();
}

/** The buyer cannot afford the ask. Shown as a quiet flag, never a block. */
export function isOverBudget(deal: DealItem): boolean {
    if (deal.buyer.budgetMaxInr == null) return false;
    return deal.property.amountInr > deal.buyer.budgetMaxInr;
}

function matchesQuery(deal: DealItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return [
        deal.buyer.name,
        deal.buyer.phoneDigits,
        deal.property.title,
        deal.property.locality,
        deal.property.city,
        deal.owner.name,
    ].some((field) => field.toLowerCase().includes(needle));
}

function sortDeals(items: DealItem[], sort: DealsFilters["sort"]): DealItem[] {
    const sorted = [...items];

    switch (sort) {
        case "stalled":
            // Quietest first — this sort exists to surface neglect.
            return sorted.sort(
                (a, b) =>
                    new Date(a.lastContactedAt ?? a.stageEnteredAt).getTime() -
                    new Date(b.lastContactedAt ?? b.stageEnteredAt).getTime(),
            );
        case "price_desc":
            return sorted.sort((a, b) => b.property.amountInr - a.property.amountInr);
        case "price_asc":
            return sorted.sort((a, b) => a.property.amountInr - b.property.amountInr);
        case "visit_soon":
            // Deals with a visit booked lead; the rest keep recency order.
            return sorted.sort((a, b) => {
                const aAt = a.nextVisitAt ? new Date(a.nextVisitAt).getTime() : Infinity;
                const bAt = b.nextVisitAt ? new Date(b.nextVisitAt).getTime() : Infinity;
                if (aAt !== bAt) return aAt - bAt;
                return new Date(b.stageEnteredAt).getTime() - new Date(a.stageEnteredAt).getTime();
            });
        default:
            return sorted.sort(
                (a, b) =>
                    new Date(b.stageEnteredAt).getTime() - new Date(a.stageEnteredAt).getTime(),
            );
    }
}

function buildSummary(all: DealItem[]): DealsSummary {
    const counts = Object.fromEntries(
        DEAL_STAGE_ORDER.map((stage) => [
            stage,
            all.filter((deal) => deal.status === stage).length,
        ]),
    ) as StageCounts;

    const live = all.filter((deal) => isLiveStage(deal.status));
    const closedCount = all.filter((deal) => deal.status === "closed").length;
    const lostCount = all.filter((deal) => deal.status === "lost").length;
    const resolved = closedCount + lostCount;

    return {
        counts,
        liveTotal: live.length,
        stalledCount: live.filter(isStalled).length,
        upcomingVisitCount: live.filter(hasUpcomingVisit).length,
        liveValueInr: live.reduce((sum, deal) => sum + deal.property.amountInr, 0),
        closedCount,
        lostCount,
        winRate: resolved === 0 ? 0 : Math.round((closedCount / resolved) * 100),
    };
}

export const pipelineApi = {
    /**
     * Every deal, filtered and sorted. The board splits by stage on the
     * client — the whole set is small enough that paginating it would cost
     * more in round trips than it saves, and a kanban column that paginates
     * is a kanban column that lies about its count.
     */
    async list(filters: DealsFilters): Promise<DealsResult> {
        await delay();

        const all = deals.map((item) => ({ ...item }));
        let items = all.filter((deal) => matchesQuery(deal, filters.q));

        if (filters.stage) {
            items = items.filter((deal) => deal.status === filters.stage);
        }

        return { items: sortDeals(items, filters.sort), summary: buildSummary(all) };
    },

    /** Move a deal to another stage, or to closed/lost. */
    async setStage(
        dealId: string,
        status: DealItem["status"],
        options: { lostReason?: DealLostReason; closedAmountInr?: number } = {},
    ): Promise<void> {
        await delay(160);

        deals = deals.map((deal) => {
            if (deal.id !== dealId) return deal;

            const isResolved = status === "closed" || status === "lost";

            return {
                ...deal,
                status,
                stageEnteredAt: new Date().toISOString(),
                resolvedAt: isResolved ? new Date().toISOString() : null,
                lostReason: status === "lost" ? options.lostReason : undefined,
                closedAmountInr:
                    status === "closed"
                        ? (options.closedAmountInr ?? deal.property.amountInr)
                        : null,
            };
        });
    },

    /** Record that the broker spoke to the buyer, without moving the deal. */
    async logContact(dealId: string): Promise<void> {
        await delay(160);

        deals = deals.map((deal) =>
            deal.id === dealId ? { ...deal, lastContactedAt: new Date().toISOString() } : deal,
        );
    },

    /** Book or clear the next visit. Passing null clears it. */
    async setVisit(dealId: string, visitAtIso: string | null): Promise<void> {
        await delay(160);

        deals = deals.map((deal) =>
            deal.id === dealId ? { ...deal, nextVisitAt: visitAtIso } : deal,
        );
    },

    async setNote(dealId: string, note: string): Promise<void> {
        await delay(160);

        deals = deals.map((deal) => (deal.id === dealId ? { ...deal, note } : deal));
    },

    /** Put a closed or lost deal back on the board. */
    async reopen(dealId: string, stage: DealStage): Promise<void> {
        await delay(160);

        deals = deals.map((deal) =>
            deal.id === dealId
                ? {
                      ...deal,
                      status: stage,
                      stageEnteredAt: new Date().toISOString(),
                      resolvedAt: null,
                      closedAmountInr: null,
                      lostReason: undefined,
                  }
                : deal,
        );
    },
};
