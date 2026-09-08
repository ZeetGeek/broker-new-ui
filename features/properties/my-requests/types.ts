/**
 * Lifecycle of a "request to represent" from the broker's side.
 *
 * `locked` is the dead end: all three attempts used and the owner never
 * replied, so the broker may not approach them again on this property. The
 * owner can still start a conversation from their side.
 */
export type RequestStage = "pending" | "approved" | "declined" | "locked" | "cancelled";

export type RequestStageFilter = "all" | RequestStage;

export type RequestSort = "recent" | "oldest" | "waiting_longest" | "price_desc" | "price_asc";

export type RequestTimelineStep = {
    /** Machine key for the icon + tone. */
    key: "sent" | "seen" | "approved" | "declined" | "locked" | "cancelled" | "nudged";
    label: string;
    /** ISO instant. */
    at: string;
};

/** Just enough of a buyer to render an avatar and a name. */
export type RequestAttachedClient = {
    id: string;
    name: string;
    avatarUrl?: string;
};

/**
 * One tracked "request to represent". Denormalized on purpose — the broker
 * must never retype property data the owner already entered.
 */
export type RequestItem = {
    id: string;
    propertyId: string;
    stage: RequestStage;
    title: string;
    configLabel: string;
    propertyTypeLabel: string;
    locality: string;
    city: string;
    areaSqft: number;
    bhk: number;
    /** Ask in INR — rent when `isRent`, else sale. */
    amountInr: number;
    isRent: boolean;
    commissionPercent: number;
    ownerName: string;
    ownerAvatarUrl?: string;
    /**
     * Consent-gated. The API only sends this once the owner approves — a
     * pending or declined request must never expose the owner's number.
     */
    ownerPhoneDigits?: string;
    /** Owner has opened the request. Drives the "not seen yet" nudge. */
    ownerSeen: boolean;
    /** ISO instant the request was sent. */
    requestedAt: string;
    /** ISO instant of approve/decline/lock/cancel. Null while pending. */
    resolvedAt: string | null;
    /** Whole days the current attempt has been waiting. Pending rows only. */
    daysWaiting: number;
    /** Clients attached after approval — the "did I act on it" signal. */
    clientsAttached: number;
    /**
     * The attached buyers themselves, for the avatar stack on the card.
     * Denormalized so the card never has to fetch the client list per row.
     */
    attachedClients: RequestAttachedClient[];
    brokerSlotsOpen: number;
    brokerSlotsTotal: number;
    /**
     * Which attempt this is, 1-based. A broker gets ATTEMPT_LIMIT tries per
     * property; each try is one request plus one optional reminder.
     */
    attemptNumber: number;
    /** Whether the reminder for THIS attempt has been used. */
    reminderUsed: boolean;
    /** ISO instant of this attempt's reminder. Null when not yet sent. */
    nudgedAt: string | null;
    /** Owner's reason, when they gave one on decline. */
    declineReason?: string;
    imageSrc: string;
    timeline: RequestTimelineStep[];
};

/**
 * Every way of narrowing the list, as one value — the stages plus two
 * shortcuts for rows that need the broker to act. One control, one choice.
 */
export type RequestsViewFilter =
    | RequestStageFilter
    /** Approved rows with zero clients attached. */
    | "needs_buyer"
    /** Pending rows the owner has not opened yet. */
    | "not_opened";

export type RequestsFilters = {
    q: string;
    view: RequestsViewFilter;
    sort: RequestSort;
    page: number;
    limit: number;
};

export type RequestsCounts = Record<RequestStage, number> & { all: number };

export type RequestsSummary = {
    counts: RequestsCounts;
    /** Approved ÷ resolved, as a percent 0–100. */
    approvalRate: number;
    /** Mean days to an owner decision across resolved requests. */
    avgResponseDays: number;
    /** Approved rows with no client attached yet. */
    needsFollowUpCount: number;
    /** Pending rows the owner has not opened. */
    unseenCount: number;
    quota: { limit: number; used: number; remaining: number; resetsOn: string };
};

export type RequestsResult = {
    items: RequestItem[];
    total: number;
    page: number;
    totalPages: number;
};

export const DEFAULT_REQUESTS_FILTERS: RequestsFilters = {
    q: "",
    view: "all",
    sort: "recent",
    page: 1,
    limit: 10,
};

/**
 * Tries a broker gets per property. One attempt = one request plus one
 * optional reminder. After the last attempt is cancelled unanswered the
 * property locks: the broker cannot approach that owner again, though the
 * owner may still reach out to the broker.
 */
export const ATTEMPT_LIMIT = 3;
