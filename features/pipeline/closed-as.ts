import type { DealItem } from "@/features/pipeline/types";

/** How a "Sale & Rent" listing actually closed. */
export type ClosedAs = "sale" | "rent";

/**
 * The deal as it closes: a "Sale & Rent" listing valued at its sale price or
 * its monthly rent. Offers are made on the sale price, so a rental drops the
 * offer. Returns a copy; the board's deal is untouched.
 */
export function dealAsClosed(deal: DealItem, closedAs: ClosedAs): DealItem {
    const both = deal.property.saleAndRent;
    if (!both) return deal;
    const isRent = closedAs === "rent";
    return {
        ...deal,
        offerAmountInr: isRent ? null : deal.offerAmountInr,
        offerStatus: isRent ? null : deal.offerStatus,
        property: {
            ...deal.property,
            isRent,
            amountInr: isRent ? both.monthlyRentInr : both.salePriceInr,
        },
    };
}
