"use client";

import { useMemo } from "react";

import {
    type SelfDestructBannerKey,
    shouldShowExpandedSelfDestructBanner,
} from "@/lib/onboarding/self-destruct-banner";

export function useSelfDestructBanner({
    bannerKey,
    userId,
    milestoneReached = false,
    ttlDays,
}: {
    bannerKey: SelfDestructBannerKey;
    userId: string | undefined;
    milestoneReached?: boolean;
    ttlDays?: number;
}): boolean {
    return useMemo(() => {
        if (milestoneReached) return false;
        if (!userId) return true;
        return shouldShowExpandedSelfDestructBanner({
            key: bannerKey,
            userId,
            milestoneReached,
            ttlDays,
        });
    }, [bannerKey, milestoneReached, ttlDays, userId]);
}
