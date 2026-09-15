import type { LucideIcon } from "lucide-react";
import {
    CalendarCheck,
    CalendarClock,
    CircleSlash,
    Handshake,
    HeartHandshake,
    Repeat2,
    ThumbsDown,
    UserRoundX,
    XCircle,
} from "lucide-react";

import type {
    VisitCancelReason,
    VisitOutcome,
    VisitStatus,
    VisitViewer,
} from "@/features/site-visits/types";

export type VisitStatusMeta = {
    /** Plain language, sentence case. Never the internal key. */
    label: string;
    icon: LucideIcon;
    /** Badge variant from components/ui/badge.tsx. No new colours. */
    badgeVariant: "brand" | "urgent" | "danger" | "neutral" | "outline";
    /** Left accent on a list row. Single-sided border, so no radius. §3.2. */
    accentClass: string;
    /** Dot colour on the calendar chip. */
    dotClass: string;
};

/**
 * One entry per status. `proposed` is deliberately `urgent` rather than
 * `pending`: an unanswered proposal has a clock on it (the other side is
 * waiting and the slot is being held), and docs/DESIGN.md §1.3 reserves
 * `pending` for processes the user cannot speed up. This one they can.
 */
export const VISIT_STATUS_META: Record<VisitStatus, VisitStatusMeta> = {
    proposed: {
        label: "Awaiting confirmation",
        icon: CalendarClock,
        badgeVariant: "urgent",
        accentClass: "border-l-urgent",
        dotClass: "bg-urgent",
    },
    confirmed: {
        label: "Confirmed",
        icon: CalendarCheck,
        badgeVariant: "brand",
        accentClass: "border-l-brand",
        dotClass: "bg-brand",
    },
    completed: {
        label: "Done",
        icon: HeartHandshake,
        badgeVariant: "neutral",
        accentClass: "border-l-brand-deep",
        dotClass: "bg-brand-deep",
    },
    cancelled: {
        label: "Cancelled",
        icon: XCircle,
        badgeVariant: "danger",
        accentClass: "border-l-danger",
        dotClass: "bg-danger",
    },
    no_show: {
        label: "Nobody turned up",
        icon: UserRoundX,
        badgeVariant: "danger",
        accentClass: "border-l-danger",
        dotClass: "bg-danger",
    },
    declined: {
        label: "Declined",
        icon: CircleSlash,
        badgeVariant: "danger",
        accentClass: "border-l-danger",
        dotClass: "bg-danger",
    },
};

/**
 * What a status means, said differently to each side. An owner reading
 * "Awaiting confirmation" needs to know *they* are the holdup; a broker
 * reading the same word needs to know they are not.
 */
export const VISIT_STATUS_HINT: Record<VisitStatus, Record<VisitViewer, string>> = {
    proposed: {
        broker: "Waiting for the owner to confirm this time.",
        owner: "A broker wants to bring a buyer at this time. Confirm or suggest another slot.",
    },
    confirmed: {
        broker: "The owner has agreed to this time.",
        owner: "You agreed to this visit. The broker will bring a buyer.",
    },
    completed: {
        broker: "The visit happened. Record what the buyer thought.",
        owner: "This visit happened.",
    },
    cancelled: {
        broker: "This visit was called off.",
        owner: "This visit was called off.",
    },
    no_show: {
        broker: "Nobody turned up for this visit.",
        owner: "Nobody turned up for this visit.",
    },
    declined: {
        broker: "The owner could not do this time.",
        owner: "You turned this time down.",
    },
};

export const VISIT_OUTCOME_META: Record<
    VisitOutcome,
    { label: string; icon: LucideIcon; badgeVariant: "brand" | "neutral" | "danger" }
> = {
    made_offer: { label: "Made an offer", icon: Handshake, badgeVariant: "brand" },
    interested: { label: "Interested", icon: HeartHandshake, badgeVariant: "brand" },
    wants_second_visit: { label: "Wants another look", icon: Repeat2, badgeVariant: "neutral" },
    not_interested: { label: "Not interested", icon: ThumbsDown, badgeVariant: "neutral" },
};

/** Cancel reasons, in the words a broker or owner would actually say. */
export const VISIT_CANCEL_REASON_LABEL: Record<VisitCancelReason, string> = {
    buyer_unavailable: "The buyer could not make it",
    owner_unavailable: "The owner was not available",
    property_unavailable: "The property could not be shown",
    weather: "Weather",
    rescheduled: "Moved to another time",
    other: "Something else",
};

/** Which side the word "you" refers to, for history lines and empty states. */
export function actorLabel(actor: "broker" | "owner", viewer: VisitViewer): string {
    if (actor === viewer) return "You";
    return actor === "broker" ? "The broker" : "The owner";
}
