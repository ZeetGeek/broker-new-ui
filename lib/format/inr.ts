const indianNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function parseInr(value: string | number | null | undefined): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : null;
    if (!value) return null;

    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[₹,\s]/g, "");
    if (!normalized) return null;

    const match = normalized.match(/^(-?\d+(?:\.\d+)?)(crores?|cr|lakhs?|l|thousands?|k)?$/);
    if (!match) return null;

    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount < 0) return null;
    const multiplier =
        match[2] === "cr" || match[2]?.startsWith("crore")
            ? 10_000_000
            : match[2] === "l" || match[2]?.startsWith("lakh")
              ? 100_000
              : match[2] === "k" || match[2]?.startsWith("thousand")
                ? 1_000
                : 1;
    return Math.round(amount * multiplier);
}

export function formatInr(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return "— — —";
    return `₹${indianNumber.format(Math.round(value))}`;
}

export function formatInrInput(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value) || value === 0) return "";
    return indianNumber.format(Math.round(value));
}

export function formatInrCompact(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return "— — —";
    const amount = Math.max(0, value);
    if (amount >= 10_000_000) return `₹${trimZeros(amount / 10_000_000, 2)} Cr`;
    if (amount >= 100_000) return `₹${trimZeros(amount / 100_000, 2)} L`;
    return formatInr(amount);
}

export function inrWordHint(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value) || value <= 0) return "";
    if (value >= 10_000_000) return `${trimZeros(value / 10_000_000, 2)} Crore`;
    if (value >= 100_000) return `${trimZeros(value / 100_000, 2)} Lakh`;
    if (value >= 1_000) return `${trimZeros(value / 1_000, 1)} Thousand`;
    return `${Math.round(value)} Rupees`;
}

function trimZeros(value: number, digits: number): string {
    return value.toFixed(digits).replace(/\.?0+$/, "");
}
