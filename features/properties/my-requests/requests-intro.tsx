"use client";

import { type ReactNode, useMemo } from "react";

import { formatDateShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { RequestsSummary } from "@/features/properties/my-requests/types";

const SUMMARY_LOOP_INTERVAL_S = 6.5;
const META_TEXT = "body-sm font-medium text-ink-muted";
const CHIP_SURFACE = "bg-surface";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Rotating one-liners under the page title. Ordered so the most actionable
 * line comes first — a broker glancing once should see what needs doing.
 */
function buildSummaryLines(summary: RequestsSummary | null, isLoading: boolean): ReactNode[] {
    if (isLoading && !summary) {
        return ["Getting your requests…"];
    }

    if (!summary || summary.counts.all === 0) {
        return ["You have not sent any requests yet"];
    }

    const lines: ReactNode[] = [];

    if (summary.needsFollowUpCount > 0) {
        lines.push(
            <>
                {countLabel(
                    summary.needsFollowUpCount,
                    "accepted request needs",
                    "accepted requests need",
                )}{" "}
                a buyer
            </>,
        );
    }

    if (summary.counts.pending > 0) {
        lines.push(
            <>
                {countLabel(summary.counts.pending, "request is", "requests are")} waiting for a
                reply
            </>,
        );
    }

    if (summary.unseenCount > 0) {
        lines.push(
            <>
                {countLabel(summary.unseenCount, "request has", "requests have")} not been opened
                yet
            </>,
        );
    }

    if (summary.counts.approved > 0) {
        lines.push(
            <>{countLabel(summary.counts.approved, "request was", "requests were")} accepted</>,
        );
    }

    return lines.length > 0 ? lines : ["Every request you have sent"];
}

/**
 * One count as an inline badge, matching the meta row on Your listings —
 * a bordered stat card outweighs the page title at this altitude.
 */
function StatChip({
    label,
    value,
    hint,
    tone = "default",
}: {
    label: string;
    value: string;
    /** Plain-English explanation shown on hover — every number gets one. */
    hint: string;
    tone?: "default" | "urgent" | "success";
}) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Badge
                        variant={tone === "urgent" ? "urgent" : "outline"}
                        className={cn(
                            "cursor-help",
                            tone !== "urgent" && CHIP_SURFACE,
                            tone === "success" && "text-success",
                        )}
                    >
                        {label} · <span className="tabular">{value}</span>
                    </Badge>
                }
            />
            <TooltipContent side="bottom">{hint}</TooltipContent>
        </Tooltip>
    );
}

export function RequestsIntro({
    summary,
    isLoading,
}: {
    summary: RequestsSummary | null;
    isLoading: boolean;
}) {
    const lines = useMemo(() => buildSummaryLines(summary, isLoading), [summary, isLoading]);

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-3">
                {/* Title and summary stack rather than sharing a baseline — at
                    360px the rotating line wrapped under the title anyway, and
                    the ragged two-column effect was the worst of both. */}
                <div className="flex flex-col gap-1">
                    <h1 className="h4 text-ink">Your deals</h1>
                    <div className={cn(META_TEXT, "min-inline-0")}>
                        {lines.length > 1 ? (
                            <TextLoop interval={SUMMARY_LOOP_INTERVAL_S}>
                                {lines.map((line, index) => (
                                    <span key={index}>{line}</span>
                                ))}
                            </TextLoop>
                        ) : (
                            lines[0]
                        )}
                    </div>
                </div>

                {summary && summary.counts.all > 0 ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        {/* Three numbers, not seven. Waiting and Accepted are the
                            two states a broker acts on; "needs a buyer" only
                            appears when it is actually true. Success rate and
                            average reply time moved to the tooltip on Accepted —
                            they explain a number rather than being one. */}
                        <div className="flex flex-wrap items-center gap-2">
                            <StatChip
                                label="Waiting"
                                value={String(summary.counts.pending)}
                                hint={
                                    summary.avgResponseDays > 0
                                        ? `Requests the owner has not replied to yet. Owners usually reply in ${summary.avgResponseDays} days.`
                                        : "Requests the owner has not replied to yet."
                                }
                            />
                            <StatChip
                                label="Accepted"
                                value={String(summary.counts.approved)}
                                tone="success"
                                hint={`Requests the owner accepted. You can sell these. Of the requests owners replied to, ${summary.approvalRate}% were accepted.`}
                            />
                            {summary.needsFollowUpCount > 0 ? (
                                <StatChip
                                    label="Needs a buyer"
                                    value={String(summary.needsFollowUpCount)}
                                    tone="urgent"
                                    hint="Accepted requests where you have not added a buyer yet."
                                />
                            ) : null}
                        </div>

                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <span
                                        className={cn(
                                            META_TEXT,
                                            "ms-auto cursor-help whitespace-nowrap",
                                        )}
                                    >
                                        {summary.quota.remaining} of {summary.quota.limit} requests
                                        left
                                    </span>
                                }
                            />
                            <TooltipContent side="bottom">
                                You can send {summary.quota.limit} requests a week. This resets on{" "}
                                {formatDateShort(new Date(summary.quota.resetsOn))}.
                            </TooltipContent>
                        </Tooltip>
                    </div>
                ) : null}
            </div>
        </TooltipProvider>
    );
}
