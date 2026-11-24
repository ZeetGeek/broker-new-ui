import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";

import { observeScrollOverflow } from "@/lib/styles/scroll-overflow";

class ScrollNode {
    clientHeight = 200;
    scrollHeight = 200;
    scrollTop = 0;
    overflowY = "auto";
    children: ScrollNode[] = [];
    parentElement: ScrollNode | null = null;
    ownerDocument!: HTMLElement["ownerDocument"];
    listeners = new Set<() => void>();

    append(child: ScrollNode) {
        child.parentElement = this;
        child.ownerDocument = this.ownerDocument;
        this.children.push(child);
        return child;
    }
    querySelectorAll(): ScrollNode[] {
        return this.children.flatMap((child) => [child, ...child.querySelectorAll()]);
    }
    contains(node: ScrollNode): boolean {
        return node === this || this.children.some((child) => child.contains(node));
    }
    addEventListener(_name: string, listener: () => void) {
        this.listeners.add(listener);
    }
    removeEventListener(_name: string, listener: () => void) {
        this.listeners.delete(listener);
    }
    scroll(top: number) {
        this.scrollTop = top;
        this.emitScroll();
    }
    emitScroll() {
        this.listeners.forEach((listener) => listener());
        this.parentElement?.emitScroll();
    }
    asElement() {
        return this as unknown as HTMLElement;
    }
}

function harness(t: TestContext) {
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 0;
    const observers: FakeObserver[] = [];
    class FakeObserver {
        targets = new Set<Element>();
        constructor(readonly notify: () => void) {
            observers.push(this);
        }
        observe(node: Element) {
            this.targets.add(node);
        }
        unobserve(node: Element) {
            this.targets.delete(node);
        }
        disconnect() {
            this.targets.clear();
        }
    }
    for (const name of ["ResizeObserver", "MutationObserver"] as const) {
        const original = Object.getOwnPropertyDescriptor(globalThis, name);
        Object.defineProperty(globalThis, name, { configurable: true, value: FakeObserver });
        t.after(() => {
            if (original) Object.defineProperty(globalThis, name, original);
            else Reflect.deleteProperty(globalThis, name);
        });
    }
    const view = {
        getComputedStyle: (node: ScrollNode) => ({ overflowY: node.overflowY }),
        requestAnimationFrame: (callback: FrameRequestCallback) => {
            frames.set(++nextFrame, callback);
            return nextFrame;
        },
        cancelAnimationFrame: (id: number) => frames.delete(id),
    };
    const root = new ScrollNode();
    root.ownerDocument = { defaultView: view } as unknown as Document;
    const values: boolean[] = [];
    const stop = observeScrollOverflow(root.asElement(), (value) => values.push(value));
    const flush = () => {
        const current = [...frames.values()];
        frames.clear();
        current.forEach((callback) => callback(0));
        return values.at(-1);
    };
    t.after(stop);
    return { root, values, frames, observers, flush, stop };
}

test("native modal and drawer shadows start on overflow, hide at the end and return on scrolling up", (t) => {
    const h = harness(t);
    h.root.scrollHeight = 500;
    assert.equal(h.flush(), true);
    h.root.scroll(299.5);
    assert.equal(h.flush(), false, "fractional final pixels must not leave a shadow");
    h.root.scroll(80);
    assert.equal(h.flush(), true);
    h.root.scroll(300);
    assert.equal(h.flush(), false);
});

test("SimpleBar and custom ScrollArea viewports use their actual scroll offset", (t) => {
    const h = harness(t);
    h.root.overflowY = "hidden";
    h.root.scrollHeight = 800;
    const viewport = h.root.append(new ScrollNode());
    viewport.scrollHeight = 700;
    assert.equal(h.flush(), true);
    viewport.scroll(500);
    assert.equal(h.flush(), false, "clipped layout wrappers must not keep the footer shadow on");
    viewport.scroll(100);
    assert.equal(h.flush(), true);
});

test("content loading, accordion changes and resizing recalculate the overflow cue", (t) => {
    const h = harness(t);
    assert.equal(h.flush(), false);
    h.root.scrollHeight = 600;
    h.observers[1].notify();
    assert.equal(h.flush(), true);
    h.root.scroll(400);
    assert.equal(h.flush(), false);
    h.root.scrollHeight = 800;
    h.observers[0].notify();
    assert.equal(h.flush(), true, "new content below the former end restores the cue");
    h.root.clientHeight = 800;
    h.root.scrollTop = 0;
    h.observers[0].notify();
    assert.equal(h.flush(), false, "a viewport that fits the content needs no shadow");
});

test("nested lists and hidden tabs cannot leave a shadow after the main body reaches the end", (t) => {
    const h = harness(t);
    h.root.scrollHeight = 600;
    h.root.scrollTop = 400;
    const inner = h.root.append(new ScrollNode());
    inner.scrollHeight = 1000;
    assert.equal(h.flush(), false);
    h.root.scroll(100);
    assert.equal(h.flush(), true);
    h.root.scrollHeight = 200;
    h.root.scrollTop = 0;
    inner.clientHeight = 0;
    h.observers[1].notify();
    assert.equal(h.flush(), false);
});

test("closing a modal cancels pending measurement and disconnects scroll and size observers", (t) => {
    const h = harness(t);
    h.root.scrollHeight = 500;
    assert.equal(h.frames.size, 1);
    h.stop();
    assert.equal(h.frames.size, 0);
    assert.equal(h.root.listeners.size, 0);
    assert.ok(h.observers.every((observer) => observer.targets.size === 0));
    h.root.scroll(100);
    h.observers.forEach((observer) => observer.notify());
    h.flush();
    assert.deepEqual(h.values, []);
});
