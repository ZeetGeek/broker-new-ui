"use client";

import { cn } from "@/lib/utils";

import { UserAvatar } from "@/components/shared/user-avatar";

import { ATTENTION_DOT_CLASS, type AttentionTone } from "@/features/pipeline/deal-attention";
import type { DealAssignedAgent } from "@/features/pipeline/types";

type Party = {
    name: string;
    avatarUrl?: string;
};

function PartyRow({
    party,
    role,
    dotTone,
}: {
    party: Party;
    role: string;
    /** Status dot, buyer row only — sits in line with the buyer's name. */
    dotTone?: AttentionTone;
}) {
    return (
        <div className="flex items-center gap-1.5">
            {dotTone ? (
                <span
                    aria-hidden
                    className={cn(
                        "shrink-0 rounded-full block-2 inline-2",
                        ATTENTION_DOT_CLASS[dotTone],
                    )}
                />
            ) : null}
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
 * Also carries the buyer-row status dot (healthy/slow/quiet) — this is the
 * canonical place the buyer's name appears, so that is where "in line with
 * the buyer's name" lands.
 */
export function DealPartiesPanel({
    buyer,
    owner,
    attention,
    assignedAgent,
    currentUserId,
}: {
    buyer: Party;
    owner: Party;
    /** Omit for a resolved (closed/lost) deal — no dot once there's nothing to track. */
    attention?: AttentionTone | null;
    assignedAgent?: DealAssignedAgent | null;
    currentUserId?: string | null;
}) {
    const showHandledBy = Boolean(assignedAgent) && assignedAgent?.id !== currentUserId;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1 rounded-inner bg-surface-muted p-2.5">
                <PartyRow party={buyer} role="Buyer" dotTone={attention ?? undefined} />
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
