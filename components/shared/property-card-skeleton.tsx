import { cn } from "@/lib/utils";

const BROWSE_CARD_PHOTO_CLASS = "relative aspect-[4/3] shrink-0 overflow-hidden bg-surface-muted";
const BROWSE_CARD_PHOTO_LIST_CLASS = "relative w-40 min-h-40 shrink-0 self-stretch overflow-hidden bg-surface-muted sm:w-48 md:w-56";

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
                    "overflow-hidden rounded-card border border-border-warm/70 bg-surface shadow-sm",
                    isListView ? "flex flex-row" : "flex flex-col",
                    className,
                )}
                aria-hidden
            >
                <div
                    className={cn(
                        BROWSE_CARD_PHOTO_CLASS,
                        "animate-pulse bg-surface-muted",
                        isListView && BROWSE_CARD_PHOTO_LIST_CLASS,
                    )}
                />

                <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-4/5" />
                        <div className="animate-pulse rounded-full bg-surface-muted block-3.5 inline-3/5" />
                    </div>

                    <div className="animate-pulse rounded-full bg-surface-muted block-3.5 inline-full" />

                    <div className="flex items-baseline gap-2 pt-0.5">
                        <div className="animate-pulse rounded-full bg-surface-muted block-6 inline-24" />
                        <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-10" />
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

            <div className={cn(BROWSE_CARD_PHOTO_CLASS, "animate-pulse bg-surface-muted")} />

            <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="animate-pulse rounded-full bg-surface-muted block-7 inline-24" />
                    <div className="animate-pulse rounded-full bg-surface-muted block-6 inline-16" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-4/5" />
                    <div className="animate-pulse rounded-full bg-surface-muted block-3.5 inline-3/5" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="animate-pulse rounded-full bg-surface-muted block-8 inline-8" />
                        <div className="animate-pulse rounded-full bg-surface-muted block-4 inline-28" />
                    </div>
                </div>

                <div className="flex gap-2 pbs-1">
                    <div className="animate-pulse flex-1 rounded-control bg-surface-muted block-9" />
                    <div className="animate-pulse flex-[1.4] rounded-control bg-surface-muted block-9" />
                </div>
            </div>
        </div>
    );
}
