import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";

import { EmptyStateAction } from "@/components/empty-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Inbox, Search } from "@/components/shared/icons";

/** No requests at all — point the broker at the pool, not at a filter. */
export function RequestsFirstRunEmpty() {
    return (
        <EmptyState
            icon={Inbox}
            heading="You have not sent any requests yet"
            description="Browse what owners have listed, then send a request for the ones your clients want."
        >
            <EmptyStateAction
                label="See owner properties"
                icon={Search}
                href={BROKER_OWNER_LISTINGS_HREF}
            />
        </EmptyState>
    );
}

/** Filters hid everything — the fix is clearing them, not leaving the page. */
export function RequestsFilteredEmpty({
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
                    ? `No results for "${searchQuery.trim()}". Try clearing a filter.`
                    : "Try another option above, or clear it to see every deal."
            }
        >
            {onClearFilters ? (
                <EmptyStateAction label="Clear filters" icon={Search} onClick={onClearFilters} />
            ) : null}
        </EmptyState>
    );
}

export function InvitesFirstRunEmpty() {
    return (
        <EmptyState
            icon={Inbox}
            heading="No invites yet"
            description="When an owner picks you to sell their property, their invite shows up here."
        />
    );
}
