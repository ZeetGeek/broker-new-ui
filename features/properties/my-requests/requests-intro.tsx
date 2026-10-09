"use client";

import { type ReactNode, useMemo, useState } from "react";

import { formatDateShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { InvitesSummary } from "@/features/properties/my-requests/invite-types";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";
import type { RequestsSummary } from "@/features/properties/my-requests/types";

const SUMMARY_LOOP_INTERVAL_S = 6.5;
const META_TEXT = "body-sm font-medium text-ink-muted";
const CHIP_SURFACE = "bg-surface";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

function buildSentLines(summary: RequestsSummary | null, isLoading: boolean): ReactNode[] {
    if (isLoading && !summary) return ["Getting your deals…"];
    if (!summary || summary.counts.all === 0) return ["You have not sent any requests yet"];

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

function buildInviteLines(summary: InvitesSummary | null, isLoading: boolean): ReactNode[] {
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

function DealsStatusMeta({
    activeTab,
    sentSummary,
    inviteSummary,
}: {
    activeTab: RequestsTab;
    sentSummary: RequestsSummary | null;
    inviteSummary: InvitesSummary | null;
}) {
    if (activeTab === "invites") {
        if (!inviteSummary || inviteSummary.counts.all === 0) return null;

        return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={META_TEXT}>Status</span>
                    <StatusBadge
                        label="Waiting on you"
                        count={inviteSummary.waitingOnYouCount}
                        tone="urgent"
                        hint="Owners waiting for you to say yes or no."
                    />
                    <StatusBadge
                        label="Accepted"
                        count={inviteSummary.counts.accepted}
                        tone="success"
                        hint="Invites you took. You can sell these properties."
                    />
                    <StatusBadge
                        label="Turned down"
                        count={inviteSummary.counts.declined}
                        hint="Invites you said no to."
                    />
                </div>
            </div>
        );
    }

    if (!sentSummary || sentSummary.counts.all === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className={META_TEXT}>Status</span>
                <StatusBadge
                    label="Waiting"
                    count={sentSummary.counts.pending}
                    hint={
                        sentSummary.avgResponseDays > 0
                            ? `Requests the owner has not replied to yet. Owners usually reply in ${sentSummary.avgResponseDays} days.`
                            : "Requests the owner has not replied to yet."
                    }
                />
                <StatusBadge
                    label="Accepted"
                    count={sentSummary.counts.approved}
                    tone="success"
                    hint={`Requests the owner accepted. You can sell these. Of the requests owners replied to, ${sentSummary.approvalRate}% were accepted.`}
                />
                <StatusBadge
                    label="Needs a buyer"
                    count={sentSummary.needsFollowUpCount}
                    tone="urgent"
                    hint="Accepted requests where you have not added a buyer yet."
                />
            </div>

            <Tooltip>
                <TooltipTrigger
                    render={
                        <span className={cn(META_TEXT, "cursor-help whitespace-nowrap")}>
                            {sentSummary.quota.remaining} of {sentSummary.quota.limit} left
                        </span>
                    }
                />
                <TooltipContent side="bottom">
                    You can send {sentSummary.quota.limit} requests a week. This resets on{" "}
                    {formatDateShort(new Date(sentSummary.quota.resetsOn))}.
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export function MyDealsIntro({
    activeTab,
    sentSummary,
    inviteSummary,
    isLoading = false,
}: {
    activeTab: RequestsTab;
    sentSummary: RequestsSummary | null;
    inviteSummary: InvitesSummary | null;
    isLoading?: boolean;
}) {
    const [isPaused, setIsPaused] = useState(false);
    const isInvites = activeTab === "invites";

    const lines = useMemo(
        () =>
            isInvites
                ? buildInviteLines(inviteSummary, isLoading)
                : buildSentLines(sentSummary, isLoading),
        [inviteSummary, isInvites, isLoading, sentSummary],
    );

    return (
        <TooltipProvider>
            <div className="flex flex-wrap items-center justify-between gap-3 text-start">
                <h1 className="h3 min-inline-0">
                    <span className="text-ink">My deals</span>
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

                <DealsStatusMeta
                    activeTab={activeTab}
                    sentSummary={sentSummary}
                    inviteSummary={inviteSummary}
                />
            </div>
        </TooltipProvider>
    );
}
