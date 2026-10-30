import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/shared/skeleton";

import { DEAL_STAGE_ORDER, type DealStage, type DealsView } from "@/features/pipeline/types";

import detailStyles from "./deal-detail-modal.module.css";

function Bone({ className }: { className?: string }) {
    return <Skeleton className={cn("animate-none", className)} />;
}

function DealCardSkeleton({ stage, outcome = false }: { stage?: DealStage; outcome?: boolean }) {
    return (
        <div
            className="flex flex-col gap-2.5 rounded-card border border-border-warm bg-surface p-4 shadow-md"
            aria-hidden
        >
            <div className="flex items-start justify-between gap-2">
                <Bone className="rounded-full block-6 inline-20" />
                <div className="flex gap-1.5">
                    {Array.from({ length: outcome ? 2 : 3 }, (_, index) => (
                        <Bone
                            key={index}
                            className="rounded-full block-control-sm inline-control-sm"
                        />
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Bone className="shrink-0 rounded-xl border-2 border-white block-20 inline-20" />
                <div className="flex flex-1 flex-col gap-2 min-inline-0">
                    <Bone className="rounded-sm block-6 inline-24 max-inline-full" />
                    <Bone className="rounded-sm block-4 inline-full" />
                    <Bone className="rounded-sm block-3.5 inline-3/4" />
                </div>
            </div>
            {outcome || stage === "visit" || stage === "negotiation" ? (
                <div className="flex items-center gap-2.5 rounded-inner border border-border-warm px-3 min-block-10">
                    <Bone className="rounded-full block-4 inline-4" />
                    <Bone className="rounded-sm block-3 inline-2/3" />
                </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-control border border-ink/15 p-1.5 min-block-16">
                {[0, 1].map((person) => (
                    <div key={person} className="flex flex-1 items-center gap-2 px-2 min-inline-0">
                        <Bone className="shrink-0 rounded-full block-8 inline-8" />
                        <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                            <Bone className="rounded-sm block-3.5 inline-full" />
                            <Bone className="rounded-sm block-3 inline-10" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 pbs-1">
                <Bone className="flex-1 rounded-control block-control-lg" />
                <Bone className="flex-1 rounded-control block-control-lg" />
            </div>
        </div>
    );
}

/** Responsive cold-load placeholders; existing records stay visible during refetches. */
export function PipelineBoardSkeleton({
    view = "board",
    mobileStage = "new",
}: {
    view?: DealsView;
    mobileStage?: DealStage;
}) {
    return (
        <div role="status" aria-busy="true" className="motion-safe:animate-pulse">
            <span className="sr-only">Loading your deals</span>
            <div aria-hidden>
                {view !== "board" ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }, (_, index) => (
                            <DealCardSkeleton key={index} outcome />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="hidden snap-x snap-mandatory items-stretch gap-3 overflow-x-auto md:flex lg:grid lg:snap-none lg:grid-cols-4 lg:gap-4 lg:overflow-visible">
                            {DEAL_STAGE_ORDER.map((stage) => (
                                <div
                                    key={stage}
                                    className={cn(
                                        "flex snap-start flex-col gap-3 rounded-card border p-3 min-inline-72 lg:min-inline-0",
                                        "border-border-warm bg-border-warm/40",
                                    )}
                                >
                                    <div className="flex flex-col gap-1">
                                        <Bone className="rounded-sm bg-border-warm block-3 inline-20" />
                                        <div className="flex items-center justify-between gap-2 block-7">
                                            <Bone className="rounded-sm bg-border-warm block-5 inline-32" />
                                            <Bone className="rounded-sm bg-border-warm block-3 inline-12" />
                                        </div>
                                    </div>
                                    {Array.from({ length: 6 }, (_, index) => (
                                        <DealCardSkeleton key={index} stage={stage} />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-4 md:hidden">
                            <div className="-mx-4 flex gap-2 overflow-hidden px-4 pbe-1">
                                {DEAL_STAGE_ORDER.map((stage) => (
                                    <Bone
                                        key={stage}
                                        className="shrink-0 rounded-control block-control-lg inline-32"
                                    />
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                {Array.from({ length: 6 }, (_, index) => (
                                    <DealCardSkeleton key={index} stage={mobileStage} />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/** Full header placeholder, shared by route transitions and the first API load. */
export function PipelineHeaderSkeleton() {
    return (
        <>
            <h1 className="h3 min-inline-0">
                <span className="sr-only">Loading pipeline</span>
                <span aria-hidden className="relative inline-block align-bottom">
                    <span className="invisible">Pipeline.</span>
                    <Bone className="absolute inset-s-0 inset-bs-[0.12em] bg-border-warm block-[0.8em] inline-full" />
                </span>{" "}
                <span aria-hidden className="relative inline-block align-bottom max-inline-full">
                    <span className="invisible">Your deals, from first contact to close</span>
                    <Bone className="absolute inset-s-0 inset-bs-[0.12em] bg-border-warm block-[0.8em] inline-full" />
                </span>
            </h1>
            <div
                className="flex flex-wrap items-center gap-x-3 gap-y-2 motion-safe:animate-pulse"
                aria-hidden
            >
                <div className="flex items-center gap-1.5 rounded-control border border-border-warm bg-surface px-3.5 shadow-sm block-[38px] inline-24">
                    <Bone className="shrink-0 rounded-full block-3 inline-3" />
                    <Bone className="rounded-full block-3 inline-10" />
                </div>
                <div className="flex gap-3">
                    {[
                        "inline-20 sm:inline-36",
                        "inline-24 sm:inline-40",
                        "inline-20 sm:inline-32",
                    ].map((width, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center gap-1.5 rounded-control border border-border-warm bg-surface px-3 shadow-sm block-[38px]",
                                width,
                            )}
                        >
                            <Bone className="flex-1 rounded-full block-3" />
                            <Bone className="shrink-0 rounded-full block-4 inline-5" />
                        </div>
                    ))}
                </div>
                <div className="ms-auto flex gap-2">
                    <div className="flex items-center gap-2 rounded-control border border-border-warm bg-surface px-3 shadow-sm block-[38px] inline-44 sm:inline-52 lg:inline-64">
                        <Bone className="shrink-0 rounded-full block-3 inline-3" />
                        <Bone className="rounded-full block-3 inline-2/3" />
                    </div>
                    <div className="flex items-center gap-2 rounded-control border border-border-warm bg-surface px-3 shadow-sm block-[38px] inline-20 sm:inline-36">
                        <Bone className="shrink-0 rounded-full block-3 inline-3" />
                        <Bone className="flex-1 rounded-full block-3" />
                    </div>
                </div>
            </div>
        </>
    );
}

/** App Router/Suspense fallback reserves the same header slots as the page. */
export function PipelinePageSkeleton() {
    return (
        <div className="flex flex-col gap-5" aria-busy="true">
            <PipelineHeaderSkeleton />
            <PipelineBoardSkeleton />
        </div>
    );
}

export function PipelineHistorySkeleton() {
    return (
        <div className={detailStyles.timeline} aria-hidden>
            {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className={detailStyles.timelineEntry}>
                    <Bone className="rounded-full block-8 inline-8" />
                    <div className="flex flex-col gap-2 pbs-1">
                        <Bone className="block-4 inline-28" />
                        <Bone className="block-3 inline-36 max-inline-full" />
                        <Bone className="block-3 inline-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Shares the live modal's grid, image ratio, thumbnail sizes and section frames. */
export function PipelineDetailSkeleton() {
    return (
        <div
            className={cn(detailStyles.layout, "motion-safe:animate-pulse")}
            role="status"
            aria-busy="true"
        >
            <span className="sr-only">Loading deal details</span>
            <div className={detailStyles.leftColumn} aria-hidden>
                <div className={detailStyles.gallery}>
                    <div className={detailStyles.carouselViewport}>
                        <div className={detailStyles.carouselTrack}>
                            <div className={detailStyles.carouselSlide}>
                                <Bone className="absolute inset-0 block-full inline-full" />
                            </div>
                        </div>
                    </div>
                    <div className={detailStyles.thumbnails}>
                        {Array.from({ length: 4 }, (_, index) => (
                            <Bone key={index} className={detailStyles.thumbnail} />
                        ))}
                    </div>
                </div>
                <div className={detailStyles.property}>
                    <div className={detailStyles.propertySummary}>
                        <Bone className="block-5 inline-3/4" />
                        <Bone className="block-4 inline-2/3" />
                        <Bone className="block-6 inline-18" />
                    </div>
                </div>
                <div className={detailStyles.details}>
                    <Bone className="block-6 inline-28" />
                    <div className={detailStyles.contacts}>
                        {[0, 1].map((index) => (
                            <div key={index} className="flex gap-2.5">
                                <Bone className="shrink-0 rounded-full block-10 inline-10" />
                                <div className="flex flex-1 flex-col gap-2">
                                    <Bone className="block-3 inline-12" />
                                    <Bone className="block-4 inline-3/4" />
                                    <Bone className="block-3 inline-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Bone className="block-6 inline-28" />
                    <div className={detailStyles.facts}>
                        {[0, 1].map((index) => (
                            <div key={index} className="flex flex-col gap-2">
                                <Bone className="block-3 inline-24 max-inline-full" />
                                <Bone className="block-4 inline-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className={detailStyles.rightColumn} aria-hidden>
                <div className={detailStyles.notes}>
                    <Bone className="block-6 inline-14" />
                    <div className={detailStyles.noteBody}>
                        <Bone className="block-3 inline-3/4" />
                    </div>
                </div>
                <div className={detailStyles.history}>
                    <Bone className="block-6 inline-28" />
                    <PipelineHistorySkeleton />
                </div>
            </div>
        </div>
    );
}
