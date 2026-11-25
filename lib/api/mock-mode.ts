import type { UserProfile } from "@/lib/api/profile";
import type { AuthUser } from "@/lib/auth/session";
import { getTestLabSettings, isSampleDataEnabled, isTestSampleMode } from "@/lib/testing/test-lab";

export const MOCK_ACCESS_TOKEN = "design-mock-access-token";

export function isMockMode(): boolean {
    return isSampleDataEnabled();
}

const lab = getTestLabSettings();
const sample = isTestSampleMode();
const newAccount = sample && lab.account === "new";
const emptyWorkspace = sample && lab.volume === "empty";
const incomplete = sample && (lab.account === "incomplete" || newAccount);

export const MOCK_AUTH_USER: AuthUser = {
    id: sample ? `test-lab-${lab.portal}-${lab.accountType}` : "user_design_broker",
    email: "zeet.patel@gmail.com",
    role: sample ? lab.portal : "broker",
    fullName: "Zeet Patel",
    phone: "9876543210",
    city: "Mumbai",
    accountType: sample ? lab.accountType : "individual",
    orgName: sample && lab.accountType === "organization" ? "Sample Property Group" : null,
    avatarUrl: null,
    authProvider: "email",
    isEmailVerified: !(sample && lab.account === "unverified"),
    createdAt: new Date(Date.now() - (newAccount ? 0 : 90 * 86_400_000)).toISOString(),
    country: {
        id: "country-in",
        name: "India",
        iso2: "IN",
        emoji: "🇮🇳",
        currency: { code: "INR", symbol: "₹", name: "Indian Rupee", decimalDigits: 2 },
    },
};

/** Complete enough that owner-listings is not blocked on RERA / service areas. */
export const MOCK_PROFILE: UserProfile = {
    id: MOCK_AUTH_USER.id,
    email: "zeet.patel@gmail.com",
    phone: "+919876543210",
    role: MOCK_AUTH_USER.role,
    fullName: "Zeet Patel",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    accountType: MOCK_AUTH_USER.accountType ?? "individual",
    orgName: MOCK_AUTH_USER.orgName,
    avatarUrl: null,
    authProvider: "email",
    isEmailVerified: MOCK_AUTH_USER.isEmailVerified ?? true,
    profileType: sample ? lab.portal : "broker",
    accountLabel:
        sample && lab.accountType === "organization"
            ? lab.portal === "owner"
                ? "Builder company"
                : "Broker agency"
            : sample && lab.portal === "owner"
              ? "Independent owner"
              : "Independent broker",
    verified: false,
    licenseNumber: incomplete ? null : "MH-RERA-12345",
    reraState: "Maharashtra",
    experienceYears: 6,
    notifications: {
        unreadCount: emptyWorkspace ? 0 : 4,
        whatsapp: true,
        sms: false,
        email: true,
    },
    broker: {
        id: "broker_design",
        experienceYears: 6,
        specializations: ["Residential", "Resale"],
        serviceAreas: incomplete ? [] : ["Andheri West", "Baner", "Satellite"],
        licenseNumber: incomplete ? null : "MH-RERA-12345",
        reraState: "Maharashtra",
        bio: "Helping families find homes in Andheri West, Baner and Satellite.",
        publicSlug: "zeet-patel",
        verified: false,
        dealsClosed: emptyWorkspace ? 0 : 14,
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
