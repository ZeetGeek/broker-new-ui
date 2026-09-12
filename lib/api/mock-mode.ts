import type { UserProfile } from "@/lib/api/profile";
import type { AuthUser } from "@/lib/auth/session";

import { USE_MOCK_DATA } from "@/config";

export const MOCK_ACCESS_TOKEN = "design-mock-access-token";

export function isMockMode(): boolean {
    return USE_MOCK_DATA;
}

export const MOCK_AUTH_USER: AuthUser = {
    id: "user_design_broker",
    email: "zeet.patel@gmail.com",
    role: "broker",
    fullName: "Zeet Patel",
    phone: "9876543210",
    city: "Surat",
    accountType: "individual",
    orgName: null,
    avatarUrl: null,
    authProvider: "email",
    isEmailVerified: true,
};

/** Complete enough that owner-listings is not blocked on RERA / service areas. */
export const MOCK_PROFILE: UserProfile = {
    id: "user_design_broker",
    email: "zeet.patel@gmail.com",
    phone: "+919876543210",
    role: "broker",
    fullName: "Zeet Patel",
    city: "Surat",
    country: "India",
    accountType: "individual",
    orgName: null,
    avatarUrl: null,
    authProvider: "email",
    isEmailVerified: true,
    profileType: "broker",
    accountLabel: "Independent broker",
    verified: false,
    licenseNumber: "GJ-RERA-12345",
    reraState: "Gujarat",
    experienceYears: 6,
    notifications: { unreadCount: 4, whatsapp: true, sms: false, email: true },
    broker: {
        id: "broker_design",
        experienceYears: 6,
        specializations: ["Residential", "Resale"],
        serviceAreas: ["Vesu", "Adajan", "Pal"],
        licenseNumber: "GJ-RERA-12345",
        reraState: "Gujarat",
        bio: "Helping families find homes in Vesu, Adajan and Pal.",
        publicSlug: "zeet-patel",
        verified: false,
        dealsClosed: 14,
        avgDaysToClose: 21,
    },
};

export function paginateItems<T>(items: T[], page: number, limit: number) {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * limit;
    return {
        items: items.slice(start, start + limit),
        total,
        page: safePage,
        totalPages,
        nextCursor: safePage < totalPages ? String(safePage + 1) : null,
    };
}
