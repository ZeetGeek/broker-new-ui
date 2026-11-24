import type { NotificationItem } from "@/lib/api/notifications";
import { getReminderParts } from "@/lib/notifications/display-content";

export type ReminderToastContent = {
    kind: "task" | "visit";
    title: string;
    line: string;
    detail: string;
    href: string;
    action: string;
};

export function reminderToastContent(item: NotificationItem): ReminderToastContent | null {
    const parts = getReminderParts(item);
    if (!parts) return null;
    const { kind, line, detail } = parts;
    return {
        kind,
        title: item.title || (kind === "task" ? "Task reminder" : "Visit reminder"),
        line,
        detail,
        href:
            item.href ??
            (kind === "task"
                ? `/broker/tasks?view=detail&task=${encodeURIComponent(item.referenceId ?? "")}`
                : "/broker/visits"),
        action: kind === "task" ? "View task" : "View visit",
    };
}
