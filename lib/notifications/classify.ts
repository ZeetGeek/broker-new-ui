import type { LucideIcon } from "lucide-react";
import {
    BadgeCheck,
    Bell,
    BellRing,
    Building2,
    CalendarClock,
    Gift,
    MessageCircle,
    Send,
    ShieldCheck,
    UserPlus,
    XCircle,
} from "lucide-react";

import type { NotificationItem, NotificationType } from "@/lib/api/notifications";
import { formatActivityDayLabel, formatDateIso } from "@/lib/format/date";

export type NotificationTab = "all" | "requests" | "visits" | "updates";

export type NotificationActor = {
    name: string;
    avatarUrl: string | null;
};

export type NotificationVisual = {
    Icon: LucideIcon;
    colorClass: string;
};

const TAB_ORDER: NotificationTab[] = ["all", "requests", "visits", "updates"];

const REQUEST_TYPES = new Set<NotificationType>([
    "representation_request",
    "representation_approved",
    "representation_rejected",
    "representation_revoked",
    "representation_message",
    "invite_received",
    "invite_accepted",
    "invite_declined",
    "offer_received",
    "offer_accepted",
    "offer_rejected",
]);

const VISIT_TYPES = new Set<NotificationType>([
    "visit_requested",
    "visit_approved",
    "visit_cancelled",
]);

const BROKER_ACTIONABLE_TYPES = new Set<NotificationType>([
    "representation_request",
    "invite_received",
]);

const OWNER_ACTIONABLE_TYPES = new Set<NotificationType>(["representation_request"]);

const ALL_NOTIFICATION_TYPES = new Set<NotificationType>([
    ...REQUEST_TYPES,
    ...VISIT_TYPES,
    "lead_added",
    "deal_closed",
    "team_joined",
    "referral_rewarded",
    "property_assigned",
    "client_assigned",
    "system",
]);

function notificationKey(item: NotificationItem): string {
    return [item.type ?? "", item.title, item.body ?? "", item.referenceType ?? ""]
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

function isKnownNotificationType(type: string | null): type is NotificationType {
    return Boolean(type && ALL_NOTIFICATION_TYPES.has(type as NotificationType));
}

/** Classify a notification into a filter tab (excluding "all"). */
export function getNotificationTab(item: NotificationItem): Exclude<NotificationTab, "all"> {
    if (isKnownNotificationType(item.type)) {
        if (REQUEST_TYPES.has(item.type)) return "requests";
        if (VISIT_TYPES.has(item.type)) return "visits";
        return "updates";
    }

    const key = notificationKey(item);

    if (matchesAny(key, ["represent", "request", "invite", "offer"])) {
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

export type NotificationDaySection = {
    dayKey: string;
    label: string;
    items: NotificationItem[];
};

/** Group notifications by calendar day, newest day first. */
export function groupNotificationsByDay(
    items: NotificationItem[],
    now: Date,
): NotificationDaySection[] {
    const byDay = new Map<string, NotificationItem[]>();
    const undated: NotificationItem[] = [];

    for (const item of items) {
        if (!item.createdAt) {
            undated.push(item);
            continue;
        }

        const dayKey = formatDateIso(new Date(item.createdAt));
        const bucket = byDay.get(dayKey);
        if (bucket) {
            bucket.push(item);
        } else {
            byDay.set(dayKey, [item]);
        }
    }

    const sections = [...byDay.entries()]
        .sort(([left], [right]) => right.localeCompare(left))
        .map(([dayKey, dayItems]) => ({
            dayKey,
            label: formatActivityDayLabel(new Date(dayItems[0].createdAt!), now),
            items: dayItems,
        }));

    if (undated.length > 0) {
        sections.push({ dayKey: "undated", label: "Earlier", items: undated });
    }

    return sections;
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

function getRepresentationStatus(item: NotificationItem): string | null {
    if (item.representationStatus) {
        return item.representationStatus.toLowerCase();
    }
    const status = metadataString(item.metadata, "status", "requestStatus", "request_status");
    return status ? status.toLowerCase() : null;
}

function isPendingRequest(item: NotificationItem): boolean {
    const status = getRepresentationStatus(item);
    if (!status) return true;
    return matchesAny(status, ["pending", "open", "awaiting"]);
}

/** Shown after a representation request/invite has been decided. */
export function getRepresentationDecisionLabel(item: NotificationItem): string | null {
    const status = getRepresentationStatus(item);
    if (!status || isPendingRequest(item)) return null;
    if (status === "accepted") return "Accepted";
    if (status === "rejected") return "Declined";
    if (status === "withdrawn") return "Withdrawn";
    if (status === "revoked") return "Revoked";
    return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Whether to show inline Decline / Accept controls for the signed-in portal. */
export function isActionableRequest(
    item: NotificationItem,
    role: "owner" | "broker" | string | null | undefined,
): boolean {
    if (!item.relatedRepresentationId) return false;
    if (!isPendingRequest(item)) return false;
    if (!isKnownNotificationType(item.type)) return false;

    if (role === "broker") {
        return BROKER_ACTIONABLE_TYPES.has(item.type);
    }

    if (role === "owner") {
        return OWNER_ACTIONABLE_TYPES.has(item.type);
    }

    return false;
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

export function getNotificationVisual(item: NotificationItem): NotificationVisual {
    const key = notificationKey(item);

    if (key.includes("referral")) {
        return { Icon: Gift, colorClass: "!text-urgent-mid" };
    }

    if (key.includes("message") || key.includes("chat")) {
        return { Icon: MessageCircle, colorClass: "!text-brand-deep" };
    }

    if (key.includes("visit") || key.includes("showing") || key.includes("schedule")) {
        return {
            Icon: CalendarClock,
            colorClass:
                key.includes("approv") || key.includes("accept") ? "!text-brand" : "!text-urgent",
        };
    }

    if (key.includes("invite") || key.includes("property") || key.includes("listing")) {
        return { Icon: Building2, colorClass: "!text-brand" };
    }

    if (key.includes("reject") || key.includes("declin") || key.includes("cancel")) {
        return { Icon: XCircle, colorClass: "!text-danger" };
    }

    if (key.includes("approv") || key.includes("accepted") || key.includes("qualified")) {
        return { Icon: BadgeCheck, colorClass: "!text-brand" };
    }

    if (key.includes("represent") || key.includes("request")) {
        return { Icon: Send, colorClass: "!text-brand-deep" };
    }

    if (
        key.includes("reminder") ||
        key.includes("follow-up") ||
        key.includes("follow up") ||
        key.includes("due")
    ) {
        return { Icon: BellRing, colorClass: "!text-urgent" };
    }

    if (key.includes("client") || key.includes("lead")) {
        return { Icon: UserPlus, colorClass: "!text-brand-text" };
    }

    if (key.includes("verif") || key.includes("rera")) {
        return { Icon: ShieldCheck, colorClass: "!text-brand-text" };
    }

    if (key.includes("announce") || key.includes("update") || key.includes("system")) {
        return { Icon: Bell, colorClass: "!text-brand" };
    }

    return { Icon: Bell, colorClass: "!text-brand" };
}
