import { Skeleton } from "@/components/shared/skeleton";

/** Mirrors the loaded earnings layout so nothing jumps when data arrives. */
export function EarningsPageSkeleton() {
    return (
        <div role="status" aria-live="polite" className="flex flex-col gap-6 md:gap-8">
            <span className="sr-only">Loading your earnings…</span>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <Skeleton className="block-8 inline-40" />
                    <Skeleton className="block-4 inline-72" />
                </div>
                <Skeleton className="block-control-md inline-72 max-sm:inline-full" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="rounded-card block-40" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-12">
                <Skeleton className="rounded-card block-96 lg:col-span-8" />
                <Skeleton className="rounded-card block-96 lg:col-span-4" />
                <Skeleton className="rounded-card block-80 lg:col-span-7" />
                <Skeleton className="rounded-card block-80 lg:col-span-5" />
            </div>
        </div>
    );
}
