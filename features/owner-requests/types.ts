export type OwnerRequestsTab = "browse" | "requests" | "invitations" | "active";

export type OwnerRepStatus =
    | "pending"
    | "accepted"
    | "rejected"
    | "withdrawn"
    | "revoked"
    | "unknown";

export type OwnerRequestsSummary = {
    incomingPending: number;
    invitesPending: number;
    active: number;
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
    imageSrc: string;
};

export type OwnerRequestCardItem = OwnerDealListing & {
    id: string;
    status: OwnerRepStatus;
    message: string | null;
    createdAt: string;
    brokerName: string;
    brokerAvatarUrl?: string;
    brokerPhoneDigits?: string;
    brokerOrgName?: string | null;
    brokerVerified?: boolean;
};
