import type { AppIcon } from "@/components/shared/icons";
import { Check, Eye, Pencil, Trash2, UserRoundX, X } from "@/components/shared/icons";

import type { VisitActionKind } from "./model";

export const VISIT_ACTIONS: Record<
    VisitActionKind,
    { label: string; icon: AppIcon; danger?: boolean }
> = {
    edit: { label: "Edit visit", icon: Pencil },
    completed: { label: "Mark completed", icon: Check },
    cancelled: { label: "Cancel visit", icon: X, danger: true },
    not_attended: { label: "Mark not attended", icon: UserRoundX },
    delete: { label: "Delete visit", icon: Trash2, danger: true },
    view: { label: "View visit", icon: Eye },
};
