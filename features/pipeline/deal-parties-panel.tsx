"use client";

import { PartyMeetRow } from "@/components/shared/attached-people-row";
import { UserAvatar } from "@/components/shared/user-avatar";

import type { DealAssignedAgent } from "@/features/pipeline/types";

type Party = {
    id?: string;
    name: string;
    avatarUrl?: string;
};

/**
 * Buyer + owner on every pipeline card — one strip so both sides of a deal
 * stay visible without two full-width rows (AGENTS.md core loop).
 *
 * Stall state stays on the chip row, not here — colour-only markers would
 * duplicate the day-count chip (docs/DESIGN.md §1.4).
 */
export function DealPartiesPanel({
    buyer,
    owner,
    assignedAgent,
    currentUserId,
    onOpenBuyer,
    onOpenOwner,
}: {
    buyer: Party;
    owner: Party;
    assignedAgent?: DealAssignedAgent | null;
    currentUserId?: string | null;
    /** Opens deal / buyer context. Matches property-card manage taps. */
    onOpenBuyer?: () => void;
    onOpenOwner?: () => void;
}) {
    const showHandledBy = Boolean(assignedAgent) && assignedAgent?.id !== currentUserId;

    return (
        <div className="flex flex-col gap-2">
            <PartyMeetRow
                left={{
                    name: owner.name,
                    avatarUrl: owner.avatarUrl,
                    role: "Owner",
                    onOpen: onOpenOwner,
                }}
                right={{
                    name: buyer.name,
                    avatarUrl: buyer.avatarUrl,
                    role: "Buyer",
                    onOpen: onOpenBuyer,
                }}
            />

            {showHandledBy && assignedAgent ? (
                <div className="flex items-center gap-2 px-1">
                    <span className="body-xs text-ink-subtle">Handled by</span>
                    <UserAvatar
                        name={assignedAgent.name}
                        imageUrl={assignedAgent.avatarUrl}
                        size="xxs"
                        fallback="character"
                    />
                    <span className="body-xs truncate font-semibold text-ink-muted capitalize">
                        {assignedAgent.name}
                    </span>
                </div>
            ) : null}
        </div>
    );
}
