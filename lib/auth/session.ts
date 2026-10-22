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

/**
 * "Remember me" sessions live in localStorage (survive tab/browser close).
 * Otherwise they live in sessionStorage, which the browser drops when the tab closes.
 */
function activeStorage(): Storage {
    return sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
}

export function getAccessToken(): string | null {
    if (memoryAccessToken) return memoryAccessToken;
    if (typeof window === "undefined") return null;
    return activeStorage().getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
    if (memoryUser) return memoryUser;
    if (typeof window === "undefined") return null;
    const raw = activeStorage().getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

/**
 * `persist` picks the storage on login; when omitted (token refresh, profile
 * update) the session stays in whichever storage it already uses.
 */
export function setSession(session: AuthSession, options?: { persist?: boolean }) {
    memoryAccessToken = session.accessToken;
    memoryUser = session.user;
    if (typeof window === "undefined") return;
    const persist = options?.persist ?? activeStorage() === localStorage;
    const target = persist ? localStorage : sessionStorage;
    const other = persist ? sessionStorage : localStorage;
    target.setItem(TOKEN_KEY, session.accessToken);
    target.setItem(USER_KEY, JSON.stringify(session.user));
    other.removeItem(TOKEN_KEY);
    other.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

export function clearSession() {
    memoryAccessToken = null;
    memoryUser = null;
    if (typeof window === "undefined") return;
    for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem(TOKEN_KEY);
        storage.removeItem(USER_KEY);
    }
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
    return Boolean(getAccessToken());
}

export type Portal = "owner" | "broker";

export function portalForRole(role: string | null | undefined): Portal {
    return role === "owner" ? "owner" : "broker";
}

export function portalHomeForRole(role: string | null | undefined): string {
    if (role === "owner") return "/owner";
    if (role === "admin") return "/broker/dashboard";
    return "/broker/dashboard";
}

/** Which portal a path belongs to, or null for public routes. */
export function portalForPath(path: string): Portal | null {
    if (path === "/owner" || path.startsWith("/owner/")) return "owner";
    if (path === "/broker" || path.startsWith("/broker/")) return "broker";
    return null;
}

/**
 * Post-login destination. Same-portal `next` is kept; the other portal
 * falls back to this user's home so a broker cannot land on `/owner`.
 */
export function destinationForRole(role: string | null | undefined, next: string | null): string {
    const home = portalHomeForRole(role);
    if (!next || !next.startsWith("/") || next.startsWith("//")) return home;
    const portal = portalForPath(next);
    if (portal && portal !== portalForRole(role)) return home;
    return next;
}
