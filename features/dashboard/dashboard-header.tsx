"use client";

import Link from "next/link";

import { MapPin, Pencil, Search, UserRoundPlus } from "@/components/shared/icons";

import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";

import { DashboardContactLine, hasPhoneNumber } from "./dashboard-contact-line";
import {
    countPhrase,
    DashboardMetaDivider,
    DashboardMetaItem,
    DashboardPageHeader,
} from "./dashboard-page-header";
import type { ReraStatus } from "./mock-data";
import { ReraStatusChip } from "./rera-status";

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

const ICON_CLASS = "block-3 inline-3";
const META_TEXT = "body-sm font-medium text-ink-muted";
const PROFILE_EDIT_HREF = "/broker/profile";
const ADD_SERVICE_AREA_TOOLTIP =
    "Tell us where you work. We'll show you new properties in those areas.";
const SETUP_CHIP_TOOLTIP_CLASS = "block w-max max-w-66! text-pretty";
const ACTIONABLE_CHIP_HOVER = "transition-colors duration-160 hover:brightness-95";

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
        ...(FEATURE_PLATFORM_OWNER
            ? [
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
              ]
            : []),
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
                                badgeVariants({ color: "sky" }),
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
                <Badge key={area} color="sky">
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
        <DashboardPageHeader
            now={now}
            greetingLines={buildSummaryLines({
                siteVisitCount,
                requestsWaitingCount,
                pipelineActiveTotal,
                followUpsOverdueCount,
                followUpsRemainingCount,
                activityCount,
            })}
            meta={
                <>
                    <DashboardMetaItem>
                        <div className="flex flex-wrap items-center gap-2">
                            <ReraStatusChip status={reraStatus} />
                        </div>
                    </DashboardMetaItem>

                    {showContact ? (
                        <DashboardMetaItem>
                            <DashboardContactLine phoneDigits={phoneDigits} email={email} />
                        </DashboardMetaItem>
                    ) : null}

                    {showContact ? <DashboardMetaDivider /> : null}

                    <DashboardMetaItem>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 ${META_TEXT}`}>
                                <MapPin aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                                Working in
                            </span>
                            <ServiceAreaChips areas={serviceAreas} />
                        </div>
                    </DashboardMetaItem>
                </>
            }
            actions={
                <>
                    {FEATURE_PLATFORM_OWNER ? (
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
                    ) : null}
                    <ShortcutTooltip shortcutId="pipeline" label="Pipeline">
                        <Button
                            variant="accent"
                            size="md"
                            nativeButton={false}
                            render={<Link href="/broker/pipeline" />}
                            aria-label="Add buyer"
                        >
                            <UserRoundPlus aria-hidden strokeWidth={1.75} />
                            <span className="hidden md:inline">Add buyers</span>
                        </Button>
                    </ShortcutTooltip>
                </>
            }
        />
    );
}
