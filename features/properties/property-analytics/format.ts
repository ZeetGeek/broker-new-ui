import { formatPrice } from "@/lib/format/price";

/** The listing's ask, for `<PriceWithCommission>`. Rent-only listings show the monthly rent. */
export function listingAsk(input: {
    transactionType?: string | null;
    salePrice?: string | null;
    monthlyRent?: string | null;
}): { amountInr: number; isRent: boolean } | null {
    const sale = amount(input.salePrice);
    const rent = amount(input.monthlyRent);
    if (input.transactionType === "rent")
        return rent == null ? null : { amountInr: rent, isRent: true };
    if (sale != null) return { amountInr: sale, isRent: false };
    if (rent != null) return { amountInr: rent, isRent: true };
    return null;
}

/** Offers and closed amounts — not a listing ask, so plain price formatting. */
export function amountLabel(value: string | null | undefined): string | null {
    const parsed = amount(value);
    return parsed == null ? null : formatPrice(parsed);
}

function amount(value: string | null | undefined): number | null {
    if (value == null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
}
