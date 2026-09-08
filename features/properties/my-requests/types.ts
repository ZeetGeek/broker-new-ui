/** Lifecycle of a "request to represent" from the broker's side. */
export type RequestStage = "pending" | "approved" | "declined" | "expired" | "withdrawn";

export type RequestStageFilter = "all" | RequestStage;

export type RequestSort = "recent" | "oldest" | "waiting_longest" | "price_desc" | "price_asc";

export type RequestTimelineStep = {
    /** Machine key for the icon + tone. */
    key: "sent" | "seen" | "approved" | "declined" | "expired" | "withdrawn" | "nudged";
    label: string;
    /** ISO instant. */
    at: string;
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
    /** ISO instant of approve/decline/expire. Null while pending. */
    resolvedAt: string | null;
    /** Whole days the request has been waiting. Pending rows only. */
    daysWaiting: number;
    /** Days until an unanswered request auto-expires. Pending rows only. */
    daysToExpiry: number | null;
    /**
     * ISO instant the request auto-expires. Null once resolved. Drives the
     * live countdown — `daysToExpiry` is too coarse on the final day.
     */
    expiresAt: string | null;
    /** Clients attached after approval — the "did I act on it" signal. */
    clientsAttached: number;
    brokerSlotsOpen: number;
    brokerSlotsTotal: number;
    /** Reminders already sent. Capped at REMINDER_LIMIT. */
    remindersSent: number;
    /** ISO instant of the most recent reminder. Null when none sent. */
    nudgedAt: string | null;
    /** Owner's reason, when they gave one on decline. */
    declineReason?: string;
    imageSrc: string;
    timeline: RequestTimelineStep[];
};

/**
 * Every way of narrowing the list, as one value — the six stages plus three
 * shortcuts for rows that need the broker to act. One control, one choice.
 */
export type RequestsViewFilter =
    | RequestStageFilter
    /** Approved rows with zero clients attached. */
    | "needs_buyer"
    /** Pending rows about to auto-expire. */
    | "closing_soon"
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
    /** Pending rows expiring within the warning window. */
    expiringSoonCount: number;
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

/** Pending requests inside this many days of expiry are "expiring soon". */
export const EXPIRING_SOON_DAYS = 3;

/**
 * Most reminders a broker may send on one request. Owners are non-technical
 * and on cheap phones — repeat pings from one broker cost us the supply side.
 */
export const REMINDER_LIMIT = 3;

/** Wait between reminders, so the three cannot be fired back to back. */
export const REMINDER_COOLDOWN_HOURS = 48;
