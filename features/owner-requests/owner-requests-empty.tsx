import { ownerBrokersHref } from "@/lib/routes/owner";

import { EmptyStateAction } from "@/components/empty-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Inbox, Mail, Search } from "@/components/shared/icons";

import type { OwnerRequestsTab } from "@/features/owner-requests/types";

export function OwnerRequestsEmpty({ tab }: { tab: OwnerRequestsTab }) {
    if (tab === "requests") {
        return (
            <EmptyState
                icon={Inbox}
                heading="No pending requests"
                description="When a broker asks to sell your property, it shows up here."
            >
                <EmptyStateAction label="Browse brokers" icon={Search} href={ownerBrokersHref()} />
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
                <EmptyStateAction label="Browse brokers" icon={Search} href={ownerBrokersHref()} />
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
                <EmptyStateAction label="Browse brokers" icon={Search} href={ownerBrokersHref()} />
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
        <EmptyState
            size="card"
            icon={Search}
            heading="Nothing matches what you picked"
            variant="filtered"
            description={
                searchQuery?.trim()
                    ? `No results for "${searchQuery.trim()}". Try clearing the search.`
                    : "Try another option above, or clear it to see every request."
            }
        >
            {onClearFilters ? (
                <EmptyStateAction label="Clear search" icon={Search} onClick={onClearFilters} />
            ) : null}
        </EmptyState>
    );
}
