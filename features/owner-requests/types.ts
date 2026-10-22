export type OwnerRequestsTab = "requests" | "invitations" | "accepted" | "rejected" | "cancelled";

export const OWNER_REQUESTS_TABS: readonly OwnerRequestsTab[] = [
    "requests",
    "invitations",
    "accepted",
    "rejected",
    "cancelled",
];

export type OwnerRepStatus =
    | "pending"
    | "accepted"
    | "rejected"
    | "withdrawn"
    | "revoked"
    | "owner_cancelled"
    | "broker_cancelled"
    | "unknown";

/** Statuses after which the representation is over (no chat, no contact). */
export const CLOSED_OWNER_REP_STATUSES: readonly OwnerRepStatus[] = [
    "rejected",
    "withdrawn",
    "revoked",
    "owner_cancelled",
    "broker_cancelled",
];

export type OwnerRequestsSummary = {
    incomingPending: number;
    invitesPending: number;
    /** Brokers currently representing a listing. */
    accepted: number;
    /** Requests you turned down plus invites brokers turned down. */
    rejected: number;
    /** Accepted deals later cancelled by you or the broker. */
    cancelled: number;
};

export type OwnerDealListing = {
    propertyId: string;
    title: string;
    configLabel: string;
    propertyTypeLabel: string;
    locality: string;
    city: string;
    areaSqft: number;
    bhk: number;
    amountInr: number;
    isRent: boolean;
    commissionPercent: number;
    /** Fixed rent brokerage in INR. 0 when unset. */
    commissionAmount?: number;
    imageSrc: string;
};

export type OwnerRequestCardItem = OwnerDealListing & {
    id: string;
    status: OwnerRepStatus;
    /** `owner` = you invited the broker, `broker` = the broker asked. */
    initiatedBy?: "owner" | "broker";
    /** Reason given when the representation was cancelled. */
    cancelReason?: string;
    message: string | null;
    createdAt: string;
    brokerName: string;
    brokerAvatarUrl?: string;
    brokerPhoneDigits?: string;
    brokerOrgName?: string | null;
    brokerVerified?: boolean;
};
