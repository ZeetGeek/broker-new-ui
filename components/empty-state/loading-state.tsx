import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/shared/skeleton";

/** One announcement for an entire group of decorative skeletons. */
export function LoadingState({
    label,
    children,
    className,
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div role="status" aria-busy="true" className={className}>
            <span className="sr-only">{label}</span>
            <div aria-hidden="true">{children}</div>
        </div>
    );
}

/** Text rows with an optional thumbnail, for embedded lists. */
export function ListSkeleton({
    rows = 3,
    thumbnail = false,
    className,
}: {
    rows?: number;
    thumbnail?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("grid gap-4 py-4 min-inline-0", className)}>
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="flex items-center gap-3 min-inline-0">
                    <Skeleton
                        className={
                            thumbnail ? "shrink-0 block-16 inline-16" : "shrink-0 block-5 inline-5"
                        }
                    />
                    <div className="grid flex-1 gap-2 min-inline-0">
                        <Skeleton className="block-4 inline-3/4" />
                        <Skeleton className="block-3 inline-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}
