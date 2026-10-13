import {
    BadgeCheck,
    Briefcase,
    Building2,
    CalendarDays,
    Handshake,
    Home,
    type LucideIcon,
    ShieldCheck,
    ShieldQuestion,
    Users,
} from "lucide-react";

import type { UserProfile } from "@/lib/api/profile";
import { formatDateShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

type Metric = {
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
    emphasize?: boolean;
};

type VerificationState = {
    label: string;
    hint: string;
    tone: "verified" | "pending" | "action";
    Icon: LucideIcon;
};

function resolveVerification(profile: UserProfile, isOwner: boolean): VerificationState {
    const isVerified = Boolean(
        isOwner
            ? (profile.owner?.verified ?? profile.verified)
            : (profile.broker?.verified ?? profile.verified),
    );
    const isEmailVerified = Boolean(profile.isEmailVerified);

    if (isVerified) {
        return {
            label: isOwner ? "Verified owner" : "Verified broker",
            hint: isOwner
                ? "Brokers see a verified badge on your listings."
                : "Owners see a verified badge on your requests.",
            tone: "verified",
            Icon: BadgeCheck,
        };
    }

    if (isEmailVerified) {
        return {
            label: "Awaiting review",
            hint: isOwner
                ? "We are checking your account details."
                : "We are checking your RERA number.",
            tone: "pending",
            Icon: ShieldQuestion,
        };
    }

    return {
        label: "Confirm your email",
        hint: "Check your inbox to finish signing up.",
        tone: "action",
        Icon: ShieldCheck,
    };
}

function countOrNone(value: number | undefined): { display: string; hasValue: boolean } {
    const n = value ?? 0;
    return { display: n > 0 ? String(n) : "None yet", hasValue: n > 0 };
}

function buildOwnerMetrics(profile: UserProfile): Metric[] {
    const properties = countOrNone(profile.stats?.propertiesListed);
    const brokers = countOrNone(profile.stats?.activeBrokers);
    const visits = countOrNone(profile.stats?.siteVisits);

    return [
        {
            label: "Properties listed",
            value: properties.display,
            hint: properties.hasValue
                ? "Listings on your account"
                : "Add your first property to get started",
            icon: Home,
            emphasize: properties.hasValue,
        },
        {
            label: "Active brokers",
            value: brokers.display,
            hint: brokers.hasValue
                ? "Accepted representation requests"
                : "Invite a broker from a listing",
            icon: Handshake,
            emphasize: brokers.hasValue,
        },
        {
            label: "Site visits",
            value: visits.display,
            hint: visits.hasValue ? "Across your properties" : "Visits will show here once booked",
            icon: CalendarDays,
            emphasize: visits.hasValue,
        },
    ];
}

function buildBrokerMetrics(profile: UserProfile): Metric[] {
    const dealsClosed = profile.broker?.dealsClosed ?? profile.stats?.dealsClosed ?? 0;
    const clientsServed = profile.clientsServed ?? 0;
    const avgDays = profile.broker?.avgDaysToClose ?? null;

    return [
        {
            label: "Deals closed",
            value: dealsClosed > 0 ? String(dealsClosed) : "None yet",
            hint: dealsClosed > 0 ? "Since you joined" : "Your first one will show here",
            icon: Briefcase,
            emphasize: dealsClosed > 0,
        },
        {
            label: "Clients",
            value: clientsServed > 0 ? String(clientsServed) : "None yet",
            hint:
                clientsServed > 0 ? "Buyers and tenants you have worked" : "Add one from Contacts",
            icon: Users,
            emphasize: clientsServed > 0,
        },
        {
            label: "Avg. time to close",
            value: avgDays === null ? "—" : `${avgDays} days`,
            hint: avgDays === null ? "Needs a closed deal first" : "Across your closed deals",
            icon: CalendarDays,
            emphasize: avgDays !== null,
        },
    ];
}

function memberSinceLabel(profile: UserProfile): string | null {
    if (!profile.memberSince) return null;
    const date = new Date(profile.memberSince);
    if (Number.isNaN(date.getTime())) return null;
    return `Joined ${formatDateShort(date)}`;
}

function StatsSkeleton() {
    return (
        <div
            className="
              animate-pulse overflow-hidden rounded-card border border-border-warm bg-surface
              shadow-sm block-72
            "
            aria-busy
            aria-hidden
        />
    );
}

/**
 * Account at a glance — one composed rail beside the profile form.
 *
 * Not four equal dashboard tiles (that reads as a second dashboard on a
 * settings page). Verification leads; metrics sit as dense rows underneath.
 */
export function ProfileStats({
    profile,
}: {
    profile: UserProfile | null;
    /** @deprecated Always renders as a single rail. Kept so call sites stay typed. */
    layout?: "row" | "stack";
}) {
    if (!profile) return <StatsSkeleton />;

    const isOwner = profile.profileType === "owner" || profile.role === "owner";
    const verification = resolveVerification(profile, isOwner);
    const metrics = isOwner ? buildOwnerMetrics(profile) : buildBrokerMetrics(profile);
    const joined = memberSinceLabel(profile);
    const VerificationIcon = verification.Icon;
    const HeaderIcon = isOwner ? Building2 : Briefcase;

    return (
        <aside
            className="
              overflow-hidden rounded-card border border-border-warm bg-surface shadow-sm
            "
            aria-label="Account at a glance"
        >
            <div
                className="
                  flex items-center justify-between gap-2 border-be border-border-warm/80 px-4
                  py-3
                "
            >
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <HeaderIcon
                        className="shrink-0 text-brand block-4 inline-4"
                        strokeWidth={1.75}
                        aria-hidden
                    />
                    At a glance
                </p>
                {joined ? (
                    <span className="body-xs text-ink-subtle tabular-nums">{joined}</span>
                ) : null}
            </div>

            {/* Verified is a worded badge, never colour alone — docs/DESIGN.md §1.4. */}
            <div
                className={cn(
                    "flex flex-col gap-2 px-4 py-4",
                    verification.tone === "verified" && "bg-brand-soft/50",
                    verification.tone === "pending" && "bg-urgent-soft/40",
                    verification.tone === "action" && "bg-urgent-soft/55",
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-inline-0">
                        <span
                            className={cn(
                                `
                                  mt-0.5 flex shrink-0 items-center justify-center rounded-control
                                  block-9 inline-9
                                `,
                                verification.tone === "verified"
                                    ? "bg-brand text-surface"
                                    : "bg-surface text-pending shadow-xs",
                            )}
                            aria-hidden
                        >
                            <VerificationIcon className="block-4 inline-4" strokeWidth={2} />
                        </span>
                        <div className="min-inline-0">
                            <p
                                className={cn(
                                    "text-sm font-semibold",
                                    verification.tone === "verified"
                                        ? "text-brand-text"
                                        : "text-pending",
                                )}
                            >
                                {verification.label}
                            </p>
                            <p
                                className={cn(
                                    "mbs-0.5 text-xs/5",
                                    verification.tone === "verified"
                                        ? "text-brand-text/75"
                                        : "text-ink-muted",
                                )}
                            >
                                {verification.hint}
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant={verification.tone === "verified" ? "brand" : "urgent"}
                        className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                    >
                        {verification.tone === "verified"
                            ? "Verified"
                            : verification.tone === "pending"
                              ? "In review"
                              : "Action"}
                    </Badge>
                </div>
            </div>

            <dl className="border-bs border-border-warm/80">
                {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                        <div
                            key={metric.label}
                            className={cn(
                                "flex items-start justify-between gap-3 px-4 py-3.5",
                                index < metrics.length - 1 && "border-be border-border-warm/70",
                            )}
                        >
                            <dt className="flex items-start gap-2.5 min-inline-0">
                                <span
                                    className="
                                      mt-0.5 flex shrink-0 items-center justify-center
                                      rounded-control bg-surface-muted text-ink-muted
                                      block-8 inline-8
                                    "
                                    aria-hidden
                                >
                                    <Icon className="block-3.5 inline-3.5" strokeWidth={1.75} />
                                </span>
                                <span className="flex flex-col gap-0.5 min-inline-0">
                                    <span className="text-sm font-medium text-ink">
                                        {metric.label}
                                    </span>
                                    <span className="text-xs/5 text-ink-subtle">{metric.hint}</span>
                                </span>
                            </dt>
                            <dd
                                className={cn(
                                    "shrink-0 text-end text-base font-semibold tabular-nums",
                                    metric.emphasize ? "text-brand" : "text-ink-muted",
                                )}
                            >
                                {metric.value}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </aside>
    );
}
