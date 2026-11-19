import { type ComponentProps, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

// The server-render checks need markup, while the shared button face imports CSS.
register(
    `data:text/javascript,${encodeURIComponent(`
        export function load(url, context, nextLoad) {
            if (url.endsWith(".css")) {
                return { format: "module", source: 'export default { button: "icon-button-face" };', shortCircuit: true };
            }
            return nextLoad(url, context);
        }
    `)}`,
    { parentURL: import.meta.url },
);
const { DrawerSection, revealDrawerSections } = await import("@/components/shared/drawer-section");

function renderSection(props: ComponentProps<typeof DrawerSection>) {
    return renderToStaticMarkup(createElement(DrawerSection, props));
}

test("drawer groups start open with a native keyboard-accessible disclosure and labelled content", () => {
    const html = renderSection({
        title: "Visit date and time",
        description: "Choose when to meet.",
        children: createElement("input", { name: "date", defaultValue: "2026-11-20" }),
    });
    assert.match(html, /<details[^>]*open=""[^>]*data-drawer-section/);
    assert.match(html, /<summary[^>]*>/);
    assert.match(html, /role="heading" aria-level="2"/);
    assert.match(html, /Choose when to meet\./);
    assert.match(html, /name="date" value="2026-11-20"/);
    assert.doesNotMatch(html, /<button/);
    assert.match(html, /<span[^>]*aria-hidden="true"[^>]*data-icon-button=""/);
    assert.match(html, /data-icon-appearance="outline"/);
});

test("initially collapsed groups keep form fields and values mounted", () => {
    const html = renderSection({
        title: "Notes",
        defaultOpen: false,
        headingLevel: 3,
        children: createElement("textarea", {
            name: "notes",
            defaultValue: "Meet at the gate",
        }),
    });
    assert.doesNotMatch(html, /<details[^>]*\sopen(?:=|\s|>)/);
    assert.match(html, /aria-level="3"/);
    assert.match(html, /<textarea name="notes">Meet at the gate<\/textarea>/);
});

test("validation reveals all groups in the requested form without touching other drawers", () => {
    const groups = [{ open: false }, { open: true }, { open: false }];
    const outsideGroup = { open: false };
    const form = {
        querySelectorAll(selector: string) {
            assert.equal(selector, "details[data-drawer-section]");
            return groups;
        },
    };
    revealDrawerSections(form as unknown as ParentNode);
    assert.ok(groups.every((group) => group.open));
    assert.equal(outsideGroup.open, false);
});
