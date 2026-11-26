import { EmptyStateAction } from "@/components/empty-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, UserRoundPlus, UsersRound } from "@/components/shared/icons";

/**
 * First run — nobody invited yet.
 *
 * The action here is deliberately secondary. The dark share card directly
 * above holds the page's one primary action (docs/EMPTY_STATES.md rule 5), so
 * a second filled button two inches below it would be two primaries competing.
 * This one exists because the list is where a reader's eye lands and they
 * should not have to scroll back up to act.
 */
export function ReferralsFirstRunEmpty({ onInvite }: { onInvite: () => void }) {
    return (
        <EmptyState
            icon={UsersRound}
            heading="No one invited yet"
            description="Brokers you invite show up here, from the moment they open your link to the day they start working a property."
            className="py-14"
        >
            <EmptyStateAction label="Invite by number" icon={UserRoundPlus} onClick={onInvite} />
        </EmptyState>
    );
}

/** Search or a status chip matched nothing. Offers escape, never "invite your first". */
export function ReferralsFilteredEmpty({ onClear }: { onClear: () => void }) {
    return (
        <EmptyState
            icon={Search}
            heading="No invites match"
            description="Try a different name, number or status."
            className="py-14"
        >
            <EmptyStateAction label="Clear the filters" icon={Search} onClick={onClear} />
        </EmptyState>
    );
}
