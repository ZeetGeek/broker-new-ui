import { apiFetch } from "@/lib/api/client";

export type NotificationPreferences = {
    unreadCount?: number;
    whatsapp?: boolean;
    sms?: boolean;
    email?: boolean;
};

export type UserProfile = {
    id?: string;
    email?: string;
    phone?: string | null;
    role?: string;
    fullName?: string | null;
    city?: string | null;
    country?: string | null;
    accountType?: string | null;
    orgName?: string | null;
    avatarUrl?: string | null;
    memberSince?: string | null;
    isEmailVerified?: boolean;
    notifications?: NotificationPreferences;
    profileType?: "owner" | "broker";
    accountLabel?: string;
    companyName?: string | null;
    verified?: boolean;
    experienceYears?: number | null;
    clientsServed?: number;
    rating?: string;
    ratingCount?: number;
    licenseNumber?: string | null;
    reraState?: string | null;
    stats?: Record<string, number>;
    broker?: {
        id?: string;
        experienceYears?: number | null;
        specializations?: string[];
        serviceAreas?: string[];
        licenseNumber?: string | null;
        reraState?: string | null;
        bio?: string | null;
        publicSlug?: string | null;
        verified?: boolean | null;
        dealsClosed?: number | null;
        avgDaysToClose?: number | null;
    };
    owner?: {
        id?: string;
        ownerKind?: string | null;
        companyName?: string | null;
        gstin?: string | null;
        preferredCities?: string[];
        preferredLocalities?: string[];
        bio?: string | null;
        publicSlug?: string | null;
        verified?: boolean | null;
    };
    menu?: Array<{ key: string; label: string; available: boolean }>;
};

export const profileApi = {
    get() {
        return apiFetch<UserProfile>("/profile");
    },
};
