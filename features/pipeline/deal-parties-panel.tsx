"use client";

import { UserAvatar } from "@/components/shared/user-avatar";

import type { DealAssignedAgent } from "@/features/pipeline/types";

type Party = {
    name: string;
    avatarUrl?: string;
};

function PartyRow({ party, role }: { party: Party; role: string }) {
    return (
        <div className="flex items-center gap-2">
            <UserAvatar
                name={party.name}
                imageUrl={party.avatarUrl}
                size="xxs"
                fallback="character"
                className="shrink-0"
            />
            <span className="body-sm truncate font-medium text-ink">{party.name}</span>
            <span className="body-xs ms-auto shrink-0 text-ink-subtle">{role}</span>
        </div>
    );
}

/**
 * The buyer + owner block every pipeline card shows, directly under the
 * price. Both sides of a deal must always be visible — see AGENTS.md, "the
 * core loop" — a card that only names the buyer is telling half the story.
 *
 * Deliberately unboxed. An inset `surface-muted` panel here would be a card
 * inside a card, which docs/DESIGN.md §3.3 and the spatial rules both reject:
 * separation on this card comes from spacing, not from a second surface.
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
        <div className="flex flex-col gap-1.5">
            <PartyRow party={buyer} role="Buyer" />
            <PartyRow party={owner} role="Owner" />

            {showHandledBy && assignedAgent ? (
                <div className="flex items-center gap-1.5">
                    <span className="body-xs text-ink-subtle">Handled by</span>
                    <UserAvatar
                        name={assignedAgent.name}
                        imageUrl={assignedAgent.avatarUrl}
                        size="xxs"
                        fallback="character"
                    />
                    <span className="body-xs truncate font-medium text-ink-muted">
                        {assignedAgent.name}
                    </span>
                </div>
            ) : null}
        </div>
    );
}
