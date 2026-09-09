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

/**
 * Prefer a real photo when we have one.
 *
 * Uploaded avatars always win. Google profile photos are allowed for Google
 * accounts, but suppressed for email/password accounts so a leftover OAuth
 * URL never overrides the generated avatar (or a later upload).
 */
export function resolveUserAvatarImageUrl({
    avatarUrl,
    authProvider,
}: ResolveUserAvatarImageUrlInput): string | undefined {
    const normalized = normalizeAvatarUrl(avatarUrl);
    if (!normalized) return undefined;

    const provider = authProvider?.trim().toLowerCase();
    if (isGoogleAvatarUrl(normalized) && provider && MANUAL_AUTH_PROVIDERS.has(provider)) {
        return undefined;
    }

    return normalized;
}
