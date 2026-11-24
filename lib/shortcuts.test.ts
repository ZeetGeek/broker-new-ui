import assert from "node:assert/strict";
import test from "node:test";

import {
    BROKER_SHORTCUTS,
    getBrokerContextShortcutIds,
    getShortcut,
    shortcutMatchesEvent,
} from "@/lib/shortcuts";

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
        saved_properties: "KeyG KeyS",
        profile: "KeyG KeyU",
        referrals: "KeyG KeyF",
    } as const;

    for (const [id, keys] of Object.entries(expected)) {
        assert.equal(getShortcut(id as keyof typeof expected)?.keys, keys);
    }
});

test("broker page actions are contextual two-key sequences", () => {
    assert.deepEqual(getBrokerContextShortcutIds("/broker/dashboard"), [
        "add_contact",
        "add_property",
        "schedule_visit",
        "add_task",
    ]);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/contacts"), ["add_contact", "add_owner"]);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/my-listings"), ["add_property"]);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/visits"), ["schedule_visit"]);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/tasks"), ["add_task"]);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/properties/new"), ["form_primary"]);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/properties/abc/edit"), ["form_primary"]);
    assert.deepEqual(getBrokerContextShortcutIds("/broker/earnings"), []);

    const pageBindings = BROKER_SHORTCUTS.filter((shortcut) => shortcut.scope === "page");
    assert.ok(pageBindings.length > 0);
    for (const shortcut of pageBindings) {
        assert.match(shortcut.keys, /^KeyA Key[A-Z]$/);
    }
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
