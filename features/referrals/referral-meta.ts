import {
    Building2,
    CircleCheckBig,
    Hourglass,
    type LucideIcon,
    MailCheck,
    MailOpen,
    Send,
    TimerOff,
    UserRound,
    UserRoundCheck,
} from "lucide-react";

import { calendarDaysBetween } from "@/lib/format/date";

import {
    isNudgeable,
    REFERRAL_REMINDER_COOLDOWN_HOURS,
    REFERRAL_REMINDER_LIMIT,
    REFERRAL_REWARD_CREDITS,
    REFERRAL_STALE_DAYS,
    type ReferralChannel,
    type ReferralItem,
    type ReferralRole,
    type ReferralStatus,
} from "@/features/referrals/types";

type BadgeVariant = "brand" | "urgent" | "danger" | "neutral" | "outline";

export type ReferralStatusMeta = {
    /** Sentence case, as the badge says it. */
    label: string;
    icon: LucideIcon;
    variant: BadgeVariant;
};

/**
 * One label per status, written for the person reading it rather than for the
 * state machine. "Qualified" is the one internal-sounding word kept, because
 * it is the word the reward rules use and the two have to agree.
 */
export const REFERRAL_STATUS_META: Record<ReferralStatus, ReferralStatusMeta> = {
    sent: { label: "Invite sent", icon: Send, variant: "outline" },
    opened: { label: "Link opened", icon: MailOpen, variant: "neutral" },
    joined: { label: "Email pending", icon: MailCheck, variant: "neutral" },
    verified: { label: "Signed up", icon: UserRoundCheck, variant: "neutral" },
    // Not urgent — urgent is reserved for deadlines (docs/DESIGN.md §1.3), and
    // this is a wait nobody can hurry.
    awaiting_approval: { label: "Owner deciding", icon: Hourglass, variant: "neutral" },
    qualified: { label: "Qualified", icon: CircleCheckBig, variant: "brand" },
    expired: { label: "Expired", icon: TimerOff, variant: "outline" },
};

/**
 * The one line under the name that says what is actually going on. Statuses
 * are nouns; these are the sentences that make them mean something.
 *
 * A function rather than a table because two of them read differently by
 * track — an owner and a broker who have both just verified their email are
 * waiting on completely different things.
 */
export function referralStatusHint(item: ReferralItem): string {
    switch (item.status) {
        case "sent":
            return "Waiting for them to open the link.";
        case "opened":
            return "They looked. They have not signed up yet.";
        case "joined":
            return "Signed up, but their email is not confirmed yet. Nothing counts until it is.";
        case "verified":
            return item.role === "owner"
                ? "Signed up. They have not listed a property yet."
                : "Signed up. They have not asked an owner for a property yet.";
        case "awaiting_approval":
            return "They asked an owner to represent a property. Waiting on the next milestone.";
        case "qualified":
            return item.role === "owner"
                ? "Listed their first property. Credits paid."
                : "Requested an owner property. Credits paid.";
        case "expired":
            return "The link ran out. Send a fresh one if they are still interested.";
    }
}

export const REFERRAL_ROLE_LABEL: Record<ReferralRole, string> = {
    broker: "Broker",
    owner: "Owner",
};

export const REFERRAL_ROLE_ICON: Record<ReferralRole, LucideIcon> = {
    broker: UserRound,
    owner: Building2,
};

/**
 * The earning rules, exactly as the page states them.
 *
 * One list, used by both the "How to earn" card and the invite modal, so the
 * promise made when sending an invite cannot drift from the promise shown when
 * counting the reward.
 */
/** Matches backend `earnRules` / REFERRAL_WORKFLOW.md — do not invent extra gates. */
export const REFERRAL_EARNING_RULES: { role: ReferralRole; label: string; credits: number }[] = [
    {
        role: "broker",
        label: "Broker joins, confirms their email, and requests an owner property",
        credits: REFERRAL_REWARD_CREDITS.broker,
    },
    {
        role: "owner",
        label: "Owner or builder joins, confirms their email, and lists their first property",
        credits: REFERRAL_REWARD_CREDITS.owner,
    },
];

export const REFERRAL_CHANNEL_LABEL: Record<ReferralChannel, string> = {
    link: "Shared link",
    whatsapp: "WhatsApp",
    sms: "SMS",
    copy: "Copied link",
};

/**
 * An invite is stale when it has sat somewhere nudgeable past the quiet
 * period. Measured from the last nudge when there was one, so a nudge buys it
 * fresh time instead of leaving it permanently flagged.
 *
 * `awaiting_approval` is never stale: the wait is an owner's to end, and
 * flagging it would tell the inviter to chase someone they cannot reach.
 */
export function isStaleReferral(referral: ReferralItem, now: Date): boolean {
    if (!isNudgeable(referral.status)) return false;

    const since = referral.lastRemindedAt ?? referral.invitedAt;
    return calendarDaysBetween(new Date(since), now) >= REFERRAL_STALE_DAYS;
}

/** Hours until this invite may be nudged again. 0 means now. */
function hoursUntilNudgeAllowed(referral: ReferralItem, now: Date): number {
    if (!referral.lastRemindedAt) return 0;

    const elapsedHours = (now.getTime() - new Date(referral.lastRemindedAt).getTime()) / 3_600_000;
    return Math.max(0, Math.ceil(REFERRAL_REMINDER_COOLDOWN_HOURS - elapsedHours));
}

export type NudgeState =
    | { kind: "allowed" }
    /** Too soon since the last one. */
    | { kind: "cooling"; hoursLeft: number }
    /** Three nudges is the ceiling — after that it is a phone call, not a ping. */
    | { kind: "exhausted" }
    /** The wait is an owner's to end. Nudging the invitee would do nothing. */
    | { kind: "owner_deciding" }
    /** Nothing to nudge: already qualified, or the invite is dead. */
    | { kind: "not_applicable" };

/**
 * Whether this invite can be nudged, and why not when it cannot.
 *
 * Returning the reason rather than a boolean is what lets the button explain
 * itself. A disabled button with no explanation reads as broken to a
 * non-technical user (docs/MESSAGES.md).
 */
export function nudgeState(referral: ReferralItem, now: Date): NudgeState {
    if (referral.status === "awaiting_approval") return { kind: "owner_deciding" };
    if (!isNudgeable(referral.status)) return { kind: "not_applicable" };
    if (referral.reminderCount >= REFERRAL_REMINDER_LIMIT) return { kind: "exhausted" };

    const hoursLeft = hoursUntilNudgeAllowed(referral, now);
    if (hoursLeft > 0) return { kind: "cooling", hoursLeft };

    return { kind: "allowed" };
}

/** Copy for a nudge button that cannot be pressed. */
export function nudgeBlockedReason(state: NudgeState): string | null {
    switch (state.kind) {
        case "cooling":
            return state.hoursLeft === 1
                ? "You nudged them just now. You can nudge again in an hour."
                : `You nudged them recently. You can nudge again in ${state.hoursLeft} hours.`;
        case "exhausted":
            return "You have nudged them three times. A phone call will do more than a fourth.";
        case "owner_deciding":
            return "Nothing to chase — the owner has their request and has not answered yet.";
        case "not_applicable":
        case "allowed":
            return null;
    }
}

/**
 * The invite message itself.
 *
 * Written as the referring broker, not as the product — this arrives on
 * WhatsApp from someone the reader knows, and a corporate voice in that thread
 * is what gets it ignored. Kept in one function so the SMS, WhatsApp, and
 * copy paths cannot drift into three different pitches.
 */
export function buildInviteMessage({
    inviterName,
    shareUrl,
    note,
}: {
    inviterName: string;
    shareUrl: string;
    note?: string;
}): string {
    const opening = note?.trim()
        ? note.trim()
        : `I have been using this to find properties direct from owners. No listing fees, and the owner approves you before you work the property.`;

    return [opening, "", `Sign up here: ${shareUrl}`, "", `— ${inviterName}`].join("\n");
}
