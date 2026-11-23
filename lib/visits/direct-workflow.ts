import { type WorkflowTarget, workflowTarget } from "@/lib/workflows/target";

/** Direct links and modified-click tabs must open the same record as the shared overlay. */
export function directVisitWorkflow(
    params: URLSearchParams,
): Extract<WorkflowTarget, { kind: "visit" }> | null {
    const target = workflowTarget(`/broker/visits?${params}`, "broker");
    if (target?.kind !== "visit") return null;
    const contextualSchedule =
        target.mode === "schedule" &&
        params.get("view") === "schedule" &&
        Boolean(target.intent.clientId || target.intent.propertyId || target.intent.leadId);
    return target.mode !== "schedule" || contextualSchedule ? target : null;
}

/** Remove only the record overlay, retaining collection filters and other URL state. */
export function closeDirectVisitHref(params: URLSearchParams): string {
    const next = new URLSearchParams(params);
    for (const key of ["view", "visit", "preview"]) next.delete(key);
    return `/broker/visits${next.size ? `?${next}` : ""}`;
}
