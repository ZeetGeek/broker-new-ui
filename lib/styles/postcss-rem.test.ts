import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

import config from "../../postcss.config.mjs";

const require = createRequire(import.meta.url);

test("the final PostCSS step converts Tailwind utilities, CSS variables, calc, and media queries", async () => {
    const processors = Object.entries(config.plugins).map(([name, options]) =>
        require(name)(options),
    );
    const result = await postcss(processors).process(
        `@import "tailwindcss" source(none);
        @source inline("w-[32px] p-[8px] text-[20px]");
        :root { --custom-distance: 24px; }
        .rem-check { width: calc(100% - 32px); border: 1px solid black; margin: -8px; }
        @media (min-width: 640px) { .rem-check { padding: 24px; } }`,
        { from: fileURLToPath(new URL("../../app/globals.css", import.meta.url)) },
    );

    const declarations = new Map<string, string>();
    result.root.walkRules((rule) => {
        rule.walkDecls((declaration) => {
            declarations.set(`${rule.selector}:${declaration.prop}`, declaration.value);
        });
    });
    assert.equal(declarations.get(".w-\\[32px\\]:width"), "2rem");
    assert.equal(declarations.get(".p-\\[8px\\]:padding"), "0.5rem");
    assert.equal(declarations.get(".text-\\[20px\\]:font-size"), "1.25rem");
    assert.equal(declarations.get(":root:--custom-distance"), "1.5rem");
    assert.equal(declarations.get(".rem-check:width"), "calc(100% - 2rem)");
    assert.equal(declarations.get(".rem-check:border"), "0.0625rem solid black");
    assert.equal(declarations.get(".rem-check:margin"), "-0.5rem");
    assert.match(result.css, /@media \(min-width: 40rem\)/);
    assert.equal(Object.keys(config.plugins).at(-1), "postcss-pxtorem");
});
