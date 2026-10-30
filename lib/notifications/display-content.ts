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
