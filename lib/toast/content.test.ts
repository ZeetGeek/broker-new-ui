import assert from "node:assert/strict";
import test from "node:test";

import { resolveToastContent } from "./content";
import { APP_TOAST_MESSAGES } from "./messages";

test("catalog messages render without preview metadata or unwired action buttons", () => {
    assert.equal(
        new Set(APP_TOAST_MESSAGES.map((message) => message.id)).size,
        APP_TOAST_MESSAGES.length,
    );
    for (const message of APP_TOAST_MESSAGES) {
        const content = resolveToastContent(message.id);
        assert.equal(content.title, message.title);
        assert.equal(content.variant, message.variant);
        assert.equal(content.action, undefined);
        assert.equal("actionLabel" in content, false);
        assert.equal("group" in content, false);
    }
});

test("live reminders replace all specimen details and preserve the real action", () => {
    const onClick = () => {};
    const content = resolveToastContent("visit-reminder", {
        title: "Your visit starts in 30 minutes",
        description: "Office in Pune",
        detail: "Today, 2:00 pm · Client: Asha",
        action: { label: "View visit", onClick },
    });
    assert.deepEqual(content, {
        variant: "reminder",
        title: "Your visit starts in 30 minutes",
        description: "Office in Pune",
        detail: "Today, 2:00 pm · Client: Asha",
        action: { label: "View visit", onClick },
    });
});

test("owner approval can describe the broker's inventory and omit a description explicitly", () => {
    const description = "The broker can now work on this property from their listings.";
    assert.equal(resolveToastContent("request-approved", { description }).description, description);
    assert.equal(
        resolveToastContent("request-approved", { description: undefined }).description,
        undefined,
    );
    assert.equal(resolveToastContent("note-saved").description, undefined);
});
