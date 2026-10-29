import { type Currency, getActiveCurrency, withCurrencySymbol } from "@/lib/format/currency";

const intlNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const intlCompact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
});

/**
 * Parses a typed money amount in any currency.
 * Accepts plain numbers and common short suffixes (k / m / b). Lakh / crore
 * suffixes still parse so Indian users and older drafts keep working.
 * Currency symbols and a leading ISO code (`USD 500k`) are ignored.
 */
export function parseMoney(value: string | number | null | undefined): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : null;
    if (!value) return null;

    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/^[a-z]{3}(?=\s*[\d.])/, "")
        .replace(/[^\d.a-z-]/g, "");
    if (!normalized) return null;

    const match = normalized.match(
        /^(-?\d+(?:\.\d+)?)(crores?|cr|lakhs?|l|thousands?|k|millions?|m|billions?|b)?$/,
    );
    if (!match) return null;

    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount < 0) return null;
    const suffix = match[2];
    const multiplier =
        suffix === "b" || suffix?.startsWith("billion")
            ? 1_000_000_000
            : suffix === "m" || suffix?.startsWith("million")
              ? 1_000_000
              : suffix === "cr" || suffix?.startsWith("crore")
                ? 10_000_000
                : suffix === "l" || suffix?.startsWith("lakh")
                  ? 100_000
                  : suffix === "k" || suffix?.startsWith("thousand")
                    ? 1_000
                    : 1;
    return Math.round(amount * multiplier);
}

/** Full digits with the currency symbol, e.g. `₹8,500,000` / `$850,000`. */
export function formatMoney(
    value: number | null | undefined,
    currency: Currency = getActiveCurrency(),
): string {
    if (value == null || !Number.isFinite(value)) return "— — —";
    return withCurrencySymbol(currency, intlNumber.format(Math.round(value)));
}

/** Digits only, for a money input the user is editing. */
export function formatMoneyInput(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value) || value === 0) return "";
    return intlNumber.format(Math.round(value));
}

/** International compact with the symbol, e.g. `₹1.2M` / `$850K`. */
export function formatMoneyCompact(
    value: number | null | undefined,
    currency: Currency = getActiveCurrency(),
): string {
    if (value == null || !Number.isFinite(value)) return "— — —";
    return withCurrencySymbol(currency, intlCompact.format(Math.max(0, value)));
}

/** Short readable hint under money fields — international compact, no symbol. */
export function moneyWordHint(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value) || value <= 0) return "";
    return intlCompact.format(value);
}
