"use client";

import { formatResultsCountLine } from "@/lib/format/owner-listings-labels";

import {
    formatNewInAreasThisWeekLine,
} from "@/features/properties/owner-listings/count-new-listings-this-week";
import type { OwnerListingsFilters } from "@/features/properties/owner-listings/types";
import { useSelfDestructBanner } from "@/lib/onboarding/use-self-destruct-banner";

const INTRO_TITLE = "Find properties to represent";
const INTRO_DESCRIPTION =
    "Every property here is listed by the owner. Send a request, and once they approve it, the property moves straight into your pipeline.";

export type OwnerListingsIntroProps = {
    userId: string | undefined;
    hasApprovedRepresentation: boolean;
    newThisWeekCount: number;
    serviceAreas: string[];
    totalCount: number;
    filters: OwnerListingsFilters;
    isLoading?: boolean;
};

function ResultsCount({ totalCount, filters, serviceAreas, isLoading }: Pick<
    OwnerListingsIntroProps,
    "totalCount" | "filters" | "serviceAreas" | "isLoading"
>) {
    const countLine = formatResultsCountLine(totalCount, filters, serviceAreas);

    return (
        <p className="body-sm shrink-0 text-ink-muted">
            {isLoading ? "Finding properties…" : countLine}
        </p>
    );
}

export function OwnerListingsIntro({
    userId,
    hasApprovedRepresentation,
    newThisWeekCount,
    serviceAreas,
    totalCount,
    filters,
    isLoading = false,
}: OwnerListingsIntroProps) {
    const isExpanded = useSelfDestructBanner({
        bannerKey: "owner_listings_intro",
        userId,
        milestoneReached: hasApprovedRepresentation,
    });

    const newThisWeekLine = formatNewInAreasThisWeekLine(newThisWeekCount, serviceAreas);

    if (isExpanded) {
        return (
            <div className="flex flex-col gap-2 text-start">
                <div className="flex items-baseline justify-between gap-4">
                    <h1 className="h2 min-w-0 text-ink">{INTRO_TITLE}</h1>
                    <ResultsCount
                        totalCount={totalCount}
                        filters={filters}
                        serviceAreas={serviceAreas}
                        isLoading={isLoading}
                    />
                </div>
                <p className="body hidden max-inline-[52ch] text-ink-muted sm:block">
                    {INTRO_DESCRIPTION}
                </p>
            </div>
        );
    }

    return (
        <div className="flex items-baseline justify-between gap-4 text-start">
            <h1 className="h5 min-w-0 text-ink">
                Browse
                {newThisWeekLine ? (
                    <>
                        <span aria-hidden> · </span>
                        <span className="body-sm font-normal text-ink-muted">{newThisWeekLine}</span>
                    </>
                ) : null}
            </h1>
            <ResultsCount
                totalCount={totalCount}
                filters={filters}
                serviceAreas={serviceAreas}
                isLoading={isLoading}
            />
        </div>
    );
}
