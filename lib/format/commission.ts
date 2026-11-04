/** Earned brokerage totals, distinct from a property's listing ask price. */
export function formatCommission(amountInr: number, compact = false): string {
    if (!Number.isFinite(amountInr)) return "—";
    if (Math.abs(amountInr) >= 100_000) {
        const divisor = Math.abs(amountInr) >= 10_000_000 ? 10_000_000 : 100_000;
        const unit = divisor === 10_000_000 ? "crore" : "lakh";
        return `₹${(amountInr / divisor).toFixed(2)}${compact ? (unit === "crore" ? "Cr" : "L") : ` ${unit}`}`;
    }
    if (compact && Math.abs(amountInr) >= 1_000) {
        return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(amountInr / 1_000)}k`;
    }
    return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amountInr)}`;
}

/** Month keys are calendar months (YYYY-MM), independent of browser timezone. */
export function formatCommissionMonth(monthKey: string, style: "short" | "long" = "long"): string {
    return new Intl.DateTimeFormat("en-IN", {
        month: style,
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${monthKey}-01T00:00:00Z`));
}

export function formatCommissionPeriod(
    first: string,
    last: string,
    style: "short" | "long" = "long",
): string {
    if (first === last) return formatCommissionMonth(first, style);
    const firstLabel =
        first.slice(0, 4) === last.slice(0, 4)
            ? new Intl.DateTimeFormat("en-IN", { month: style, timeZone: "UTC" }).format(
                  new Date(`${first}-01T00:00:00Z`),
              )
            : formatCommissionMonth(first, style);
    return `${firstLabel}–${formatCommissionMonth(last, style)}`;
}
