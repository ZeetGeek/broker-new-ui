"use client";

import Link from "next/link";

import { CalendarDays, MapPin, Pencil, Plus } from "lucide-react";

import {
    OWNER_PROFILE_HREF,
    OWNER_PROPERTIES_NEW_HREF,
    OWNER_VISITS_HREF,
} from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { DashboardContactLine, hasPhoneNumber } from "./dashboard-contact-line";
import {
    countPhrase,
    DashboardMetaDivider,
    DashboardMetaItem,
    DashboardPageHeader,
} from "./dashboard-page-header";

export type OwnerDashboardSummaryStats = {
    propertiesListed: number;
    activeBrokers: number;
    pendingRequests: number;
    visitsScheduled: number;
    dealsClosed: number;
};

export type OwnerDashboardHeaderProps = OwnerDashboardSummaryStats & {
    now: Date;
    phoneDigits: string;
    email: string;
    city: string | null;
};

const ICON_CLASS = "block-3 inline-3";
const META_TEXT = "body-sm font-medium text-ink-muted";
const ACTIONABLE_CHIP_HOVER = "transition-colors duration-160 hover:brightness-95";

function buildSummaryLines({
    propertiesListed,
    activeBrokers,
    pendingRequests,
    visitsScheduled,
    dealsClosed,
}: OwnerDashboardSummaryStats) {
    return [
        propertiesListed === 0 ? (
            "Add your first property to get started"
        ) : (
            <>You have {countPhrase(propertiesListed, "property listed", "properties listed")}</>
        ),
        pendingRequests === 0 ? (
            "No broker requests waiting on you"
        ) : (
            <>
                {countPhrase(
                    pendingRequests,
                    "broker request needs a reply",
                    "broker requests need a reply",
                )}
            </>
        ),
        visitsScheduled === 0 ? (
            "No site visits scheduled yet"
        ) : (
            <>
                {countPhrase(
                    visitsScheduled,
                    "visit coming up on your listings",
                    "visits coming up on your listings",
                )}
            </>
        ),
        dealsClosed === 0 ? (
            activeBrokers === 0 ? (
                "No brokers representing you yet"
            ) : (
                <>
                    {countPhrase(
                        activeBrokers,
                        "broker is representing you",
                        "brokers are representing you",
                    )}
                </>
            )
        ) : (
            <>{countPhrase(dealsClosed, "property deal closed", "property deals closed")}</>
        ),
    ];
}

function EditProfileLink() {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button
                        variant="link"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={OWNER_PROFILE_HREF} />}
                        aria-label="Edit profile"
                        className="
                          body-sm gap-1 p-0 font-medium text-ink-muted block-auto
                          hover:text-ink hover:underline
                        "
                    >
                        <Pencil aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        Edit profile
                    </Button>
                }
            />
            <TooltipContent side="bottom" className="text-pretty max-inline-64">
                Update your name, city, and contact details.
            </TooltipContent>
        </Tooltip>
    );
}

function CityChips({ city }: { city: string | null }) {
    if (!city) {
        return (
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Link
                            href={OWNER_PROFILE_HREF}
                            aria-label="Add your city"
                            className={cn(
                                badgeVariants({ color: "sky" }),
                                ACTIONABLE_CHIP_HOVER,
                                "outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                            )}
                        >
                            <MapPin aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                            Add your city
                        </Link>
                    }
                />
                <TooltipContent side="inline-end" className="text-pretty max-inline-64">
                    Tell us where your properties are so brokers nearby can find you.
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <>
            <Badge color="sky">{city}</Badge>
            <EditProfileLink />
        </>
    );
}

export function OwnerDashboardHeader({
    now,
    propertiesListed,
    activeBrokers,
    pendingRequests,
    visitsScheduled,
    dealsClosed,
    phoneDigits,
    email,
    city,
}: OwnerDashboardHeaderProps) {
    const showContact = hasPhoneNumber(phoneDigits) || Boolean(email);

    return (
        <DashboardPageHeader
            now={now}
            greetingLines={buildSummaryLines({
                propertiesListed,
                activeBrokers,
                pendingRequests,
                visitsScheduled,
                dealsClosed,
            })}
            meta={
                <>
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
                                Based in
                            </span>
                            <CityChips city={city} />
                        </div>
                    </DashboardMetaItem>
                </>
            }
            actions={
                <>
                    <ShortcutTooltip shortcutId="visits">
                        <Button
                            variant="outline-dark"
                            size="md"
                            nativeButton={false}
                            render={<Link href={OWNER_VISITS_HREF} />}
                            aria-label="Manage visits"
                        >
                            <CalendarDays aria-hidden strokeWidth={1.75} />
                            <span className="hidden md:inline">Manage visits</span>
                        </Button>
                    </ShortcutTooltip>
                    <ShortcutTooltip shortcutId="add_property">
                        <Button
                            variant="accent"
                            size="md"
                            nativeButton={false}
                            render={<Link href={OWNER_PROPERTIES_NEW_HREF} />}
                            aria-label="Add property"
                        >
                            <Plus aria-hidden strokeWidth={1.75} />
                            <span className="hidden md:inline">Add property</span>
                        </Button>
                    </ShortcutTooltip>
                </>
            }
        />
    );
}
