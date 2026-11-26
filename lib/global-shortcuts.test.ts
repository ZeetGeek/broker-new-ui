import assert from "node:assert/strict";
import test from "node:test";
import { createKeybindingsHandler } from "tinykeys";

import { workflowTarget } from "@/lib/workflows/target";

import { buildGlobalShortcutBindings } from "@/features/shortcuts/global-shortcut-bindings";

class ShortcutTarget {
    constructor(readonly editable = false) {}
    closest() {
        return this.editable ? this : null;
    }
    matches() {
        return this.editable;
    }
}

function withShortcutDom(run: (dialogs: HTMLElement[]) => void) {
    const previousElement = Object.getOwnPropertyDescriptor(globalThis, "Element");
    const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
    const dialogs: HTMLElement[] = [];
    Object.defineProperty(globalThis, "Element", { configurable: true, value: ShortcutTarget });
    Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: { querySelectorAll: () => dialogs },
    });
    try {
        run(dialogs);
    } finally {
        for (const [key, descriptor] of [
            ["Element", previousElement],
            ["document", previousDocument],
        ] as const) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else Reflect.deleteProperty(globalThis, key);
        }
    }
}

function keyEvent(key: string, overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
    return {
        key,
        code: /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : key,
        target: new ShortcutTarget(),
        currentTarget: null,
        defaultPrevented: false,
        repeat: false,
        isComposing: false,
        getModifierState: () => false,
        preventDefault() {
            Object.assign(this, { defaultPrevented: true });
        },
        ...overrides,
    } as unknown as KeyboardEvent;
}

test("quick-action sequences open one existing form without navigating away", () => {
    withShortcutDom(() => {
        const opened: string[] = [];
        const handler = createKeybindingsHandler(
            buildGlobalShortcutBindings({
                routes: { dashboard: "/broker/dashboard" },
                onNavigate: () => assert.fail("quick actions must preserve the current page"),
                onWorkflowOpen: (href) => {
                    const target = workflowTarget(href, "broker");
                    assert.ok(target);
                    opened.push(`${target.kind}:${target.mode}`);
                    return true;
                },
                onShortcutsOpen: () => assert.fail("unexpected help dialog"),
            }),
        );

        for (const key of ["c", "o", "l", "v", "t"]) {
            handler(keyEvent("a"));
            const completion = keyEvent(key);
            handler(completion);
            assert.equal(completion.defaultPrevented, true, `A then ${key}`);
            handler(keyEvent("Escape"));
        }
        assert.deepEqual(opened, [
            "contact:create-client",
            "contact:create-owner",
            "property:create",
            "visit:schedule",
            "task:create",
        ]);
    });
});

test("quick actions respect typing, handled events, composition, and repeated keys", () => {
    withShortcutDom(() => {
        const bindings = buildGlobalShortcutBindings({
            routes: {},
            onNavigate: () => assert.fail("unexpected navigation"),
            onWorkflowOpen: () => assert.fail("must not interrupt the current interaction"),
            onShortcutsOpen: () => assert.fail("unexpected help dialog"),
        });
        for (const overrides of [
            { target: new ShortcutTarget(true) as unknown as EventTarget },
            { defaultPrevented: true },
            { isComposing: true },
            { repeat: true },
        ]) {
            for (const key of ["C", "O", "L", "V", "T"])
                bindings[`KeyA Key${key}`]!(keyEvent(key.toLowerCase(), overrides));
        }
    });
});

test("an open form blocks another quick action and shortcuts resume after it closes", () => {
    withShortcutDom((dialogs) => {
        let opened = 0;
        const handler = createKeybindingsHandler(
            buildGlobalShortcutBindings({
                routes: {},
                onNavigate: () => assert.fail("unexpected navigation"),
                onWorkflowOpen: () => {
                    opened++;
                    dialogs.push({
                        hidden: false,
                        getAttribute: () => null,
                    } as unknown as HTMLElement);
                    return true;
                },
                onShortcutsOpen: () => assert.fail("unexpected help dialog"),
            }),
        );
        const addTask = () => {
            handler(keyEvent("a"));
            handler(keyEvent("t"));
        };
        addTask();
        addTask();
        assert.equal(opened, 1);
        dialogs.length = 0;
        addTask();
        assert.equal(opened, 2);
    });
});

test("navigation remains available and broker quick actions do not enter the owner portal", () => {
    withShortcutDom(() => {
        const navigated: string[] = [];
        const bindings = buildGlobalShortcutBindings({
            portal: "owner",
            routes: { dashboard: "/owner/dashboard" },
            onNavigate: (href) => navigated.push(href),
            onWorkflowOpen: () => assert.fail("broker actions must not open in the owner portal"),
            onShortcutsOpen: () => undefined,
        });
        const handler = createKeybindingsHandler(bindings);
        handler(keyEvent("g"));
        handler(keyEvent("d"));
        assert.deepEqual(navigated, ["/owner/dashboard"]);
        for (const keys of ["KeyA KeyC", "KeyA KeyL", "KeyA KeyV", "KeyA KeyT", "KeyA KeyO"])
            assert.equal(bindings[keys], undefined);
    });
});
