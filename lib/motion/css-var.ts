export function readRootVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function readRootMs(name: string, fallback: number): number {
    const value = parseFloat(readRootVar(name));
    return Number.isFinite(value) ? value : fallback;
}

/** Length tokens have already passed through PostCSS and may now be in rem. */
export function readRootPx(name: string, fallback: number): number {
    const raw = readRootVar(name);
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) return fallback;
    if (raw.endsWith("rem")) {
        const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return value * (Number.isFinite(rootSize) && rootSize > 0 ? rootSize : 16);
    }
    return value;
}
