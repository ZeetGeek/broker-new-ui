import assert from "node:assert/strict";
import test from "node:test";

import { areaColorClassName } from "@/lib/styles/area-color";

test("area colours preserve their assignments across pages, ordering and repeated lookups", () => {
    assert.equal(areaColorClassName("Adajan"), "bg-emerald-100 text-emerald-800");
    assert.equal(areaColorClassName("Pal"), "bg-amber-100 text-amber-800");
    const names = ["Adajan", "Pal", "Bhimrad", "અડાજણ", "अडाजन"];
    const original = new Map(names.map((name) => [name, areaColorClassName(name)]));
    for (const name of [...names].reverse()) {
        assert.equal(areaColorClassName(name), original.get(name));
    }
});

test("case, whitespace and equivalent Unicode do not change an area's colour", () => {
    assert.equal(areaColorClassName(" ADAJAN "), areaColorClassName("Adajan"));
    assert.equal(areaColorClassName("Adajan\t  Gam"), areaColorClassName("adajan gam"));
    assert.equal(areaColorClassName("Ａｄａｊａｎ"), areaColorClassName("Adajan"));
    assert.equal(areaColorClassName("Cafe\u0301"), areaColorClassName("Café"));
});

test("missing area names have a predictable neutral colour", () => {
    assert.equal(areaColorClassName(""), "bg-stone-100 text-stone-800");
    assert.equal(areaColorClassName(" \t\n "), areaColorClassName(""));
});
