"use client";

import { type ReactNode, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { OwnerRequestsSummary, OwnerRequestsTab } from "@/features/owner-requests/types";

const SUMMARY_LOOP_INTERVAL_S = 6.5;
const META_TEXT = "body-sm font-medium text-ink-muted";
const CHIP_SURFACE = "bg-surface";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

function buildLines(
    tab: OwnerRequestsTab,
    summary: OwnerRequestsSummary | null,
    isLoading: boolean,
): ReactNode[] {
    if (isLoading && !summary) return ["Getting your broker requests…"];

    if (!summary) {
        return ["Every broker request for your listings"];
    }

    const lines: ReactNode[] = [];

    if (tab === "requests") {
        if (summary.incomingPending > 0) {
            lines.push(
                <>
                    {countLabel(summary.incomingPending, "broker is", "brokers are")} waiting on
                    your answer
                </>,
            );
        } else {
            lines.push("No broker requests waiting right now");
        }
        return lines;
    }

    if (tab === "invitations") {
        if (summary.invitesPending > 0) {
            lines.push(
                <>
                    {countLabel(summary.invitesPending, "invite is", "invites are")} waiting for a
                    reply
                </>,
            );
        } else {
            lines.push("No open invitations right now");
        }
        return lines;
    }

    return ["Every broker request for your listings"];
}

function StatusBadge({
    label,
    count,
    hint,
    tone = "default",
}: {
    label: string;
    count: number;
    hint: string;
    tone?: "default" | "urgent" | "success";
}) {
    if (count <= 0) return null;

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
                        {label} · {count}
                    </Badge>
                }
            />
            <TooltipContent side="bottom">{hint}</TooltipContent>
        </Tooltip>
    );
}

function RequestsStatusMeta({ summary }: { summary: OwnerRequestsSummary | null }) {
    if (!summary) return null;
    if (summary.incomingPending <= 0 && summary.invitesPending <= 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className={META_TEXT}>Status</span>
                <StatusBadge
                    label="Waiting on you"
                    count={summary.incomingPending}
                    tone="urgent"
                    hint="Brokers waiting for you to say yes or no."
                />
                <StatusBadge
                    label="Sent invites"
                    count={summary.invitesPending}
                    hint="Invites you sent that brokers have not answered yet."
                />
            </div>
        </div>
    );
}

export function OwnerRequestsIntro({
    activeTab,
    summary,
    isLoading = false,
}: {
    activeTab: OwnerRequestsTab;
    summary: OwnerRequestsSummary | null;
    isLoading?: boolean;
}) {
    const [isPaused, setIsPaused] = useState(false);

    const lines = useMemo(
        () => buildLines(activeTab, summary, isLoading),
        [activeTab, isLoading, summary],
    );

    return (
        <TooltipProvider>
            <div className="flex flex-wrap items-center justify-between gap-3 text-start">
                <h1 className="h3 min-inline-0">
                    <span className="text-ink">Broker requests</span>
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

                <RequestsStatusMeta summary={summary} />
            </div>
        </TooltipProvider>
    );
}
