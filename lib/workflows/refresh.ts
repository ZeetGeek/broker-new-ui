export const WORKFLOW_SAVED_EVENT = "app:workflow-saved";
export function notifyWorkflowSaved(
    kind: "contact" | "visit" | "task" | "property" | "deal",
): void {
    if (typeof window !== "undefined")
        window.dispatchEvent(new CustomEvent(WORKFLOW_SAVED_EVENT, { detail: { kind } }));
}
