import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { ListPageHeading } from "@/components/shared/list-page-heading";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { ResponsiveListToolbar } from "@/components/shared/responsive-list-toolbar";
import { Skeleton } from "@/components/shared/skeleton";

import { DEAL_STAGE_ORDER, type DealStage, type DealsView } from "@/features/pipeline/types";

import cardStyles from "./deal-card.module.css";
import detailStyles from "./deal-detail-modal.module.css";
import desktopBoardStyles from "./pipeline-board.module.css";
import boardStyles from "./pipeline-mobile-board.module.css";

function Bone({ className }: { className?: string }) {
    return <Skeleton className={cn("animate-none", className)} />;
}

function DealCardSkeleton({ stage, outcome = false }: { stage?: DealStage; outcome?: boolean }) {
    return (
        <div
            className={cn(
                "flex flex-col overflow-hidden rounded-card border border-border-warm bg-surface shadow-md",
                cardStyles.card,
            )}
            aria-hidden
        >
            <div className={cn("flex flex-col gap-3", cardStyles.panel)}>
                <div className="flex items-center justify-between gap-2">
                    <Bone className="rounded-full block-6 inline-20" />
                    <div className="flex gap-1.5">
                        {Array.from({ length: 2 }, (_, index) => (
                            <Bone
                                key={index}
                                className="rounded-full block-control-sm inline-control-sm"
                            />
                        ))}
                    </div>
                </div>
                <div className={cardStyles.summary}>
                    <PropertyCoverImage alt="" size={80} className={cardStyles.photo}>
                        <Bone className="absolute inset-0 rounded-none" />
                    </PropertyCoverImage>
                    <div className={cardStyles.summaryDetails}>
                        <Bone className="rounded-sm block-6 inline-24 max-inline-full" />
                        <Bone className="rounded-sm block-4 inline-full" />
                        <Bone className="rounded-sm block-3.5 inline-3/4" />
                    </div>
                </div>
                {outcome ? (
                    <div
                        className={cn(
                            cardStyles.outcome,
                            "rounded-inner border border-border-warm",
                        )}
                    >
                        <div className={cardStyles.outcomeHeader}>
                            <Bone className="rounded-sm block-3 inline-20" />
                            <Bone className="rounded-sm block-3 inline-16" />
                        </div>
                        <Bone className="rounded-sm block-4 inline-3/4" />
                    </div>
                ) : stage === "visit" || stage === "negotiation" ? (
                    <div className="flex items-center gap-2.5 rounded-inner border border-border-warm px-3 min-block-10">
                        <Bone className="rounded-full block-4 inline-4" />
                        <Bone className="rounded-sm block-3 inline-2/3" />
                    </div>
                ) : null}
                <div className={cardStyles.people}>
                    {[0, 1].map((person) => (
                        <div key={person} className={cardStyles.personRow}>
                            <Bone
                                className={cn(
                                    "shrink-0 rounded-sm block-3 inline-10",
                                    cardStyles.personLabel,
                                )}
                            />
                            <Bone className="shrink-0 rounded-full block-6 inline-6" />
                            <Bone className="flex-1 rounded-sm block-3.5" />
                        </div>
                    ))}
                </div>
                <div className={cardStyles.contactActions}>
                    <Bone
                        className={cn(
                            "flex-1 rounded-control block-control-lg",
                            cardStyles.contactButton,
                        )}
                    />
                    <Bone
                        className={cn(
                            "flex-1 rounded-control block-control-lg",
                            cardStyles.contactButton,
                        )}
                    />
                </div>
            </div>
        </div>
    );
}

/** Results-only placeholders for the first load and changed search/filter criteria. */
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
                    <div className="grid grid-cols-1 gap-card-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }, (_, index) => (
                            <DealCardSkeleton key={index} outcome />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className={desktopBoardStyles.rail}>
                            {DEAL_STAGE_ORDER.map((stage) => (
                                <div
                                    key={stage}
                                    className={cn(
                                        "flex snap-start flex-col gap-3 rounded-card border p-3 min-inline-0",
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
                        <div className={boardStyles.board}>
                            <div className={boardStyles.rail}>
                                {[
                                    mobileStage,
                                    ...DEAL_STAGE_ORDER.filter((stage) => stage !== mobileStage),
                                ].map((stage) => (
                                    <div key={stage} className={boardStyles.column}>
                                        <div className={boardStyles.columnHeader}>
                                            <Bone className="block-5 inline-28" />
                                            <Bone className="block-3 inline-32" />
                                        </div>
                                        <div className={boardStyles.deals}>
                                            {[0, 1, 2].map((index) => (
                                                <DealCardSkeleton key={index} stage={stage} />
                                            ))}
                                        </div>
                                    </div>
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
            <PortalSectionNav>
                <ListPageHeading title="Pipeline.">
                    <span className="sr-only">Loading pipeline summary</span>
                    <Bone className="bg-border-warm block-5 inline-80 max-inline-full" />
                </ListPageHeading>
            </PortalSectionNav>
            <div role="status" aria-busy="true">
                <span className="sr-only">Loading deal controls</span>
                <div aria-hidden>
                    <ResponsiveListToolbar
                        selection={
                            <>
                                <Bone className="list-control inline-20" />
                                <Bone className="flex-1 list-control min-inline-0 sm:flex-none sm:inline-40" />
                            </>
                        }
                        search={<Bone className="list-control inline-full" />}
                        actions={
                            <Bone className="list-control inline-(--list-control-height) sm:inline-36" />
                        }
                    />
                </div>
            </div>
        </>
    );
}

/** App Router/Suspense fallback reserves the same header slots as the page. */
export function PipelinePageSkeleton() {
    return (
        <div className="flex flex-col gap-4 min-inline-0 md:gap-5" aria-busy="true">
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
