"use client";

import { useState } from "react";
import Link from "next/link";

import { CalendarDays, Inbox, Mail, MapPin, Pencil, Phone, Plus } from "lucide-react";
import { motion } from "motion/react";

import {
    OWNER_PROPERTIES_NEW_HREF,
    OWNER_PROFILE_HREF,
    OWNER_REQUESTS_HREF,
    OWNER_VISITS_HREF,
} from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { DateDisplay } from "@/components/shared/date-display";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { DigitPopIn } from "./digit-pop-in";
import { dashboardMetaContainer, dashboardMetaItem } from "./motion";
import { StaggerLine, StaggerReveal } from "./stagger-reveal";

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
const SUMMARY_LOOP_INTERVAL_S = 6.5;

function hasPhoneNumber(phoneDigits: string) {
    return phoneDigits.replace(/\D/g, "").slice(-10).length === 10;
}

function countPhrase(count: number, singular: string, plural: string) {
    if (count === 0) return null;
    return (
        <>
            <DigitPopIn value={count} /> {count === 1 ? singular : plural}
        </>
    );
}

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

function OwnerGreetingSummary(stats: OwnerDashboardSummaryStats) {
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

/** Mirrors the broker header's edit-profile link. */
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

function ContactLine({ phoneDigits, email }: { phoneDigits: string; email: string }) {
    const showPhone = hasPhoneNumber(phoneDigits);
    if (!showPhone && !email) return null;

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
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
                <StaggerReveal className="h1 min-inline-0">
                    <StaggerLine>
                        <DateDisplay date={now} variant="weekday" className="text-ink" />
                        <span className="text-ink">.</span>{" "}
                        <OwnerGreetingSummary
                            propertiesListed={propertiesListed}
                            activeBrokers={activeBrokers}
                            pendingRequests={pendingRequests}
                            visitsScheduled={visitsScheduled}
                            dealsClosed={dealsClosed}
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
                    {showContact ? (
                        <motion.div variants={dashboardMetaItem}>
                            <ContactLine phoneDigits={phoneDigits} email={email} />
                        </motion.div>
                    ) : null}

                    {showContact && city ? (
                        <motion.span
                            aria-hidden
                            variants={dashboardMetaItem}
                            className="
                              hidden self-center bg-border-warm block-3.5 inline-px
                              sm:block
                            "
                        />
                    ) : null}

                    {city ? (
                        <motion.div
                            className="flex flex-wrap items-center gap-2"
                            variants={dashboardMetaItem}
                        >
                            <span className={`inline-flex items-center gap-1 ${META_TEXT}`}>
                                <MapPin aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                                Based in
                            </span>
                            <Link
                                href={OWNER_PROFILE_HREF}
                                className={cn(
                                    "body-sm rounded-control border border-border-warm bg-surface px-2 py-0.5",
                                    "font-medium text-ink shadow-none",
                                    "transition-colors duration-160 hover:border-ink/20 hover:bg-neutral-50",
                                )}
                            >
                                {city}
                            </Link>
                            <EditProfileLink />
                        </motion.div>
                    ) : (
                        <motion.div variants={dashboardMetaItem}>
                            <Link
                                href={OWNER_PROFILE_HREF}
                                className={cn(
                                    "body-sm inline-flex items-center gap-1 rounded-control border",
                                    "border-border-warm bg-surface px-2 py-0.5 font-medium text-ink",
                                    "transition-colors duration-160 hover:border-ink/20 hover:bg-neutral-50",
                                )}
                            >
                                <MapPin aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                                Add your city
                            </Link>
                        </motion.div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <motion.div
                        className="ms-auto flex shrink-0 items-center gap-3"
                        variants={dashboardMetaItem}
                    >
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
                        {pendingRequests > 0 ? (
                            <Button
                                variant="outline-dark"
                                size="md"
                                nativeButton={false}
                                render={<Link href={OWNER_REQUESTS_HREF} />}
                                aria-label="Review requests"
                            >
                                <Inbox aria-hidden strokeWidth={1.75} />
                                <span className="hidden md:inline">Review requests</span>
                            </Button>
                        ) : null}
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
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

/** Compact metric strip used inside the overview card — matches broker RequestsCard. */
export function OwnerMetricCell({
    label,
    value,
    hint,
    valueClassName,
}: {
    label: string;
    value: number;
    hint: string;
    valueClassName?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        type="button"
                        aria-label={`${label}: ${value}. ${hint}`}
                        className="
                          flex flex-1 flex-col items-start gap-0.5 rounded-inner px-3 text-start
                          outline-none min-inline-0
                          focus-visible:ring-2 focus-visible:ring-ring
                        "
                    >
                        <span className="body-xs font-medium text-ink-muted">{label}</span>
                        <span
                            className={cn("tabular h5 font-semibold", valueClassName ?? "text-ink")}
                        >
                            <DigitPopIn value={value} />
                        </span>
                    </button>
                }
            />
            <TooltipContent side="bottom" align="center" className="text-pretty max-inline-64">
                {hint}
            </TooltipContent>
        </Tooltip>
    );
}
