import Link from "next/link";

import { Inbox } from "lucide-react";

import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/** No requests at all — point the broker at the pool, not at a filter. */
export function RequestsFirstRunEmpty() {
    return (
        <EmptyState
            icon={Inbox}
            heading="You have not sent any requests yet"
            description="Browse what owners have listed, then send a request for the ones your buyers want."
        >
            <Button
                size="lg"
                nativeButton={false}
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
            >
                See owner properties
            </Button>
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
        <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="h6 text-ink">Nothing matches what you picked</p>
            <p className="body-sm max-w-prose text-ink-muted">
                {searchQuery?.trim()
                    ? `No results for "${searchQuery.trim()}". Try clearing a filter.`
                    : "Try another option above, or clear it to see every deal."}
            </p>
            {onClearFilters ? (
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="body-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                    Clear filters
                </button>
            ) : null}
        </div>
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
