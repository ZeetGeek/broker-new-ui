/** Keep this order stable: changing it changes the colour assigned to every area. */
const AREA_COLORS = [
    "bg-emerald-100 text-emerald-800",
    "bg-sky-100 text-sky-800",
    "bg-amber-100 text-amber-800",
    "bg-violet-100 text-violet-800",
    "bg-rose-100 text-rose-800",
    "bg-teal-100 text-teal-800",
    "bg-orange-100 text-orange-800",
    "bg-indigo-100 text-indigo-800",
] as const;

/** Same area name, same colour on every page, independent of list order or session. */
export function areaColorClassName(area: string): string {
    const name = area.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
    if (!name) return "bg-stone-100 text-stone-800";

    // FNV-1a uses only the name; no browser storage or API data is needed.
    let hash = 2166136261;
    for (let index = 0; index < name.length; index += 1) {
        hash = Math.imul(hash ^ name.charCodeAt(index), 16777619);
    }
    return AREA_COLORS[(hash >>> 0) % AREA_COLORS.length];
}
