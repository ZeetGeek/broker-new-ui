import { Skeleton } from "@/components/shared/skeleton";

/** Mirrors the loaded earnings layout so nothing jumps when data arrives. */
export function EarningsPageSkeleton() {
    return (
        <div role="status" aria-live="polite" className="flex flex-col gap-5 pbe-6 sm:gap-6">
            <span className="sr-only">Loading your earnings…</span>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-2">
                    <Skeleton className="block-8 inline-80 max-sm:inline-full" />
                    <Skeleton className="block-4 inline-64" />
                </div>
                <Skeleton className="rounded-control block-control-md inline-72 max-sm:inline-full" />
            </div>
            <Skeleton className="rounded-card block-64 lg:block-36" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
                <Skeleton className="rounded-card block-80 lg:col-span-4 lg:block-96" />
                <Skeleton className="rounded-card block-96 lg:col-span-8" />
                <Skeleton className="rounded-card block-96 lg:col-span-5" />
                <Skeleton className="rounded-card block-96 lg:col-span-3" />
                <Skeleton className="rounded-card block-96 lg:col-span-4" />
                <Skeleton className="rounded-card block-96 md:order-last md:col-span-2 lg:col-span-6" />
                <Skeleton className="rounded-card block-96 lg:col-span-6" />
            </div>
        </div>
    );
}
