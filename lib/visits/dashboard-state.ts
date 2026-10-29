export type AgendaVisitState = "done" | "cancelled" | "missed" | "elapsed" | "upcoming";

export function agendaVisitState(
    status: string | null,
    startsAt: Date,
    now: Date,
): AgendaVisitState {
    if (status === "completed") return "done";
    if (status === "cancelled" || status?.startsWith("cancelled_by_")) return "cancelled";
    if (status === "no_show") return "missed";
    return startsAt.getTime() < now.getTime() ? "elapsed" : "upcoming";
}

export function isActiveDashboardVisit(status: string | null): boolean {
    return (
        status !== "completed" &&
        status !== "cancelled" &&
        !status?.startsWith("cancelled_by_") &&
        status !== "no_show" &&
        status !== "expired"
    );
}
