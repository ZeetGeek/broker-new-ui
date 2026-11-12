import { Badge, type BadgeColor } from "@/components/ui/badge";

import { STATE_LABELS, type VisitState } from "./model";

export const VISIT_STATUS_COLORS: Record<VisitState, { badge: BadgeColor; dotClassName: string }> =
    {
        scheduled: { badge: "emerald", dotClassName: "bg-emerald-400" },
        upcoming: { badge: "emerald", dotClassName: "bg-emerald-400" },
        running: { badge: "sky", dotClassName: "bg-sky-400" },
        needs_update: { badge: "amber", dotClassName: "bg-amber-400" },
        completed: { badge: "emerald", dotClassName: "bg-emerald-400" },
        not_attended: { badge: "red", dotClassName: "bg-red-400" },
        cancelled: { badge: "stone", dotClassName: "bg-stone-400" },
    };

export function VisitStatusBadge({ state }: { state: VisitState }) {
    return <Badge color={VISIT_STATUS_COLORS[state].badge}>{STATE_LABELS[state]}</Badge>;
}
