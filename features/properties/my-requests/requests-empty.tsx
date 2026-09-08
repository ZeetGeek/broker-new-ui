import Link from "next/link";

import { Inbox, SearchX } from "lucide-react";

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
            <Button render={<Link href="/broker/owner-listings" />}>See owner properties</Button>
        </EmptyState>
    );
}

/** Filters hid everything — the fix is clearing them, not leaving the page. */
export function RequestsFilteredEmpty({ onClearFilters }: { onClearFilters?: () => void }) {
    return (
        <EmptyState
            icon={SearchX}
            heading="Nothing matches what you picked"
            description="Try another option above, or clear it to see every request you have sent."
        >
            {onClearFilters ? (
                <Button variant="outline" className="border-border-warm" onClick={onClearFilters}>
                    Clear filters
                </Button>
            ) : null}
        </EmptyState>
    );
}
