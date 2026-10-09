/**
 * Formats a listing price for display using Indian lakh/crore conventions
 * per docs/DESIGN.md §6.
 */
export function formatPriceInr(amountInr: number): string {
    const abs = Math.abs(amountInr);
    if (!Number.isFinite(abs)) return "—";

    if (abs >= 10_000_000) {
        const crores = abs / 10_000_000;
        const digits = crores >= 10 ? 1 : 2;
        const text = crores
            .toFixed(digits)
            .replace(/\.0+$/, "")
            .replace(/(\.\d*[1-9])0+$/, "$1");
        return `₹${text} Cr`;
    }

    if (abs >= 100_000) {
        const lakhs = abs / 100_000;
        const text =
            lakhs >= 10 ? String(Math.round(lakhs)) : (Math.round(lakhs * 10) / 10).toString();
        return `₹${text} L`;
    }

    return new Intl.NumberFormat("en-IN", {
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
    intent: "buy" | "sell" | "rent" | "lease" | "sale" | "both" = "buy",
): string {
    if (amountInr == null || !Number.isFinite(amountInr)) return "—";
    return intent === "rent" || intent === "lease"
        ? formatRentInr(amountInr)
        : formatPriceInr(amountInr);
}
