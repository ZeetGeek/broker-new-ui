"use client";

import { useEffect, useMemo } from "react";

import { createWorkflowHistory } from "@/lib/workflows/history";

/** Manages modal history for the current route and account scope. */
export function useWorkflowHistory(scope: string) {
    const history = useMemo(
        () =>
            createWorkflowHistory(scope, {
                url: () => window.location.href,
                state: () => window.history.state,
                push: (state, url) => window.history.pushState(state, "", url),
                replace: (state, url) => window.history.replaceState(state, "", url),
                back: () => window.history.back(),
                listen: (handler) => {
                    window.addEventListener("popstate", handler);
                    return () => window.removeEventListener("popstate", handler);
                },
                schedule: (handler) => window.setTimeout(handler, 0),
                cancel: (handle) => window.clearTimeout(handle as number),
            }),
        [scope],
    );
    useEffect(() => {
        history.start();
        return () => history.stop();
    }, [history]);
    return history;
}
