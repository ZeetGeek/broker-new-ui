import type { OwnerLeadsLayout } from "@/features/owner-leads/use-owner-leads-layout";

function LeadCardSkeleton() {
    return (
        <div
            className="
              flex flex-col overflow-hidden rounded-card border border-border-warm bg-surface
            "
            aria-hidden
        >
            <div className="bg-surface-muted block-52" />
            <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                    <div className="rounded-sm bg-surface-muted block-5 inline-48" />
                    <div className="rounded-sm bg-surface-muted block-4 inline-56" />
                </div>
                <div className="flex items-end justify-between gap-2">
                    <div className="rounded-sm bg-surface-muted block-7 inline-28" />
                    <div className="rounded-control bg-surface-muted block-6 inline-28" />
                </div>
                <div className="rounded-inner bg-surface-muted block-16" />
                <div className="flex gap-2">
                    <div className="flex-1 rounded-control bg-surface-muted block-control-lg" />
                    <div className="flex-1 rounded-control bg-surface-muted block-control-lg" />
                    <div className="flex-1 rounded-control bg-surface-muted block-control-lg" />
                </div>
            </div>
        </div>
    );
}

function BoardCardSkeleton() {
    return (
        <div
            className="flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4"
            aria-hidden
        >
            <div className="aspect-4/3 rounded-inner bg-surface-muted inline-full" />
            <div className="flex items-center justify-between gap-2">
                <div className="rounded-sm bg-surface-muted block-4 inline-36" />
                <div className="rounded-sm bg-surface-muted block-4 inline-14" />
            </div>
            <div className="rounded-sm bg-surface-muted block-3 inline-44" />
            <div className="flex flex-col gap-2.5">
                <div className="rounded-sm bg-surface-muted block-5 inline-full" />
                <div className="rounded-sm bg-surface-muted block-5 inline-full" />
            </div>
            <div className="flex items-center justify-between border-bs border-border-warm pbs-3">
                <div className="rounded-control bg-surface-muted block-control-sm inline-24" />
                <div className="rounded-control bg-surface-muted block-control-sm inline-28" />
            </div>
        </div>
    );
}

export function LeadsSkeleton({ layout }: { layout: OwnerLeadsLayout }) {
    if (layout === "board") {
        return (
            <div
                className="
                  flex items-start gap-3 overflow-hidden
                  motion-safe:animate-pulse
                  lg:grid lg:grid-cols-4 lg:gap-4
                "
                aria-busy="true"
                aria-label="Loading your leads"
            >
                {Array.from({ length: 4 }).map((_, column) => (
                    <div
                        key={column}
                        className="
                          flex shrink-0 flex-col gap-3 rounded-card bg-surface-muted/40 p-3
                          inline-72
                          lg:inline-auto
                        "
                    >
                        <div className="flex flex-col gap-1.5">
                            <div className="rounded-sm bg-surface-muted block-3 inline-20" />
                            <div className="rounded-sm bg-surface-muted block-3 inline-14" />
                        </div>
                        {Array.from({ length: column === 0 ? 2 : 1 }).map((__, card) => (
                            <BoardCardSkeleton key={card} />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            className="flex flex-col gap-4 motion-safe:animate-pulse lg:grid lg:grid-cols-2"
            aria-busy="true"
            aria-label="Loading your leads"
        >
            {Array.from({ length: 4 }).map((_, index) => (
                <LeadCardSkeleton key={index} />
            ))}
        </div>
    );
}
