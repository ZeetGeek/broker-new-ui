import { VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

export function VisitsPageSkeleton() {
    return (
        <div className="flex flex-col gap-5" aria-hidden>
            <div className="flex items-center justify-between gap-4">
                <div className="animate-pulse rounded-sm bg-surface-muted block-10 inline-52" />
                <div className="flex gap-2">
                    <div className="
                      animate-pulse rounded-control bg-surface-muted block-11 inline-36
                    " />
                    <div className="
                      animate-pulse rounded-control bg-surface-muted block-11 inline-32
                    " />
                </div>
            </div>
            <div className="animate-pulse bg-surface-muted block-16 inline-full" />
            <div className="animate-pulse rounded-control bg-surface-muted block-12 inline-80" />
            <VisitsTabSkeleton />
        </div>
    );
}

