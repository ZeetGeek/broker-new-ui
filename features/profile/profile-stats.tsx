import { BadgeCheck, ShieldCheck, ShieldQuestion } from "lucide-react";

import type { UserProfile } from "@/lib/api/profile";
import { cn } from "@/lib/utils";

/**
 * One fact about the account, as a tile.
 *
 * Stats only — nothing here is editable. Everything on this row is decided by
 * what the broker has actually done or by what the platform has verified, so
 * showing it beside the form would invite the reader to try to change it.
 */
function StatTile({
    label,
    value,
    hint,
    tone = "default",
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: "default" | "brand" | "pending";
}) {
    return (
        <div className="flex flex-col gap-1 rounded-card border border-border-warm bg-surface p-4">
            <span className="eyebrow">{label}</span>
            <span
                className={cn(
                    "h4 tabular",
                    tone === "brand" && "text-brand",
                    tone === "pending" && "text-pending",
                    tone === "default" && "text-ink",
                )}
            >
                {value}
            </span>
            {hint ? <span className="body-xs text-ink-subtle">{hint}</span> : null}
        </div>
    );
}

/** Verified is a badge with a word in it, never a bare colour. docs/DESIGN.md §1.4. */
function VerificationTile({ profile, isOwner }: { profile: UserProfile; isOwner: boolean }) {
    const isVerified = Boolean(
        isOwner
            ? (profile.owner?.verified ?? profile.verified)
            : (profile.broker?.verified ?? profile.verified),
    );
    const isEmailVerified = Boolean(profile.isEmailVerified);

    const state = isVerified
        ? {
              label: isOwner ? "Verified owner" : "Verified broker",
              hint: isOwner
                  ? "Brokers see a verified badge on your listings."
                  : "Owners see a verified badge on your requests.",
          }
        : isEmailVerified
          ? {
                label: "Awaiting review",
                hint: isOwner
                    ? "We are checking your account details."
                    : "We are checking your RERA number.",
            }
          : { label: "Confirm your email", hint: "Check your inbox to finish signing up." };

    const Icon = isVerified ? BadgeCheck : isEmailVerified ? ShieldQuestion : ShieldCheck;

    return (
        <div className="flex flex-col gap-1 rounded-card border border-border-warm bg-surface p-4">
            <span className="eyebrow">Verification</span>
            <span
                className={cn(
                    "body-lg flex items-center gap-1.5 font-semibold",
                    isVerified ? "text-brand" : "text-pending",
                )}
            >
                <Icon aria-hidden className="block-4 inline-4" strokeWidth={2} />
                {state.label}
            </span>
            <span className="body-xs text-ink-subtle">{state.hint}</span>
        </div>
    );
}

function countOrNone(value: number | undefined): { display: string; hasValue: boolean } {
    const n = value ?? 0;
    return { display: n > 0 ? String(n) : "None yet", hasValue: n > 0 };
}

/**
 * The account at a glance.
 *
 * Broker tiles: deals, clients, avg close time.
 * Owner tiles: properties listed, active brokers, site visits — from `stats`.
 */
export function ProfileStats({ profile }: { profile: UserProfile | null }) {
    if (!profile) return null;

    const isOwner = profile.profileType === "owner" || profile.role === "owner";

    if (isOwner) {
        const properties = countOrNone(profile.stats?.propertiesListed);
        const brokers = countOrNone(profile.stats?.activeBrokers);
        const visits = countOrNone(profile.stats?.siteVisits);

        return (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <VerificationTile profile={profile} isOwner />

                <StatTile
                    label="Properties listed"
                    value={properties.display}
                    hint={
                        properties.hasValue
                            ? "Listings on your account"
                            : "Add your first property to get started"
                    }
                    tone={properties.hasValue ? "brand" : "default"}
                />

                <StatTile
                    label="Active brokers"
                    value={brokers.display}
                    hint={
                        brokers.hasValue
                            ? "Accepted representation requests"
                            : "Invite a broker from a listing"
                    }
                />

                <StatTile
                    label="Site visits"
                    value={visits.display}
                    hint={
                        visits.hasValue
                            ? "Across your properties"
                            : "Visits will show here once booked"
                    }
                />
            </div>
        );
    }

    const dealsClosed = profile.broker?.dealsClosed ?? profile.stats?.dealsClosed ?? 0;
    const clientsServed = profile.clientsServed ?? 0;
    const avgDays = profile.broker?.avgDaysToClose ?? null;

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <VerificationTile profile={profile} isOwner={false} />

            <StatTile
                label="Deals closed"
                // Never a bare standalone zero — docs/EMPTY_STATES.md.
                value={dealsClosed > 0 ? String(dealsClosed) : "None yet"}
                hint={dealsClosed > 0 ? "Since you joined" : "Your first one will show here"}
                tone={dealsClosed > 0 ? "brand" : "default"}
            />

            <StatTile
                label="Clients"
                value={clientsServed > 0 ? String(clientsServed) : "None yet"}
                hint={
                    clientsServed > 0
                        ? "Buyers and tenants you have worked"
                        : "Add one from Contacts"
                }
            />

            <StatTile
                label="Average time to close"
                value={avgDays === null ? "—" : `${avgDays} days`}
                hint={avgDays === null ? "Needs a closed deal first" : "Across your closed deals"}
            />
        </div>
    );
}
