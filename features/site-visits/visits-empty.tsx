import Link from "next/link";

import { CalendarCheck, CalendarPlus, CircleCheck, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

import type { VisitViewer } from "@/features/site-visits/types";

const SCHEDULE_HREF = "/broker/visits/new";
const BROWSE_HREF = "/broker/owner-listings";

/**
 * First run. An invitation, not an apology — docs/EMPTY_STATES.md.
 *
 * The two sides get different copy and different actions because they have
 * genuinely different next steps. A broker can go and propose a time. An owner
 * cannot — visits arrive when a broker has a buyer, so offering them a
 * "Schedule visit" button would be a CTA they cannot complete (rule 6).
 */
export function VisitsFirstRunEmpty({
    viewer,
    canSchedule,
}: {
    viewer: VisitViewer;
    canSchedule: boolean;
}) {
    if (viewer === "owner") {
        return (
            <EmptyState
                icon={CalendarCheck}
                heading="No visits booked"
                description="When a broker has a buyer for one of your properties, their request to visit shows up here."
                className="py-16"
            />
        );
    }

    return (
        <EmptyState
            icon={CalendarPlus}
            heading="No visits booked"
            description={
                canSchedule
                    ? "Pick a property you represent and propose a time. The owner confirms before anyone turns up."
                    : "You need a property an owner has approved you for before you can book a visit."
            }
            className="py-16"
        >
            <Button
                size="lg"
                nativeButton={false}
                render={<Link href={canSchedule ? SCHEDULE_HREF : BROWSE_HREF} />}
            >
                {canSchedule ? "Schedule a visit" : "Browse owner listings"}
            </Button>
        </EmptyState>
    );
}

/** Search or status filter matched nothing. Offers escape, never "add your first". */
export function VisitsFilteredEmpty({ onClear }: { onClear: () => void }) {
    return (
        <EmptyState
            icon={Search}
            heading="No visits match"
            description="Try a different property, name or status."
            className="py-16"
        >
            <Button variant="secondary" size="sm" onClick={onClear}>
                Clear the filters
            </Button>
        </EmptyState>
    );
}

/**
 * Cleared state — the user had something to do and finished it. Quiet,
 * positive, and deliberately without a button.
 */
export function VisitsAllClearEmpty({ viewer }: { viewer: VisitViewer }) {
    return (
        <EmptyState
            icon={CircleCheck}
            heading="Nothing waiting on you"
            description={
                viewer === "owner"
                    ? "Every visit request has an answer. Brokers will ask again when they have another buyer."
                    : "Every visit is confirmed and every finished one has its verdict recorded."
            }
            className="py-16"
        />
    );
}

/**
 * No visits in the selected date window. Sits inside the list, under the week
 * strip, so the strip stays on screen as the way back out.
 */
export function VisitsDayEmpty({
    onPickSlot,
    isRange = false,
}: {
    onPickSlot?: () => void;
    isRange?: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="body-sm text-ink-muted">
                {isRange ? "Nothing booked in these dates" : "Nothing booked this day"}
            </p>
            {onPickSlot ? (
                <Button variant="secondary" size="sm" onClick={onPickSlot}>
                    Propose a time
                </Button>
            ) : null}
        </div>
    );
}
