"use client";

import {
    formatNewInAreasThisWeekLine,
} from "@/features/properties/owner-listings/count-new-listings-this-week";
import { useSelfDestructBanner } from "@/lib/onboarding/use-self-destruct-banner";

const INTRO_TITLE = "Find properties to represent";
const INTRO_DESCRIPTION =
    "Every property here is listed by the owner. Send a request, and once they approve it, the property moves straight into your pipeline.";

export type OwnerListingsIntroProps = {
    userId: string | undefined;
    hasApprovedRepresentation: boolean;
    newThisWeekCount: number;
    serviceAreas: string[];
};

export function OwnerListingsIntro({
    userId,
    hasApprovedRepresentation,
    newThisWeekCount,
    serviceAreas,
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
                <h1 className="h2 text-ink">{INTRO_TITLE}</h1>
                <p className="body hidden max-inline-[52ch] text-ink-muted sm:block">
                    {INTRO_DESCRIPTION}
                </p>
            </div>
        );
    }

    return (
        <div className="text-start">
            <h1 className="h5 text-ink">
                Browse
                {newThisWeekLine ? (
                    <>
                        <span aria-hidden> · </span>
                        <span className="body-sm font-normal text-ink-muted">{newThisWeekLine}</span>
                    </>
                ) : null}
            </h1>
        </div>
    );
}
