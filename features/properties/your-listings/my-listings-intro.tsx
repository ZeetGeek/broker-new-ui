"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { BROKER_PROPERTIES_NEW_HREF } from "@/lib/routes/broker";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Button } from "@/components/ui/button";

import type { MyListingsSummary } from "@/lib/api/my-listings";

const SUMMARY_LOOP_INTERVAL_S = 6.5;

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

function buildMyListingsSummaryLines({
    summary,
    resultTotal,
    hasActiveFilters,
    isLoading,
}: {
    summary: MyListingsSummary | null;
    resultTotal: number;
    hasActiveFilters: boolean;
    isLoading: boolean;
}): ReactNode[] {
    if (isLoading && !summary) {
        return ["Getting your listings…"];
    }

    const lines: ReactNode[] = [];
    const total = summary?.total ?? 0;

    if (hasActiveFilters) {
        if (resultTotal === 0) {
            lines.push("No properties match these filters — try clearing a few");
        } else {
            lines.push(
                <>
                    {countLabel(resultTotal, "listing matches", "listings match")} your filters
                </>,
            );
        }
    } else if (total === 0) {
        lines.push("No properties yet — add your first one");
    } else {
        lines.push(
            <>{countLabel(total, "listing", "listings")} in your inventory</>,
        );
    }

    if (summary && summary.published > 0) {
        lines.push(
            <>{countLabel(summary.published, "listing is", "listings are")} published</>,
        );
    }

    if (summary && summary.draft > 0) {
        lines.push(<>{countLabel(summary.draft, "draft", "drafts")} waiting to publish</>);
    }

    if (summary && summary.unpublished > 0) {
        lines.push(
            <>
                {countLabel(summary.unpublished, "listing is", "listings are")} unpublished
            </>,
        );
    }

    return lines.length > 0 ? lines : ["Your inventory"];
}

export type MyListingsIntroProps = {
    summary: MyListingsSummary | null;
    resultTotal: number;
    hasActiveFilters: boolean;
    isLoading?: boolean;
};

export function MyListingsIntro({
    summary,
    resultTotal,
    hasActiveFilters,
    isLoading = false,
}: MyListingsIntroProps) {
    const [isPaused, setIsPaused] = useState(false);

    const lines = useMemo(
        () =>
            buildMyListingsSummaryLines({
                summary,
                resultTotal,
                hasActiveFilters,
                isLoading,
            }),
        [summary, resultTotal, hasActiveFilters, isLoading],
    );

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-start">
            <h1 className="h3 min-inline-0">
                <span className="text-ink">Your listings</span>
                <span className="text-ink">.</span>{" "}
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
            </h1>

            <Button
                size="md"
                variant="accent"
                className="shrink-0"
                render={<Link href={BROKER_PROPERTIES_NEW_HREF} />}
            >
                <Plus aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                Add property
            </Button>
        </div>
    );
}
