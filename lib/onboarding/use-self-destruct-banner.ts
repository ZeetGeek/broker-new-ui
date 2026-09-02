"use client";

import { useEffect, useState } from "react";

import {
    shouldShowExpandedSelfDestructBanner,
    type SelfDestructBannerKey,
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
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (milestoneReached) {
            setIsExpanded(false);
            return;
        }

        if (!userId) {
            setIsExpanded(true);
            return;
        }

        setIsExpanded(
            shouldShowExpandedSelfDestructBanner({
                key: bannerKey,
                userId,
                milestoneReached,
                ttlDays,
            }),
        );
    }, [bannerKey, milestoneReached, ttlDays, userId]);

    return isExpanded;
}
