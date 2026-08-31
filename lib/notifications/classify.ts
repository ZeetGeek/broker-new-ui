import type { NotificationItem } from "@/lib/api/notifications";

export type NotificationTab = "all" | "requests" | "visits" | "updates";

export type NotificationActor = {
    name: string;
    avatarUrl: string | null;
};

const TAB_ORDER: NotificationTab[] = ["all", "requests", "visits", "updates"];

function notificationKey(item: NotificationItem): string {
    return [
        item.type ?? "",
        item.title,
        item.body ?? "",
        item.referenceType ?? "",
    ]
        .join(" ")
        .toLowerCase();
}

function metadataString(
    metadata: Record<string, unknown> | null,
    ...keys: string[]
): string | null {
    if (!metadata) return null;
    for (const key of keys) {
        const value = metadata[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return null;
}

function matchesAny(key: string, terms: string[]): boolean {
    return terms.some((term) => key.includes(term));
}

/** Classify a notification into a filter tab (excluding "all"). */
export function getNotificationTab(item: NotificationItem): Exclude<NotificationTab, "all"> {
    const key = notificationKey(item);

    if (matchesAny(key, ["represent", "request", "invite"])) {
        return "requests";
    }

    if (matchesAny(key, ["visit", "showing", "schedule"])) {
        return "visits";
    }

    return "updates";
}

export function filterNotificationsByTab(
    items: NotificationItem[],
    tab: NotificationTab,
): NotificationItem[] {
    if (tab === "all") return items;
    return items.filter((item) => getNotificationTab(item) === tab);
}

export function countByTab(items: NotificationItem[]): Record<NotificationTab, number> {
    const counts: Record<NotificationTab, number> = {
        all: items.length,
        requests: 0,
        visits: 0,
        updates: 0,
    };

    for (const item of items) {
        counts[getNotificationTab(item)] += 1;
    }

    return counts;
}

export const NOTIFICATION_TABS: { value: NotificationTab; label: string }[] = TAB_ORDER.map(
    (value) => ({
        value,
        label:
            value === "all"
                ? "All"
                : value === "requests"
                  ? "Requests"
                  : value === "visits"
                    ? "Visits"
                    : "Updates",
    }),
);

function parseNameFromTitle(title: string): string | null {
    const trimmed = title.trim();
    if (!trimmed) return null;

    const beforeVerb = trimmed.split(/\s+(?:wants|invited|sent|requested|asked|shared)\s+/i)[0];
    if (beforeVerb && beforeVerb !== trimmed && beforeVerb.length <= 48) {
        return beforeVerb.trim();
    }

    return null;
}

export function getNotificationActor(item: NotificationItem): NotificationActor | null {
    const metadataName = metadataString(
        item.metadata,
        "actorName",
        "actor_name",
        "senderName",
        "sender_name",
        "userName",
        "user_name",
    );
    const metadataAvatar = metadataString(
        item.metadata,
        "actorAvatarUrl",
        "actor_avatar_url",
        "senderAvatarUrl",
        "sender_avatar_url",
        "avatarUrl",
        "avatar_url",
    );

    if (metadataName) {
        return { name: metadataName, avatarUrl: metadataAvatar };
    }

    if (item.actorUserId) {
        const parsedName = parseNameFromTitle(item.title);
        return {
            name: parsedName ?? "User",
            avatarUrl: metadataAvatar,
        };
    }

    return null;
}

export function hasNotificationActor(item: NotificationItem): boolean {
    return getNotificationActor(item) !== null;
}

function isRequestLike(item: NotificationItem): boolean {
    const key = notificationKey(item);
    return matchesAny(key, ["represent", "request", "invite"]);
}

function isPendingRequest(item: NotificationItem): boolean {
    const status = metadataString(item.metadata, "status", "requestStatus", "request_status");
    if (!status) return true;
    return matchesAny(status.toLowerCase(), ["pending", "open", "awaiting"]);
}

/** Whether to show inline Decline / Accept controls. */
export function isActionableRequest(item: NotificationItem): boolean {
    if (!isRequestLike(item)) return false;
    if (!isPendingRequest(item)) return false;
    return Boolean(item.relatedRepresentationId) || isRequestLike(item);
}

export function getPropertyLabel(item: NotificationItem): string | null {
    return metadataString(
        item.metadata,
        "propertyTitle",
        "property_title",
        "propertyName",
        "property_name",
        "listingTitle",
        "listing_title",
    );
}
