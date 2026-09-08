import Link from "next/link";

import { CircleSlash, Search, Users } from "lucide-react";

import { BROKER_DEALS_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/**
 * First run. An invitation, not an apology — see docs/EMPTY_STATES.md. The
 * action points at Deals because that is genuinely where a deal starts: a
 * buyer can only be added to a property whose owner already approved you.
 * Sending the broker straight to "add a buyer" would be a CTA they cannot
 * complete yet.
 */
export function PipelineFirstRunEmpty() {
    return (
        <EmptyState
            icon={Users}
            heading="No deals yet"
            description="A deal starts when you add a buyer to a property you represent. Open one an owner accepted and add the buyer there."
            className="py-16"
        >
            <Button size="lg" nativeButton={false} render={<Link href={BROKER_DEALS_HREF} />}>
                Go to your deals
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
