export type AreaUnit =
    | "sqft"
    | "sqin"
    | "sqyd"
    | "sqmi"
    | "acre"
    | "sqmm"
    | "sqcm"
    | "sqm"
    | "sqkm"
    | "hectare"
    | "are";

/**
 * Square feet per unit. These are exact by definition, not measurements:
 * the international yard is defined as 0.9144 m, which fixes every
 * imperial/metric relationship below. Values are written as expressions
 * so the definition stays visible and no digits get truncated by hand.
 */
const SQFT_PER_SQM = 1 / 0.3048 ** 2;

export const AREA_TO_SQFT: Record<AreaUnit, number> = {
    // Imperial / US customary
    sqft: 1,
    sqin: 1 / 144,
    sqyd: 9,
    sqmi: 27_878_400,
    acre: 43_560,
    // Metric
    sqmm: SQFT_PER_SQM / 1_000_000,
    sqcm: SQFT_PER_SQM / 10_000,
    sqm: SQFT_PER_SQM,
    sqkm: SQFT_PER_SQM * 1_000_000,
    hectare: SQFT_PER_SQM * 10_000,
    are: SQFT_PER_SQM * 100,
};

function factorFor(unit: string): number | null {
    return AREA_TO_SQFT[unit as AreaUnit] ?? null;
}

export function areaToSqft(value: number | null | undefined, unit: string): number {
    if (value == null || !Number.isFinite(value) || value <= 0) return 0;
    const factor = factorFor(unit);
    if (factor == null) return 0;
    return Math.round(value * factor);
}

export function convertArea(
    value: number | null | undefined,
    fromUnit: string,
    toUnit: string,
): number | null {
    if (value == null || !Number.isFinite(value) || value <= 0) return value ?? null;
    const sourceFactor = factorFor(fromUnit);
    const targetFactor = factorFor(toUnit);
    if (sourceFactor == null || targetFactor == null) return value;
    return Math.round(((value * sourceFactor) / targetFactor) * 100) / 100;
}

export function calculateLoadingPercent(
    carpet: number | null | undefined,
    superBuiltUp: number | null | undefined,
): number | null {
    if (!carpet || !superBuiltUp || carpet <= 0 || superBuiltUp < carpet) return null;
    return Math.round(((superBuiltUp - carpet) / carpet) * 100 * 100) / 100;
}
