import { apiFetch } from "@/lib/api/client";
import { isMockMode, MOCK_ACCESS_TOKEN, MOCK_AUTH_USER } from "@/lib/api/mock-mode";
import { isOwnerUnavailable, signupPortal } from "@/lib/auth/launch-policy";
import { type AuthUser, getStoredUser } from "@/lib/auth/session";

import { API_URL } from "@/config";

export type LoginResponse = {
    user: AuthUser;
    accessToken: string;
    tokenType?: string;
};

export type RegisterPayload = {
    email: string;
    password: string;
    role: "owner" | "broker";
    fullName?: string;
    phone?: string;
    city?: string;
    accountType?: "individual" | "organization";
    orgName?: string;
    referralCode?: string;
    /** ISO2 of the market the account works in. Required by the API. */
    countryIso2: string;
};

export type RegisterResponse = {
    message: string;
    user: AuthUser;
};

export const authApi = {
    login(email: string, password: string, rememberMe: boolean) {
        if (isMockMode()) {
            return Promise.resolve({
                user: MOCK_AUTH_USER,
                accessToken: MOCK_ACCESS_TOKEN,
            });
        }
        return apiFetch<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password, rememberMe }),
            skipAuth: true,
            credentials: "include",
        });
    },

    register(payload: RegisterPayload) {
        return apiFetch<RegisterResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ ...payload, role: signupPortal(payload.role) }),
            skipAuth: true,
        });
    },

    resendVerification(email: string) {
        return apiFetch<{ message?: string }>("/auth/resend-verification", {
            method: "POST",
            body: JSON.stringify({ email }),
            skipAuth: true,
        });
    },

    verifyEmail(token: string) {
        const q = new URLSearchParams({ token });
        return apiFetch<{ message?: string }>(`/auth/verify-email?${q.toString()}`, {
            skipAuth: true,
        });
    },

    forgotPassword(email: string) {
        return apiFetch<{ message: string }>("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
            skipAuth: true,
        });
    },

    resetPassword(token: string, newPassword: string) {
        return apiFetch<{ message: string }>("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ token, newPassword }),
            skipAuth: true,
        });
    },

    profile(token?: string | null) {
        if (isMockMode()) {
            return Promise.resolve(MOCK_AUTH_USER);
        }
        return apiFetch<AuthUser>("/auth/profile", {
            ...(token != null ? { token } : {}),
        });
    },

    refresh() {
        if (isMockMode()) {
            return Promise.resolve({
                user: MOCK_AUTH_USER,
                accessToken: MOCK_ACCESS_TOKEN,
            });
        }
        return apiFetch<LoginResponse>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({}),
            skipAuth: true,
            credentials: "include",
        });
    },

    logout() {
        return apiFetch("/auth/logout", {
            method: "POST",
            body: JSON.stringify({}),
            skipAuth: true,
            credentials: "include",
        }).catch(() => undefined);
    },

    /** Confirms the role and, when the account has none yet, its country. */
    completeGoogleRole(role: "owner" | "broker", countryIso2?: string) {
        if (isOwnerUnavailable(role) || isOwnerUnavailable(getStoredUser()?.role)) {
            return Promise.reject(
                new Error("Owner accounts are not available during this launch."),
            );
        }
        return apiFetch<LoginResponse>("/auth/google/complete-role", {
            method: "POST",
            body: JSON.stringify({ role, ...(countryIso2 ? { countryIso2 } : {}) }),
            credentials: "include",
        });
    },

    /**
     * Full-page redirect start URL for Google OAuth.
     * For new sign-ups, pass role + accountType (and orgName when organization).
     */
    googleStartUrl(options?: {
        role?: "owner" | "broker";
        accountType?: "individual" | "organization";
        orgName?: string;
        referralCode?: string;
        /** ISO2 picked on the register page, carried through the OAuth state. */
        countryIso2?: string;
        /** True when the register page already collected owner/broker. */
        roleChosen?: boolean;
    }) {
        const params = new URLSearchParams();
        params.set("role", signupPortal(options?.role ?? "broker"));
        if (options?.accountType) {
            params.set("accountType", options.accountType);
        }
        if (options?.orgName?.trim()) {
            params.set("orgName", options.orgName.trim());
        }
        if (options?.referralCode?.trim()) {
            params.set("referralCode", options.referralCode.trim());
        }
        if (options?.countryIso2?.trim()) {
            params.set("countryIso2", options.countryIso2.trim().toUpperCase());
        }
        if (options?.roleChosen) {
            params.set("roleChosen", "1");
        }
        // console.log("options =>",options)
        return `${API_URL}/auth/google?${params.toString()}`;
    },
};
