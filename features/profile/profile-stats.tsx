import { BadgeCheck, Eye, ShieldCheck, ShieldQuestion } from "@/components/shared/icons";

import type { UserProfile } from "@/lib/api/profile";
import { formatDateShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

type Metric = {
    label: string;
    value: string;
    hint: string;
    emphasize: boolean;
};

type VerificationState = {
    label: string;
    hint: string;
    tone: "verified" | "pending" | "action";
    Icon: typeof BadgeCheck;
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

function buildMetrics(
    profile: UserProfile,
    isOwner: boolean,
): {
    primary: Metric;
    secondary: [Metric, Metric];
} {
    if (isOwner) {
        const properties = countOrNone(profile.stats?.propertiesListed);
        const brokers = countOrNone(profile.stats?.activeBrokers);
        const visits = countOrNone(profile.stats?.siteVisits);

        return {
            primary: {
                label: "Properties listed",
                value: properties.display,
                hint: properties.hasValue
                    ? "Listings on your account"
                    : "Add your first property to get started",
                emphasize: properties.hasValue,
            },
            secondary: [
                {
                    label: "Active brokers",
                    value: brokers.display,
                    hint: brokers.hasValue ? "Accepted representation" : "Invite from a listing",
                    emphasize: brokers.hasValue,
                },
                {
                    label: "Site visits",
                    value: visits.display,
                    hint: visits.hasValue ? "Across your properties" : "Once visits are booked",
                    emphasize: visits.hasValue,
                },
            ],
        };
    }

    const dealsClosed = profile.broker?.dealsClosed ?? profile.stats?.dealsClosed ?? 0;
    const clientsServed = profile.clientsServed ?? 0;
    const avgDays = profile.broker?.avgDaysToClose ?? null;

    return {
        primary: {
            label: "Deals closed",
            value: dealsClosed > 0 ? String(dealsClosed) : "None yet",
            hint: dealsClosed > 0 ? "Since you joined" : "Your first one will show here",
            emphasize: dealsClosed > 0,
        },
        secondary: [
            {
                label: "Clients",
                value: clientsServed > 0 ? String(clientsServed) : "None yet",
                hint: clientsServed > 0 ? "Buyers and tenants" : "Add one from Contacts",
                emphasize: clientsServed > 0,
            },
            {
                label: "Avg. close",
                value: avgDays === null ? "—" : `${avgDays}d`,
                hint: avgDays === null ? "Needs a closed deal" : "Across closed deals",
                emphasize: avgDays !== null,
            },
        ],
    };
}

function memberSinceLabel(profile: UserProfile): string | null {
    if (!profile.memberSince) return null;
    const date = new Date(profile.memberSince);
    if (Number.isNaN(date.getTime())) return null;
    return `Joined ${formatDateShort(date)}`;
}

function StatsSkeleton() {
    return (
        <div className="flex flex-col gap-3" aria-busy aria-hidden>
            <div
                className="
                  animate-pulse overflow-hidden rounded-card border border-border-warm bg-surface
                  block-56
                "
            />
            <div
                className="
                  animate-pulse rounded-card border border-dashed border-brand/20 bg-brand-soft/20
                  block-24
                "
            />
        </div>
    );
}

/**
 * Account at a glance — listing-form preview rail language.
 *
 * One preview card (primary metric + muted strip) and a dashed verification
 * note underneath. Same padding and borders as LiveSummaryPanel.
 */
export function ProfileStats({
    profile,
}: {
    profile: UserProfile | null;
    /** @deprecated Always renders as the listing-style rail. */
    layout?: "row" | "stack";
}) {
    if (!profile) return <StatsSkeleton />;

    const isOwner = profile.profileType === "owner" || profile.role === "owner";
    const verification = resolveVerification(profile, isOwner);
    const { primary, secondary } = buildMetrics(profile, isOwner);
    const joined = memberSinceLabel(profile);
    const VerificationIcon = verification.Icon;

    return (
        <aside className="flex flex-col gap-3" aria-label="Account at a glance">
            <article className="overflow-hidden rounded-card border border-border-warm bg-surface">
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        <Eye className="text-brand block-4 inline-4" aria-hidden />
                        At a glance
                    </p>
                    {joined ? <Badge color="sky">{joined}</Badge> : null}
                </div>

                <div className="flex flex-col gap-2 p-3.5">
                    <p
                        className={cn(
                            "tabular text-xl font-bold tracking-[-0.02em]",
                            primary.emphasize ? "text-brand" : "text-ink-muted",
                        )}
                    >
                        {primary.value}
                    </p>
                    <p className="text-sm/5 font-semibold text-ink">{primary.label}</p>
                    <p className="text-xs text-ink-muted">{primary.hint}</p>

                    <div
                        className="
                          mts-1 grid grid-cols-2 gap-2 rounded-control bg-surface-muted p-2.5
                        "
                    >
                        {secondary.map((metric) => (
                            <div key={metric.label} className="text-center min-inline-0">
                                <p
                                    className={cn(
                                        "tabular truncate text-sm font-semibold",
                                        metric.emphasize ? "text-ink" : "text-ink-muted",
                                    )}
                                >
                                    {metric.value}
                                </p>
                                <p
                                    className="
                                  mts-0.5 truncate text-[11px] font-medium text-ink-muted
                                "
                                >
                                    {metric.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </article>

            {/* Same dashed note pattern as Live deal summary on the listing form. */}
            <div
                className={cn(
                    "rounded-card border border-dashed px-3.5 py-4",
                    verification.tone === "verified"
                        ? "border-brand/30 bg-brand-soft/30"
                        : "border-pending/35 bg-urgent-soft/45",
                )}
            >
                <div className="flex items-start gap-2.5">
                    <VerificationIcon
                        className={cn(
                            "mts-0.5 shrink-0 block-4 inline-4",
                            verification.tone === "verified" ? "text-brand" : "text-pending",
                        )}
                        strokeWidth={2}
                        aria-hidden
                    />
                    <div className="min-inline-0">
                        <p className="text-sm font-semibold text-ink">{verification.label}</p>
                        <p className="mbs-1 text-sm/5 text-ink-muted">{verification.hint}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
