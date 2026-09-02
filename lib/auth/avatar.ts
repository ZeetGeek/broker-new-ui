const MANUAL_AUTH_PROVIDERS = new Set(["email", "credentials", "local", "password"]);

function isGoogleAvatarHost(hostname: string): boolean {
    return hostname === "lh3.googleusercontent.com" || hostname.endsWith(".googleusercontent.com");
}

export function normalizeAvatarUrl(avatarUrl?: string | null): string | undefined {
    const trimmed = avatarUrl?.trim();
    if (!trimmed) {
        return undefined;
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return undefined;
        }
        return parsed.toString();
    } catch {
        return undefined;
    }
}

export function isGoogleAvatarUrl(avatarUrl: string): boolean {
    try {
        return isGoogleAvatarHost(new URL(avatarUrl).hostname);
    } catch {
        return false;
    }
}

export type ResolveUserAvatarImageUrlInput = {
    avatarUrl?: string | null;
    authProvider?: string | null;
};

/** Google sign-in with a photo → URL. Everything else → undefined (generated avatar). */
export function resolveUserAvatarImageUrl({
    avatarUrl,
    authProvider,
}: ResolveUserAvatarImageUrlInput): string | undefined {
    const normalized = normalizeAvatarUrl(avatarUrl);
    const provider = authProvider?.trim().toLowerCase();

    if (provider && MANUAL_AUTH_PROVIDERS.has(provider)) {
        return undefined;
    }

    if (provider === "google") {
        return normalized;
    }

    if (normalized && isGoogleAvatarUrl(normalized)) {
        return normalized;
    }

    return undefined;
}
