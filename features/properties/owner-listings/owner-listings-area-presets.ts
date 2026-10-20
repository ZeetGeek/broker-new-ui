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

export function formatAreaFilterLabel(minAreaSqft: string, maxAreaSqft: string): string {
    const preset = findAreaPreset(minAreaSqft, maxAreaSqft);
    if (preset) return preset.shortLabel;
    if (!minAreaSqft && !maxAreaSqft) return "Any";

    const min = minAreaSqft ? Number(minAreaSqft) : null;
    const max = maxAreaSqft ? Number(maxAreaSqft) : null;

    if (min != null && !Number.isNaN(min) && max != null && !Number.isNaN(max)) {
        return `${formatSqftCompact(min)}–${formatSqftCompact(max)}`;
    }
    if (max != null && !Number.isNaN(max)) return `Under ${formatSqftCompact(max)}`;
    if (min != null && !Number.isNaN(min)) return `${formatSqftCompact(min)}+`;
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
    const high = maxAreaSqft ? Number(maxAreaSqft) : bounds.max;
    return [
        Number.isFinite(low) ? Math.max(bounds.min, Math.min(bounds.max, low)) : bounds.min,
        Number.isFinite(high) ? Math.max(bounds.min, Math.min(bounds.max, high)) : bounds.max,
    ];
}

/** Drop legacy / impossible floors (e.g. URL `minArea=0`). */
export function normalizeAreaFilterStrings(
    minAreaSqft: string,
    maxAreaSqft: string,
): { minAreaSqft: string; maxAreaSqft: string } {
    return areaRangeToDraft(areaDraftToRange(minAreaSqft, maxAreaSqft));
}

export function formatAreaSqftDisplay(value: number, openAtMax = false): string {
    if (openAtMax && value >= OWNER_LISTINGS_AREA_RANGE.max) {
        return `${OWNER_LISTINGS_AREA_RANGE.max.toLocaleString("en-IN")}+`;
    }
    return value.toLocaleString("en-IN");
}

const HISTOGRAM_BUCKETS = 28;

/** Soft fallback curve when the pool has little area data. */
function fallbackHistogramHeights(): number[] {
    const peaks = [0.15, 0.28, 0.45, 0.7, 0.95, 1, 0.92, 0.85, 0.72, 0.6, 0.55, 0.48, 0.42, 0.38];
    const heights: number[] = [];
    for (let i = 0; i < HISTOGRAM_BUCKETS; i++) {
        const t = i / (HISTOGRAM_BUCKETS - 1);
        const idx = t * (peaks.length - 1);
        const a = Math.floor(idx);
        const b = Math.min(peaks.length - 1, a + 1);
        const mix = idx - a;
        heights.push(peaks[a]! * (1 - mix) + peaks[b]! * mix);
    }
    return heights;
}

/** Relative bar heights 0–1 for the Area slider histogram. */
export function buildAreaHistogram(
    areaSqftValues: number[],
    bounds: { min: number; max: number } = OWNER_LISTINGS_AREA_RANGE,
): number[] {
    const usable = areaSqftValues.filter(
        (value) => Number.isFinite(value) && value > 0 && value <= bounds.max * 1.25,
    );
    if (usable.length < 3) return fallbackHistogramHeights();

    const counts = Array.from({ length: HISTOGRAM_BUCKETS }, () => 0);
    const span = bounds.max - bounds.min || 1;
    for (const value of usable) {
        const clamped = Math.min(bounds.max, Math.max(bounds.min, value));
        const index = Math.min(
            HISTOGRAM_BUCKETS - 1,
            Math.floor(((clamped - bounds.min) / span) * HISTOGRAM_BUCKETS),
        );
        counts[index] = (counts[index] ?? 0) + 1;
    }
    const peak = Math.max(...counts, 1);
    return counts.map((count) => Math.max(0.08, count / peak));
}
