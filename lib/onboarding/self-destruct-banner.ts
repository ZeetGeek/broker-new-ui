const STORAGE_PREFIX = "yb_self_destruct:";
const DEFAULT_TTL_DAYS = 7;

export type SelfDestructBannerKey = "owner_listings_intro" | "dashboard_onboarding";

export type SelfDestructBannerInput = {
    key: SelfDestructBannerKey;
    userId: string;
    now?: Date;
    /** Collapse immediately when true — e.g. first approved representation. */
    milestoneReached?: boolean;
    ttlDays?: number;
};

function storageKey(key: SelfDestructBannerKey, userId: string) {
    return `${STORAGE_PREFIX}${key}:${userId}`;
}

/** Whether the expanded onboarding copy should still show. */
export function shouldShowExpandedSelfDestructBanner(input: SelfDestructBannerInput): boolean {
    if (input.milestoneReached) {
        return false;
    }

    if (typeof window === "undefined") {
        return false;
    }

    const ttlDays = input.ttlDays ?? DEFAULT_TTL_DAYS;
    const now = input.now ?? new Date();
    const key = storageKey(input.key, input.userId);
    const raw = window.localStorage.getItem(key);

    if (!raw) {
        window.localStorage.setItem(key, now.toISOString());
        return true;
    }

    const firstSeenAt = new Date(raw);
    if (Number.isNaN(firstSeenAt.getTime())) {
        window.localStorage.setItem(key, now.toISOString());
        return true;
    }

    const daysElapsed =
        (now.getTime() - firstSeenAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysElapsed < ttlDays;
}
