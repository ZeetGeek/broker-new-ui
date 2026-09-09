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
    authProvider?: string | null;
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

/**
 * What the profile form can change.
 *
 * A subset of `UserProfile` on purpose. Email, role, verification state and
 * every derived stat are server-owned — a form that posted them would let the
 * client claim a verified badge it was never granted.
 */
export type UpdateProfileInput = {
    fullName: string;
    phone: string;
    city: string;
    country: string;
    orgName: string;
    bio: string;
    /** Broker-only fields. Omitted entirely for an owner account. */
    experienceYears?: number | null;
    licenseNumber?: string;
    reraState?: string;
    publicSlug?: string;
    serviceAreas?: string[];
    specializations?: string[];
};

export type UpdateNotificationsInput = {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
};

export const profileApi = {
    get() {
        return apiFetch<UserProfile>("/profile");
    },

    /**
     * Save the editable fields.
     *
     * Returns the whole updated profile rather than the patch, so the store
     * holds what the server actually stored — a slug the server had to
     * de-duplicate, say — instead of what the client hoped it stored.
     */
    update(input: UpdateProfileInput) {
        return apiFetch<UserProfile>("/profile", {
            method: "PATCH",
            body: JSON.stringify(input),
        });
    },

    /**
     * Replace the profile photo. Multipart, like the property photo upload —
     * `apiFetch` drops the JSON content-type when it sees FormData so the
     * browser can set its own boundary.
     */
    uploadAvatar(file: File) {
        const form = new FormData();
        form.append("avatar", file);
        return apiFetch<UserProfile>("/profile/avatar", { method: "POST", body: form });
    },

    updateNotifications(input: UpdateNotificationsInput) {
        return apiFetch<UserProfile>("/profile/notifications", {
            method: "PATCH",
            body: JSON.stringify(input),
        });
    },
};
