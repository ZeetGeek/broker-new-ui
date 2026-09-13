export type BrokerVisitsTab = "visits" | "slots" | "requests";

export type BrokerVisitStatus =
    | "awaiting_owner"
    | "confirmed"
    | "reschedule_pending"
    | "cancelled_by_broker"
    | "cancelled_by_owner"
    | "completed"
    | "no_show"
    | "expired";

export type PropertySource = "marketplace" | "own_listing";

export type PersonSummary = {
    id: string;
    name: string;
    phoneDigits?: string;
    avatarUrl?: string;
    requirement?: string;
};

export type VisitPropertySummary = {
    id: string;
    title: string;
    configLabel: string;
    propertyType: string;
    locality: string;
    city: string;
    address: string;
    areaSqft: number;
    amountInr: number;
    purpose: "sale" | "rent";
    coverUrl?: string;
    latitude?: number;
    longitude?: number;
};

export type VisitOutcome = {
    interest: "hot" | "warm" | "cold";
    attended: "buyer_and_owner" | "buyer_only" | "nobody";
    feedback: string;
    objections: string[];
    offerAmount?: number;
    nextStep:
        | "move_to_negotiation"
        | "schedule_followup"
        | "show_other_property"
        | "drop";
    followUpAt?: string;
    photos?: string[];
};

export type BrokerSiteVisit = {
    id: string;
    source: "slot" | "time_request" | "broker_created";
    slotId?: string;
    propertyId: string;
    propertySource: PropertySource;
    ownerId: string;
    brokerId: string;
    buyerIds: string[];
    startsAt: string;
    endsAt: string;
    status: BrokerVisitStatus;
    brokerNote?: string;
    ownerNote?: string;
    remindBuyer: boolean;
    outcome?: VisitOutcome;
    createdAt: string;
    updatedAt: string;
    property: VisitPropertySummary;
    owner: PersonSummary;
    buyers: PersonSummary[];
    distanceKm?: number;
    driveMinutes?: number;
    distanceApproximate?: boolean;
    checklist?: { documents: boolean; keys: boolean; parking: boolean };
};

export type VisitSlot = {
    id: string;
    propertyId: string;
    ownerId: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    bookedCount: number;
    status: "open" | "full" | "cancelled" | "expired";
    visibility: "accepted_brokers" | "all_brokers";
    autoConfirm: boolean;
    note?: string;
    bookedVisitId?: string;
    bookedBuyerName?: string;
    requestedByMe?: boolean;
};

export type PropertyWithSlots = {
    property: VisitPropertySummary;
    owner: PersonSummary;
    access: "accepted" | "requested" | "none";
    slots: VisitSlot[];
    matchScore?: number;
    matchReasons?: string[];
    distanceKm?: number;
};

export type TimeRequestStatus =
    | "pending"
    | "accepted"
    | "declined"
    | "counter_offered"
    | "withdrawn"
    | "expired";

export type TimeRequest = {
    id: string;
    propertyId: string;
    ownerId: string;
    brokerId: string;
    buyerIds: string[];
    preferredStartsAt: string;
    preferredEndsAt: string;
    alternates: { startsAt: string; endsAt: string }[];
    message?: string;
    status: TimeRequestStatus;
    counterOffer?: { startsAt: string; endsAt: string; ownerMessage?: string };
    declineReason?: string;
    expiresAt: string;
    createdAt: string;
    property: VisitPropertySummary;
    owner: PersonSummary;
    buyers: PersonSummary[];
    createdVisitId?: string;
    lastNudgedAt?: string;
};

export type BrokerVisitSummary = {
    today: number;
    tomorrow: number;
    awaitingOwner: number;
    needsOutcome: number;
    weekTotal: number;
    cancelledThisWeek: number;
    openSlots: number;
    requestReplies: number;
};

export type SummaryFilter =
    | "today"
    | "tomorrow"
    | "awaiting"
    | "feedback"
    | "week"
    | "cancelled";

