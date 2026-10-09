import { apiFetch } from "@/lib/api/client";
import { isMockMode, MOCK_ACCESS_TOKEN, MOCK_AUTH_USER } from "@/lib/api/mock-mode";
import type { AuthUser } from "@/lib/auth/session";

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
};

export type RegisterResponse = {
    message: string;
    user: AuthUser;
};

export const authApi = {
    login(email: string, password: string) {
        if (isMockMode()) {
            return Promise.resolve({
                user: MOCK_AUTH_USER,
                accessToken: MOCK_ACCESS_TOKEN,
            });
        }
        return apiFetch<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            skipAuth: true,
            credentials: "include",
        });
    },

    register(payload: RegisterPayload) {
        return apiFetch<RegisterResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
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

    completeGoogleRole(role: "owner" | "broker") {
        return apiFetch<LoginResponse>("/auth/google/complete-role", {
            method: "POST",
            body: JSON.stringify({ role }),
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
        /** True when the register page already collected owner/broker. */
        roleChosen?: boolean;
    }) {
        const params = new URLSearchParams();
        params.set("role", options?.role ?? "broker");
        if (options?.accountType) {
            params.set("accountType", options.accountType);
        }
        if (options?.orgName?.trim()) {
            params.set("orgName", options.orgName.trim());
        }
        if (options?.referralCode?.trim()) {
            params.set("referralCode", options.referralCode.trim());
        }
        if (options?.roleChosen) {
            params.set("roleChosen", "1");
        }
        // console.log("options =>",options)
        return `${API_URL}/auth/google?${params.toString()}`;
    },
};
