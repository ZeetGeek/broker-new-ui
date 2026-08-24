import Link from "next/link";

import { Compass, Flame, Pencil, UserRoundPlus } from "lucide-react";

import { DateDisplay } from "@/components/shared/date-display";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ReraStatus } from "./mock-data";
import { ReraStatusChip } from "./rera-status";

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
                    <Badge key={area} variant="outline">
                        {area}
                    </Badge>
                ))
            ) : (
                <Badge variant="outline">No service areas</Badge>
            )}
            <Link
                href="/broker/profile/edit"
                aria-label={areas.length > 0 ? "Edit service areas" : "Add service areas"}
                className="
                  body-sm inline-flex items-center gap-1.5 rounded-control px-2 font-semibold
                  text-ink-muted outline-none block-12
                  hover:text-ink
                  focus-visible:ring-3 focus-visible:ring-ring/30
                "
            >
                <Pencil aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                {areas.length > 0 ? "Edit" : "Add"}
            </Link>
        </>
    );
}

function ProfileMetaChips({
    reraStatus,
    activityStreakDays,
    phoneDigits,
    email,
}: {
    reraStatus: ReraStatus;
    activityStreakDays: number;
    phoneDigits: string;
    email: string;
}) {
    const streakLabel = `${activityStreakDays}-day streak`;

    return (
        <div className="flex flex-wrap items-center gap-2 min-inline-0">
            <ReraStatusChip status={reraStatus} />
            {activityStreakDays > 0 ? (
                <Badge variant="outline">
                    <Flame aria-hidden strokeWidth={2} />
                    {streakLabel}
                </Badge>
            ) : null}
            <Badge variant="outline">
                <PhoneNumber phoneDigits={phoneDigits} />
            </Badge>
            <Badge variant="outline" className="truncate max-inline-[28ch]">
                {email}
            </Badge>
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

                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        variant="outline-dark"
                        size="lg"
                        nativeButton={false}
                        render={<Link href="/broker/properties" />}
                        aria-label="Browse properties"
                    >
                        <Compass aria-hidden strokeWidth={1.75} />
                        <span className="hidden md:inline">Browse</span>
                    </Button>
                    <Button
                        variant="default"
                        size="lg"
                        nativeButton={false}
                        render={<Link href="/broker/clients" />}
                        aria-label="Add client"
                    >
                        <UserRoundPlus aria-hidden strokeWidth={1.75} />
                        <span className="hidden md:inline">Add client</span>
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <ProfileMetaChips
                    reraStatus={reraStatus}
                    activityStreakDays={activityStreakDays}
                    phoneDigits={phoneDigits}
                    email={email}
                />

                <ServiceAreaChips areas={serviceAreas} />
            </div>
        </div>
    );
}
