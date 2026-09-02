"use client";

import { useState } from "react";
import Link from "next/link";

import { Mail, MapPin, Pencil, Phone, Search, UserRoundPlus } from "lucide-react";
import { motion } from "motion/react";

import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { DateDisplay } from "@/components/shared/date-display";
import { PhoneNumber } from "@/components/shared/phone-number";
import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    phoneDigits: string;
    email: string;
};

const CHIP_SURFACE = "bg-surface";
const ICON_CLASS = "block-3 inline-3";
const META_TEXT = "body-sm font-medium text-ink-muted";
const PROFILE_EDIT_HREF = "/broker/profile/edit";
const ADD_SERVICE_AREA_TOOLTIP =
    "Tell us where you work. We'll show you new properties in those areas.";
const SETUP_CHIP_TOOLTIP_CLASS = "block w-max max-w-66! text-pretty";
const ADD_SERVICE_AREA_CHIP = "border-border-warm bg-surface text-ink shadow-none";
const ACTIONABLE_CHIP_HOVER =
    "transition-colors duration-160 hover:border-ink/20 hover:bg-neutral-50 hover:text-ink";

function hasPhoneNumber(phoneDigits: string) {
    return phoneDigits.replace(/\D/g, "").slice(-10).length === 10;
}

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

    return (
        <>
            {areas.map((area) => (
                <Badge key={area} variant="outline" className={CHIP_SURFACE}>
                    {area}
                </Badge>
            ))}
            <ShortcutTooltip shortcutId="profile" label="Press to navigate">
                <Button
                    variant="link"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={PROFILE_EDIT_HREF} />}
                    aria-label="Edit profile"
                    className="
                      body-sm gap-1 p-0 font-medium text-ink-muted block-auto
                      hover:text-ink hover:underline
                    "
                >
                    <Pencil aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                    Edit profile
                </Button>
            </ShortcutTooltip>
        </>
    );
}

function ContactLine({ phoneDigits, email }: { phoneDigits: string; email: string }) {
    const showPhone = hasPhoneNumber(phoneDigits);

    if (!showPhone && !email) {
        return null;
    }

    return (
        <div className={`inline-flex items-center gap-2 ${META_TEXT}`}>
            {showPhone ? (
                <>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <span className="inline-flex items-center gap-1">
                                    <Phone aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                                    <PhoneNumber phoneDigits={phoneDigits} />
                                </span>
                            }
                        />
                        <TooltipContent side="bottom">Your phone number</TooltipContent>
                    </Tooltip>
                    {email ? (
                        <span aria-hidden className="text-ink-subtle">
                            ·
                        </span>
                    ) : null}
                </>
            ) : null}
            {email ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span className="inline-flex items-center gap-1">
                                <Mail aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                                <span className="truncate max-inline-[28ch]">{email}</span>
                            </span>
                        }
                    />
                    <TooltipContent side="bottom">Your email</TooltipContent>
                </Tooltip>
            ) : null}
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
    phoneDigits,
    email,
}: DashboardHeaderProps) {
    const showContact = hasPhoneNumber(phoneDigits) || Boolean(email);

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
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2"
            >
                <div className="-mbe-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <motion.div
                        className="flex flex-wrap items-center gap-2"
                        variants={dashboardMetaItem}
                    >
                        <ReraStatusChip status={reraStatus} />
                    </motion.div>

                    {showContact ? (
                        <motion.div variants={dashboardMetaItem}>
                            <ContactLine phoneDigits={phoneDigits} email={email} />
                        </motion.div>
                    ) : null}

                    {showContact ? (
                        <motion.span
                            aria-hidden
                            variants={dashboardMetaItem}
                            className="
                              hidden self-center bg-border-warm block-3.5 inline-px
                              sm:block
                            "
                        />
                    ) : null}

                    <motion.div
                        className="flex flex-wrap items-center gap-2"
                        variants={dashboardMetaItem}
                    >
                        <span className={`inline-flex items-center gap-1 ${META_TEXT}`}>
                            <MapPin aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                            Working in
                        </span>
                        <ServiceAreaChips areas={serviceAreas} />
                    </motion.div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <motion.div
                        className="ms-auto flex shrink-0 items-center gap-3"
                        variants={dashboardMetaItem}
                    >
                        <ShortcutTooltip shortcutId="owner_listings">
                            <Button
                                variant="outline-dark"
                                size="md"
                                nativeButton={false}
                                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
                                aria-label="Owner listings"
                            >
                                <Search aria-hidden strokeWidth={1.75} />
                                <span className="hidden md:inline">Owner listings</span>
                            </Button>
                        </ShortcutTooltip>
                        <ShortcutTooltip shortcutId="clients" label="Clients">
                            <Button
                                variant="accent"
                                size="md"
                                nativeButton={false}
                                render={<Link href="/broker/clients" />}
                                aria-label="Add client"
                            >
                                <UserRoundPlus aria-hidden strokeWidth={1.75} />
                                <span className="hidden md:inline">Add clients</span>
                            </Button>
                        </ShortcutTooltip>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
