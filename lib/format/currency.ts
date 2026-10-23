/**
 * The currency money is shown in.
 *
 * The marketplace is scoped per country: a broker only sees listings from
 * their own country and an owner only works with brokers from theirs, so
 * every amount a signed-in user sees is in their market's currency. That
 * currency arrives on the session (`AuthUser.country.currency`) and is made
 * active by `MarketCurrencyScope` before any portal screen renders.
 *
 * Formatters read the active currency by default so the ~90 call sites — many
 * of them plain view-model mappers, not components — do not each need to be
 * handed one. Pages outside the portal (the public share link) pass the
 * listing's own currency explicitly.
 */
export type Currency = {
    /** ISO 4217, e.g. `INR`, `USD`, `AED`. */
    code: string;
    /** Short display symbol, e.g. `₹`, `$`. May be the code itself (`AED`). */
    symbol: string;
    name?: string;
    decimalDigits?: number;
};

/** The launch market, and the fallback for a session without a country. */
export const DEFAULT_CURRENCY: Currency = {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    decimalDigits: 2,
};

let activeCurrency: Currency = DEFAULT_CURRENCY;

export function getActiveCurrency(): Currency {
    return activeCurrency;
}

/** Called by `MarketCurrencyScope` only. Null falls back to the default. */
export function setActiveCurrency(currency: Currency | null | undefined): void {
    activeCurrency = currency?.code ? currency : DEFAULT_CURRENCY;
}

/** INR amounts read in lakh / crore; every other currency in K / M / B. */
export function usesIndianNumbering(currency: Currency): boolean {
    return currency.code.toUpperCase() === "INR";
}

/**
 * Puts the symbol in front of a formatted number. A symbol made of letters
 * (`AED`, `CHF`) gets a space so it does not run into the digits.
 */
export function withCurrencySymbol(currency: Currency, text: string): string {
    const symbol = currency.symbol || currency.code;
    return /[A-Za-z]$/.test(symbol) ? `${symbol} ${text}` : `${symbol}${text}`;
}
