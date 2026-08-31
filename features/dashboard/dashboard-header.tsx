"use client";

import Link from "next/link";

import { Mail, MapPin, Pencil, Phone, Search, UserRoundPlus } from "lucide-react";
import { motion } from "motion/react";

import { DateDisplay } from "@/components/shared/date-display";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { DigitPopIn } from "./digit-pop-in";
import type { ReraStatus } from "./mock-data";
import { dashboardMetaContainer, dashboardMetaItem } from "./motion";
import { ReraStatusChip } from "./rera-status";
import { StaggerLine, StaggerReveal } from "./stagger-reveal";

const CHIP_SURFACE = "bg-surface";
const ICON_CLASS = "block-3 inline-3";
const META_TEXT = "body-sm font-medium text-ink-muted";

export type DashboardHeaderProps = {
    now: Date;
    siteVisitCount: number;
    requestsWaitingCount: number;
    reraStatus: ReraStatus;
    serviceAreas: string[];
    phoneDigits: string;
    email: string;
};

function ServiceAreaChips({ areas }: { areas: string[] }) {
    const hasAreas = areas.length > 0;
    const actionLabel = hasAreas ? "Edit service areas" : "Add service areas";

    return (
        <>
            {hasAreas ? (
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
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            variant="link"
                            size="sm"
                            nativeButton={false}
                            render={<Link href="/broker/profile/edit" />}
                            aria-label={actionLabel}
                            className="
                              body-sm gap-1 p-0 font-medium text-ink-muted block-auto
                              hover:text-ink hover:underline
                            "
                        >
                            <Pencil aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                            {hasAreas ? "Edit" : "Add"}
                        </Button>
                    }
                />
                <TooltipContent side="right" align="center">
                    {actionLabel}
                </TooltipContent>
            </Tooltip>
        </>
    );
}

function ContactLine({ phoneDigits, email }: { phoneDigits: string; email: string }) {
    const phoneHref = `tel:+91${phoneDigits.replace(/\D/g, "").slice(-10)}`;
    const linkClass = `
      body-sm gap-1 p-0 font-medium text-ink-muted block-auto
      hover:text-ink hover:underline
    `;

    return (
        <div className={`inline-flex items-center gap-2 ${META_TEXT}`}>
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
            <span aria-hidden className="text-ink-subtle">
                ·
            </span>
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
    const visitWord = siteVisitCount === 1 ? "site visit" : "site visits";
    const requestWord = requestsWaitingCount === 1 ? "request" : "requests";

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
                <StaggerReveal className="h1 min-inline-0">
                    <StaggerLine>
                        <DateDisplay date={now} variant="weekday" className="text-ink" />
                        <span className="text-ink">.</span>{" "}
                        <span className="text-ink-muted">
                            <DigitPopIn value={siteVisitCount} /> {visitWord},{" "}
                            <DigitPopIn value={requestsWaitingCount} /> {requestWord} waiting.
                        </span>
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

                <motion.div variants={dashboardMetaItem}>
                    <ContactLine phoneDigits={phoneDigits} email={email} />
                </motion.div>

                <motion.span
                    aria-hidden
                    variants={dashboardMetaItem}
                    className="hidden self-center bg-border-warm block-3.5 inline-px sm:block"
                />

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
