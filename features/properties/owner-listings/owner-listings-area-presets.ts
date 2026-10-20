/**
 * Slider bounds for the Area band control (sqft).
 * Floor is 200 — real listings are never 0 sqft. Top end means “and above”.
 */
export const OWNER_LISTINGS_AREA_RANGE = {
    min: 200,
    max: 5_000,
    step: 50,
} as const;

export type OwnerListingsAreaPreset = {
    min: string;
    max: string;
    label: string;
    /** Compact band trigger label. */
    shortLabel: string;
};

/** Kept for any legacy callers; the Area menu is a dual range slider now. */
export const OWNER_LISTINGS_AREA_PRESETS: OwnerListingsAreaPreset[] = [
    { min: "", max: "", label: "Any size", shortLabel: "Any" },
    { min: "", max: "500", label: "Under 500 sqft", shortLabel: "Under 500" },
    { min: "500", max: "1000", label: "500 – 1,000", shortLabel: "500–1k" },
    { min: "1000", max: "1500", label: "1,000 – 1,500", shortLabel: "1–1.5k" },
    { min: "1500", max: "2500", label: "1,500 – 2,500", shortLabel: "1.5–2.5k" },
    { min: "2500", max: "", label: "2,500+ sqft", shortLabel: "2,500+" },
];

export function findAreaPreset(
    minAreaSqft: string,
    maxAreaSqft: string,
): OwnerListingsAreaPreset | undefined {
    return OWNER_LISTINGS_AREA_PRESETS.find(
        (preset) => preset.min === minAreaSqft && preset.max === maxAreaSqft,
    );
}

function formatSqftCompact(value: number): string {
    if (value >= 1000) {
        const k = value / 1000;
        return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
    }
    return value.toLocaleString("en-IN");
}

/** Open upper bound — include listings above the 5,000 sqft slider ceiling. */
export const AREA_ABOVE_MAX_TOKEN = `${OWNER_LISTINGS_AREA_RANGE.max}+`;

export function isAreaAboveMax(maxAreaSqft: string): boolean {
    return maxAreaSqft.endsWith("+");
}

const AREA_PLUS_LABEL = `${OWNER_LISTINGS_AREA_RANGE.max.toLocaleString("en-IN")}+`;

export function formatAreaFilterLabel(minAreaSqft: string, maxAreaSqft: string): string {
    if (!minAreaSqft && !maxAreaSqft) return "Any";

    const min = minAreaSqft ? Number(minAreaSqft) : null;
    const openMax = isAreaAboveMax(maxAreaSqft) || !maxAreaSqft;

    if (openMax) {
        if (
            min == null ||
            Number.isNaN(min) ||
            min <= OWNER_LISTINGS_AREA_RANGE.min ||
            min >= OWNER_LISTINGS_AREA_RANGE.max
        ) {
            return AREA_PLUS_LABEL;
        }
        return `${formatSqftCompact(min)}–${AREA_PLUS_LABEL} sqft`;
    }

    const max = Number(maxAreaSqft);
    const low = min != null && !Number.isNaN(min) ? min : OWNER_LISTINGS_AREA_RANGE.min;
    if (Number.isFinite(max)) {
        return `${formatSqftCompact(low)}–${formatSqftCompact(max)} sqft`;
    }
    return "Any";
}

/** A thumb on either end means that side is open (`""`). */
export function areaRangeToDraft(
    [low, high]: readonly number[],
    bounds: { min: number; max: number } = OWNER_LISTINGS_AREA_RANGE,
): { minAreaSqft: string; maxAreaSqft: string } {
    const min = Math.round(low ?? bounds.min);
    const max = Math.round(high ?? bounds.max);
    return {
        minAreaSqft: min <= bounds.min ? "" : String(min),
        maxAreaSqft: max >= bounds.max ? "" : String(max),
    };
}

export function areaDraftToRange(
    minAreaSqft: string,
    maxAreaSqft: string,
    bounds: { min: number; max: number } = OWNER_LISTINGS_AREA_RANGE,
): [number, number] {
    const low = minAreaSqft ? Number(minAreaSqft) : bounds.min;
    const high = isAreaAboveMax(maxAreaSqft)
        ? bounds.max
        : maxAreaSqft
          ? Number(maxAreaSqft)
          : bounds.max;
    return [
        Number.isFinite(low) ? Math.max(bounds.min, Math.min(bounds.max, low)) : bounds.min,
        Number.isFinite(high) ? Math.max(bounds.min, Math.min(bounds.max, high)) : bounds.max,
    ];
}

/** Drop legacy / impossible floors (e.g. URL `minArea=0`). Keeps an explicit 5,000 cap and the 5,000+ token. */
export function normalizeAreaFilterStrings(
    minAreaSqft: string,
    maxAreaSqft: string,
): { minAreaSqft: string; maxAreaSqft: string } {
    if (isAreaAboveMax(maxAreaSqft)) {
        const min = areaRangeToDraft(areaDraftToRange(minAreaSqft, "")).minAreaSqft;
        return { minAreaSqft: min, maxAreaSqft: AREA_ABOVE_MAX_TOKEN };
    }
    const [low, high] = areaDraftToRange(minAreaSqft, maxAreaSqft);
    return {
        minAreaSqft: low <= OWNER_LISTINGS_AREA_RANGE.min ? "" : String(Math.round(low)),
        maxAreaSqft: maxAreaSqft ? String(Math.round(high)) : "",
    };
}

export function formatAreaSqftDisplay(value: number, openAtMax = false): string {
    if (openAtMax && value >= OWNER_LISTINGS_AREA_RANGE.max) {
        return `${OWNER_LISTINGS_AREA_RANGE.max.toLocaleString("en-IN")}+`;
    }
    return value.toLocaleString("en-IN");
}

/**
 * Fixed decorative bar pattern for the Area slider histogram.
 * Dual crest (taller left, secondary right) with a soft valley in between —
 * kept constant so the menu never flickers between pool-data shapes on load.
 */
const AREA_HISTOGRAM_PATTERN: readonly number[] = [
    0.18, 0.22, 0.4, 0.75, 1, 0.78, 0.42, 0.32, 0.28, 0.24, 0.3, 0.48, 0.52, 0.4, 0.58, 0.85, 0.95,
    0.72, 0.42, 0.22,
];

/**
 * Relative bar heights 0–1 for the Area slider histogram.
 * Pattern is fixed on purpose — live pool values only drive active/inactive tint.
 */
export function buildAreaHistogram(_areaSqftValues?: number[]): number[] {
    return [...AREA_HISTOGRAM_PATTERN];
}
