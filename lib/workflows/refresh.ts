export const WORKFLOW_SAVED_EVENT = "app:workflow-saved";
const WORKFLOW_STORAGE_KEY = "app:workflow-refresh";
type WorkflowKind = "contact" | "visit" | "task" | "property" | "deal";
export function notifyWorkflowSaved(kind: WorkflowKind): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(WORKFLOW_SAVED_EVENT, { detail: { kind } }));
    try {
        // Only a refresh signal is shared across tabs, never client or property data.
        window.localStorage.setItem(
            WORKFLOW_STORAGE_KEY,
            JSON.stringify({ kind, at: Date.now(), nonce: Math.random() }),
        );
    } catch {
        // The local event still works when browser storage is unavailable.
    }
}

export function subscribeWorkflowSaved(onSave: (kind: WorkflowKind) => void) {
    const local = (event: Event) => {
        if (event instanceof CustomEvent) onSave(event.detail?.kind);
    };
    const remote = (event: StorageEvent) => {
        if (event.key !== WORKFLOW_STORAGE_KEY || !event.newValue) return;
        try {
            const { kind } = JSON.parse(event.newValue);
            if (["contact", "visit", "task", "property", "deal"].includes(kind)) onSave(kind);
        } catch {
            /* Ignore an incomplete refresh signal. */
        }
    };
    window.addEventListener(WORKFLOW_SAVED_EVENT, local);
    window.addEventListener("storage", remote);
    return () => {
        window.removeEventListener(WORKFLOW_SAVED_EVENT, local);
        window.removeEventListener("storage", remote);
    };
}
