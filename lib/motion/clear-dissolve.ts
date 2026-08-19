import { readRootMs, readRootVar } from "@/lib/motion/css-var";

type ClearDissolveElements = {
    wrap: HTMLElement;
    input: HTMLInputElement;
    mirror: HTMLElement;
    placeholder: HTMLElement;
    glow: HTMLElement;
    onClear: () => void;
    onDone: () => void;
};

const clearingWraps = new WeakSet<HTMLElement>();
const measureContext =
    typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");

function sampleBezier(easing: string): (t: number) => number {
    const match = easing.match(/cubic-bezier\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/);
    if (!match) {
        return (t) => t;
    }
    const [x1, y1, x2, y2] = match.slice(1).map(Number);
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    return (t) => {
        if (t <= 0) {
            return 0;
        }
        if (t >= 1) {
            return 1;
        }
        let s = t;
        for (let i = 0; i < 8; i++) {
            const dx = ((ax * s + bx) * s + cx) * s - t;
            const d = (3 * ax * s + 2 * bx) * s + cx;
            if (Math.abs(dx) < 1e-6 || d === 0) {
                break;
            }
            s -= dx / d;
        }
        return ((ay * s + by) * s + cy) * s;
    };
}

function prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDarkTheme(): boolean {
    return document.documentElement.classList.contains("dark");
}

function buildGlow(input: HTMLInputElement, wrap: HTMLElement, text: string): string {
    if (!measureContext) {
        return "";
    }
    measureContext.font = getComputedStyle(input).font;
    const rgb = isDarkTheme() ? "255,255,255" : "0,0,0";
    const width = wrap.clientWidth || 280;
    const padStart = parseFloat(getComputedStyle(input).paddingInlineStart) || 12;
    const spread = readRootMs("--glow-spread", 1.5);
    const layers: string[] = [];
    let x = 0;
    text.split(/(\s+)/).forEach((segment) => {
        const segmentWidth = measureContext.measureText(segment).width;
        if (segment.trim()) {
            const centerX = padStart + x + segmentWidth / 2;
            const halfWidth = Math.max(segmentWidth * 0.45, 8) * spread;
            (
                [
                    [0, 0.8, 7, 0.22],
                    [halfWidth * 0.45, 0.55, 8, 0.18],
                    [-halfWidth * 0.4, 0.65, 6, 0.16],
                    [halfWidth * 0.15, 0.9, 5, 0.14],
                ] as const
            ).forEach(([dx, radiusWidth, radiusHeight, alpha]) => {
                const layerX = (((centerX + dx) / width) * 100).toFixed(2);
                layers.push(
                    `radial-gradient(ellipse ${Math.max(halfWidth * radiusWidth, 2).toFixed(1)}px ${radiusHeight}px at ${layerX}% 100%, rgba(${rgb},${alpha}), transparent)`,
                );
            });
        }
        x += segmentWidth;
    });
    return layers.join(", ");
}

export function copyInputTypeMetrics(
    input: HTMLInputElement,
    mirror: HTMLElement,
    placeholder: HTMLElement,
): void {
    const computed = getComputedStyle(input);
    for (const layer of [mirror, placeholder]) {
        layer.style.font = computed.font;
        layer.style.paddingInlineStart = computed.paddingInlineStart;
        layer.style.paddingInlineEnd = computed.paddingInlineEnd;
        layer.style.paddingBlockStart = computed.paddingBlockStart;
        layer.style.paddingBlockEnd = computed.paddingBlockEnd;
    }
    mirror.style.color = computed.color;
}

export function syncClearHasValue(wrap: HTMLElement, hasValue: boolean): void {
    if (clearingWraps.has(wrap)) {
        return;
    }
    wrap.classList.toggle("has-value", hasValue);
}

export function runClearDissolve({
    wrap,
    input,
    mirror,
    placeholder,
    glow,
    onClear,
    onDone,
}: ClearDissolveElements): void {
    if (clearingWraps.has(wrap) || !input.value) {
        return;
    }

    if (prefersReducedMotion()) {
        onClear();
        onDone();
        return;
    }

    clearingWraps.add(wrap);
    const keepFocus = document.activeElement === input;
    copyInputTypeMetrics(input, mirror, placeholder);
    mirror.textContent = input.value.replace(/ /g, "\u00a0");

    const total = readRootMs("--clear-dur", 1000);
    const outDur = readRootMs("--clear-out-dur", 400);
    const inDur = readRootMs("--clear-in-dur", 400);
    const outFly = readRootMs("--clear-out-fly", 12);
    const inFly = readRootMs("--clear-in-fly", 12);
    const blur = readRootMs("--clear-blur", 2);
    const delay = readRootMs("--glow-delay", 50);
    const peakAt = readRootMs("--glow-peak-at", 0.15);
    const glowOpacity = readRootMs("--glow-opacity", 0.42);
    const easeOut = sampleBezier(readRootVar("--clear-out-ease"));
    const easeIn = sampleBezier(readRootVar("--clear-in-ease"));

    onClear();
    wrap.classList.remove("has-value");
    wrap.classList.add("is-clearing");
    glow.style.background = buildGlow(input, wrap, mirror.textContent ?? "");
    glow.style.opacity = "0";
    placeholder.style.transform = `translateY(-${inFly}px)`;
    placeholder.style.opacity = "0.9";
    placeholder.style.filter = `blur(${blur}px)`;

    const startedAt = performance.now();
    function tick(now: number) {
        const elapsed = now - startedAt;
        const outProgress = easeOut(Math.min(1, elapsed / outDur));
        mirror.style.transform = `translateY(${(outProgress * outFly).toFixed(1)}px)`;
        mirror.style.opacity = (1 - outProgress).toFixed(3);
        mirror.style.filter = `blur(${(outProgress * blur).toFixed(1)}px)`;

        const inProgress = easeIn(Math.min(1, elapsed / inDur));
        placeholder.style.transform = `translateY(${(-inFly + inProgress * inFly).toFixed(1)}px)`;
        placeholder.style.opacity = (0.9 + inProgress * 0.1).toFixed(3);
        placeholder.style.filter = `blur(${(blur - inProgress * blur).toFixed(1)}px)`;

        let glowProgress = 0;
        if (elapsed > delay) {
            const envelope = Math.min(1, (elapsed - delay) / Math.max(1, total - delay));
            glowProgress =
                envelope < peakAt ? envelope / peakAt : 1 - (envelope - peakAt) / (1 - peakAt);
        }
        glow.style.opacity = (glowProgress * glowOpacity).toFixed(3);

        if (elapsed < total) {
            requestAnimationFrame(tick);
            return;
        }

        wrap.classList.remove("is-clearing");
        mirror.style.cssText = "";
        placeholder.style.cssText = "";
        mirror.textContent = "";
        glow.style.opacity = "0";
        glow.style.background = "";
        clearingWraps.delete(wrap);
        if (keepFocus) {
            requestAnimationFrame(() => input.focus({ preventScroll: true }));
        }
        onDone();
    }
    requestAnimationFrame(tick);
}
