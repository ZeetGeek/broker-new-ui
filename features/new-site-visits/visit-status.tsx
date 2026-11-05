import { Badge } from "@/components/ui/badge";

import { STATE_LABELS, type VisitState } from "./model";

export function VisitStatusBadge({ state }: { state: VisitState }) {
    const color =
        state === "completed" || state === "upcoming" || state === "scheduled"
            ? "emerald"
            : state === "cancelled"
              ? "stone"
              : "amber";
    return <Badge color={color}>{state === "upcoming" ? "Scheduled" : STATE_LABELS[state]}</Badge>;
}
