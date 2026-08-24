const LAKH = 100_000;
const CRORE = 10_000_000;

function trimTrailingZeros(value: string): string {
    return value.replace(/\.?0+$/, "");
}

/**
 * Formats an INR amount for display (sale or general).
 * ≥ 1 Cr → ₹X.XX Cr · 1 L–1 Cr → ₹XX L · &lt; 1 L → ₹XX,XXX (en-IN).
 */
export function formatPriceInr(amountInr: number): string {
    const abs = Math.abs(amountInr);

    if (abs >= CRORE) {
        const crores = abs / CRORE;
        const fixed = crores >= 10 ? crores.toFixed(1) : crores.toFixed(2);
        return `₹${trimTrailingZeros(fixed)} Cr`;
    }

    if (abs >= LAKH) {
        const lakhs = abs / LAKH;
        const fixed = Number.isInteger(lakhs) ? String(lakhs) : lakhs.toFixed(1);
        return `₹${trimTrailingZeros(fixed)} L`;
    }

    return `₹${abs.toLocaleString("en-IN")}`;
}

/** Rent display: same rules as {@link formatPriceInr}, with `/mo` appended. */
export function formatRentInr(amountInr: number): string {
    return `${formatPriceInr(amountInr)}/mo`;
}
