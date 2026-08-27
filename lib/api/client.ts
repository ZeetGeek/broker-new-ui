import { clearSession, getAccessToken } from "@/lib/auth/session";

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

export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
    const { token, skipAuth, headers, credentials, ...rest } = options;
    const accessToken = skipAuth ? null : (token ?? getAccessToken());
    const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

    const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

    let res: Response;
    try {
        res = await fetch(url, {
            ...rest,
            credentials: credentials ?? "same-origin",
            headers: {
                ...(isFormData ? {} : { "Content-Type": "application/json" }),
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...headers,
            },
            cache: "no-store",
        });
    } catch (err) {
        throw new ApiError(
            `Unable to reach the server at ${API_URL}. Please check your connection and try again.`,
            0,
            err instanceof Error ? err.message : err,
        );
    }

    const text = await res.text();
    let data: unknown = null;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!res.ok) {
        if (res.status === 401 && typeof window !== "undefined") {
            clearSession();
            window.dispatchEvent(new CustomEvent("broker:unauthorized"));
        }
        const message = extractErrorMessage(data, res.statusText || "Request failed");
        throw new ApiError(message, res.status, data);
    }

    return data as T;
}
