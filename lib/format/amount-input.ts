import { type Currency, usesIndianNumbering } from "@/lib/format/currency";

/**
 * Typed-amount parsing for the smart price field.
 *
 * Global by design: separators come from the market's region (1,500.50 in
 * the US, 1.500,50 in Germany, 1 500,50 in France), shorthand is K / M / B
 * everywhere, and lakh / crore switch on only for markets that number that
 * way (see `usesIndianNumbering`). English words only, no regional words.
 *
 * Output is always a whole number of major currency units (dollars, euros,
 * rupees) as a safe integer, which is what the API stores.
 */

export type Numbering = "indian" | "international";

export type AmountFormat = {
    /** BCP 47 tag used for grouping on display, e.g. `de-Latn-DE-u-nu-latn`. */
    locale: string;
    /** The region's decimal mark: "." or ",". */
    decimal: "." | ",";
    numbering: Numbering;
    /** Where the region writes the currency symbol. */
    symbolPosition: "start" | "end";
};

/** Largest amount we accept. Under 2^53 so a JS number never drops digits. */
export const MAX_AMOUNT = 999_999_999_999_999;

/** Currency → region, used only when the session carries no country. */
const CURRENCY_REGION: Record<string, string> = {
    INR: "IN",
    USD: "US",
    EUR: "DE",
    GBP: "GB",
    AED: "AE",
    SAR: "SA",
    QAR: "QA",
    KWD: "KW",
    SGD: "SG",
    AUD: "AU",
    CAD: "CA",
    JPY: "JP",
    CHF: "CH",
    VND: "VN",
    IDR: "ID",
    BRL: "BR",
};

const formatCache = new Map<string, AmountFormat>();

function regionLocale(region: string): string {
    try {
        const maximized = new Intl.Locale(`und-${region}`).maximize();
        return `${maximized.baseName}-u-nu-latn`;
    } catch {
        return "en";
    }
}

/**
 * The number conventions for a market. `iso2` is the market's country; when
 * missing we guess the region from the currency, then fall back to plain English (en).
 */
export function amountFormatFor(currency: Currency, iso2?: string | null): AmountFormat {
    const region = (iso2 || CURRENCY_REGION[currency.code.toUpperCase()] || "US").toUpperCase();
    const numbering: Numbering = usesIndianNumbering(currency) ? "indian" : "international";
    const key = `${region}|${currency.code}|${numbering}`;
    const cached = formatCache.get(key);
    if (cached) return cached;

    // Indian numbering groups 12,34,567 no matter which region asked for it.
    const locale = numbering === "indian" ? "en-IN" : regionLocale(region);
    let decimal: "." | "," = ".";
    let symbolPosition: "start" | "end" = "start";
    try {
        // A plain number: zero-decimal currencies (JPY, VND) print no mark at all.
        const numberParts = new Intl.NumberFormat(locale).formatToParts(1.5);
        decimal = numberParts.find((p) => p.type === "decimal")?.value === "," ? "," : ".";
        const parts = new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency.code,
        }).formatToParts(1);
        const symbolAt = parts.findIndex((p) => p.type === "currency");
        const integerAt = parts.findIndex((p) => p.type === "integer");
        symbolPosition = symbolAt > integerAt ? "end" : "start";
    } catch {
        // Unknown currency code: keep the defaults.
    }
    const format: AmountFormat = { locale, decimal, numbering, symbolPosition };
    formatCache.set(key, format);
    return format;
}

const INTERNATIONAL_SUFFIXES: Record<string, bigint> = {
    k: BigInt(1_000),
    thousand: BigInt(1_000),
    thousands: BigInt(1_000),
    m: BigInt(1_000_000),
    mn: BigInt(1_000_000),
    mil: BigInt(1_000_000),
    million: BigInt(1_000_000),
    millions: BigInt(1_000_000),
    b: BigInt(1_000_000_000),
    bn: BigInt(1_000_000_000),
    billion: BigInt(1_000_000_000),
    billions: BigInt(1_000_000_000),
    tn: BigInt(1_000_000_000_000),
    trillion: BigInt(1_000_000_000_000),
    trillions: BigInt(1_000_000_000_000),
};

const INDIAN_SUFFIXES: Record<string, bigint> = {
    l: BigInt(100_000),
    lac: BigInt(100_000),
    lacs: BigInt(100_000),
    lakh: BigInt(100_000),
    lakhs: BigInt(100_000),
    cr: BigInt(10_000_000),
    crs: BigInt(10_000_000),
    crore: BigInt(10_000_000),
    crores: BigInt(10_000_000),
};

function suffixMultiplier(word: string, numbering: Numbering): bigint | null {
    if (numbering === "indian" && word in INDIAN_SUFFIXES) return INDIAN_SUFFIXES[word];
    return INTERNATIONAL_SUFFIXES[word] ?? null;
}

export type ParseResult =
    | { status: "empty"; value: null }
    | { status: "valid"; value: number }
    | { status: "invalid"; value: null }
    | { status: "too-large"; value: null };

const EMPTY: ParseResult = { status: "empty", value: null };
const INVALID: ParseResult = { status: "invalid", value: null };

/**
 * Turns one run of digits and separators into a plain "123.45" string, or
 * null when the separators make no sense. Rules, in order:
 *  - apostrophes are always grouping (Swiss 1'500)
 *  - both "." and "," present: whichever comes last is the decimal mark
 *  - one mark used more than once: grouping (1,50,000 / 1.500.000)
 *  - one mark used once: decimal when it is the region's decimal mark, or
 *    when it is not followed by exactly three digits (21,5k in a "." region)
 */
function normalizeNumber(raw: string, decimal: "." | ","): string | null {
    const text = raw.replace(/['’]/g, "");
    if (!/\d/.test(text) || /[.,]{2}/.test(text)) return null;

    const lastDot = text.lastIndexOf(".");
    const lastComma = text.lastIndexOf(",");
    let decimalMark: string | null = null;

    if (lastDot >= 0 && lastComma >= 0) {
        decimalMark = lastDot > lastComma ? "." : ",";
    } else if (lastDot >= 0 || lastComma >= 0) {
        const mark = lastDot >= 0 ? "." : ",";
        const count = text.split(mark).length - 1;
        if (count === 1) {
            const after = text.slice(text.indexOf(mark) + 1);
            decimalMark = mark === decimal || after.length !== 3 ? mark : null;
        }
    }

    let integer = text;
    let fraction = "";
    if (decimalMark) {
        const at = text.lastIndexOf(decimalMark);
        integer = text.slice(0, at);
        fraction = text.slice(at + 1);
        if (/[.,]/.test(fraction)) return null;
    }
    // Grouping must look like grouping: 1,500,000 or 15,00,000, never 1,5,0.
    const groups = integer.split(/[.,]/);
    if (groups.length > 1) {
        const tail = groups.slice(1);
        if (tail.at(-1)?.length !== 3 || tail.some((g) => g.length < 2 || g.length > 3)) {
            return null;
        }
    }
    integer = groups.join("");
    if (!integer && !fraction) return null;
    return `${integer || "0"}.${fraction}`;
}

/** Exact `number × multiplier`, rounded half-up to a whole unit. */
function scale(decimalText: string, multiplier: bigint): bigint {
    const [integer, fraction] = decimalText.split(".");
    const digits = BigInt(`${integer}${fraction}` || "0");
    const divisor = BigInt(10) ** BigInt(fraction.length);
    const scaled = digits * multiplier;
    return (scaled + divisor / BigInt(2)) / divisor;
}

/** Strips symbols, bidi marks, `/-`, and a leading or trailing 3-letter code. */
function clean(text: string, currency: Currency): string {
    let value = text
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[‎‏؜]/g, "")
        .replace(/\p{Sc}/gu, "")
        .replace(/\/-$/, "")
        .trim();
    const symbol = currency.symbol.toLowerCase();
    if (/^[a-z]+$/.test(symbol)) {
        if (value.startsWith(symbol)) value = value.slice(symbol.length);
        if (value.endsWith(symbol)) value = value.slice(0, -symbol.length);
    }
    return value
        .trim()
        .replace(/^[a-z]{3}(?=[\s\d.,])/, "")
        .replace(/(?<=[\d\s])[a-z]{3}$/, (code) =>
            code in INTERNATIONAL_SUFFIXES || code in INDIAN_SUFFIXES ? code : "",
        )
        .trim();
}

/** One term: `1.5M`, `1M 200k`, `$1,250,000`. Null when unreadable. */
function parseTerm(cleaned: string, format: AmountFormat): bigint | null {
    // Spaces are grouping in many regions (1 500 000), so drop them all and
    // let the suffix letters split compound amounts like 1m200k. JS `\s`
    // already covers the no-break spaces French and Swiss grouping use.
    const compact = cleaned.replace(/\s/g, "");
    const segment = /([\d.,'’]+)([a-z]*)/gy;
    let total = BigInt(0);
    let lastMultiplier: bigint | null = null;
    let consumed = 0;
    let match: RegExpExecArray | null;

    while ((match = segment.exec(compact)) !== null) {
        consumed = segment.lastIndex;
        if (lastMultiplier === BigInt(1)) return null; // a bare number must come last
        const number = normalizeNumber(match[1], format.decimal);
        if (number == null) return null;
        const multiplier = match[2] ? suffixMultiplier(match[2], format.numbering) : BigInt(1);
        if (multiplier == null) return null;
        if (lastMultiplier != null && multiplier >= lastMultiplier) return null;
        total += scale(number, multiplier);
        lastMultiplier = multiplier;
        if (consumed === compact.length) break;
    }
    if (consumed !== compact.length || lastMultiplier == null) return null;
    return total;
}

/** True when the text adds amounts together (`10k+20k`). */
export function isAmountSum(text: string): boolean {
    return text.normalize("NFKC").includes("+");
}

/**
 * Parses what a user typed: `29k`, `21.5k`, `1.5M`, `1M 200k`, `$1,250,000`,
 * `1.250.000 €`, `1'500`, and on Indian-numbering markets `1.5L`, `1cr 20L`.
 * Parts must go from biggest to smallest; only the last may be bare.
 * Terms can be added with `+` (`10k+20k`, `85L + 5L`). No other operators:
 * `-` already means a range.
 */
export function parseAmount(
    text: string,
    currency: Currency,
    format: AmountFormat,
    max: number = MAX_AMOUNT,
): ParseResult {
    const terms = text.normalize("NFKC").split("+");
    if (terms.length === 1 && !clean(terms[0], currency)) return EMPTY;

    let total = BigInt(0);
    for (const term of terms) {
        const cleaned = clean(term, currency);
        if (!cleaned) return INVALID; // "10k+" or "10k++5k"
        const value = parseTerm(cleaned, format);
        if (value == null) return INVALID;
        total += value;
    }
    if (total > BigInt(max)) return { status: "too-large", value: null };
    return { status: "valid", value: Number(total) };
}

/** Splits `500k-750k`, `500k – 750k`, `500k to 750k`. Null when not a range. */
export function splitAmountRange(text: string): [string, string] | null {
    const parts = text.split(/\s*(?:-|–|—|\bto\b)\s*/i);
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return null;
    return [parts[0], parts[1]];
}

/** Grouped digits in the region's style: 1,234,567 · 12,34,567 · 1.234.567. */
export function formatAmountGrouped(value: number | null, format: AmountFormat): string {
    if (value == null || !Number.isFinite(value)) return "";
    return new Intl.NumberFormat(format.locale, { maximumFractionDigits: 0 }).format(value);
}

/** Grouped digits with the symbol on the region's side: `$1,250,000` · `1.250.000 €`. */
export function formatAmountWithSymbol(
    value: number | null,
    currency: Currency,
    format: AmountFormat,
): string {
    const digits = formatAmountGrouped(value, format);
    if (!digits) return "";
    const symbol = currency.symbol || currency.code;
    if (format.symbolPosition === "end") return `${digits} ${symbol}`;
    return /[A-Za-z]$/.test(symbol) ? `${symbol} ${digits}` : `${symbol}${digits}`;
}
