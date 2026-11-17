/**
 * Shared colour meanings on the earnings page.
 *
 * Trend chart (area): brand greens only — see `earnings-trend-chart.tsx`.
 * Hero / pipeline cards still use the stage chart palette for sale vs rent
 * until those cards are brought onto the one-green system.
 */
export const VIZ = {
    sale: "var(--color-chart-1)",
    rent: "var(--color-chart-3)",
    sold: "var(--color-chart-4)",
    lost: "var(--color-ink-subtle)",
    pipeline: "var(--color-chart-2)",
} as const;

/** Lighter tints of the same hues, readable on the dark earnings card. */
export const VIZ_ON_DARK = {
    sale: "color-mix(in oklch, var(--color-chart-1) 55%, var(--color-surface))",
    rent: "color-mix(in oklch, var(--color-chart-3) 60%, var(--color-surface))",
} as const;

/** Same hues as Tailwind classes, for dots, chips, and bars outside charts. */
export const VIZ_CLASS = {
    sale: { dot: "bg-chart-1", soft: "bg-chart-1/10 text-chart-1" },
    rent: { dot: "bg-chart-3", soft: "bg-chart-3/12 text-chart-3" },
    sold: { dot: "bg-chart-4", soft: "bg-chart-4/10 text-chart-4" },
    lost: { dot: "bg-ink-subtle/40", soft: "bg-surface-muted text-ink-muted" },
    pipeline: { dot: "bg-chart-2", soft: "bg-chart-2/10 text-chart-2" },
} as const;
