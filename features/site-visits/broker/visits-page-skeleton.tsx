import { VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

export function VisitsPageSkeleton() {
    return (
        <div className="flex flex-col gap-5" aria-hidden>
            <div className="flex items-center justify-between gap-4">
                <div className="animate-pulse rounded-sm bg-surface-muted block-10 inline-52" />
                <div className="animate-pulse rounded-control bg-surface-muted block-8 inline-40" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <div className="animate-pulse rounded-sm bg-surface-muted block-6 inline-24" />
                <div className="animate-pulse rounded-sm bg-surface-muted block-6 inline-20" />
                <div className="animate-pulse rounded-sm bg-surface-muted block-6 inline-20" />
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="animate-pulse rounded-control bg-surface-muted block-11 flex-1" />
                <div className="animate-pulse rounded-control bg-surface-muted block-11 inline-36" />
                <div className="animate-pulse rounded-control bg-surface-muted block-11 inline-40" />
            </div>
            <VisitsTabSkeleton />
        </div>
    );
}
