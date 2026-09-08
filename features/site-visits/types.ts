/**
 * Site visits — the appointment layer on top of an approved representation.
 *
 * A visit only exists because a broker already represents the property (see
 * AGENTS.md, "the core loop"), so the property and owner fields here are
 * denormalized from that representation. The broker never retypes them.
 *
 * Both portals read this same model. What differs is which side may act:
 * the broker proposes and reschedules, the owner confirms or declines. That
 * asymmetry lives in `visit-permissions.ts`, not in the shape.
 */

/**
 * Where a visit is in its short life.
 *
 * `proposed` is the consent gate. A broker cannot put a buyer on an owner's
 * doorstep unilaterally — the owner has to say yes first, exactly like the
 * representation request that preceded it. Everything else is bookkeeping.
 */
export type VisitStatus =
    "proposed" | "confirmed" | "completed" | "cancelled" | "no_show" | "declined";

/** Which side proposed, rescheduled, or cancelled. Drives "who is waiting". */
export type VisitActor = "broker" | "owner";

/**
 * What came of a completed visit. Recorded by the broker while it is fresh —
 * a visit with no outcome is the single most common way a pipeline goes stale.
 */
export type VisitOutcome = "interested" | "not_interested" | "wants_second_visit" | "made_offer";

/** Why a visit did not happen. Kept separate from outcome — a cancel is not a verdict. */
export type VisitCancelReason =
    | "buyer_unavailable"
    | "owner_unavailable"
    | "property_unavailable"
    | "weather"
    | "rescheduled"
    | "other";

/**
 * The property side, denormalized from the owner's listing through the
 * approved representation. Mirrors `DealProperty` so a visit card and a deal
 * card can show the same property without two shapes disagreeing.
 */
export type VisitProperty = {
    id: string;
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
    imageSrc: string;
};

/**
 * The owner, as the broker sees them. Contact is consent-gated the same way
 * it is on a deal: the API only sends a number while representation is live.
 */
export type VisitOwner = {
    id: string;
    name: string;
    avatarUrl?: string;
    /** Absent once representation lapses — the card stops offering to call. */
    phoneDigits?: string;
    isRepresentationActive: boolean;
};

/** The broker, as the owner sees them. */
export type VisitBroker = {
    id: string;
    name: string;
    avatarUrl?: string;
    phoneDigits?: string;
    agencyName?: string;
    /** Verified brokers get a badge, never a bare colour. docs/DESIGN.md §1.4. */
    isVerified: boolean;
};

/**
 * The buyer being shown the property. Broker-side only — an owner sees that
 * *a* buyer is coming and how many, never the broker's book. Leaking this is
 * how a marketplace loses its brokers.
 */
export type VisitBuyer = {
    id: string;
    name: string;
    phoneDigits: string;
};

/** One entry in a visit's history. Append-only; both portals read it. */
export type VisitEvent = {
    id: string;
    /** ISO instant. */
    at: string;
    actor: VisitActor;
    /** Plain sentence, already written for a non-technical reader. */
    label: string;
    kind:
        "proposed" | "confirmed" | "rescheduled" | "cancelled" | "completed" | "declined" | "note";
};

/**
 * One scheduled showing of one property to one buyer.
 *
 * Two buyers at the same property at the same hour are two visits, not one —
 * they can have different outcomes, and merging them would force the card to
 * lie about one of them. Same reasoning as `DealItem`.
 */
export type VisitItem = {
    id: string;
    status: VisitStatus;
    /** ISO instant the visit starts. Always UTC on the wire. */
    scheduledAt: string;
    /** Minutes. Drives the block height in the calendar grid. */
    durationMin: number;
    property: VisitProperty;
    owner: VisitOwner;
    broker: VisitBroker;
    /** Broker-side only. The owner portal receives this as `null`. */
    buyer: VisitBuyer | null;
    /** Related deal, when the visit came out of the pipeline. */
    dealId: string | null;
    /** Which side put this slot on the table. */
    proposedBy: VisitActor;
    /** Free-text meeting instructions — "meet at the gate", "ask for Ramesh". */
    meetingNote: string;
    /** Broker's private note. Never shown to the owner. */
    brokerNote: string;
    /** Set once status is `completed`. */
    outcome: VisitOutcome | null;
    /** Set once status is `cancelled` or `declined`. */
    cancelReason: VisitCancelReason | null;
    /** Who cancelled, when cancelled. */
    cancelledBy: VisitActor | null;
    /** ISO instant this visit was created. */
    createdAt: string;
    /** ISO instant of the last status change. */
    updatedAt: string;
    /**
     * Alternative slots the proposer offered. The other side picks one instead
     * of a round trip of "not that time, then?" messages — the product has no
     * chat, so the proposal has to carry its own negotiation.
     */
    alternativeSlots: string[];
    history: VisitEvent[];
};

/** Which portal is reading. Decides the visible fields and the allowed actions. */
export type VisitViewer = "broker" | "owner";

export type VisitsView = "calendar" | "list";

export type VisitStatusFilter = VisitStatus | "all" | "upcoming" | "needs_action";

export type VisitsFilters = {
    q: string;
    status: VisitStatusFilter;
    /** Property id, or "" for all. */
    propertyId: string;
};

export type VisitsSummary = {
    /** Confirmed and starting today, in the user's timezone. */
    todayCount: number;
    /** Confirmed, from now onward. */
    upcomingCount: number;
    /** Waiting on *this* viewer to respond. The number that drives the dark card. */
    needsActionCount: number;
    /** Proposed by this viewer, waiting on the other side. */
    awaitingOtherCount: number;
    /** Completed but with no outcome recorded — the quiet pipeline killer. */
    missingOutcomeCount: number;
    completedCount: number;
    cancelledCount: number;
};

export type VisitsResult = {
    items: VisitItem[];
    summary: VisitsSummary;
};

export const DEFAULT_VISITS_FILTERS: VisitsFilters = {
    q: "",
    status: "upcoming",
    propertyId: "",
};

/** Default showing length. Long enough to walk a 3 BHK and talk in the lift. */
export const DEFAULT_VISIT_DURATION_MIN = 45;

/** Selectable durations, in minutes. */
export const VISIT_DURATION_OPTIONS = [30, 45, 60, 90] as const;

/**
 * How long before a visit the "starting soon" state kicks in. Ninety minutes
 * is roughly when a broker in Surat traffic has to leave.
 */
export const VISIT_IMMINENT_MINUTES = 90;

/** A visit still sitting at `proposed` this long has effectively been ignored. */
export const VISIT_PROPOSAL_STALE_HOURS = 24;

/** Statuses that still occupy a slot in the day. */
export const LIVE_VISIT_STATUSES: VisitStatus[] = ["proposed", "confirmed"];

/** Statuses that are over, one way or another. */
export const RESOLVED_VISIT_STATUSES: VisitStatus[] = [
    "completed",
    "cancelled",
    "no_show",
    "declined",
];

export function isLiveVisit(status: VisitStatus): boolean {
    return LIVE_VISIT_STATUSES.includes(status);
}

export function isResolvedVisit(status: VisitStatus): boolean {
    return RESOLVED_VISIT_STATUSES.includes(status);
}
