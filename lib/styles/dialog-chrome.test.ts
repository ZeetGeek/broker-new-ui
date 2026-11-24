import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

register(
    `data:text/javascript,${encodeURIComponent(`
        export function load(url, context, nextLoad) {
            if (url.endsWith(".css")) {
                return { format: "module", source: "export default {};", shortCircuit: true };
            }
            return nextLoad(url, context);
        }
    `)}`,
    { parentURL: import.meta.url },
);

const { AppModalFooter } = await import("@/components/shared/app-modal-footer");
const { AppModalHeader } = await import("@/components/shared/app-modal-header");
const { Dialog } = await import("@/components/ui/dialog");

test("shared footer keeps external form submission and busy destructive actions intact", () => {
    const html = renderToStaticMarkup(
        createElement(AppModalFooter, {
            primaryLabel: "Delete task",
            primaryVariant: "destructive",
            primaryType: "submit",
            primaryFormId: "delete-task-form",
            primaryLoading: true,
            secondaryLabel: "Keep task",
            secondaryDisabled: true,
        }),
    );
    const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(
        (match) => match[0],
    );
    assert.equal(buttons.length, 2);
    const primary = buttons.find((button) => button.includes("Delete task"))!;
    assert.match(primary, /type="submit"/);
    assert.match(primary, /form="delete-task-form"/);
    assert.match(primary, /aria-busy="true"/);
    assert.match(primary, /disabled=""/);
    assert.match(
        buttons.find((button) => button.includes("Keep task"))!,
        /disabled=""/,
    );
});

test("shared footer accepts custom links without adding an unintended primary action", () => {
    const html = renderToStaticMarkup(
        createElement(
            AppModalFooter,
            null,
            createElement("a", { href: "tel:+919876543210" }, "Call owner"),
        ),
    );
    assert.match(html, /href="tel:\+919876543210"/);
    assert.doesNotMatch(html, /<button/);
});

test("form toolbar uses one accessible title, a shared disabled close control and header content", () => {
    const html = renderToStaticMarkup(
        createElement(
            Dialog,
            null,
            createElement(
                AppModalHeader,
                {
                    title: "Add property",
                    description: "Property and commission details",
                    closeDisabled: true,
                    titleExtra: createElement("span", null, "Saved on this device"),
                    actions: createElement("button", { type: "button" }, "Publish"),
                },
                createElement("input", { "aria-label": "Search properties" }),
            ),
        ),
    );
    assert.equal((html.match(/<h2\b/g) ?? []).length, 1);
    assert.match(html, /Add property/);
    assert.match(html, /Saved on this device/);
    assert.match(html, /Property and commission details/);
    assert.match(html, /aria-label="Search properties"/);
    const close = [...html.matchAll(/<button\b[^>]*>/g)].find((match) =>
        match[0].includes('aria-label="Close"'),
    )?.[0];
    assert.ok(close);
    assert.match(close, /disabled=""/);
});
