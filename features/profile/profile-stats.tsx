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
function VerificationTile({ profile }: { profile: UserProfile }) {
    const isVerified = Boolean(profile.broker?.verified ?? profile.verified);
    const isEmailVerified = Boolean(profile.isEmailVerified);

    // Two different things can be unverified, and they need different next
    // steps, so the tile says which one is outstanding rather than a flat "No".
    const state = isVerified
        ? { label: "Verified broker", hint: "Owners see a verified badge on your requests." }
        : isEmailVerified
          ? { label: "Awaiting review", hint: "We are checking your RERA number." }
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

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy aria-hidden>
            {Array.from({ length: 4 }, (_, index) => (
                <div
                    key={index}
                    className="
                      animate-pulse rounded-card border border-border-warm bg-surface p-4 block-24
                    "
                />
            ))}
        </div>
    );
}

/**
 * The account at a glance.
 *
 * Deliberately not the stat set from the reference mock: this product has no
 * "leads" table and no login-streak concept, so those tiles could only ever
 * render zero. These four come from fields the API actually returns.
 */
export function ProfileStats({ profile }: { profile: UserProfile | null }) {
    if (!profile) return <StatsSkeleton />;

    const dealsClosed = profile.broker?.dealsClosed ?? 0;
    const clientsServed = profile.clientsServed ?? 0;
    const avgDays = profile.broker?.avgDaysToClose ?? null;

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <VerificationTile profile={profile} />

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
