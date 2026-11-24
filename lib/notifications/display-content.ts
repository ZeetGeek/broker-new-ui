import type { NotificationItem } from "@/lib/api/notifications";

/** Remove duplicate presentation copy without inferring missing API data. */
export function getNotificationDisplayContent(
    item: Pick<NotificationItem, "title" | "body" | "type">,
) {
    let title = item.title.trim();
    let body = item.body?.trim() || null;

    if (item.type === "deal_closed" && /^congratulations[!.]*$/i.test(title) && body) {
        title = body;
        body = null;
    }

    if (body && title) {
        if (body.toLocaleLowerCase() === title.toLocaleLowerCase()) {
            body = null;
        } else if (body.toLocaleLowerCase().startsWith(title.toLocaleLowerCase())) {
            const rest = body.slice(title.length);
            // Require an explicit separator: don't trim meaningful longer words.
            if (/^\s*[:—–-]\s*/.test(rest)) {
                body = rest.replace(/^\s*[:—–-]\s*/, "").trim() || null;
            }
        }
    }

    return { title, body };
}

export type ReminderParts = {
    kind: "task" | "visit";
    /** What the reminder is about: `3 BHK · Happy Elegance with Aarav Shah`. */
    line: string;
    /** When, as written by the server at send time: `In 30 min · Today, 4:00 PM`. */
    detail: string;
};

/**
 * Split a task/visit reminder body into "what" and "when".
 * The API sends `<what…> · <lead time> · <day, time>`; the last two parts are the when.
 */
export function getReminderParts(
    item: Pick<NotificationItem, "type" | "body">,
): ReminderParts | null {
    const kind =
        item.type === "task_reminder" ? "task" : item.type === "visit_reminder" ? "visit" : null;
    if (!kind) return null;
    const parts = (item.body ?? "").split(" · ");
    const line = parts.length > 2 ? parts.slice(0, -2).join(" · ") : (parts[0] ?? "");
    const detail = parts.length > 2 ? parts.slice(-2).join(" · ") : parts.slice(1).join(" · ");
    return { kind, line, detail };
}
