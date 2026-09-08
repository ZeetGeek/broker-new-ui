/**
 * An owner inviting a specific broker to represent their property — the other
 * direction of the same consent gate. The broker answers rather than asks, so
 * there is no attempt counter, no reminder and no lockout here.
 */
export type InviteStage = "pending" | "accepted" | "declined" | "expired";

export type InviteStageFilter = "all" | InviteStage;

export type InviteSort = "recent" | "oldest" | "price_desc" | "price_asc";

export type InviteItem = {
    id: string;
    propertyId: string;
    stage: InviteStage;
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
     * Consent-gated like the outbound side: the API only sends the number
     * once the broker accepts.
     */
    ownerPhoneDigits?: string;
    /** The owner's note to the broker, when they wrote one. */
    message: string | null;
    /** ISO instant the owner sent the invite. */
    invitedAt: string;
    /** ISO instant the broker answered. Null while pending. */
    respondedAt: string | null;
    /** Whole days the invite has been waiting on the broker. */
    daysWaiting: number;
    /** Buyers the broker attached after accepting. */
    clientsAttached: number;
    attachedClients: { id: string; name: string; avatarUrl?: string }[];
    brokerSlotsOpen: number;
    brokerSlotsTotal: number;
    imageSrc: string;
};

export type InvitesFilters = {
    q: string;
    stage: InviteStageFilter;
    sort: InviteSort;
    page: number;
    limit: number;
};

export type InvitesCounts = Record<InviteStage, number> & { all: number };

export type InvitesSummary = {
    counts: InvitesCounts;
    /** Pending invites — the number the broker actually has to act on. */
    waitingOnYouCount: number;
};

export type InvitesResult = {
    items: InviteItem[];
    total: number;
    page: number;
    totalPages: number;
};

export const DEFAULT_INVITES_FILTERS: InvitesFilters = {
    q: "",
    stage: "all",
    sort: "recent",
    page: 1,
    limit: 10,
};
