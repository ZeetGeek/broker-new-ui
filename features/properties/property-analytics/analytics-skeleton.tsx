import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/shared/skeleton";

const CARD =
    "flex flex-col gap-4 rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 sm:p-5";

function CardSkeleton({ rows, className }: { rows: number; className?: string }) {
    return (
        <div className={cn(CARD, className)}>
            <Skeleton className="block-6 inline-48" />
            <div className="flex flex-col gap-4">
                {Array.from({ length: rows }, (_, index) => (
                    <div key={index} className="flex flex-col gap-2">
                        <Skeleton className="block-4 inline-40" />
                        <Skeleton className="rounded-full block-2 inline-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Mirrors the loaded listing analytics layout so nothing jumps when data arrives. */
export function AnalyticsSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading this listing's clients, visits and offers"
            className="flex flex-col gap-5 pbe-6 sm:gap-6"
        >
            <div className="flex flex-col gap-4">
                <Skeleton className="block-control-md inline-32" />
                <div className="flex items-start gap-4">
                    <Skeleton className="hidden shrink-0 rounded-[8px] sm:block sm:block-18 sm:inline-22" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="block-7 inline-full max-inline-xl" />
                        <Skeleton className="block-5 inline-full max-inline-md" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-card bg-surface shadow-sm ring-1 ring-border-warm/50 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3 p-4">
                        <Skeleton className="shrink-0 block-6 inline-6" />
                        <div className="flex flex-1 flex-col gap-1.5">
                            <Skeleton className="block-4 inline-20" />
                            <Skeleton className="block-4 inline-32" />
                        </div>
                        <Skeleton className="block-7 inline-12" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-card-grid lg:grid-cols-12">
                <CardSkeleton rows={3} className="lg:col-span-7" />
                <CardSkeleton rows={4} className="lg:col-span-5" />
            </div>

            <div className={CARD}>
                {Array.from({ length: 2 }, (_, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <Skeleton className="shrink-0 rounded-full block-10 inline-10" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="block-5 inline-40" />
                            <Skeleton className="block-4 inline-full max-inline-sm" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
