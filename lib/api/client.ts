import axios, {
    AxiosHeaders,
    type AxiosRequestConfig,
    type InternalAxiosRequestConfig,
} from "axios";

import { isMockMode } from "@/lib/api/mock-mode";
import { type AuthUser, clearSession, getAccessToken, setSession } from "@/lib/auth/session";

import { API_URL } from "@/config";

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

type ApiOptions = RequestInit & {
    token?: string | null;
    skipAuth?: boolean;
};

type RetryConfig = InternalAxiosRequestConfig & {
    skipAuth?: boolean;
    _retry?: boolean;
};

type RefreshResponse = {
    user: AuthUser;
    accessToken: string;
    tokenType?: string;
};

/** Unwrap NestJS / gateway error payloads into a readable string. */
function extractErrorMessage(data: unknown, fallback: string): string {
    if (data == null) return fallback;
    if (typeof data === "string") return data || fallback;
    if (Array.isArray(data)) {
        const parts = data.map((item) => extractErrorMessage(item, "")).filter(Boolean);
        return parts.length ? parts.join(", ") : fallback;
    }
    if (typeof data === "object") {
        const record = data as Record<string, unknown>;
        if ("message" in record) {
            return extractErrorMessage(record.message, fallback);
        }
        if (typeof record.error === "string" && record.error) {
            return record.error;
        }
    }
    return fallback;
}

function toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return new ApiError(
                `Unable to reach the server at ${API_URL}. Please check your connection and try again.`,
                0,
                error.message,
            );
        }

        const data = error.response.data;
        const message = extractErrorMessage(data, error.response.statusText || "Request failed");
        return new ApiError(message, error.response.status, data);
    }

    return new ApiError(error instanceof Error ? error.message : "Request failed", 0, error);
}

function forceLogout() {
    clearSession();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("broker:unauthorized"));
    }
}

function notifyTokenRefreshed(accessToken: string, user: AuthUser) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent("broker:token-refreshed", {
            detail: { accessToken, user },
        }),
    );
}

function isAuthRefreshPath(url?: string): boolean {
    if (!url) return false;
    return (
        url.includes("/auth/refresh") ||
        url.includes("/auth/login") ||
        url.includes("/auth/logout") ||
        url.includes("/auth/register")
    );
}

/** Bare client for token refresh — no response interceptor (avoids recursion). */
const refreshClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string> | null = null;

/**
 * Rotate access token using the httpOnly refresh cookie (`withCredentials`).
 * Any 401/403 from refresh (missing, expired, or revoked cookie) clears the
 * session so AuthGuard can send the user to login.
 */
async function refreshAccessToken(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = refreshClient
            .post<RefreshResponse>("/auth/refresh", {})
            .then((res) => {
                const { accessToken, user } = res.data;
                if (!accessToken || !user) {
                    throw new ApiError("Refresh response missing tokens", 401, res.data);
                }
                setSession({ accessToken, user });
                notifyTokenRefreshed(accessToken, user);
                return accessToken;
            })
            .catch((error) => {
                const apiError = toApiError(error);
                // Network blips (status 0) keep the session so a reconnect can retry.
                // Auth failures — e.g. "Refresh token is missing" — force login.
                if (apiError.status === 401 || apiError.status === 403) {
                    forceLogout();
                }
                throw apiError;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

api.interceptors.request.use((config: RetryConfig) => {
    const headers = AxiosHeaders.from(config.headers);
    const method = (config.method ?? "get").toLowerCase();
    const hasBody = config.data != null && config.data !== "";

    if (
        hasBody &&
        !(config.data instanceof FormData) &&
        !headers.has("Content-Type") &&
        method !== "get" &&
        method !== "head"
    ) {
        headers.set("Content-Type", "application/json");
    }

    if (!config.skipAuth && !headers.has("Authorization")) {
        const accessToken = getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }
    }

    config.headers = headers;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config as RetryConfig | undefined;
        const status = error.response?.status;

        const shouldAttemptRefresh =
            status === 401 &&
            Boolean(original) &&
            !original!._retry &&
            !original!.skipAuth &&
            !isAuthRefreshPath(original!.url);

        if (!shouldAttemptRefresh) {
            return Promise.reject(toApiError(error));
        }

        original!._retry = true;

        const currentToken = getAccessToken();
        const sentAuth = AxiosHeaders.from(original!.headers).get("Authorization");
        if (currentToken && !sentAuth) {
            const headers = AxiosHeaders.from(original!.headers);
            headers.set("Authorization", `Bearer ${currentToken}`);
            original!.headers = headers;
            try {
                return await api.request(original!);
            } catch {
                // Fall through to refresh.
            }
        }

        try {
            const accessToken = await refreshAccessToken();
            const headers = AxiosHeaders.from(original!.headers);
            headers.set("Authorization", `Bearer ${accessToken}`);
            original!.headers = headers;
            return api.request(original!);
        } catch (refreshError) {
            return Promise.reject(toApiError(refreshError));
        }
    },
);

/**
 * Drop-in fetch-style helper used across the app.
 * Backed by axios so expired access tokens are refreshed via interceptor.
 */
export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
    if (isMockMode()) {
        return Promise.resolve({} as T);
    }

    const { token, skipAuth, headers, body, method, signal } = options;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const axiosHeaders: Record<string, string> = {};
    if (headers) {
        const list = new Headers(headers);
        list.forEach((value, key) => {
            axiosHeaders[key] = value;
        });
    }

    if (token) {
        axiosHeaders.Authorization = `Bearer ${token}`;
    }

    if (isFormData) {
        delete axiosHeaders["Content-Type"];
        delete axiosHeaders["content-type"];
    }

    const config: AxiosRequestConfig & { skipAuth?: boolean } = {
        url: path.startsWith("/") ? path : `/${path}`,
        method: (method ?? "GET") as AxiosRequestConfig["method"],
        data: body,
        ...(signal ? { signal } : {}),
        skipAuth: Boolean(skipAuth),
        headers: axiosHeaders,
        withCredentials: true,
    };

    try {
        const response = await api.request<T>(config);
        return response.data;
    } catch (error) {
        throw toApiError(error);
    }
}
