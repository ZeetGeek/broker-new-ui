import { VisitsCalendarSkeleton } from "@/features/site-visits/visits-skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3" aria-hidden>
                <div className="animate-pulse rounded-full bg-surface-muted block-8 inline-64" />
                <div className="flex gap-2">
                    <div className="animate-pulse rounded-full bg-surface-muted block-6 inline-28" />
                    <div className="animate-pulse rounded-full bg-surface-muted block-6 inline-24" />
                </div>
            </div>
            <VisitsCalendarSkeleton />
        </div>
    );
}
