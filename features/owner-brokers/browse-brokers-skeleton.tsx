import { cn } from "@/lib/utils";

const BAR = "animate-pulse rounded-sm bg-surface-muted";

function CardSkeleton() {
    return (
        <div
            aria-hidden
            className="
              flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4 shadow-sm
              md:p-5
            "
        >
            <div className="flex items-start gap-3">
                <div
                    className="
                      shrink-0 animate-pulse rounded-full bg-surface-muted block-14 inline-14
                    "
                />
                <div className="flex flex-1 flex-col gap-2 pbs-1">
                    <div className={cn(BAR, "block-4 inline-36")} />
                    <div className={cn(BAR, "block-3 inline-28")} />
                    <div className={cn(BAR, "block-3 inline-40")} />
                </div>
            </div>
            <div className="animate-pulse rounded-inner bg-surface-muted block-14" />
            <div className="flex gap-1.5">
                <div className={cn(BAR, "rounded-lg block-6 inline-20")} />
                <div className={cn(BAR, "rounded-lg block-6 inline-16")} />
            </div>
            <div className="flex gap-2">
                <div
                    className="
                      flex-1 animate-pulse rounded-control bg-surface-muted block-control-lg
                    "
                />
                <div
                    className="
                      flex-1 animate-pulse rounded-control bg-surface-muted block-control-lg
                    "
                />
            </div>
        </div>
    );
}

export function BrowseBrokersSkeleton() {
    return (
        <div role="status" aria-label="Loading brokers" className={browseBrokersGridClass()}>
            {Array.from({ length: 6 }, (_, index) => (
                <CardSkeleton key={index} />
            ))}
        </div>
    );
}

export function browseBrokersGridClass(): string {
    return "grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-3";
}
