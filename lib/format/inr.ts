const intlNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const intlCompact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
});

/**
 * Parses a typed money amount.
 * Accepts plain numbers and common short suffixes (k / m / b).
 * Legacy India suffixes (lakh / cr) still parse so older drafts keep working.
 */
export function parseInr(value: string | number | null | undefined): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : null;
    if (!value) return null;

    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[₹$€£,\s]/g, "");
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

export function formatInr(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return "— — —";
    return `₹${intlNumber.format(Math.round(value))}`;
}

export function formatInrInput(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value) || value === 0) return "";
    return intlNumber.format(Math.round(value));
}

export function formatInrCompact(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return "— — —";
    return `₹${intlCompact.format(Math.max(0, value))}`;
}

/** Short readable hint under money fields — international compact, never lakh/crore. */
export function inrWordHint(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value) || value <= 0) return "";
    return formatInrCompact(value).replace(/^₹/, "");
}
