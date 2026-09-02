import { cn } from "@/lib/utils";

const PROPERTY_CARD_PHOTO_CLASS = "relative h-40 shrink-0 overflow-hidden bg-surface-muted";

export function PropertyCardSkeleton({
    className,
    variant = "browse",
}: {
    className?: string;
    variant?: "browse" | "represented";
}) {
    return (
        <div
            className={cn(
                "flex flex-col overflow-hidden rounded-card border border-border-warm bg-surface",
                className,
            )}
            aria-hidden
        >
            {variant === "represented" ? (
                <div className="animate-pulse bg-brand-deep/70 block-8 inline-full" />
            ) : null}

            <div className={cn(PROPERTY_CARD_PHOTO_CLASS, "animate-pulse bg-surface-muted")} />

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
                    <div className="animate-pulse rounded-control bg-surface-muted block-9 inline-full" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-1.5 flex-1 animate-pulse rounded-full bg-surface-muted"
                            />
                        ))}
                    </div>
                    <div className="animate-pulse rounded-full bg-surface-muted block-3.5 inline-4/5" />
                    <div className="animate-pulse rounded-full bg-surface-muted block-3.5 inline-3/5" />
                </div>

                <div className="flex gap-2 pbs-1">
                    <div className="animate-pulse flex-1 rounded-control bg-surface-muted block-9" />
                    <div className="animate-pulse flex-[1.4] rounded-control bg-surface-muted block-9" />
                </div>
            </div>
        </div>
    );
}
