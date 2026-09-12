export const GOOGLE_ONBOARDING_KEY = "google_onboarding_pending";

export type AuthUser = {
    id: string;
    email: string;
    role: "owner" | "broker" | "admin" | string;
    fullName: string | null;
    phone: string | null;
    city: string | null;
    accountType: string | null;
    orgName: string | null;
    avatarUrl: string | null;
    authProvider?: string | null;
    isEmailVerified: boolean | null;
    createdAt?: string | null;
};

export type AuthSession = {
    accessToken: string;
    user: AuthUser;
};

const TOKEN_KEY = "broker_access_token";
const USER_KEY = "broker_auth_user";
/** Legacy key — cleared on logout so old XSS-exposed values are removed. */
const LEGACY_REFRESH_TOKEN_KEY = "broker_refresh_token";

/**
 * In-memory copy so a failed refresh-cookie call cannot wipe a just-completed
 * login. Third-party cookies from the remote API are often blocked on localhost.
 */
let memoryAccessToken: string | null = null;
let memoryUser: AuthUser | null = null;

export function getAccessToken(): string | null {
    if (memoryAccessToken) return memoryAccessToken;
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
    if (memoryUser) return memoryUser;
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

export function setSession(session: AuthSession) {
    memoryAccessToken = session.accessToken;
    memoryUser = session.user;
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, session.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

export function clearSession() {
    memoryAccessToken = null;
    memoryUser = null;
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
    return Boolean(getAccessToken());
}

export function portalHomeForRole(role: string | null | undefined): string {
    if (role === "owner") return "/owner";
    if (role === "admin") return "/broker/dashboard";
    return "/broker/dashboard";
}
