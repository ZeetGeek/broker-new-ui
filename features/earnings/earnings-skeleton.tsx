import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/shared/skeleton";

import styles from "./earnings.module.css";

function Block({ className }: { className?: string }) {
    return <Skeleton className={cn("bg-ink-muted/12 max-inline-full", className)} />;
}

function Card({
    children,
    className,
    control = false,
}: {
    children: ReactNode;
    className?: string;
    control?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 min-block-64 min-inline-0 sm:p-5 sm:min-block-80",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-4">
                <Block className="block-5 inline-44" />
                {control ? <Block className="shrink-0 block-7 inline-24" /> : null}
            </div>
            {children}
        </div>
    );
}

function StatStrip() {
    return (
        <div className="grid grid-cols-2 overflow-hidden rounded-card bg-surface shadow-sm ring-1 ring-border-warm/50 lg:grid-cols-4">
            {[0, 1, 2, 3].map((stat) => (
                <div
                    key={stat}
                    className={cn(
                        styles.stat,
                        "relative p-2 after:absolute after:inset-y-4 after:inset-e-0 after:bg-border-warm after:inline-px even:after:hidden lg:last:after:hidden lg:even:after:block",
                    )}
                >
                    <div
                        className={cn(
                            styles.statContent,
                            "rounded-control px-2 py-2.5 block-full min-block-11 sm:px-3",
                        )}
                    >
                        <Block className={cn(styles.statIcon, "rounded-full block-5 inline-5")} />
                        <Block className={cn(styles.statLabel, "block-3 inline-24")} />
                        <Block className={cn(styles.statValue, "block-6 inline-8")} />
                        <Block className={cn(styles.statDetail, "block-2.5 inline-36")} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CommissionSummary() {
    return (
        <div className="flex flex-col justify-between gap-6 rounded-card bg-brand p-5 shadow-sm min-block-64 min-inline-0 sm:p-6 sm:min-block-80 lg:col-span-4">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <Block className="bg-surface/20 block-10 inline-48" />
                    <div className="flex flex-col gap-2">
                        <Block className="bg-surface/20 block-2.5 inline-12" />
                        <Block className="bg-surface/20 block-5 inline-24" />
                    </div>
                </div>
                <Block className="bg-surface/20 block-3 inline-60" />
            </div>
            <div className="flex flex-col gap-3">
                <Block className="bg-surface/20 block-6 inline-full" />
                <Block className="bg-surface/20 block-6 inline-24" />
            </div>
            <div className="grid grid-cols-2 gap-4 border-bs border-surface/15 pbs-4">
                {[0, 1].map((kind) => (
                    <div key={kind} className="flex flex-col gap-2">
                        <Block className="bg-surface/20 block-2.5 inline-12" />
                        <Block className="bg-surface/20 block-5 inline-24" />
                        <Block className="rounded-full bg-surface/20 block-4 inline-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function Chart({ className, control = false }: { className: string; control?: boolean }) {
    return (
        <Card className={className} control={control}>
            <div className="flex flex-1 flex-col justify-between gap-5 pbs-3 min-block-48 sm:min-block-56">
                {[0, 1, 2, 3].map((line) => (
                    <div key={line} className="flex items-center gap-3">
                        <Block className="shrink-0 block-2 inline-5" />
                        <div className="flex-1 border-bs border-dashed border-border-warm" />
                    </div>
                ))}
                <div className="flex justify-between gap-3 ps-8">
                    {[0, 1, 2, 3, 4, 5].map((month) => (
                        <Block key={month} className="block-2 inline-6" />
                    ))}
                </div>
            </div>
            <Block className="mx-auto block-2.5 inline-16" />
        </Card>
    );
}

function DealRows({ className, sold = false }: { className: string; sold?: boolean }) {
    return (
        <Card className={className}>
            <div className="flex flex-1 flex-col justify-around divide-y divide-border-warm">
                {[0, 1, 2].map((row) => (
                    <div key={row} className="flex items-center gap-3 py-3">
                        {sold ? <Block className="shrink-0 block-10 inline-10" /> : null}
                        <div className="flex flex-1 flex-col gap-2 min-inline-0">
                            <Block className="block-3 inline-44" />
                            <Block
                                className={sold ? "block-2.5 inline-28" : "block-5 inline-full"}
                            />
                        </div>
                        <Block className="shrink-0 block-3 inline-14" />
                    </div>
                ))}
            </div>
        </Card>
    );
}

function AreaRows() {
    return (
        <Card className="lg:col-span-3">
            <div className="flex flex-1 flex-col justify-around divide-y divide-border-warm">
                {[0, 1, 2].map((area) => (
                    <div key={area} className="flex flex-col gap-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <Block className="block-3 inline-24" />
                            <Block className="block-3 inline-12" />
                        </div>
                        <Block className="rounded-full block-3 inline-full" />
                        <Block className="block-2 inline-20" />
                    </div>
                ))}
            </div>
        </Card>
    );
}

function PipelineGauge() {
    return (
        <Card className="lg:col-span-4" control>
            <div className="relative mx-auto flex flex-1 items-end justify-center pbs-4 inline-full max-inline-56 min-block-32">
                <div className="rounded-t-full border-16 border-be-0 border-surface-muted block-28 inline-full" />
                <div className="absolute inset-x-0 inset-be-0 flex flex-col items-center gap-2">
                    <Block className="block-6 inline-10" />
                    <Block className="block-2 inline-20" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pbs-3">
                {[0, 1].map((total) => (
                    <div key={total} className="flex flex-col items-center gap-2">
                        <Block className="block-2 inline-20" />
                        <Block className="block-5 inline-24" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((stage) => (
                    <Block key={stage} className="block-2 inline-full" />
                ))}
            </div>
        </Card>
    );
}

/** Route, Suspense and initial query loading share the report's responsive layout. */
export function EarningsPageSkeleton() {
    return (
        <div role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading your earnings…</span>
            <div aria-hidden="true" className="flex flex-col gap-card-grid min-inline-0">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                    <div className="flex flex-col gap-2 min-inline-0">
                        <div className="flex flex-wrap items-center gap-2 min-block-8">
                            <Block className="block-6 inline-28" />
                            <Block className="block-6 inline-72" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Block className="shrink-0 rounded-full block-3 inline-3" />
                            <Block className="block-3 inline-64" />
                        </div>
                    </div>
                    <Block className="rounded-control block-control-md inline-72" />
                </div>
                <StatStrip />
                <div className="grid grid-cols-1 gap-card-grid md:grid-cols-2 lg:grid-cols-12">
                    <CommissionSummary />
                    <Chart className="lg:col-span-8" control />
                    <DealRows className="lg:col-span-5" />
                    <AreaRows />
                    <PipelineGauge />
                    <DealRows className="md:order-last md:col-span-2 lg:col-span-5" sold />
                    <Chart className="lg:col-span-7" />
                </div>
            </div>
        </div>
    );
}
