import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/shared/skeleton";

const BROWSE_CARD_PHOTO_FRAME_CLASS = "shrink-0 rounded-card bg-surface p-1 shadow-md w-full";
const BROWSE_CARD_PHOTO_INNER_CLASS =
    "relative overflow-hidden rounded-[calc(var(--radius-card)-4px)] bg-surface-muted aspect-[4/3] w-full animate-pulse";

export function PropertyCardSkeleton({
    className,
    variant = "browse",
}: {
    className?: string;
    variant?: "browse" | "browse-overlay" | "represented";
}) {
    if (variant === "browse-overlay") {
        return (
            <div
                className={cn(
                    "flex flex-1 flex-col overflow-hidden rounded-card bg-surface shadow-md",
                    className,
                )}
                aria-hidden
            >
                <div className="relative aspect-4/3 shrink-0 bg-border-warm inline-full">
                    <Skeleton className="rounded-none bg-ink/3 block-full inline-full" />
                    <div className="absolute inset-x-3 inset-bs-3 flex items-start gap-1.5">
                        <Skeleton className="rounded-full bg-surface/60 block-5 inline-24" />
                        <Skeleton className="rounded-full bg-surface/60 block-5 inline-16" />
                        <Skeleton className="ms-auto rounded-full bg-surface/60 block-10 inline-10" />
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Skeleton className="block-7 inline-1/3" />
                    <Skeleton className="block-5 inline-3/5" />
                    <Skeleton className="block-4 inline-2/5" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="shrink-0 rounded-full block-5 inline-5" />
                        <Skeleton className="block-4 inline-1/2" />
                    </div>
                    <Skeleton className="mbs-auto block-11 inline-full" />
                </div>
            </div>
        );
    }

    if (variant === "browse") {
        return (
            <div
                className={cn("flex flex-1 flex-col gap-3 block-full min-inline-0", className)}
                aria-hidden
            >
                <div className={BROWSE_CARD_PHOTO_FRAME_CLASS}>
                    <div className={BROWSE_CARD_PHOTO_INNER_CLASS} />
                </div>

                <div className="flex flex-1 flex-col gap-2.5 px-2 min-inline-0">
                    <div className="flex flex-1 items-stretch gap-2 min-block-0">
                        <div className="flex flex-1 flex-col gap-1.5 min-block-0 min-inline-0">
                            <div className="flex flex-col gap-1.5">
                                <div
                                    className="
                                      animate-pulse rounded-sm bg-surface-muted block-4 inline-4/5
                                    "
                                />
                                <div
                                    className="
                                      animate-pulse rounded-sm bg-surface-muted block-3.5 inline-3/5
                                    "
                                />
                            </div>

                            <div
                                className="
                                  animate-pulse rounded-sm bg-surface-muted block-3.5 inline-full
                                "
                            />

                            <div className="mbs-auto flex items-center gap-2 pbs-2">
                                <div
                                    className="
                                      shrink-0 animate-pulse rounded-full bg-surface-muted
                                      block-control-sm inline-control-sm
                                    "
                                />
                                <div className="flex flex-col gap-1 min-inline-0">
                                    <div
                                        className="
                                          animate-pulse rounded-sm bg-surface-muted block-3.5
                                          inline-24
                                        "
                                    />
                                    <div
                                        className="
                                          animate-pulse rounded-sm bg-surface-muted block-3
                                          inline-20
                                        "
                                    />
                                </div>
                            </div>
                        </div>
                        <div
                            className="
                              mbs-0.5 shrink-0 animate-pulse rounded-sm bg-surface-muted block-4
                              inline-4
                            "
                        />
                    </div>

                    <div className="mbs-auto flex flex-col gap-2.5">
                        <div className="flex items-baseline gap-2">
                            <div
                                className="
                                  animate-pulse rounded-sm bg-surface-muted block-6 inline-24
                                "
                            />
                            <div
                                className="
                                  animate-pulse rounded-sm bg-surface-muted block-4 inline-10
                                "
                            />
                        </div>

                        <div
                            className="
                              animate-pulse rounded-control bg-surface-muted block-11 inline-full
                            "
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col overflow-hidden rounded-card border border-border-warm bg-surface",
                className,
            )}
            aria-hidden
        >
            <div className="animate-pulse bg-brand-deep/70 block-8 inline-full" />

            <div
                className="
                  relative aspect-4/3 animate-pulse overflow-hidden rounded-card bg-surface-muted
                "
            />

            <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="animate-pulse rounded-sm bg-surface-muted block-7 inline-24" />
                    <div className="animate-pulse rounded-sm bg-surface-muted block-6 inline-16" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="animate-pulse rounded-sm bg-surface-muted block-4 inline-4/5" />
                    <div className="animate-pulse rounded-sm bg-surface-muted block-3.5 inline-3/5" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="
                              animate-pulse rounded-control bg-surface-muted block-8 inline-8
                            "
                        />
                        <div className="animate-pulse rounded-sm bg-surface-muted block-4 inline-28" />
                    </div>
                </div>

                <div className="flex gap-2 pbs-1">
                    <div className="flex-1 animate-pulse rounded-control bg-surface-muted block-9" />
                    <div className="flex-1 animate-pulse rounded-control bg-surface-muted block-9" />
                </div>
            </div>
        </div>
    );
}
