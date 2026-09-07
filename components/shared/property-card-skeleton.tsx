import { cn } from "@/lib/utils";

const BROWSE_CARD_PHOTO_FRAME_CLASS = "shrink-0 rounded-card bg-surface p-1 shadow-md";
const BROWSE_CARD_PHOTO_FRAME_GRID_CLASS = "w-full";
const BROWSE_CARD_PHOTO_FRAME_LIST_CLASS =
    "w-[min(62%,28rem)] min-w-64 shrink-0 self-start sm:min-w-72";

const BROWSE_CARD_PHOTO_INNER_CLASS =
    "relative overflow-hidden rounded-[calc(var(--radius-card)-4px)] bg-surface-muted";
const BROWSE_CARD_PHOTO_INNER_GRID_CLASS = "aspect-[4/3] w-full animate-pulse";
const BROWSE_CARD_PHOTO_INNER_LIST_CLASS = "aspect-[5/4] w-full animate-pulse";

export function PropertyCardSkeleton({
    className,
    variant = "browse",
    layout = "grid",
}: {
    className?: string;
    variant?: "browse" | "represented";
    layout?: "grid" | "list";
}) {
    const isListView = layout === "list";

    if (variant === "browse") {
        return (
            <div
                className={cn(
                    "flex min-inline-0",
                    isListView ? "flex-row items-start gap-4" : "flex-col gap-3",
                    className,
                )}
                aria-hidden
            >
                <div
                    className={cn(
                        BROWSE_CARD_PHOTO_FRAME_CLASS,
                        isListView
                            ? BROWSE_CARD_PHOTO_FRAME_LIST_CLASS
                            : BROWSE_CARD_PHOTO_FRAME_GRID_CLASS,
                    )}
                >
                    <div
                        className={cn(
                            BROWSE_CARD_PHOTO_INNER_CLASS,
                            isListView
                                ? BROWSE_CARD_PHOTO_INNER_LIST_CLASS
                                : BROWSE_CARD_PHOTO_INNER_GRID_CLASS,
                        )}
                    />
                </div>

                <div className="flex flex-1 flex-col gap-2.5 px-2 min-inline-0">
                    <div className="flex items-start gap-2">
                        <div className="flex flex-1 flex-col gap-2.5 min-inline-0">
                            <div className="flex flex-col gap-1.5">
                                <div
                                    className="
                                      animate-pulse rounded-full bg-surface-muted block-4 inline-4/5
                                    "
                                />
                                <div
                                    className="
                                      animate-pulse rounded-full bg-surface-muted block-3.5
                                      inline-3/5
                                    "
                                />
                            </div>

                            <div
                                className="
                                  animate-pulse rounded-full bg-surface-muted block-3.5 inline-full
                                "
                            />
                        </div>
                        <div
                            className="
                              mbs-0.5 shrink-0 animate-pulse rounded-full bg-surface-muted block-4
                              inline-4
                            "
                        />
                    </div>

                    <div className="mbs-auto flex flex-col gap-2.5">
                        <div className="flex items-baseline gap-2">
                            <div
                                className="
                                  animate-pulse rounded-full bg-surface-muted block-6 inline-24
                                "
                            />
                            <div
                                className="
                                  animate-pulse rounded-full bg-surface-muted block-4 inline-10
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
                    <div className="animate-pulse rounded-full bg-surface-muted block-7 inline-24" />
                    <div className="animate-pulse rounded-full bg-surface-muted block-6 inline-16" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-4/5" />
                    <div
                        className="
                      animate-pulse rounded-full bg-surface-muted block-3.5 inline-3/5
                    "
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="
                          animate-pulse rounded-full bg-surface-muted block-8 inline-8
                        "
                        />
                        <div
                            className="
                              animate-pulse rounded-full bg-surface-muted block-4 inline-28
                            "
                        />
                    </div>
                </div>

                <div className="flex gap-2 pbs-1">
                    <div className="flex-1 animate-pulse rounded-control bg-surface-muted block-9" />
                    <div
                        className="
                          flex-[1.4] animate-pulse rounded-control bg-surface-muted block-9
                        "
                    />
                </div>
            </div>
        </div>
    );
}
