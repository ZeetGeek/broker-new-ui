import type { DealItem } from "@/features/pipeline/types";
import { isLiveStage } from "@/features/pipeline/types";

/**
 * How "Mark as sold" behaves for a deal.
 *
 * - `immediate`: the deal closes now, the property is marked sold and the
 *   other clients on it are marked lost.
 * - `owner`: the final price goes to the owner, who confirms the sale.
 *   Only for owner listings, and only once the owner portal is live.
 */
export type SaleConfirmMode = "immediate" | "owner";

export function saleConfirmMode(input: {
    isBrokerListing: boolean;
    ownerPortalOn: boolean;
}): SaleConfirmMode {
    return input.ownerPortalOn && !input.isBrokerListing ? "owner" : "immediate";
}

/** Why "Mark as sold" can't open for this deal right now, or null when it can. */
export function markSoldBlockedReason(
    deal: Pick<DealItem, "offerStatus" | "property">,
    mode: SaleConfirmMode,
): string | null {
    if (deal.property.isSold) return "This property is already sold.";
    // A draft was never on the market, so it can't be sold.
    if (deal.property.isDraft) return "Publish this property before marking it sold.";
    if (mode === "owner" && deal.offerStatus === "pending") {
        return "Waiting for the owner on your offer.";
    }
    return null;
}

/** Other clients still in progress on the same property. */
export function otherLiveClientCount(deals: readonly DealItem[], deal: DealItem): number {
    return deals.filter(
        (other) =>
            other.id !== deal.id &&
            other.property.id === deal.property.id &&
            isLiveStage(other.status),
    ).length;
}

/**
 * The deal a stage move is about. It may not be on the loaded board (opened
 * from a link, or outside the current filter), so fall back to the deal the
 * broker has open.
 */
export function findDealForMove(
    deals: readonly DealItem[] | null,
    fallback: DealItem | null,
    dealId: string,
): DealItem | null {
    return deals?.find((deal) => deal.id === dealId) ?? (fallback?.id === dealId ? fallback : null);
}

/**
 * Whether a closed deal can go back on the board. On a sold property only
 * the sold deal of the broker's own listing can (the sale fell through);
 * the API then makes the property available again.
 */
export function canPutBackOnBoard(deal: Pick<DealItem, "status" | "property">): boolean {
    if (!deal.property.isSold) return true;
    return deal.status === "closed" && Boolean(deal.property.isBrokerListing);
}
