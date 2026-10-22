import Link from "next/link";

import { Inbox, Mail } from "@/components/shared/icons";

import { ownerBrokersHref } from "@/lib/routes/owner";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

import type { OwnerRequestsTab } from "@/features/owner-requests/types";

export function OwnerRequestsEmpty({ tab }: { tab: OwnerRequestsTab }) {
    if (tab === "requests") {
        return (
            <EmptyState
                icon={Inbox}
                heading="No pending requests"
                description="When a broker asks to sell your property, it shows up here."
            >
                <Button
                    size="lg"
                    variant="accent"
                    nativeButton={false}
                    render={<Link href={ownerBrokersHref()} />}
                >
                    Browse brokers
                </Button>
            </EmptyState>
        );
    }

    if (tab === "invitations") {
        return (
            <EmptyState
                icon={Mail}
                heading="No open invitations"
                description="Invite a broker from Browse when you want someone specific on a listing."
            >
                <Button
                    size="lg"
                    variant="accent"
                    nativeButton={false}
                    render={<Link href={ownerBrokersHref()} />}
                >
                    Browse brokers
                </Button>
            </EmptyState>
        );
    }

    if (tab === "accepted") {
        return (
            <EmptyState
                icon={Inbox}
                heading="No broker is selling your listings yet"
                description="When you accept a broker's request, or a broker accepts your invite, they show up here."
            >
                <Button
                    size="lg"
                    variant="accent"
                    nativeButton={false}
                    render={<Link href={ownerBrokersHref()} />}
                >
                    Browse brokers
                </Button>
            </EmptyState>
        );
    }

    if (tab === "rejected") {
        return (
            <EmptyState
                icon={Inbox}
                heading="Nothing was turned down"
                description="Requests you said no to, and invites a broker turned down, show up here."
            />
        );
    }

    if (tab === "cancelled") {
        return (
            <EmptyState
                icon={Inbox}
                heading="No cancelled representations"
                description="When you remove a broker, or a broker stops selling your property, it shows up here with the reason."
            />
        );
    }

    return null;
}

export function OwnerRequestsFilteredEmpty({
    onClearFilters,
    searchQuery,
}: {
    onClearFilters?: () => void;
    searchQuery?: string;
}) {
    return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="h6 text-ink">Nothing matches what you picked</p>
            <p className="body-sm max-w-prose text-ink-muted">
                {searchQuery?.trim()
                    ? `No results for "${searchQuery.trim()}". Try clearing the search.`
                    : "Try another option above, or clear it to see every request."}
            </p>
            {onClearFilters ? (
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="body-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                    Clear search
                </button>
            ) : null}
        </div>
    );
}
