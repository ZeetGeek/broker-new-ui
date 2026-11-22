import assert from "node:assert/strict";
import test from "node:test";

import { formatPersonName } from "@/lib/format/person-name";

test("person names are capitalized for display without changing their source", () => {
    const stored = "  rahul   mehta  ";
    assert.equal(formatPersonName(stored), "Rahul Mehta");
    assert.equal(stored, "  rahul   mehta  ");
    assert.equal(formatPersonName("RAMESH PATEL"), "Ramesh Patel");
    assert.equal(formatPersonName("exclusive owner"), "Exclusive Owner");
});

test("person-name display preserves initials, acronyms and intentional mixed casing", () => {
    assert.equal(formatPersonName("R. K. shah"), "R. K. Shah");
    assert.equal(formatPersonName("ABC builders"), "ABC Builders");
    assert.equal(formatPersonName("McDonald"), "McDonald");
    assert.equal(formatPersonName("exclOwner"), "ExclOwner");
    assert.equal(formatPersonName("d'souza shah-patel"), "D'Souza Shah-Patel");
});

test("person-name display handles Indian scripts, accents and absent values", () => {
    assert.equal(formatPersonName("ભાવના શાહ"), "ભાવના શાહ");
    assert.equal(formatPersonName("éloïse d’souza"), "Éloïse D’Souza");
    assert.equal(formatPersonName(undefined), "");
    assert.equal(formatPersonName(null), "");
    assert.equal(formatPersonName("  "), "");
});
