import assert from "node:assert/strict";
import test from "node:test";

import {
    createWorkflowHistory,
    WORKFLOW_HISTORY_KEY,
    type WorkflowHistoryEnvironment,
} from "@/lib/workflows/history";

function harness() {
    const initial = { __NA: true, tree: { route: "dashboard" }, custom: "keep" };
    const entries: Array<{ url: string; state: Record<string, unknown> }> = [
        { url: "https://app.test/broker/dashboard?tab=today", state: initial },
    ];
    let index = 0;
    let nextTimer = 0;
    let pushes = 0;
    let backs = 0;
    const timers = new Map<number, () => void>();
    const navigations: Array<() => void> = [];
    const listeners = new Set<() => void>();
    const env: WorkflowHistoryEnvironment = {
        url: () => entries[index].url,
        state: () => entries[index].state,
        push: (state, url) => {
            pushes++;
            entries.splice(index + 1);
            entries.push({ state, url });
            index++;
        },
        replace: (state, url) => {
            entries[index] = { state, url };
        },
        back: () => {
            backs++;
            navigations.push(() => {
                if (index > 0) index--;
                for (const listener of listeners) listener();
            });
        },
        listen: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        schedule: (handler) => {
            const id = ++nextTimer;
            timers.set(id, handler);
            return id;
        },
        cancel: (id) => {
            timers.delete(id as number);
        },
    };
    const flushTimers = () => {
        const batch = [...timers.values()];
        timers.clear();
        batch.forEach((handler) => handler());
    };
    const flushNavigation = () => {
        const batch = navigations.splice(0);
        batch.forEach((handler) => handler());
    };
    const flush = () => {
        for (let count = 0; (timers.size || navigations.length) && count < 20; count++) {
            flushTimers();
            flushNavigation();
        }
        assert.equal(
            timers.size + navigations.length,
            0,
            "history operations must settle without a navigation loop",
        );
    };
    return {
        env,
        initial,
        entries,
        flush,
        flushTimers,
        flushNavigation,
        index: () => index,
        pushes: () => pushes,
        backs: () => backs,
    };
}

test("opening nested dialogs adds one same-URL entry and preserves Next history fields", () => {
    const browser = harness();
    const history = createWorkflowHistory("account:dashboard", browser.env, "token-1");
    history.start();
    const removeFirst = history.register(() => {});
    const removeSecond = history.register(() => {});
    assert.equal(browser.pushes(), 1);
    assert.equal(browser.env.url(), browser.entries[0].url);
    assert.equal(browser.entries[1].state.__NA, true);
    assert.equal(browser.entries[1].state.tree, browser.initial.tree);
    assert.equal(browser.entries[1].state.custom, "keep");
    assert.equal(browser.entries[0].state, browser.initial);
    removeSecond();
    removeFirst();
    browser.flush();
    assert.equal(browser.index(), 0);
    assert.deepEqual(browser.env.state(), browser.initial);
});

test("Back invokes only the topmost dialog guard and keeps the page while another dialog remains", () => {
    const browser = harness();
    const history = createWorkflowHistory("account:dashboard", browser.env, "token-1");
    const closed: string[] = [];
    history.start();
    const removeFirst = history.register(() => {
        closed.push("first");
        removeFirst();
    });
    const removeSecond = history.register(() => {
        closed.push("second");
        removeSecond();
    });
    browser.env.back();
    browser.flush();
    assert.deepEqual(closed, ["second"]);
    assert.equal(browser.index(), 1);
    assert.equal(browser.env.url(), browser.entries[0].url);
    browser.env.back();
    browser.flush();
    assert.deepEqual(closed, ["second", "first"]);
    assert.equal(browser.index(), 0);
});

test("a dirty guard can keep its form and open a discard confirmation without losing the Back stop", () => {
    const browser = harness();
    const history = createWorkflowHistory("account:dashboard", browser.env, "token-1");
    let formCloseAttempts = 0;
    let confirmationCloses = 0;
    let removeConfirmation: (() => void) | null = null;
    history.start();
    const removeForm = history.register(() => {
        formCloseAttempts++;
        removeConfirmation = history.register(() => {
            confirmationCloses++;
            removeConfirmation?.();
        });
    });
    browser.env.back();
    browser.flush();
    assert.equal(formCloseAttempts, 1);
    assert.equal(browser.index(), 1);
    browser.env.back();
    browser.flush();
    assert.equal(confirmationCloses, 1);
    assert.equal(formCloseAttempts, 1);
    assert.equal(browser.index(), 1);
    removeForm();
    browser.flush();
    assert.equal(browser.index(), 0);
});

test("closing the final dialog consumes only its marker and never invokes its close guard twice", () => {
    const browser = harness();
    const history = createWorkflowHistory("account:dashboard", browser.env, "token-1");
    let guardCalls = 0;
    history.start();
    const remove = history.register(() => guardCalls++);
    remove();
    browser.flush();
    assert.equal(browser.backs(), 1);
    assert.equal(browser.index(), 0);
    assert.equal(guardCalls, 0);
});

test("form-to-detail transitions and StrictMode effect replay do not add duplicate entries", () => {
    const browser = harness();
    const history = createWorkflowHistory("account:dashboard", browser.env, "token-1");
    history.start();
    const remove = history.register(() => {});
    history.stop();
    remove();
    const removeReplay = history.register(() => {});
    history.start();
    browser.flush();
    assert.equal(browser.pushes(), 1);
    assert.equal(browser.backs(), 0);
    removeReplay();
    const removeDetail = history.register(() => {});
    browser.flush();
    assert.equal(browser.pushes(), 1);
    assert.equal(browser.backs(), 0);
    removeDetail();
    browser.flush();
    assert.equal(browser.index(), 0);
});

test("a dialog opened while marker consumption is pending is re-armed rather than dismissed", () => {
    const browser = harness();
    const history = createWorkflowHistory("account:dashboard", browser.env, "token-1");
    let unexpectedClose = 0;
    history.start();
    history.register(() => {})();
    browser.flushTimers();
    const removeNext = history.register(() => unexpectedClose++);
    browser.flush();
    assert.equal(browser.index(), 1);
    assert.equal(unexpectedClose, 0);
    removeNext();
    browser.flush();
    assert.equal(browser.index(), 0);
});

test("a real route change strips copied markers without navigating back or reopening the dialog", () => {
    const browser = harness();
    const history = createWorkflowHistory("account:dashboard", browser.env, "token-1");
    let closes = 0;
    history.start();
    const remove = history.register(() => closes++);
    browser.env.push(
        { ...browser.entries[1].state, tree: "new route" },
        "https://app.test/broker/pipeline",
    );
    history.stop();
    remove();
    browser.flush();
    assert.equal(browser.backs(), 0);
    assert.equal(browser.env.url(), "https://app.test/broker/pipeline");
    assert.equal(browser.entries[browser.index()].state.tree, "new route");
    assert.equal(WORKFLOW_HISTORY_KEY in browser.entries[browser.index()].state, false);
    assert.equal(closes, 0);
});

test("old account cleanup cannot remove a new account's modal marker", () => {
    const browser = harness();
    const previous = createWorkflowHistory("old-account:dashboard", browser.env, "old-token");
    previous.start();
    const removePrevious = previous.register(() => {});
    previous.stop();
    removePrevious();
    const next = createWorkflowHistory("new-account:dashboard", browser.env, "new-token");
    next.start();
    next.register(() => {});
    browser.flush();
    assert.equal(
        (browser.entries[browser.index()].state[WORKFLOW_HISTORY_KEY] as { token: string }).token,
        "new-token",
    );
    assert.equal(browser.backs(), 0);
});
