import Link from "next/link";

import { BROKER_ADD_DEAL_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { CircleCheck, CircleSlash, LayoutGrid, LostIcon, Search } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

/** A deal starts by linking a buyer to a property in Contacts. */
export function PipelineFirstRunEmpty() {
    return (
        <EmptyState
            icon={LayoutGrid}
            heading="No deals yet"
            description="Add a property to My Listings, then link a client to it from Clients. The deal will appear here automatically."
            size="page"
        >
            <Button
                size="md"
                variant="accent"
                nativeButton={false}
                render={<Link href={BROKER_ADD_DEAL_HREF} />}
            >
                Link a client to a property
            </Button>
        </EmptyState>
    );
}

/** Search or stage filter matched nothing. Offers escape, never "add your first". */
export function PipelineFilteredEmpty({ onClear }: { onClear: () => void }) {
    return (
        <EmptyState
            size="page"
            variant="filtered"
            icon={Search}
            heading="No deals match"
            description="Try a different client, property or stage, or clear your search and filters."
        >
            <Button variant="accent" size="sm" onClick={onClear}>
                Clear search & filters
            </Button>
        </EmptyState>
    );
}

/** Nothing has been sold or lost yet. Quiet — no button, nothing went wrong. */
export function PipelineDoneEmpty() {
    return (
        <EmptyState
            icon={CircleSlash}
            heading="No active deals"
            description="Your finished and lost deals are saved in their tabs. Active deals appear here."
            size="page"
        />
    );
}

/** The Sold or Lost tab has nothing in it yet. Quiet — no button. */
export function PipelineOutcomeEmpty({ outcome }: { outcome: "sold" | "lost" }) {
    return outcome === "sold" ? (
        <EmptyState
            icon={CircleCheck}
            heading="No finished deals yet"
            description="When you mark a deal as sold, it moves here."
            size="page"
        />
    ) : (
        <EmptyState
            icon={LostIcon}
            heading="No lost deals"
            description="Deals you mark as lost move here, so the board only shows what you are still working on."
            size="page"
        />
    );
}
