import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

function luminance(hex: string): number {
    const rgb = hex.match(/[\da-f]{2}/gi)!.map((part) => {
        const value = parseInt(part, 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

test("functional secondary text tokens meet 4.5:1 on app light surfaces", () => {
    const css = source("app/globals.css");
    const token = (name: string) =>
        css.match(new RegExp(`--color-${name}:\\s*(#[a-f0-9]{6})`, "i"))![1];
    const reference = source("features/design-system/theme/color-tokens.ts").toLowerCase();
    for (const foreground of ["ink-muted", "ink-subtle"]) {
        assert.ok(reference.includes(token(foreground)));
        for (const background of [
            "canvas",
            "surface",
            "surface-muted",
            "brand-soft",
            "brand-soft-hover",
        ]) {
            const ratio =
                (luminance(token(background)) + 0.05) / (luminance(token(foreground)) + 0.05);
            assert.ok(ratio >= 4.5, `${foreground} on ${background}: ${ratio}`);
        }
    }
});

test("cited visit and notes fields have accessible names and phone targets use layout space", () => {
    const reschedule = source("features/site-visits/broker/panels/reschedule-modal.tsx");
    assert.match(reschedule, /htmlFor=\{timeId\}/);
    assert.match(reschedule, /aria-describedby=/);
    assert.match(
        source("features/site-visits/broker/panels/buyer-picker.tsx"),
        /aria-label="Search buyers"/,
    );
    const contact = source("features/contacts/contact-detail-panel.tsx");
    assert.match(contact, /aria-label="Buyer notes"/);
    assert.match(contact, /aria-label="Owner notes"/);
    const css = source("app/globals.css");
    assert.match(css, /@media \(pointer: coarse\), \(max-width: 767px\)/);
    assert.match(css, /min-block-size: 44px/);
    assert.match(css, /min-inline-size: 44px/);
});
