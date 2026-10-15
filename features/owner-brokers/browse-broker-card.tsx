"use client";

import type { ReactNode } from "react";

import { BadgeCheck, MapPin, Send } from "lucide-react";

import type { BrokerProfile } from "@/lib/api/representative";
import { cn } from "@/lib/utils";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { brokerDisplayName } from "@/features/owner-brokers/browse-brokers-filters";

const MAX_TAGS = 2;

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

function brokerHeroMetric(broker: BrokerProfile): string {
    if (broker.experienceYears && broker.experienceYears > 0) {
        return `${broker.experienceYears}+ yrs experience`;
    }
    if (broker.dealsClosed != null && broker.dealsClosed > 0) {
        return `${broker.dealsClosed} deals closed`;
    }
    if (broker.orgName?.trim()) return broker.orgName.trim();
    return "Experience not listed";
}

/** Inset metric strip — kept for profile dialog reuse. */
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

export function BrowseBrokerCard({
    broker,
    onViewProfile,
    onInvite,
}: {
    broker: BrokerProfile;
    onViewProfile: (broker: BrokerProfile) => void;
    onInvite: (broker: BrokerProfile) => void;
}) {
    const name = brokerDisplayName(broker);
    const location = brokerLocationLine(broker);
    const open = () => onViewProfile(broker);

    return (
        <article
            role="button"
            tabIndex={0}
            aria-label={`Open ${name}`}
            onClick={open}
            onKeyDown={(event) => {
                if (event.key === "Enter") open();
            }}
            className={cn(
                `
                  contact-card group/card relative flex h-full cursor-pointer flex-col gap-3
                  rounded-card border border-border-warm bg-surface p-4 outline-none shadow-md
                  transition-[box-shadow] duration-160 hover:shadow-lg
                  focus-visible:ring-3 focus-visible:ring-brand/20
                `,
            )}
        >
            <div className="flex items-start gap-3 min-inline-0">
                <UserAvatar
                    name={name}
                    imageUrl={broker.avatarUrl ?? undefined}
                    size="md"
                    fallback="shape"
                    className="shrink-0"
                />
                <div className="min-inline-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="body truncate font-bold capitalize text-ink">{name}</h2>
                        {broker.verified ? (
                            <span className="body-xs inline-flex shrink-0 items-center gap-0.5 rounded-md bg-brand-soft px-1.5 py-0.5 font-semibold text-brand-text">
                                <BadgeCheck
                                    aria-hidden
                                    className="block-3 inline-3"
                                    strokeWidth={2}
                                />
                                Verified
                            </span>
                        ) : null}
                    </div>
                    {broker.orgName && broker.orgName.trim() !== name ? (
                        <p className="body-sm mbs-0.5 truncate text-ink-muted">{broker.orgName}</p>
                    ) : broker.city ? (
                        <p className="body-sm mbs-0.5 truncate text-ink-muted">{broker.city}</p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                <p className="h5 truncate font-semibold tabular text-brand">
                    {brokerHeroMetric(broker)}
                </p>
                {location ? (
                    <p className="body-sm flex items-center gap-1.5 truncate text-ink-muted">
                        <MapPin
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        <span className="truncate">{location}</span>
                    </p>
                ) : (
                    <p className="body-sm flex items-center gap-1.5 text-ink-subtle">
                        <MapPin
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        Areas not listed
                    </p>
                )}
                <BrokerSpecialtyTags specializations={broker.specializations} />
            </div>

            <footer
                className="mt-auto grid grid-cols-2 gap-2"
                onClick={(event) => event.stopPropagation()}
            >
                <Button
                    size="md"
                    variant="outline"
                    type="button"
                    className="inline-full"
                    onClick={() => onViewProfile(broker)}
                >
                    View profile
                </Button>
                <Button
                    size="md"
                    variant="accent"
                    type="button"
                    className="inline-full"
                    onClick={() => onInvite(broker)}
                >
                    <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Invite
                </Button>
            </footer>
        </article>
    );
}
