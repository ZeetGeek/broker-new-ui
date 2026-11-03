import assert from "node:assert/strict";
import test from "node:test";

import { scrollPropertyFormField } from "@/lib/properties/scroll-form-field";

function fixture(fieldTop: number, scrollTop = 0) {
    const scrolls: ScrollToOptions[] = [];
    const modal = { scrollTop: 0 };
    const form = { scrollTop: 0 };
    const container = {
        scrollTop,
        clientTop: 0,
        clientHeight: 600,
        scrollHeight: 1600,
        getBoundingClientRect: () => ({ top: 80 }),
        scrollTo: (options: ScrollToOptions) => scrolls.push(options),
    };
    const target = {
        closest: (selector: string) => {
            assert.equal(selector, "[data-property-form-scroll]");
            return container;
        },
        getBoundingClientRect: () => ({ top: fieldTop, height: 40 }),
        scrollIntoView: () => assert.fail("must not scroll modal ancestors"),
    } as unknown as HTMLElement;
    return { target, modal, form, scrolls };
}

test("validation scrolls the form body without shifting the modal or header", () => {
    const { target, modal, form, scrolls } = fixture(900, 100);
    assert.equal(scrollPropertyFormField(target), true);
    assert.equal(scrolls[0]!.top, 640);
    assert.equal(modal.scrollTop, 0);
    assert.equal(form.scrollTop, 0);
});

test("validation near the first and last fields stays within the form's bounds", () => {
    const first = fixture(100);
    scrollPropertyFormField(first.target);
    assert.equal(first.scrolls[0]!.top, 0);
    const last = fixture(2000);
    scrollPropertyFormField(last.target);
    assert.equal(last.scrolls[0]!.top, 1000);
});

test("a target outside the form never falls back to scrolling the document", () => {
    const target = {
        closest: () => null,
        scrollIntoView: () => assert.fail("must not move the page"),
    } as unknown as HTMLElement;
    assert.equal(scrollPropertyFormField(target), false);
});
