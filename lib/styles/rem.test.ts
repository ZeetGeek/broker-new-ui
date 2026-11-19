import assert from "node:assert/strict";
import test from "node:test";

import { readRootPx } from "@/lib/motion/css-var";
import { measuredCssToRem, measuredPxToRem, pxToRem } from "@/lib/styles/rem";

function withRootSize(fontSize: string, run: () => void) {
    const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
    const previousComputedStyle = Object.getOwnPropertyDescriptor(globalThis, "getComputedStyle");
    const tokens: Record<string, string> = { "--distance": "0.75rem", "--legacy": "12px" };
    const getComputedStyle = () => ({
        fontSize,
        getPropertyValue: (name: string) => tokens[name] ?? "",
    });
    Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: { documentElement: {}, defaultView: { getComputedStyle } },
    });
    Object.defineProperty(globalThis, "getComputedStyle", {
        configurable: true,
        value: getComputedStyle,
    });
    try {
        run();
    } finally {
        for (const [key, descriptor] of [
            ["document", previousDocument],
            ["getComputedStyle", previousComputedStyle],
        ] as const) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else Reflect.deleteProperty(globalThis, key);
        }
    }
}

test("authored lengths use the same baseline as PostCSS, including fractional and negative pixels", () => {
    assert.equal(pxToRem(16), "1rem");
    assert.equal(pxToRem(1), "0.0625rem");
    assert.equal(pxToRem(-2), "-0.125rem");
    assert.equal(pxToRem(0), "0rem");
    assert.equal(measuredPxToRem(32), "2rem", "server rendering needs no DOM");
});

test("measured sizes and generated transforms preserve their pixel geometry at different root sizes", () => {
    for (const rootSize of [16, 20, 24]) {
        withRootSize(`${rootSize}px`, () => {
            assert.equal(Number.parseFloat(measuredPxToRem(120)) * rootSize, 120);
            const transform = measuredCssToRem("translate3d(120px, -40px, 0) scaleX(1.2)");
            assert.equal(
                transform,
                `translate3d(${120 / rootSize}rem, ${-40 / rootSize}rem, 0) scaleX(1.2)`,
            );
            assert.equal(measuredCssToRem("translateX(50%)"), "translateX(50%)");
            assert.equal(measuredCssToRem(undefined), undefined);
        });
    }
});

test("motion length tokens read rem after PostCSS while old px tokens and missing values still work", () => {
    withRootSize("20px", () => {
        assert.equal(readRootPx("--distance", 12), 15);
        assert.equal(readRootPx("--legacy", 12), 12);
        assert.equal(readRootPx("--missing", 12), 12);
    });
    withRootSize("", () => assert.equal(measuredPxToRem(32), "2rem"));
});
