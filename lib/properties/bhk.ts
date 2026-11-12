/**
 * Usual bathroom count for a BHK value — one per bedroom (1 RK → 1, 10+ → 10).
 * Returns null when the BHK is blank or unknown.
 */
export function bathroomsForBhk(bedrooms: string | null | undefined): number | null {
    const raw = String(bedrooms ?? "")
        .trim()
        .toLowerCase();
    if (!raw || raw === "0") return null;
    if (raw === "1rk") return 1;
    const count = Number.parseInt(raw, 10);
    if (!Number.isFinite(count) || count <= 0) return null;
    return Math.min(count, 10);
}
