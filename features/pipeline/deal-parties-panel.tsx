"use client";

import { UserAvatar } from "@/components/shared/user-avatar";

import type { DealAssignedAgent } from "@/features/pipeline/types";

type Party = {
    name: string;
    avatarUrl?: string;
};

function PartyRow({ party, role }: { party: Party; role: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <UserAvatar
                name={party.name}
                imageUrl={party.avatarUrl}
                size="xs"
                fallback="initials-color"
                className="shrink-0"
            />
            <span className="body-sm truncate font-semibold text-ink">{party.name}</span>
            <span className="body-xs ms-auto shrink-0 text-ink-muted">{role}</span>
        </div>
    );
}

/**
 * The buyer + owner block every pipeline card shows, directly under the
 * price. Both sides of a deal must always be visible — see AGENTS.md, "the
 * core loop" — a card that only names the buyer is telling half the story.
 *
 * Stall state is not shown here. The card's chip row states it in words
 * with a day count, so a second colour-only marker on this row would be a
 * duplicate signal — see docs/DESIGN.md §1.4.
 */
export function DealPartiesPanel({
    buyer,
    owner,
    assignedAgent,
    currentUserId,
}: {
    buyer: Party;
    owner: Party;
    assignedAgent?: DealAssignedAgent | null;
    currentUserId?: string | null;
}) {
    const showHandledBy = Boolean(assignedAgent) && assignedAgent?.id !== currentUserId;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1 rounded-inner bg-surface-muted p-2.5">
                <PartyRow party={buyer} role="Buyer" />
                <PartyRow party={owner} role="Owner" />
            </div>

            {showHandledBy && assignedAgent ? (
                <div className="flex items-center gap-1.5 ps-0.5">
                    <span className="body-xs text-ink-muted">Handled by</span>
                    <UserAvatar
                        name={assignedAgent.name}
                        imageUrl={assignedAgent.avatarUrl}
                        size="xxs"
                        fallback="initials-color"
                    />
                    <span className="body-xs truncate font-medium text-ink-muted">
                        {assignedAgent.name}
                    </span>
                </div>
            ) : null}
        </div>
    );
}
