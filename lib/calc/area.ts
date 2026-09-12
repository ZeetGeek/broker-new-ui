export type AreaUnit =
    | "sqft"
    | "sqyd"
    | "sqm"
    | "acre"
    | "hectare"
    | "bigha"
    | "guntha"
    | "kanal"
    | "marla"
    | "cent"
    | "ground";

export const AREA_TO_SQFT: Record<Exclude<AreaUnit, "bigha">, number> = {
    sqft: 1,
    sqyd: 9,
    sqm: 10.7639,
    acre: 43_560,
    hectare: 107_639,
    guntha: 1_089,
    kanal: 5_445,
    marla: 272.25,
    cent: 435.6,
    ground: 2_400,
};

export const BIGHA_SQFT_BY_STATE: Record<string, number> = {
    Gujarat: 17_424,
};

export function areaToSqft(
    value: number | null | undefined,
    unit: string,
    state = "Gujarat",
): number {
    if (value == null || !Number.isFinite(value) || value <= 0) return 0;
    const factor =
        unit === "bigha"
            ? (BIGHA_SQFT_BY_STATE[state] ?? BIGHA_SQFT_BY_STATE.Gujarat)
            : AREA_TO_SQFT[unit as Exclude<AreaUnit, "bigha">];
    return Math.round(value * (factor ?? 1));
}

export function calculateLoadingPercent(
    carpet: number | null | undefined,
    superBuiltUp: number | null | undefined,
): number | null {
    if (!carpet || !superBuiltUp || carpet <= 0 || superBuiltUp < carpet) return null;
    return Math.round(((superBuiltUp - carpet) / carpet) * 100 * 100) / 100;
}
