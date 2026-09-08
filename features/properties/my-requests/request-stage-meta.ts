import type { LucideIcon } from "lucide-react";
import { Ban, CircleCheck, CircleX, Clock, Hourglass } from "lucide-react";

import type { RequestStage } from "@/features/properties/my-requests/types";

export type RequestStageMeta = {
    /** Owner-facing plain language — never the internal term. */
    label: string;
    /** One line explaining what the broker should expect next. */
    hint: string;
    icon: LucideIcon;
    badgeVariant: "brand" | "urgent" | "danger" | "neutral" | "outline";
    /** Text tone class for icons rendered outside a badge. */
    toneClass: string;
};

export const REQUEST_STAGE_META: Record<RequestStage, RequestStageMeta> = {
    pending: {
        label: "Waiting for reply",
        hint: "You sent a request for this property. The owner has not replied yet.",
        icon: Hourglass,
        badgeVariant: "outline",
        toneClass: "text-ink-muted",
    },
    approved: {
        label: "You can sell this",
        hint: "The owner accepted your request. You can now show this property to buyers.",
        icon: CircleCheck,
        badgeVariant: "brand",
        toneClass: "text-success",
    },
    declined: {
        label: "Request rejected",
        hint: "The owner rejected your request for this property.",
        icon: CircleX,
        badgeVariant: "danger",
        toneClass: "text-danger",
    },
    expired: {
        label: "Request expired",
        hint: "The owner never replied, so your request closed on its own. You can send a new request.",
        icon: Clock,
        badgeVariant: "urgent",
        toneClass: "text-urgent",
    },
    withdrawn: {
        label: "Request cancelled",
        hint: "You cancelled your request, so the owner will not see it.",
        icon: Ban,
        badgeVariant: "neutral",
        toneClass: "text-ink-muted",
    },
};

export const REQUEST_STAGE_ORDER: RequestStage[] = [
    "pending",
    "approved",
    "declined",
    "expired",
    "withdrawn",
];
