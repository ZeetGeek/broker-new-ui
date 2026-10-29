import Link from "next/link";

import { CircleSlash, Search, Users } from "@/components/shared/icons";

import { BROKER_ADD_DEAL_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/** A deal starts by linking a buyer to a property in Contacts. */
export function PipelineFirstRunEmpty() {
    return (
        <EmptyState
            icon={Users}
            heading="No deals yet"
            description="Add a property to Your listings, then link a buyer to it from Contacts. The deal will appear here automatically."
            className="py-16"
        >
            <Button size="lg" nativeButton={false} render={<Link href={BROKER_ADD_DEAL_HREF} />}>
                Link a buyer to a property
            </Button>
        </EmptyState>
    );
}

/** Search or stage filter matched nothing. Offers escape, never "add your first". */
export function PipelineFilteredEmpty({ onClear }: { onClear: () => void }) {
    return (
        <EmptyState
            icon={Search}
            heading="No deals match"
            description="Try a different name, area or owner."
            className="py-16"
        >
            <Button variant="secondary" size="sm" onClick={onClear}>
                Clear the search
            </Button>
        </EmptyState>
    );
}

/** Nothing has been sold or lost yet. Quiet — no button, nothing went wrong. */
export function PipelineDoneEmpty() {
    return (
        <EmptyState
            icon={CircleSlash}
            heading="Nothing finished yet"
            description="Deals you mark as sold or lost move here, so the board only shows what you are still working on."
            className="py-16"
        />
    );
}
