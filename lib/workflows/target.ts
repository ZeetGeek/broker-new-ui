export type WorkflowTarget =
    | { kind: "contact"; mode: "create-client" | "create-owner" }
    | { kind: "property"; mode: "create" | "detail" | "edit"; id?: string }
    | {
          kind: "task";
          mode: "create" | "detail" | "edit" | "reschedule" | "reminder" | "delete";
          id?: string;
          prefill: { clientId?: string; propertyId?: string; title?: string; ownerId?: string };
      }
    | {
          kind: "visit";
          mode: "schedule" | "detail" | "reschedule" | "outcome";
          id?: string;
          intent: { clientId?: string; propertyId?: string; leadId?: string };
          preview?: boolean;
      }
    | { kind: "deal"; mode: "detail" | "offer" | "note"; id: string };

/** Explicit record/action URLs open workflows; collections and property details stay full pages. */
export function workflowTarget(href: string, portal: "broker" | "owner"): WorkflowTarget | null {
    let url: URL;
    try {
        url = new URL(href, "https://app.local");
    } catch {
        return null;
    }
    if (url.origin !== "https://app.local") return null;
    const { pathname, searchParams: query } = url;
    if (portal === "owner") return null;
    if (pathname === "/broker/contacts") {
        if (query.get("add") === "buyer") return { kind: "contact", mode: "create-client" };
        if (query.get("add") === "owner") return { kind: "contact", mode: "create-owner" };
        return null;
    }
    if (pathname === "/broker/tasks") {
        const mode = query.get("view") || (query.has("task") ? "detail" : null);
        if (!["create", "detail", "edit", "reschedule", "reminder", "delete"].includes(mode ?? ""))
            return null;
        const id = query.get("task") || undefined;
        if (mode !== "create" && !id) return null;
        return {
            kind: "task",
            mode: mode as Extract<WorkflowTarget, { kind: "task" }>["mode"],
            id,
            prefill: {
                clientId: query.get("visitClient") || query.get("clientId") || undefined,
                propertyId: query.get("visitProperty") || query.get("propertyId") || undefined,
                ownerId: query.get("ownerId") || undefined,
                title: query.get("visitTitle") || undefined,
            },
        };
    }
    if (pathname === "/broker/visits") {
        const mode =
            query.get("view") ||
            (query.get("schedule") === "1" ? "schedule" : query.has("visit") ? "detail" : null);
        const id = query.get("visit") || undefined;
        const intent = {
            clientId: query.get("clientId") || undefined,
            propertyId: query.get("propertyId") || undefined,
            leadId: query.get("leadId") || undefined,
        };
        if (mode === "schedule" || (query.get("tab") === "slots" && !mode))
            return { kind: "visit", mode: "schedule", intent };
        if (id && ["detail", "reschedule", "outcome"].includes(mode ?? ""))
            return {
                kind: "visit",
                mode: mode as "detail" | "reschedule" | "outcome",
                id,
                intent,
                preview: query.get("preview") === "true",
            };
        return null;
    }
    let match = pathname.match(/^\/broker\/properties\/(new|[^/]+)(?:\/(edit))?\/?$/);
    if (match) {
        if (match[1] === "new" && !match[2]) return { kind: "property", mode: "create" };
        // Property cards and titles always navigate to the full listing page.
        if (!match[2]) return null;
        try {
            return {
                kind: "property",
                mode: "edit",
                id: decodeURIComponent(match[1]),
            };
        } catch {
            return null;
        }
    }
    match = pathname.match(/^\/broker\/pipeline\/([^/]+)\/?$/);
    if (match && match[1] !== "new") {
        try {
            return {
                kind: "deal",
                id: decodeURIComponent(match[1]),
                mode:
                    query.get("action") === "offer"
                        ? "offer"
                        : query.get("action") === "note"
                          ? "note"
                          : "detail",
            };
        } catch {
            return null;
        }
    }
    return null;
}

export function isWorkingWorkflow(target: WorkflowTarget): boolean {
    return target.kind === "contact" || !["detail"].includes(target.mode);
}
