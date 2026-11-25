import { BROKER_ADD_DEAL_HREF } from "@/lib/routes/broker";

import { EmptyStateCard } from "@/components/shared/empty-state-card";
import {
    CircleCheck,
    CircleSlash,
    LayoutGrid,
    Link2,
    LostIcon,
    Search,
} from "@/components/shared/icons";

/** A deal starts by linking a buyer to a property in Contacts. */
export function PipelineFirstRunEmpty() {
    return (
        <EmptyStateCard
            icon={LayoutGrid}
            heading="No deals yet"
            description="Add a property to My Listings, then link a client to it from Clients. The deal will appear here automatically."
            action={{
                label: "Link a client to a property",
                icon: Link2,
                href: BROKER_ADD_DEAL_HREF,
            }}
        />
    );
}

/** Search or stage filter matched nothing. Offers escape, never "add your first". */
export function PipelineFilteredEmpty({ onClear }: { onClear: () => void }) {
    return (
        <EmptyStateCard
            variant="filtered"
            icon={Search}
            heading="No deals match"
            description="Try a different client, property or stage, or clear your search and filters."
            action={{ label: "Clear search & filters", icon: Search, onClick: onClear }}
        />
    );
}

/** Nothing has been sold or lost yet. Quiet — no button, nothing went wrong. */
export function PipelineDoneEmpty() {
    return (
        <EmptyStateCard
            icon={CircleSlash}
            heading="No active deals"
            description="Your finished and lost deals are saved in their tabs. Active deals appear here."
        />
    );
}

/** The Sold or Lost tab has nothing in it yet. Quiet — no button. */
export function PipelineOutcomeEmpty({ outcome }: { outcome: "sold" | "lost" }) {
    return outcome === "sold" ? (
        <EmptyStateCard
            icon={CircleCheck}
            heading="No finished deals yet"
            description="When you mark a deal as sold, it moves here."
        />
    ) : (
        <EmptyStateCard
            icon={LostIcon}
            heading="No lost deals"
            description="Deals you mark as lost move here, so the board only shows what you are still working on."
        />
    );
}
