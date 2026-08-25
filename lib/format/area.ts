/**
 * Formats carpet/built-up area for display.
 * Indian grouping: `1,340 sq ft`.
 */
export function formatAreaSqft(areaSqft: number): string {
    const abs = Math.abs(Math.round(areaSqft));
    return `${abs.toLocaleString("en-IN")} sq ft`;
}
