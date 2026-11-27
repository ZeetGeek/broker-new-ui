export const WORKFLOW_HISTORY_KEY = "__appWorkflowModal";

export type WorkflowHistoryEnvironment = {
    url: () => string;
    state: () => unknown;
    push: (state: Record<string, unknown>, url: string) => void;
    replace: (state: Record<string, unknown>, url: string) => void;
    back: () => void;
    listen: (handler: () => void) => () => void;
    schedule: (handler: () => void) => unknown;
    cancel: (handle: unknown) => void;
};

const record = (value: unknown): Record<string, unknown> =>
    value !== null && typeof value === "object" ? { ...value } : {};

/** One same-URL Back stop for a stack of dialogs. Existing close guards decide whether to dismiss. */
export function createWorkflowHistory(
    scope: string,
    environment: WorkflowHistoryEnvironment,
    token = crypto.randomUUID(),
) {
    const dialogs = new Map<symbol, () => void>();
    let openedUrl: string | null = null;
    let armed = false;
    let consuming = false;
    let running = false;
    let unlisten: (() => void) | null = null;
    let releaseTimer: unknown = null;
    let stopTimer: unknown = null;
    const clearRelease = () => {
        if (releaseTimer !== null) environment.cancel(releaseTimer);
        releaseTimer = null;
    };
    const ownsCurrent = () => {
        const marker = record(environment.state())[WORKFLOW_HISTORY_KEY];
        return (
            marker !== null &&
            typeof marker === "object" &&
            "token" in marker &&
            marker.token === token
        );
    };
    const stripCurrentMarker = () => {
        if (!ownsCurrent()) return;
        const state = record(environment.state());
        delete state[WORKFLOW_HISTORY_KEY];
        environment.replace(state, environment.url());
    };
    const arm = () => {
        if (!dialogs.size || consuming) return;
        if (ownsCurrent()) {
            armed = true;
            return;
        }
        openedUrl ??= environment.url();
        if (environment.url() !== openedUrl) return;
        environment.push(
            {
                ...record(environment.state()),
                [WORKFLOW_HISTORY_KEY]: { token, scope, url: openedUrl },
            },
            openedUrl,
        );
        armed = true;
    };
    const pop = () => {
        if (!running) return;
        if (consuming) {
            consuming = false;
            armed = false;
            if (environment.url() === openedUrl) arm();
            return;
        }
        if (!armed || !dialogs.size) return;
        if (environment.url() !== openedUrl) {
            armed = false;
            return;
        }
        if (ownsCurrent()) return;
        // Re-arm before calling the guard. A dirty form or nested confirmation can stay open.
        armed = false;
        arm();
        const topmost = [...dialogs.values()].at(-1);
        topmost?.();
    };
    const scheduleRelease = () => {
        clearRelease();
        releaseTimer = environment.schedule(() => {
            releaseTimer = null;
            if (!running || dialogs.size || consuming) return;
            if (ownsCurrent() && environment.url() === openedUrl) {
                consuming = true;
                armed = false;
                environment.back();
            } else {
                stripCurrentMarker();
                armed = false;
            }
        });
    };
    return {
        register(handler: () => void) {
            clearRelease();
            const key = Symbol("workflow-dialog");
            dialogs.set(key, handler);
            arm();
            return () => {
                if (!dialogs.delete(key)) return;
                if (!dialogs.size) scheduleRelease();
            };
        },
        /** Let route navigation replace the final dialog's same-URL Back stop. */
        takeNavigationEntry() {
            if (dialogs.size !== 1 || environment.url() !== openedUrl || !ownsCurrent())
                return false;
            stripCurrentMarker();
            armed = false;
            return true;
        },
        start() {
            if (stopTimer !== null) environment.cancel(stopTimer);
            stopTimer = null;
            if (running) return;
            running = true;
            unlisten = environment.listen(pop);
            arm();
        },
        stop() {
            running = false;
            unlisten?.();
            unlisten = null;
            clearRelease();
            // React StrictMode replays effects immediately; only a real unmount reaches this timer.
            stopTimer = environment.schedule(() => {
                stopTimer = null;
                if (running) return;
                clearRelease();
                dialogs.clear();
                consuming = false;
                armed = false;
                // A route/account change must never navigate backwards into the previous page.
                stripCurrentMarker();
            });
        },
    };
}
