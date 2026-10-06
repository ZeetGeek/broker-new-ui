"use client";

import type { ReactNode } from "react";

import { BadgeCheck, Building2, MapPin, Send } from "lucide-react";

import type { BrokerProfile } from "@/lib/api/representative";
import { cn } from "@/lib/utils";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { brokerDisplayName } from "@/features/owner-brokers/browse-brokers-filters";
import type { OwnerRequestsView } from "@/features/owner-requests/use-owner-requests-view";

const MAX_TAGS = 3;

export function brokerLocationLine(broker: BrokerProfile): string {
    const areas = broker.serviceAreas?.filter(Boolean) ?? [];
    const shown = areas.slice(0, 2).join(", ");
    const more = areas.length > 2 ? ` +${areas.length - 2}` : "";
    return [shown ? `${shown}${more}` : null, broker.city].filter(Boolean).join(" · ");
}

export function formatExperience(years: number | null | undefined): string {
    if (!years || years <= 0) return "—";
    return `${years} ${years === 1 ? "yr" : "yrs"}`;
}

/** Inset metric strip (DESIGN §4.6) — label above, tabular value below. */
export function BrokerMetricStrip({
    broker,
    className,
}: {
    broker: BrokerProfile;
    className?: string;
}) {
    const metrics: { label: string; value: ReactNode }[] = [
        { label: "Experience", value: formatExperience(broker.experienceYears) },
        { label: "Deals closed", value: broker.dealsClosed ?? "—" },
        {
            label: "Avg. to close",
            value: broker.avgDaysToClose ? `${broker.avgDaysToClose} days` : "—",
        },
    ];

    return (
        <dl
            className={cn(
                "grid grid-cols-3 divide-x divide-border-warm rounded-inner bg-surface-muted py-2.5",
                className,
            )}
        >
            {metrics.map((metric) => (
                <div key={metric.label} className="flex flex-col gap-1 px-3 min-inline-0">
                    <dt className="truncate text-[11px] leading-tight text-ink-subtle">
                        {metric.label}
                    </dt>
                    <dd className="body-sm truncate font-semibold text-ink tabular-nums">
                        {metric.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

export function BrokerSpecialtyTags({
    specializations,
    max = MAX_TAGS,
}: {
    specializations: string[] | undefined;
    max?: number;
}) {
    const tags = (specializations ?? []).map((s) => s.trim()).filter(Boolean);
    if (tags.length === 0) return null;
    const shown = tags.slice(0, max);
    const rest = tags.length - shown.length;

    return (
        <ul className="flex flex-wrap gap-1.5" aria-label="Specializations">
            {shown.map((tag) => (
                <li key={tag}>
                    <Badge variant="outline" className="font-medium">
                        {tag}
                    </Badge>
                </li>
            ))}
            {rest > 0 ? (
                <li>
                    <Badge variant="outline" className="font-medium tabular-nums">
                        +{rest}
                    </Badge>
                </li>
            ) : null}
        </ul>
    );
}

function BrokerIdentity({ broker }: { broker: BrokerProfile }) {
    const name = brokerDisplayName(broker);
    const location = brokerLocationLine(broker);

    return (
        <div className="flex items-start gap-3 min-inline-0">
            <UserAvatar
                name={name}
                imageUrl={broker.avatarUrl ?? undefined}
                size="lg"
                className="shrink-0"
            />
            <div className="flex flex-1 flex-col gap-1 min-inline-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-inline-0">
                    <h3 className="body truncate font-semibold tracking-wide text-ink capitalize">
                        {name}
                    </h3>
                    {broker.verified ? (
                        <Badge variant="brand" className="shrink-0">
                            <BadgeCheck aria-hidden />
                            Verified
                        </Badge>
                    ) : null}
                </div>
                {broker.orgName && broker.orgName.trim() !== name ? (
                    <p className="body-sm flex items-center gap-1.5 text-ink-muted min-inline-0">
                        <Building2
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        <span className="truncate">{broker.orgName}</span>
                        {broker.isAgency && broker.agencyStaffCount ? (
                            <span className="shrink-0 text-ink-subtle tabular-nums">
                                · {broker.agencyStaffCount} brokers
                            </span>
                        ) : null}
                    </p>
                ) : null}
                {location ? (
                    <p className="body-sm flex items-center gap-1.5 text-ink-muted min-inline-0">
                        <MapPin
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        <span className="truncate">{location}</span>
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function BrokerActions({
    broker,
    onViewProfile,
    onInvite,
    className,
}: {
    broker: BrokerProfile;
    onViewProfile: (broker: BrokerProfile) => void;
    onInvite: (broker: BrokerProfile) => void;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                size="md"
                variant="surface"
                className="flex-1"
                onClick={() => onViewProfile(broker)}
            >
                View profile
            </Button>
            <Button size="md" className="flex-1" onClick={() => onInvite(broker)}>
                <Send aria-hidden strokeWidth={1.75} />
                Invite
            </Button>
        </div>
    );
}

export function BrowseBrokerCard({
    broker,
    view,
    onViewProfile,
    onInvite,
}: {
    broker: BrokerProfile;
    view: OwnerRequestsView;
    onViewProfile: (broker: BrokerProfile) => void;
    onInvite: (broker: BrokerProfile) => void;
}) {
    const shell = `
      rounded-card border border-border-warm bg-surface p-4 shadow-sm
      transition-[box-shadow,border-color] duration-160
      hover:border-ink/15 hover:shadow-md
      md:p-5
    `;

    if (view === "list") {
        return (
            <article
                className={cn(shell, "flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6")}
            >
                <div className="flex flex-col gap-3 min-inline-0 lg:flex-1">
                    <BrokerIdentity broker={broker} />
                    <BrokerSpecialtyTags specializations={broker.specializations} max={4} />
                </div>
                <BrokerMetricStrip broker={broker} className="lg:shrink-0 lg:inline-80" />
                <BrokerActions
                    broker={broker}
                    onViewProfile={onViewProfile}
                    onInvite={onInvite}
                    className="lg:shrink-0 lg:inline-64"
                />
            </article>
        );
    }

    return (
        <article className={cn(shell, "flex flex-col gap-4 block-full")}>
            <BrokerIdentity broker={broker} />
            <BrokerMetricStrip broker={broker} />
            <div className="flex-1">
                <BrokerSpecialtyTags specializations={broker.specializations} />
            </div>
            <BrokerActions broker={broker} onViewProfile={onViewProfile} onInvite={onInvite} />
        </article>
    );
}
