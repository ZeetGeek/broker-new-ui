"use client";

import { useMemo, useState } from "react";

import { MapPin } from "lucide-react";

import { useSelfDestructBanner } from "@/lib/onboarding/use-self-destruct-banner";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Badge } from "@/components/ui/badge";

import {
    buildOwnerListingsSummaryLines,
    type OwnerListingsPoolSummary,
} from "@/features/properties/owner-listings/build-owner-listings-summary-lines";
import type { OwnerListingsFilters } from "@/features/properties/owner-listings/types";

const INTRO_TITLE = "Find properties to represent";
const INTRO_DESCRIPTION =
    "Every property here is listed by the owner. Send a request, and once they approve it, the property moves straight into your pipeline.";
const SUMMARY_LOOP_INTERVAL_S = 6.5;
const ICON_CLASS = "block-3 inline-3";
const META_TEXT = "body-sm font-medium text-ink-muted";
const CHIP_SURFACE = "bg-surface";

const EMPTY_POOL_SUMMARY: OwnerListingsPoolSummary = {
    slotsOpenCount: 0,
    newTodayCount: 0,
    commissionSetCount: 0,
    readyToMoveCount: 0,
};

export type OwnerListingsIntroProps = {
    userId: string | undefined;
    hasApprovedRepresentation: boolean;
    newThisWeekCount: number;
    serviceAreas: string[];
    totalCount: number;
    poolSummary?: OwnerListingsPoolSummary;
    filters: OwnerListingsFilters;
    hasActiveFilters: boolean;
    isLoading?: boolean;
};

function OwnerListingsBrowseSummary({
    totalCount,
    newThisWeekCount,
    serviceAreas,
    poolSummary,
    filters,
    hasActiveFilters,
    isLoading,
}: Pick<
    OwnerListingsIntroProps,
    | "totalCount"
    | "newThisWeekCount"
    | "serviceAreas"
    | "poolSummary"
    | "filters"
    | "hasActiveFilters"
    | "isLoading"
>) {
    const [isPaused, setIsPaused] = useState(false);

    const lines = useMemo(
        () =>
            buildOwnerListingsSummaryLines({
                totalCount,
                newThisWeekCount,
                serviceAreas,
                filters,
                poolSummary: poolSummary ?? EMPTY_POOL_SUMMARY,
                isLoading: isLoading ?? false,
                hasActiveFilters,
            }),
        [
            totalCount,
            newThisWeekCount,
            serviceAreas,
            poolSummary,
            filters,
            hasActiveFilters,
            isLoading,
        ],
    );

    return (
        <span
            aria-live="polite"
            aria-atomic="true"
            className="text-ink-muted"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <TextLoop interval={SUMMARY_LOOP_INTERVAL_S} trigger={!isPaused}>
                {lines.map((line, index) => (
                    <span key={index}>{line}</span>
                ))}
            </TextLoop>
        </span>
    );
}

function ServiceAreasMeta({ areas }: { areas: string[] }) {
    if (areas.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 ${META_TEXT}`}>
                    <MapPin aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                    Your areas
                </span>
                {areas.map((area) => (
                    <Badge key={area} variant="outline" className={CHIP_SURFACE}>
                        {area}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

type BrowseHeaderProps = Pick<
    OwnerListingsIntroProps,
    | "totalCount"
    | "newThisWeekCount"
    | "serviceAreas"
    | "poolSummary"
    | "filters"
    | "hasActiveFilters"
    | "isLoading"
> & {
    title: string;
    titleClassName: string;
};

function BrowseHeader({
    title,
    titleClassName,
    totalCount,
    newThisWeekCount,
    serviceAreas,
    poolSummary,
    filters,
    hasActiveFilters,
    isLoading,
}: BrowseHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-3 text-start">
            <h1 className={`${titleClassName} min-inline-0`}>
                <span className="text-ink">{title}</span>
                <span className="text-ink">.</span>{" "}
                <OwnerListingsBrowseSummary
                    totalCount={totalCount}
                    newThisWeekCount={newThisWeekCount}
                    serviceAreas={serviceAreas}
                    poolSummary={poolSummary}
                    filters={filters}
                    hasActiveFilters={hasActiveFilters}
                    isLoading={isLoading}
                />
            </h1>

            <ServiceAreasMeta areas={serviceAreas} />
        </div>
    );
}

export function OwnerListingsIntro({
    userId,
    hasApprovedRepresentation,
    newThisWeekCount,
    serviceAreas,
    totalCount,
    poolSummary,
    filters,
    hasActiveFilters,
    isLoading = false,
}: OwnerListingsIntroProps) {
    const isExpanded = useSelfDestructBanner({
        bannerKey: "owner_listings_intro",
        userId,
        milestoneReached: hasApprovedRepresentation,
    });

    const headerProps = {
        totalCount,
        newThisWeekCount,
        serviceAreas,
        poolSummary,
        filters,
        hasActiveFilters,
        isLoading,
    };

    if (isExpanded) {
        return (
            <div className="flex flex-col gap-3 text-start">
                <BrowseHeader title={INTRO_TITLE} titleClassName="h2" {...headerProps} />
                <p className="body hidden text-ink-muted max-inline-[52ch] sm:block">
                    {INTRO_DESCRIPTION}
                </p>
            </div>
        );
    }

    return <BrowseHeader title="Browse" titleClassName="h3" {...headerProps} />;
}
