"use client";

import { useEffect, useRef } from "react";

export function useInfiniteScrollTrigger({
    enabled,
    onLoadMore,
    rootMargin = "800px 0px",
}: {
    enabled: boolean;
    onLoadMore: () => void;
    rootMargin?: string;
}) {
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = triggerRef.current;
        if (!node || !enabled) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) onLoadMore();
            },
            { rootMargin },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [enabled, onLoadMore, rootMargin]);

    return triggerRef;
}
