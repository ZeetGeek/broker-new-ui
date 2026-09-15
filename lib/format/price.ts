/**
 * Formats a listing price for display using international grouping.
 * Compact notation for large amounts (e.g. ₹1.2M) — never lakh/crore.
 */
export function formatPriceInr(amountInr: number): string {
    const abs = Math.abs(amountInr);
    if (!Number.isFinite(abs)) return "—";

    if (abs >= 1_000_000) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "INR",
            currencyDisplay: "narrowSymbol",
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(abs);
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
    }).format(abs);
}

/** Rent display: same rules as {@link formatPriceInr}, with `/mo` appended. */
export function formatRentInr(amountInr: number): string {
    return `${formatPriceInr(amountInr)}/mo`;
}

/** Shared contact/listing formatter. Values are always plain integer currency units. */
export function formatIndianPrice(
    amountInr: number | null | undefined,
    intent: "buy" | "sell" | "rent" | "lease" | "sale" = "buy",
): string {
    if (amountInr == null || !Number.isFinite(amountInr)) return "—";
    return intent === "rent" || intent === "lease"
        ? formatRentInr(amountInr)
        : formatPriceInr(amountInr);
}
