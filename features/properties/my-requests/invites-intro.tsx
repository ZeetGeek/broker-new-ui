"use client";

import { type ReactNode, useMemo } from "react";

import { cn } from "@/lib/utils";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { InvitesSummary } from "@/features/properties/my-requests/invite-types";

const SUMMARY_LOOP_INTERVAL_S = 6.5;
const META_TEXT = "body-sm font-medium text-ink-muted";
const CHIP_SURFACE = "bg-surface";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

/** Most actionable line first — pending invites are what the broker owes. */
function buildSummaryLines(summary: InvitesSummary | null, isLoading: boolean): ReactNode[] {
    if (isLoading && !summary) return ["Getting your invites…"];
    if (!summary || summary.counts.all === 0) return ["No owner has invited you yet"];

    const lines: ReactNode[] = [];

    if (summary.waitingOnYouCount > 0) {
        lines.push(
            <>
                {countLabel(summary.waitingOnYouCount, "owner is", "owners are")} waiting on your
                answer
            </>,
        );
    }

    if (summary.counts.accepted > 0) {
        lines.push(<>You accepted {countLabel(summary.counts.accepted, "invite", "invites")}</>);
    }

    if (summary.counts.declined > 0) {
        lines.push(<>You turned down {countLabel(summary.counts.declined, "invite", "invites")}</>);
    }

    return lines.length > 0 ? lines : ["Every invite an owner has sent you"];
}

function StatChip({
    label,
    value,
    hint,
    tone = "default",
}: {
    label: string;
    value: string;
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

export function InvitesIntro({
    summary,
    isLoading,
}: {
    summary: InvitesSummary | null;
    isLoading: boolean;
}) {
    const lines = useMemo(() => buildSummaryLines(summary, isLoading), [summary, isLoading]);

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={META_TEXT}>So far</span>
                        {summary.waitingOnYouCount > 0 ? (
                            <StatChip
                                label="Waiting on you"
                                value={String(summary.waitingOnYouCount)}
                                tone="urgent"
                                hint="Owners waiting for you to say yes or no."
                            />
                        ) : null}
                        <StatChip
                            label="Accepted"
                            value={String(summary.counts.accepted)}
                            tone="success"
                            hint="Invites you took. You can sell these properties."
                        />
                        <StatChip
                            label="Turned down"
                            value={String(summary.counts.declined)}
                            hint="Invites you said no to."
                        />
                        <StatChip
                            label="Closed"
                            value={String(summary.counts.expired)}
                            hint="Invites that closed because you did not answer in time."
                        />
                    </div>
                ) : null}
            </div>
        </TooltipProvider>
    );
}
