/** Match postcss.config.mjs: authored pixel lengths use a 16px design baseline. */
export function pxToRem(pixels: number, rootSize = 16): string {
    return `${pixels / rootSize}rem`;
}

function rootFontSize(): number {
    if (typeof document === "undefined") return 16;
    const view = document.defaultView;
    if (!view) return 16;
    const size = Number.parseFloat(view.getComputedStyle(document.documentElement).fontSize);
    return Number.isFinite(size) && size > 0 ? size : 16;
}

/** DOM measurements are already rendered pixels; preserve their actual size in rem. */
export function measuredPxToRem(pixels: number): string {
    return pxToRem(pixels, rootFontSize());
}

/** Convert a library-generated CSS transform without changing its measured position. */
export function measuredCssToRem(value: string): string;
export function measuredCssToRem(value: string | undefined): string | undefined;
export function measuredCssToRem(value: string | undefined): string | undefined {
    if (value === undefined) return value;
    const size = rootFontSize();
    return value.replace(/(-?(?:\d*\.)?\d+)px\b/g, (_, pixels: string) =>
        pxToRem(Number(pixels), size),
    );
}
