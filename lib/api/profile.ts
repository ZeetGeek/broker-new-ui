import { apiFetch } from "@/lib/api/client";
import { isMockMode, MOCK_PROFILE } from "@/lib/api/mock-mode";

export type NotificationPreferences = {
    unreadCount?: number;
    whatsapp?: boolean;
    sms?: boolean;
    email?: boolean;
};

export type AvatarUploadUrlResponse = {
    key: string;
    uploadUrl: string;
    publicUrl: string;
    expiresIn: number;
};

export type ConfirmAvatarResponse = {
    avatarUrl: string;
    key: string;
    profile?: UserProfile;
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
    qr?: {
        publicSlug?: string | null;
        publicProfileUrl?: string | null;
    };
    organization?: { id: string; name: string; portal: string } | null;
    organizationRole?: {
        key: string;
        name: string;
        level: number | null;
        memberId: string;
        isMember: boolean;
    } | null;
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
    fullName?: string;
    phone?: string;
    city?: string;
    country?: string;
    orgName?: string;
    bio?: string;
    accountType?: "individual" | "organization";
    // Owner-only
    ownerKind?: "individual" | "builder" | "company";
    companyName?: string;
    gstin?: string;
    preferredCities?: string[];
    preferredLocalities?: string[];
    // Broker-only
    experienceYears?: number | null;
    licenseNumber?: string;
    reraState?: string;
    publicSlug?: string;
    serviceAreas?: string[];
    specializations?: string[];
};

export type UpdateNotificationsInput = {
    notifyWhatsapp?: boolean;
    notifySms?: boolean;
    notifyEmail?: boolean;
};

export const profileApi = {
    get() {
        if (isMockMode()) {
            return Promise.resolve(MOCK_PROFILE);
        }
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
        if (isMockMode()) {
            return Promise.resolve({ ...MOCK_PROFILE, ...input });
        }
        return apiFetch<UserProfile>("/profile", {
            method: "PATCH",
            body: JSON.stringify(input),
        });
    },

    /** Step 1 — get a presigned PUT URL for the avatar. */
    createAvatarUploadUrl(fileName: string, contentType: string) {
        return apiFetch<AvatarUploadUrlResponse>("/profile/avatar/upload-url", {
            method: "POST",
            body: JSON.stringify({ fileName, contentType }),
        });
    },

    /** Step 2 — confirm after the file was PUT to `uploadUrl`. */
    confirmAvatar(key: string) {
        return apiFetch<ConfirmAvatarResponse>("/profile/avatar", {
            method: "PATCH",
            body: JSON.stringify({ key }),
        });
    },

    /**
     * Full avatar flow: request URL → PUT file to storage → confirm on API.
     * Returns the updated profile (or a minimal stub with the new avatarUrl).
     */
    async uploadAvatar(file: File): Promise<UserProfile> {
        const contentType = file.type === "image/jpg" ? "image/jpeg" : file.type;
        const { key, uploadUrl } = await this.createAvatarUploadUrl(file.name, contentType);

        const putRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
        });
        if (!putRes.ok) {
            throw new Error("Failed to upload image to storage");
        }

        const result = await this.confirmAvatar(key);
        if (result.profile) return result.profile;
        return { avatarUrl: result.avatarUrl };
    },

    updateNotifications(input: UpdateNotificationsInput) {
        return apiFetch<{ message: string }>("/profile/notification-preference", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },
};
