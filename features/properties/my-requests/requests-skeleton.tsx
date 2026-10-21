"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { filterChipClassName } from "@/components/shared/filter-chip";
import { Skeleton } from "@/components/shared/skeleton";

import {
    DEAL_CARD_PANEL_CLASS,
    REQUESTS_GRID_CLASS,
} from "@/features/properties/my-requests/requests-grid-class";
import {
    DEALS_SEARCH_CLASS,
    DEALS_SORT_CLASS,
    DEALS_TOOLBAR_CLASS,
} from "@/features/properties/my-requests/requests-header";
import { MyDealsIntro } from "@/features/properties/my-requests/requests-intro";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";

function SkeletonLabel({ children }: { children: ReactNode }) {
    return (
        <span className="relative inline-block">
            <span className="invisible">{children}</span>
            <Skeleton className="absolute inset-x-0 inset-bs-1/2 -translate-y-1/2 block-3" />
        </span>
    );
}

function CountSkeleton() {
    return (
        <span className="inline-flex shrink-0 items-center justify-center block-5 inline-8">
            <Skeleton className="block-4 inline-7" />
        </span>
    );
}

function RequestsToolbarSkeleton() {
    return (
        <div aria-hidden className={DEALS_TOOLBAR_CLASS}>
            <div className="-my-1.5 flex flex-1 gap-2.5 overflow-hidden px-0.5 py-1.5 min-inline-0">
                <div className={filterChipClassName(false)}>
                    <Skeleton className="shrink-0 block-4 inline-4" />
                    <SkeletonLabel>Filters</SkeletonLabel>
                    <CountSkeleton />
                </div>
                <div className={filterChipClassName(false)}>
                    <SkeletonLabel>Representing</SkeletonLabel>
                    <CountSkeleton />
                </div>
                <div className={filterChipClassName(false)}>
                    <SkeletonLabel>
                        <span className="md:hidden">Sent</span>
                        <span className="hidden md:inline">Sent by you</span>
                    </SkeletonLabel>
                    <CountSkeleton />
                </div>
                <div className={cn(filterChipClassName(false), "gap-2")}>
                    <SkeletonLabel>
                        <span className="md:hidden">Invites</span>
                        <span className="hidden md:inline">Owner invitations</span>
                    </SkeletonLabel>
                    <CountSkeleton />
                </div>
                <div className={filterChipClassName(false)}>
                    <SkeletonLabel>Rejected</SkeletonLabel>
                    <CountSkeleton />
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 max-inline-full">
                <div
                    className={cn(
                        DEALS_SEARCH_CLASS,
                        "flex items-center gap-2 rounded-control border border-border-warm bg-surface px-3 block-[38px]",
                    )}
                >
                    <Skeleton className="shrink-0 block-4 inline-4" />
                    <Skeleton className="block-3 inline-24" />
                </div>
                <div className={cn(filterChipClassName(false), DEALS_SORT_CLASS, "gap-2")}>
                    <Skeleton className="shrink-0 block-4 inline-4" />
                    <SkeletonLabel>
                        <span className="hidden sm:inline">Newest first</span>
                        <span className="sm:hidden">Sort</span>
                    </SkeletonLabel>
                    <Skeleton className="shrink-0 block-3.5 inline-3.5" />
                </div>
            </div>
        </div>
    );
}

function TextSkeleton({ className, width }: { className: string; width: string }) {
    return (
        <div className={cn("relative", className)}>
            <span className="invisible">Loading</span>
            <Skeleton
                className={cn("absolute inset-bs-1/2 -translate-y-1/2 block-[0.8em]", width)}
            />
        </div>
    );
}

function DealCardSkeleton({ activeTab }: { activeTab: RequestsTab }) {
    return (
        <div
            aria-hidden
            className="flex flex-1 flex-col overflow-hidden rounded-card bg-surface shadow-md"
        >
            <div className="relative aspect-4/3 shrink-0 bg-border-warm inline-full">
                <Skeleton className="rounded-none bg-ink/3 block-full inline-full" />
                <div className="absolute inset-x-3 inset-bs-3 flex items-start gap-1.5">
                    <Skeleton className="rounded-full bg-surface/60 block-5 inline-24" />
                    <Skeleton className="rounded-full bg-surface/60 block-5 inline-16" />
                    <Skeleton className="ms-auto rounded-full bg-surface/60 block-10 inline-10" />
                </div>
            </div>
            <div className={cn("flex flex-1 flex-col gap-4 p-4", DEAL_CARD_PANEL_CLASS)}>
                <div className="flex flex-col gap-2 min-inline-0">
                    <TextSkeleton className="h5" width="inline-1/3" />
                    <div className="flex flex-col gap-1">
                        <TextSkeleton className="body font-semibold" width="inline-4/5" />
                        <TextSkeleton className="body-sm" width="inline-3/5" />
                    </div>
                </div>
                <div className="flex flex-col gap-3.5">
                    <div className="body-sm flex items-center gap-2 min-block-5">
                        <Skeleton className="block-3 inline-14" />
                        <Skeleton className="shrink-0 rounded-full block-5 inline-5" />
                        <Skeleton className="block-3 inline-2/5" />
                    </div>
                    {activeTab === "accepted" ? (
                        <div className="body-sm flex items-center gap-2 min-block-5">
                            <Skeleton className="block-3 inline-14" />
                            <Skeleton className="shrink-0 rounded-full block-5 inline-5" />
                            <Skeleton className="block-3 inline-1/3" />
                        </div>
                    ) : null}
                </div>
                <div className="mbs-auto flex flex-col gap-1.5">
                    {activeTab === "sent" ? (
                        <TextSkeleton className="body-xs" width="inline-1/2" />
                    ) : null}
                    <div className="flex gap-2">
                        <Skeleton className="flex-1 block-control-md" />
                        {activeTab === "accepted" || activeTab === "invites" ? (
                            <Skeleton className="flex-1 block-control-md" />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function RequestsListSkeleton({
    count = 5,
    activeTab = "accepted",
}: {
    count?: number;
    activeTab?: RequestsTab;
}) {
    return (
        <div role="status" aria-busy="true">
            <span className="sr-only">Loading your deals</span>
            <div className={REQUESTS_GRID_CLASS}>
                {Array.from({ length: count }, (_, index) => (
                    <DealCardSkeleton key={index} activeTab={activeTab} />
                ))}
            </div>
        </div>
    );
}

export function RequestsPageSkeleton({ activeTab = "accepted" }: { activeTab?: RequestsTab }) {
    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <MyDealsIntro
                    activeTab={activeTab}
                    sentSummary={null}
                    inviteSummary={null}
                    isLoading
                />
            </PortalSectionNav>
            <RequestsToolbarSkeleton />
            <RequestsListSkeleton activeTab={activeTab} />
        </div>
    );
}
