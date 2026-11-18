import type { AppIcon } from "@/components/shared/icons";
import { CalendarClock, Check, Eye, UserRoundX, X } from "@/components/shared/icons";

import type { VisitActionKind } from "./model";

export const VISIT_ACTIONS: Record<
    VisitActionKind,
    { label: string; icon: AppIcon; danger?: boolean }
> = {
    reschedule: { label: "Reschedule", icon: CalendarClock },
    completed: { label: "Mark completed", icon: Check },
    cancelled: { label: "Cancel visit", icon: X, danger: true },
    not_attended: { label: "Mark not attended", icon: UserRoundX },
    view: { label: "View visit", icon: Eye },
};
