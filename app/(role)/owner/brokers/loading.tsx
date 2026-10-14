import { BrowseBrokersSkeleton } from "@/features/owner-brokers/browse-brokers-skeleton";

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <div className="animate-pulse rounded-sm bg-surface-muted block-8 inline-48" />
                <div className="animate-pulse rounded-sm bg-surface-muted block-4 inline-72 max-inline-full" />
            </div>
            <div className="flex items-center gap-2">
                <div className="animate-pulse rounded-control bg-surface-muted block-9 inline-28" />
                <div className="animate-pulse rounded-control bg-surface-muted block-9 inline-32" />
            </div>
            <BrowseBrokersSkeleton count={8} />
        </div>
    );
}
