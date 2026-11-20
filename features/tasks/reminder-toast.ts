import type { NotificationItem } from "@/lib/api/notifications";

export type ReminderToastContent = {
    kind: "task" | "visit";
    title: string;
    line: string;
    detail: string;
    href: string;
    action: string;
};

export function reminderToastContent(item: NotificationItem): ReminderToastContent | null {
    const kind =
        item.type === "task_reminder" ? "task" : item.type === "visit_reminder" ? "visit" : null;
    if (!kind) return null;
    const parts = (item.body ?? "").split(" · ");
    const line = parts.length > 2 ? parts.slice(0, -2).join(" · ") : (parts[0] ?? "");
    const detail = parts.length > 2 ? parts.slice(-2).join(" · ") : parts.slice(1).join(" · ");
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
