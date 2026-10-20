"use client";

import { type ReactNode, useMemo, useState } from "react";

import { formatDateShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { Badge, type BadgeColor } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { InvitesSummary } from "@/features/properties/my-requests/invite-types";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";
import type { RequestsSummary } from "@/features/properties/my-requests/types";

const SUMMARY_LOOP_INTERVAL_S = 6.5;
const META_TEXT = "body-sm font-medium text-ink-muted";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

function buildSentLines(summary: RequestsSummary | null, isLoading: boolean): ReactNode[] {
    if (isLoading && !summary) return ["Getting your deals…"];
    if (!summary || summary.counts.all === 0) return ["You have not sent any requests yet"];

    const lines: ReactNode[] = [];

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

    return lines.length > 0 ? lines : ["No requests waiting for a reply"];
}

function buildInviteLines(summary: InvitesSummary | null, isLoading: boolean): ReactNode[] {
    if (isLoading && !summary) return ["Getting your invites…"];
    if (!summary || summary.counts.all === 0) return ["No owner has invited you yet"];

    if (summary.waitingOnYouCount > 0) {
        return [
            <>
                {countLabel(summary.waitingOnYouCount, "owner is", "owners are")} waiting on your
                answer
            </>,
        ];
    }

    return ["No invitations waiting for you"];
}

function buildAcceptedLines(
    sentSummary: RequestsSummary | null,
    inviteSummary: InvitesSummary | null,
    isLoading: boolean,
): ReactNode[] {
    if (isLoading && !sentSummary && !inviteSummary) return ["Getting your deals…"];

    const approved = sentSummary?.counts.approved ?? 0;
    const acceptedInvites = inviteSummary?.counts.accepted ?? 0;
    const total = approved + acceptedInvites;

    if (total === 0) return ["Nothing to represent yet"];

    const lines: ReactNode[] = [];

    if (approved > 0) {
        lines.push(<>{countLabel(approved, "request lets", "requests let")} you sell</>);
    }
    if (acceptedInvites > 0) {
        lines.push(<>{countLabel(acceptedInvites, "invite lets", "invites let")} you sell</>);
    }
    if (sentSummary && sentSummary.needsFollowUpCount > 0) {
        lines.push(
            <>
                {countLabel(
                    sentSummary.needsFollowUpCount,
                    "property still needs",
                    "properties still need",
                )}{" "}
                a buyer
            </>,
        );
    }

    return lines.length > 0 ? lines : ["Every property you can sell"];
}

function buildRejectedLines(
    sentSummary: RequestsSummary | null,
    inviteSummary: InvitesSummary | null,
    isLoading: boolean,
): ReactNode[] {
    if (isLoading && !sentSummary && !inviteSummary) return ["Getting your deals…"];

    const ownerRejected = sentSummary?.counts.declined ?? 0;
    const youTurnedDown = inviteSummary?.counts.declined ?? 0;
    const total = ownerRejected + youTurnedDown;

    if (total === 0) return ["No rejected deals"];

    const lines: ReactNode[] = [];

    if (ownerRejected > 0) {
        lines.push(
            <>{countLabel(ownerRejected, "request was", "requests were")} rejected by the owner</>,
        );
    }
    if (youTurnedDown > 0) {
        lines.push(<>You turned down {countLabel(youTurnedDown, "invite", "invites")}</>);
    }

    return lines;
}

function StatusBadge({
    label,
    count,
    hint,
    color,
}: {
    label: string;
    count: number;
    hint: string;
    color: BadgeColor;
}) {
    if (count <= 0) return null;

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Badge color={color} className="cursor-help">
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
                        color="orange"
                        hint="Owners waiting for you to say yes or no."
                    />
                </div>
            </div>
        );
    }

    if (activeTab === "accepted") {
        const approved = sentSummary?.counts.approved ?? 0;
        const acceptedInvites = inviteSummary?.counts.accepted ?? 0;
        if (approved + acceptedInvites === 0) return null;

        return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={META_TEXT}>Status</span>
                    <StatusBadge
                        label="From your requests"
                        count={approved}
                        color="emerald"
                        hint="Requests the owner accepted. You can sell these."
                    />
                    <StatusBadge
                        label="From invites"
                        count={acceptedInvites}
                        color="emerald"
                        hint="Invites you took. You can sell these properties."
                    />
                    <StatusBadge
                        label="Needs a buyer"
                        count={sentSummary?.needsFollowUpCount ?? 0}
                        color="orange"
                        hint="Properties you represent that still need a buyer."
                    />
                </div>
            </div>
        );
    }

    if (activeTab === "rejected") {
        const ownerRejected = sentSummary?.counts.declined ?? 0;
        const youTurnedDown = inviteSummary?.counts.declined ?? 0;
        if (ownerRejected + youTurnedDown === 0) return null;

        return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={META_TEXT}>Status</span>
                    <StatusBadge
                        label="Owner rejected"
                        count={ownerRejected}
                        color="red"
                        hint="Requests you sent that the owner turned down."
                    />
                    <StatusBadge
                        label="You turned down"
                        count={youTurnedDown}
                        color="red"
                        hint="Owner invites you said no to."
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
                    color="amber"
                    hint={
                        sentSummary.avgResponseDays > 0
                            ? `Requests the owner has not replied to yet. Owners usually reply in ${sentSummary.avgResponseDays} days.`
                            : "Requests the owner has not replied to yet."
                    }
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

    const lines = useMemo(() => {
        if (activeTab === "invites") return buildInviteLines(inviteSummary, isLoading);
        if (activeTab === "accepted")
            return buildAcceptedLines(sentSummary, inviteSummary, isLoading);
        if (activeTab === "rejected")
            return buildRejectedLines(sentSummary, inviteSummary, isLoading);
        return buildSentLines(sentSummary, isLoading);
    }, [activeTab, inviteSummary, isLoading, sentSummary]);

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
