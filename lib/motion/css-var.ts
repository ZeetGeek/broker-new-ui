export function readRootVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function readRootMs(name: string, fallback: number): number {
    const value = parseFloat(readRootVar(name));
    return Number.isFinite(value) ? value : fallback;
}
