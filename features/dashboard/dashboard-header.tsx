"use client";

import Link from "next/link";

import { Mail, MapPin, Pencil, Phone, Search, UserRoundPlus } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

import { DateDisplay } from "@/components/shared/date-display";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { DigitPopIn } from "./digit-pop-in";
import type { ReraStatus } from "./mock-data";
import { dashboardMetaContainer, dashboardMetaItem } from "./motion";
import { ReraStatusChip } from "./rera-status";
import { StaggerLine, StaggerReveal } from "./stagger-reveal";

export type DashboardHeaderProps = {
    now: Date;
    siteVisitCount: number;
    requestsWaitingCount: number;
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

function DashboardGreetingSummary({
    siteVisitCount,
    requestsWaitingCount,
}: {
    siteVisitCount: number;
    requestsWaitingCount: number;
}) {
    if (siteVisitCount === 0 && requestsWaitingCount === 0) {
        return <span className="text-ink-muted">No visits booked. No requests waiting.</span>;
    }

    const visitPart =
        siteVisitCount === 0 ? (
            "No visits booked"
        ) : (
            <>
                <DigitPopIn value={siteVisitCount} />{" "}
                {siteVisitCount === 1 ? "site visit" : "site visits"}
            </>
        );

    const requestPart =
        requestsWaitingCount === 0 ? (
            "No requests waiting"
        ) : (
            <>
                <DigitPopIn value={requestsWaitingCount} />{" "}
                {requestsWaitingCount === 1 ? "request" : "requests"} waiting
            </>
        );

    return (
        <span className="text-ink-muted">
            {visitPart}. {requestPart}.
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
        </>
    );
}

function ContactLine({ phoneDigits, email }: { phoneDigits: string; email: string }) {
    const showPhone = hasPhoneNumber(phoneDigits);
    const phoneHref = `tel:+91${phoneDigits.replace(/\D/g, "").slice(-10)}`;
    const linkClass = `
      body-sm gap-1 p-0 font-medium text-ink-muted block-auto
      hover:text-ink hover:underline
    `;

    if (!showPhone && !email) {
        return null;
    }

    return (
        <div className={`inline-flex items-center gap-2 ${META_TEXT}`}>
            {showPhone ? (
                <>
                    <Button
                        variant="link"
                        size="sm"
                        nativeButton={false}
                        render={<a href={phoneHref} />}
                        className={linkClass}
                    >
                        <Phone aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                        <PhoneNumber phoneDigits={phoneDigits} />
                    </Button>
                    {email ? (
                        <span aria-hidden className="text-ink-subtle">
                            ·
                        </span>
                    ) : null}
                </>
            ) : null}
            {email ? (
                <Button
                    variant="link"
                    size="sm"
                    nativeButton={false}
                    render={<a href={`mailto:${email}`} />}
                    className={linkClass}
                >
                    <Mail aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                    <span className="truncate max-inline-[28ch]">{email}</span>
                </Button>
            ) : null}
        </div>
    );
}

export function DashboardHeader({
    now,
    siteVisitCount,
    requestsWaitingCount,
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
                        />
                    </StaggerLine>
                </StaggerReveal>
            </div>

            <motion.div
                className="flex flex-wrap items-center gap-x-3 gap-y-2"
                variants={dashboardMetaContainer}
                initial="hidden"
                animate="visible"
            >
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
                        className="hidden self-center bg-border-warm block-3.5 inline-px sm:block"
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

                <motion.div
                    className="ms-auto flex shrink-0 items-center gap-3"
                    variants={dashboardMetaItem}
                >
                    <Button
                        variant="outline-dark"
                        size="md"
                        nativeButton={false}
                        render={<Link href="/broker/properties" />}
                        aria-label="Browse properties"
                    >
                        <Search aria-hidden strokeWidth={1.75} />
                        <span className="hidden md:inline">Browse properties</span>
                    </Button>
                    <Button
                        variant="default"
                        size="md"
                        nativeButton={false}
                        render={<Link href="/broker/clients" />}
                        aria-label="Add client"
                    >
                        <UserRoundPlus aria-hidden strokeWidth={1.75} />
                        <span className="hidden md:inline">Add client</span>
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
