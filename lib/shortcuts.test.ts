import assert from "node:assert/strict";
import test from "node:test";

import {
    BROKER_SHORTCUTS,
    getBrokerContextShortcutIds,
    getShortcut,
    shortcutMatchesEvent,
} from "@/lib/shortcuts";
import { workflowTarget } from "@/lib/workflows/target";

test("broker navigation shortcuts cover every top-level module with mnemonic keys", () => {
    const expected = {
        dashboard: "KeyG KeyD",
        contacts: "KeyG KeyC",
        your_listings: "KeyG KeyL",
        pipeline: "KeyG KeyP",
        visits: "KeyG KeyV",
        tasks: "KeyG KeyT",
        earnings: "KeyG KeyE",
        owner_listings: "KeyG KeyM",
        my_deals: "KeyG KeyR",
        notifications: "KeyG KeyN",
        recent_updates: "KeyG KeyH",
        profile: "KeyG KeyU",
        referrals: "KeyG KeyF",
    } as const;

    for (const [id, keys] of Object.entries(expected)) {
        assert.equal(getShortcut(id as keyof typeof expected)?.keys, keys);
    }
});

test("history shortcuts have profile hints and unique navigation bindings", () => {
    for (const id of ["notifications", "recent_updates"] as const) {
        assert.equal(getShortcut(id)?.showInProfileMenu, true);
    }
    const keys = BROKER_SHORTCUTS.filter((shortcut) => shortcut.scope === "global").map(
        (shortcut) => shortcut.keys,
    );
    assert.equal(new Set(keys).size, keys.length);
});

test("saved-property navigation is absent from the broker shortcut registry", () => {
    assert.equal(getShortcut("saved_properties"), undefined);
});

test("broker quick actions open existing create workflows from every page", () => {
    const expected = {
        add_contact: { keys: "KeyA KeyC", kind: "contact", mode: "create-client" },
        add_owner: { keys: "KeyA KeyO", kind: "contact", mode: "create-owner" },
        add_property: { keys: "KeyA KeyL", kind: "property", mode: "create" },
        schedule_visit: { keys: "KeyA KeyV", kind: "visit", mode: "schedule" },
        add_task: { keys: "KeyA KeyT", kind: "task", mode: "create" },
    } as const;
    for (const [id, { keys, kind, mode }] of Object.entries(expected)) {
        const shortcut = getShortcut(id as keyof typeof expected)!;
        assert.equal(shortcut.scope, "global");
        assert.equal(shortcut.group, "Quick actions");
        assert.equal(shortcut.keys, keys);
        const target = workflowTarget(shortcut.workflowHref!, "broker");
        assert.equal(target?.kind, kind);
        assert.equal(target?.mode, mode);
    }
});

test("only form shortcuts depend on the current broker page", () => {
    assert.deepEqual(getBrokerContextShortcutIds("/broker/dashboard"), []);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/contacts"), []);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/my-listings"), []);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/visits"), []);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/tasks"), []);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/properties/new"), ["form_primary"]);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/properties/abc/edit"), ["form_primary"]);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/earnings"), []);

    const pageBindings = BROKER_SHORTCUTS.filter((shortcut) => shortcut.scope === "page");
    assert.deepEqual(pageBindings, []);
});

test("broker registry omits destructive and consequential shortcuts", () => {
    const ids = new Set<string>(BROKER_SHORTCUTS.map((shortcut) => shortcut.id));
    for (const forbidden of ["logout", "delete", "publish", "approve", "reject"]) {
        assert.equal(ids.has(forbidden), false);
    }
    assert.equal(
        BROKER_SHORTCUTS.some((shortcut) => shortcut.keys.toLowerCase() === "$mod+keys"),
        false,
    );
    assert.equal(
        BROKER_SHORTCUTS.some(
            (shortcut) =>
                (shortcut.scope === "global" || shortcut.scope === "page") &&
                /^(Key|Digit)[A-Z0-9]+$/.test(shortcut.keys),
        ),
        false,
    );
});

test("form chord matching follows the registry modifiers", () => {
    const primary = getShortcut("form_primary")!;
    const another = getShortcut("form_submit_another")!;
    const event = {
        altKey: false,
        code: "Enter",
        ctrlKey: true,
        key: "Enter",
        metaKey: false,
        shiftKey: false,
    };

    assert.equal(shortcutMatchesEvent(event, primary.keys), true);
    assert.equal(shortcutMatchesEvent({ ...event, shiftKey: true }, primary.keys), false);
    assert.equal(shortcutMatchesEvent({ ...event, shiftKey: true }, another.keys), true);
    assert.equal(shortcutMatchesEvent({ ...event, ctrlKey: false }, primary.keys), false);
    assert.equal(
        shortcutMatchesEvent({ ...event, ctrlKey: false, metaKey: true }, primary.keys),
        true,
    );
});
