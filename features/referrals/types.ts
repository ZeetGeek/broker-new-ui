/**
 * Referrals — a broker bringing someone onto the platform with their code.
 *
 * Phase 1 is seeded by hand from personal contacts (AGENTS.md, "Market
 * context"). This screen is the tool that makes that hand-seeding
 * self-serving: the person already in the product does the introducing,
 * because they are the one their contact will actually answer the phone for.
 *
 * Two tracks, because the two sides prove themselves differently:
 *
 * - An invited **broker** qualifies when an owner **accepts** their request to
 *   represent. Not when they sign up, and not when they send the request —
 *   the whole loop only pays off once a representation actually exists, and
 *   requests can be sent to nobody in particular.
 * - An invited **owner** qualifies when they create their first property. That
 *   is supply arriving, which is the thing the marketplace is short of.
 *
 * What a credit is: an internal unit spendable inside the product — today,
 * against the cost of publishing a listing. It is deliberately **not** money.
 * There is no withdrawal, no payout, and no KYC, because payment rails are
 * deferred scope (AGENTS.md, "Scope"). Do not add a cash-out path here without
 * that decision being made first.
 */

/** Which side of the marketplace the invited person signed up as. */
export type ReferralRole = "broker" | "owner";

/**
 * Where an invite is in its life.
 *
 * Longer than "sent → joined" on purpose. Each step is a real gate someone can
 * stall at, and the broker chasing them needs to know *which* one — "signed up
 * but never verified their email" and "requested a property and the owner has
 * not answered" call for completely different nudges.
 */
export type ReferralStatus =
    /** Invite created, not yet opened by the person invited. */
    | "sent"
    /** They opened the link. Proof the number was right. */
    | "opened"
    /** Account created. Email not confirmed, so nothing counts yet. */
    | "joined"
    /** Email confirmed. Now they have to do the thing their role qualifies on. */
    | "verified"
    /**
     * Broker track only: they asked an owner to represent a property and the
     * owner has not answered. The reward is real but not yet earned — and the
     * inviter cannot do anything to speed it up.
     */
    | "awaiting_approval"
    /** The qualifying action landed. Credits paid. */
    | "qualified"
    /** Nothing happened for long enough that chasing it is the next step. */
    | "expired";

/** How the invite left this broker's hands. Drives the "resend by" affordance. */
export type ReferralChannel = "link" | "whatsapp" | "sms" | "copy";

/**
 * A credit line. Append-only — a ledger that can be edited is not a ledger,
 * and a broker who cannot see why their balance moved will not trust it.
 */
export type CreditEntryKind =
    /** Someone they invited qualified. */
    | "referral_qualified"
    /** Founding-broker grant, support goodwill, anything hand-issued. */
    | "bonus"
    /** Spent publishing a listing. Negative amount. */
    | "listing_published";

type ReferralPerson = {
    /** Local id. The invitee has no account until they join. */
    id: string;
    name: string;
    /** 10 digits, unformatted. The invite key — brokers are found by number. */
    phoneDigits: string;
    /** Set once they join. The reference screen lists people by email. */
    email?: string;
    /** Set once they join and pick an avatar. */
    avatarUrl?: string;
    /** Their city, when they told us. Used to spot out-of-city invites. */
    city?: string;
    /** Agency they work under, when they gave one. */
    agencyName?: string;
};

/** One entry in an invite's history. Append-only; drives the detail timeline. */
type ReferralEvent = {
    id: string;
    /** ISO instant. */
    at: string;
    /** Plain sentence, already written for a non-technical reader. */
    label: string;
    kind: ReferralStatus | "reminded" | "note";
};

/** One person this broker invited. */
export type ReferralItem = {
    id: string;
    status: ReferralStatus;
    /**
     * Which side they joined as. Null until they actually sign up — the
     * inviter shares one link and does not decide who uses it.
     */
    role: ReferralRole | null;
    person: ReferralPerson;
    /** How it was sent the first time. */
    channel: ReferralChannel;
    /** ISO instant the invite was created. */
    invitedAt: string;
    /** ISO instant they opened the link. Null until they do. */
    openedAt: string | null;
    /** ISO instant they created an account. Null until they do. */
    joinedAt: string | null;
    /** ISO instant they confirmed their email. Null until they do. */
    verifiedAt: string | null;
    /** ISO instant the qualifying action completed. Null until it does. */
    qualifiedAt: string | null;
    /** ISO instant the invite stops being chaseable. */
    expiresAt: string;
    /** Credits this invite has earned. 0 until `qualified`. */
    creditsEarned: number;
    /** How many nudges have been sent. Caps the resend button. */
    reminderCount: number;
    /** ISO instant of the last nudge, so the button can cool down. */
    lastRemindedAt: string | null;
    history: ReferralEvent[];
};

export type CreditEntry = {
    id: string;
    kind: CreditEntryKind;
    /** Signed. Positive earns, negative spends. */
    amount: number;
    /** Plain sentence — "Rakesh Patel qualified with your code". */
    label: string;
    /** ISO instant. */
    at: string;
    /** The invite this line came from, when it came from one. */
    referralId: string | null;
};

/**
 * What each track pays, in credits. Flat, per person, every time.
 *
 * There is no ladder and no threshold: the tenth qualified broker pays exactly
 * what the first one did. A tiered scheme would tell a broker their next
 * referral is worth less than the last, which is the opposite of what a
 * referral programme is for.
 *
 * The broker side pays more because it asks more: an owner has to accept them
 * before anything counts, which is a gate the invited broker only half
 * controls. An owner listing a property controls their own qualification
 * entirely.
 */
export const REFERRAL_REWARD_CREDITS: Record<ReferralRole, number> = {
    broker: 100,
    owner: 80,
};

/** What publishing one listing costs. The only thing credits buy today. */
export const LISTING_COST_CREDITS = 50;

/** An invite unanswered this long is worth a nudge rather than a wait. */
export const REFERRAL_STALE_DAYS = 5;

/** A nudge closer together than this is nagging, so the button waits. */
export const REFERRAL_REMINDER_COOLDOWN_HOURS = 24;

/** Nudges allowed per invite, ever. Past this it is the broker's phone call. */
export const REFERRAL_REMINDER_LIMIT = 3;

/**
 * Statuses where the invitee has not finished arriving.
 *
 * `awaiting_approval` counts as pending even though the invited broker has
 * done everything asked of them — the credits are not earned until an owner
 * says yes, and a balance that counted them would be wrong.
 */
const PENDING_REFERRAL_STATUSES: ReferralStatus[] = [
    "sent",
    "opened",
    "joined",
    "verified",
    "awaiting_approval",
];

export function isPendingReferral(status: ReferralStatus): boolean {
    return PENDING_REFERRAL_STATUSES.includes(status);
}

/**
 * Whether nudging this person could still move things along.
 *
 * `awaiting_approval` is deliberately excluded: the ball is with an owner the
 * inviter has no relationship with, so a nudge would go to someone who cannot
 * act on it. That is the one pending state with nothing useful to do.
 */
export function isNudgeable(status: ReferralStatus): boolean {
    return status === "sent" || status === "opened" || status === "joined" || status === "verified";
}

/** What this person still has to do, in the words the inviter would use. */
export function referralNextStep(item: ReferralItem): string | null {
    switch (item.status) {
        case "sent":
            return "Open the link";
        case "opened":
            return "Create an account";
        case "joined":
            return "Confirm their email";
        case "verified":
            return item.role === "owner" ? "Add their first property" : "Request an owner property";
        case "awaiting_approval":
            return "Owner to accept";
        case "qualified":
        case "expired":
            return null;
    }
}

export type ReferralStatusFilter = ReferralStatus | "all" | "pending";

export type ReferralsFilters = {
    q: string;
    status: ReferralStatusFilter;
};

export const DEFAULT_REFERRALS_FILTERS: ReferralsFilters = {
    q: "",
    /** Unfiltered, matching the leading "All" chip. */
    status: "all",
};

export type ReferralsSummary = {
    /** Every invite ever sent. */
    invitedCount: number;
    /** Signed up but not yet qualified — still in flight. */
    pendingCount: number;
    /** Signed up, whatever they have done since. */
    joinedCount: number;
    /** Qualified. The number that earns. */
    qualifiedCount: number;
    /** Signed up but has not confirmed their email yet. */
    emailPendingCount: number;
    /**
     * Waiting on an owner's decision. Called out separately because it is the
     * one wait the inviter must not be told to chase.
     */
    awaitingApprovalCount: number;
    /** Ran out of time with nothing to show. */
    expiredCount: number;
    /**
     * Pending, nudgeable, and stale enough that a nudge is the obvious next
     * move. Drives the "Gone quiet" flag and the headline.
     */
    needsNudgeCount: number;
    /** Credits available to spend now. Sum of the ledger. */
    creditBalance: number;
    /** Credits earned all time, ignoring anything spent. */
    creditsEarnedTotal: number;
    /** Credits spent all time, as a positive number. */
    creditsSpentTotal: number;
    /**
     * Qualified ÷ invited, as a percentage 0–100. Null until at least one
     * invite has been sent — a rate over zero invites is not a zero rate,
     * it is no rate at all.
     */
    conversionPct: number | null;
};

/**
 * One month of earnings, for the chart.
 *
 * Credits earned only — spending is a separate story and mixing the two in one
 * column would make a month where the broker published two listings look like
 * a month they earned nothing.
 */
export type ReferralEarningsPoint = {
    /** `YYYY-MM`. Sorts correctly as a string, unlike a display label. */
    month: string;
    /** Short display label, e.g. `Sep`. */
    label: string;
    /** Credits earned that month. */
    credits: number;
    /** People who qualified that month, for the tooltip. */
    qualifiedCount: number;
};

/**
 * The broker's own invite code and the link built from it. Server-owned —
 * the code is not derivable from anything the client holds.
 */
export type ReferralCode = {
    code: string;
    /** Absolute, ready to paste. */
    shareUrl: string;
};

export type ReferralsResult = {
    items: ReferralItem[];
    ledger: CreditEntry[];
    /** Credits earned per month, oldest first. Drives the chart. */
    earnings: ReferralEarningsPoint[];
    summary: ReferralsSummary;
    referralCode: ReferralCode;
};

/** What the invite form collects. Name and number, nothing more. */
export type ReferralInviteDraft = {
    name: string;
    /** 10 digits, unformatted. */
    phoneDigits: string;
    /** Optional first line of the message, in the broker's own words. */
    note: string;
};
