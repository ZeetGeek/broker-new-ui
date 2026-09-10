"use client";

import { useState } from "react";
import Link from "next/link";

import { CalendarDays, ChevronDown, MapPin, Tag, UserRoundPlus } from "lucide-react";
import { motion } from "motion/react";

import {
    BROKER_OWNER_LISTINGS_HREF,
    BROKER_PIPELINE_HREF,
    BROKER_PROPERTIES_NEW_HREF,
    BROKER_REQUESTS_HREF,
} from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { DateDisplay } from "@/components/shared/date-display";
import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { DigitPopIn } from "./digit-pop-in";
import type { ReraStatus } from "./mock-data";
import { dashboardMetaContainer, dashboardMetaItem } from "./motion";
import { ReraStatusChip } from "./rera-status";
import { StaggerLine, StaggerReveal } from "./stagger-reveal";

export type DashboardSummaryStats = {
    siteVisitCount: number;
    requestsWaitingCount: number;
    pipelineActiveTotal: number;
    followUpsOverdueCount: number;
    followUpsRemainingCount: number;
    activityCount: number;
};

export type DashboardHeaderProps = DashboardSummaryStats & {
    now: Date;
    reraStatus: ReraStatus;
    serviceAreas: string[];
};

const ICON_CLASS = "block-3 inline-3";
const PROFILE_EDIT_HREF = "/broker/profile";
const ADD_SERVICE_AREA_TOOLTIP =
    "Tell us where you work. We'll show you new properties in those areas.";
const SETUP_CHIP_TOOLTIP_CLASS = "block w-max max-w-66! text-pretty";
const ADD_SERVICE_AREA_CHIP = "border-border-warm bg-surface text-ink shadow-none";
const ACTIONABLE_CHIP_HOVER = "transition-colors duration-160 hover:border-ink/20 hover:text-ink";

const SUMMARY_LOOP_INTERVAL_S = 6.5;

function countPhrase(count: number, singular: string, plural: string) {
    if (count === 0) {
        return null;
    }

    return (
        <>
            <DigitPopIn value={count} /> {count === 1 ? singular : plural}
        </>
    );
}

function buildSummaryLines({
    siteVisitCount,
    requestsWaitingCount,
    pipelineActiveTotal,
    followUpsOverdueCount,
    followUpsRemainingCount,
    activityCount,
}: DashboardSummaryStats) {
    const followUpCount = followUpsOverdueCount + followUpsRemainingCount;

    return [
        siteVisitCount === 0 ? (
            "Your calendar is clear today"
        ) : (
            <>You have {countPhrase(siteVisitCount, "site visit today", "site visits today")}</>
        ),
        requestsWaitingCount === 0 ? (
            "No owner replies waiting on you"
        ) : (
            <>
                {countPhrase(
                    requestsWaitingCount,
                    "owner hasn't replied yet",
                    "owners haven't replied yet",
                )}
            </>
        ),
        pipelineActiveTotal === 0 ? (
            "Add a client when a deal comes in"
        ) : (
            <>
                You&apos;re working{" "}
                {countPhrase(pipelineActiveTotal, "client right now", "clients right now")}
            </>
        ),
        followUpCount === 0 ? (
            <>You&apos;re all caught up on follow-ups</>
        ) : followUpsOverdueCount > 0 ? (
            <>
                {countPhrase(
                    followUpsOverdueCount,
                    "client waiting for your call",
                    "clients waiting for your call",
                )}
            </>
        ) : (
            <>
                {countPhrase(
                    followUpCount,
                    "follow-up coming up this week",
                    "follow-ups coming up this week",
                )}
            </>
        ),
        activityCount === 0 ? (
            "Updates will show here as things happen"
        ) : (
            <>
                {countPhrase(
                    activityCount,
                    "update since you last checked",
                    "updates since you last checked",
                )}
            </>
        ),
    ];
}

function DashboardGreetingSummary(stats: DashboardSummaryStats) {
    const [isPaused, setIsPaused] = useState(false);
    const lines = buildSummaryLines(stats);

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

function ServiceAreaChips({ areas }: { areas: string[] }) {
    const hasAreas = areas.length > 0;

    if (!hasAreas) {
        return (
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Link
                            href={PROFILE_EDIT_HREF}
                            aria-label="Add service area"
                            className={cn(
                                badgeVariants({ variant: "outline" }),
                                ADD_SERVICE_AREA_CHIP,
                                ACTIONABLE_CHIP_HOVER,
                                "outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                            )}
                        >
                            <MapPin aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                            Add service area
                        </Link>
                    }
                />
                <TooltipContent side="inline-end" className={SETUP_CHIP_TOOLTIP_CLASS}>
                    {ADD_SERVICE_AREA_TOOLTIP}
                </TooltipContent>
            </Tooltip>
        );
    }

    const [primaryArea, ...otherAreas] = areas;

    return (
        <>
            <Badge
                variant="neutral"
                className="border-border-warm bg-surface px-3 py-1.5 text-ink"
            >
                <MapPin aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                {primaryArea}
            </Badge>
            {otherAreas.length > 0 ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Badge
                                variant="outline"
                                tabIndex={0}
                                aria-label={`Other service areas: ${otherAreas.join(", ")}`}
                                className="
                                  bg-surface px-3 py-1.5 text-ink outline-none
                                  focus-visible:ring-2 focus-visible:ring-brand/35
                                "
                            >
                                +{otherAreas.length} {otherAreas.length === 1 ? "area" : "areas"}
                            </Badge>
                        }
                    />
                    <TooltipContent side="bottom">{otherAreas.join(", ")}</TooltipContent>
                </Tooltip>
            ) : null}
        </>
    );
}

type SnapshotItemProps = {
    href: string;
    label: string;
    value: React.ReactNode;
    urgent?: boolean;
};

function SnapshotItem({ href, label, value, urgent = false }: SnapshotItemProps) {
    return (
        <Link
            href={href}
            className="
              group inline-flex items-center gap-2 rounded-control outline-none
              focus-visible:ring-2 focus-visible:ring-canvas/60
            "
        >
            <span
                aria-hidden
                className={cn(
                    "shrink-0 rounded-full",
                    urgent
                        ? "bg-highlight ring-4 ring-highlight/20 block-3 inline-3"
                        : "bg-brand block-2 inline-2",
                )}
            />
            <span
                className="
                  body-sm font-medium text-canvas/70 transition-colors duration-160
                  group-hover:text-canvas
                "
            >
                {label}
            </span>
            <span aria-hidden className="body-sm text-canvas/35">
                ·
            </span>
            <span className={cn("body-sm font-semibold text-canvas", urgent && "text-urgent-mid")}>
                {value}
            </span>
        </Link>
    );
}

function BrokerSnapshot({
    requestsWaitingCount,
    pipelineActiveTotal,
    followUpsOverdueCount,
    followUpsRemainingCount,
}: Pick<
    DashboardSummaryStats,
    | "requestsWaitingCount"
    | "pipelineActiveTotal"
    | "followUpsOverdueCount"
    | "followUpsRemainingCount"
>) {
    const followUpValue =
        followUpsOverdueCount > 0
            ? `${followUpsOverdueCount} overdue`
            : followUpsRemainingCount > 0
              ? `${followUpsRemainingCount} this week`
              : "All caught up";

    return (
        <div className="overflow-x-auto rounded-control px-6 py-5 dashboard-status-rail md:px-8">
            <div className="flex items-center gap-4 min-inline-max md:min-inline-full">
                <SnapshotItem
                    href={BROKER_REQUESTS_HREF}
                    label="Owner replies"
                    value={
                        requestsWaitingCount > 0 ? `${requestsWaitingCount} pending` : "All clear"
                    }
                />
                <span
                    aria-hidden
                    className="rounded-full bg-brand/65 block-0.5 inline-20 md:flex-1"
                />
                <SnapshotItem
                    href={BROKER_PIPELINE_HREF}
                    label="Active clients"
                    value={pipelineActiveTotal > 0 ? pipelineActiveTotal : "Build pipeline"}
                />
                <span
                    aria-hidden
                    className="rounded-full bg-brand/45 block-0.5 inline-20 md:flex-1"
                />
                <SnapshotItem
                    href={BROKER_PIPELINE_HREF}
                    label="Follow-ups"
                    value={followUpValue}
                    urgent={followUpsOverdueCount > 0}
                />
            </div>
        </div>
    );
}

export function DashboardHeader({
    now,
    siteVisitCount,
    requestsWaitingCount,
    pipelineActiveTotal,
    followUpsOverdueCount,
    followUpsRemainingCount,
    activityCount,
    reraStatus,
    serviceAreas,
}: DashboardHeaderProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
                <StaggerReveal className="h1 min-inline-0">
                    <StaggerLine>
                        <DateDisplay date={now} variant="weekday" className="text-ink" />
                        <span className="text-ink">.</span>{" "}
                        <DashboardGreetingSummary
                            siteVisitCount={siteVisitCount}
                            requestsWaitingCount={requestsWaitingCount}
                            pipelineActiveTotal={pipelineActiveTotal}
                            followUpsOverdueCount={followUpsOverdueCount}
                            followUpsRemainingCount={followUpsRemainingCount}
                            activityCount={activityCount}
                        />
                    </StaggerLine>
                </StaggerReveal>
            </div>

            <motion.div
                variants={dashboardMetaContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <motion.div
                        className="flex flex-wrap items-center gap-2 min-inline-0"
                        variants={dashboardMetaItem}
                    >
                        <ServiceAreaChips areas={serviceAreas} />
                        <ReraStatusChip status={reraStatus} />
                    </motion.div>
                    <motion.div
                        className="flex shrink-0 items-center gap-2"
                        variants={dashboardMetaItem}
                    >
                        <ShortcutTooltip shortcutId="owner_listings">
                            <Button
                                variant="outline"
                                size="icon-lg"
                                nativeButton={false}
                                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
                                aria-label="Owner listings"
                                className="rounded-full bg-surface text-ink hover:bg-canvas"
                            >
                                <Tag aria-hidden strokeWidth={1.75} />
                            </Button>
                        </ShortcutTooltip>
                        <ShortcutTooltip shortcutId="visits" label="Site visits">
                            <Button
                                variant="outline"
                                size="icon-lg"
                                nativeButton={false}
                                render={<Link href="/broker/visits" />}
                                aria-label="Site visits"
                                className="rounded-full bg-surface text-ink hover:bg-canvas"
                            >
                                <CalendarDays aria-hidden strokeWidth={1.75} />
                            </Button>
                        </ShortcutTooltip>
                        <div className="flex overflow-hidden rounded-full bg-brand-ink text-canvas">
                            <ShortcutTooltip shortcutId="pipeline" label="Add buyer">
                                <Button
                                    variant="default"
                                    size="lg"
                                    nativeButton={false}
                                    render={<Link href={BROKER_PIPELINE_HREF} />}
                                    aria-label="Add buyer"
                                    className="rounded-none border-0 bg-transparent pe-4 text-canvas hover:bg-canvas/10"
                                >
                                    <UserRoundPlus aria-hidden strokeWidth={1.75} />
                                    <span>Add buyer</span>
                                </Button>
                            </ShortcutTooltip>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button
                                            variant="default"
                                            size="icon-lg"
                                            aria-label="More quick actions"
                                            className="rounded-none border-0 border-s border-canvas/15 bg-transparent text-canvas hover:bg-canvas/10"
                                        />
                                    }
                                >
                                    <ChevronDown aria-hidden strokeWidth={1.75} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={8}
                                    className="min-inline-52"
                                >
                                    <DropdownMenuItem render={<Link href={BROKER_PIPELINE_HREF} />}>
                                        <UserRoundPlus aria-hidden strokeWidth={1.75} />
                                        View pipeline
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        render={<Link href={BROKER_PROPERTIES_NEW_HREF} />}
                                    >
                                        <Tag aria-hidden strokeWidth={1.75} />
                                        Add your property
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </motion.div>
                </div>

                <motion.div variants={dashboardMetaItem}>
                    <BrokerSnapshot
                        requestsWaitingCount={requestsWaitingCount}
                        pipelineActiveTotal={pipelineActiveTotal}
                        followUpsOverdueCount={followUpsOverdueCount}
                        followUpsRemainingCount={followUpsRemainingCount}
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}
