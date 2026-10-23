import {
    type Currency,
    getActiveCurrency,
    usesIndianNumbering,
    withCurrencySymbol,
} from "@/lib/format/currency";

const intlGrouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const intlCompact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
});

/** INR: lakh / crore per docs/DESIGN.md §6. */
function formatIndianAmount(abs: number, currency: Currency): string {
    if (abs >= 10_000_000) {
        const crores = abs / 10_000_000;
        const digits = crores >= 10 ? 1 : 2;
        const text = crores
            .toFixed(digits)
            .replace(/\.0+$/, "")
            .replace(/(\.\d*[1-9])0+$/, "$1");
        return withCurrencySymbol(currency, `${text} Cr`);
    }

    if (abs >= 100_000) {
        const lakhs = abs / 100_000;
        const text =
            lakhs >= 10 ? String(Math.round(lakhs)) : (Math.round(lakhs * 10) / 10).toString();
        return withCurrencySymbol(currency, `${text} L`);
    }

    return withCurrencySymbol(currency, new Intl.NumberFormat("en-IN").format(Math.round(abs)));
}

/** Every other currency: full digits up to 100K, then K / M / B. */
function formatInternationalAmount(abs: number, currency: Currency): string {
    const text = abs >= 100_000 ? intlCompact.format(abs) : intlGrouped.format(Math.round(abs));
    return withCurrencySymbol(currency, text);
}

/**
 * Formats a listing price for display — lakh / crore for INR, K / M / B for
 * every other currency. Defaults to the signed-in user's market currency.
 */
export function formatPrice(amount: number, currency: Currency = getActiveCurrency()): string {
    const abs = Math.abs(amount);
    if (!Number.isFinite(abs)) return "—";

    return usesIndianNumbering(currency)
        ? formatIndianAmount(abs, currency)
        : formatInternationalAmount(abs, currency);
}

/** Rent display: same rules as {@link formatPrice}, with `/mo` appended. */
export function formatRent(amount: number, currency: Currency = getActiveCurrency()): string {
    return `${formatPrice(amount, currency)}/mo`;
}

/** Shared contact/listing formatter. Values are always plain integer currency units. */
export function formatListingPrice(
    amount: number | null | undefined,
    intent: "buy" | "sell" | "rent" | "lease" | "sale" | "both" = "buy",
    currency: Currency = getActiveCurrency(),
): string {
    if (amount == null || !Number.isFinite(amount)) return "—";
    return intent === "rent" || intent === "lease"
        ? formatRent(amount, currency)
        : formatPrice(amount, currency);
}
