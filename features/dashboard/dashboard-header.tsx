import Link from "next/link";

import { Compass, Flame, Mail, MapPin, Pencil, Phone, UserRoundPlus } from "lucide-react";

import { DateDisplay } from "@/components/shared/date-display";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import type { ReraStatus } from "./mock-data";
import { ReraStatusChip } from "./rera-status";

const CHIP_SURFACE = "bg-surface";
const ICON_CLASS = "block-3 inline-3";
const META_TEXT = "body-sm font-medium text-ink-muted";

export type DashboardHeaderProps = {
    now: Date;
    siteVisitCount: number;
    requestsWaitingCount: number;
    reraStatus: ReraStatus;
    serviceAreas: string[];
    activityStreakDays: number;
    phoneDigits: string;
    email: string;
};

function ServiceAreaChips({ areas }: { areas: string[] }) {
    return (
        <>
            {areas.length > 0 ? (
                areas.map((area) => (
                    <Badge key={area} variant="outline" className={CHIP_SURFACE}>
                        {area}
                    </Badge>
                ))
            ) : (
                <Badge variant="outline" className={CHIP_SURFACE}>
                    No service areas
                </Badge>
            )}
            <Button
                variant="link"
                size="sm"
                nativeButton={false}
                render={<Link href="/broker/profile/edit" />}
                aria-label={areas.length > 0 ? "Edit service areas" : "Add service areas"}
                className="body-sm gap-1 p-0 font-medium text-ink-muted block-auto hover:text-ink"
            >
                <Pencil aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                {areas.length > 0 ? "Edit" : "Add"}
            </Button>
        </>
    );
}

function ContactLine({ phoneDigits, email }: { phoneDigits: string; email: string }) {
    const phoneHref = `tel:+91${phoneDigits.replace(/\D/g, "").slice(-10)}`;
    const linkClass = `
      inline-flex items-center gap-1 ${META_TEXT} outline-none
      hover:text-ink
      focus-visible:ring-3 focus-visible:ring-ring/30
    `;

    return (
        <div className={`inline-flex items-center gap-2 ${META_TEXT}`}>
            <a href={phoneHref} className={linkClass}>
                <Phone aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                <PhoneNumber phoneDigits={phoneDigits} />
            </a>
            <span aria-hidden className="text-ink-subtle">
                ·
            </span>
            <a href={`mailto:${email}`} className={linkClass}>
                <Mail aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                <span className="truncate max-inline-[28ch]">{email}</span>
            </a>
        </div>
    );
}

export function DashboardHeader({
    now,
    siteVisitCount,
    requestsWaitingCount,
    reraStatus,
    serviceAreas,
    activityStreakDays,
    phoneDigits,
    email,
}: DashboardHeaderProps) {
    const visitWord = siteVisitCount === 1 ? "site visit" : "site visits";
    const requestWord = requestsWaitingCount === 1 ? "request" : "requests";

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
                <h1 className="h1 min-inline-0">
                    <DateDisplay date={now} variant="weekday" className="text-ink" />
                    <span className="text-ink">.</span>{" "}
                    <span className="text-ink-muted">
                        {siteVisitCount} {visitWord}, {requestsWaitingCount} {requestWord} waiting.
                    </span>
                </h1>

                <TooltipProvider>
                    <div className="flex shrink-0 items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="outline-dark"
                                        size="lg"
                                        nativeButton={false}
                                        render={<Link href="/broker/properties" />}
                                        aria-label="Browse properties"
                                    />
                                }
                            >
                                <Compass aria-hidden strokeWidth={1.75} />
                                <span className="hidden md:inline">Browse</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Browse properties</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="default"
                                        size="lg"
                                        nativeButton={false}
                                        render={<Link href="/broker/clients" />}
                                        aria-label="Add client"
                                    />
                                }
                            >
                                <UserRoundPlus aria-hidden strokeWidth={1.75} />
                                <span className="hidden md:inline">Add client</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Add client</TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <ReraStatusChip status={reraStatus} />
                    {activityStreakDays > 0 ? (
                        <Badge variant="outline" className={CHIP_SURFACE}>
                            <Flame aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                            {`${activityStreakDays}-day streak`}
                        </Badge>
                    ) : null}
                </div>

                <ContactLine phoneDigits={phoneDigits} email={email} />

                <span
                    aria-hidden
                    className="hidden self-center bg-border-warm sm:block block-3.5 inline-px"
                />

                <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 ${META_TEXT}`}>
                        <MapPin aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        Working in
                    </span>
                    <ServiceAreaChips areas={serviceAreas} />
                </div>
            </div>
        </div>
    );
}
