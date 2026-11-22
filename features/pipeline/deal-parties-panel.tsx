"use client";

import { ContactName } from "@/components/shared/contact-name";
import { UserAvatar } from "@/components/shared/user-avatar";

import type { DealAssignedAgent } from "@/features/pipeline/types";

import styles from "./deal-card.module.css";

type Party = {
    id?: string;
    name: string;
    avatarUrl?: string;
};

/**
 * Full-width owner and client rows keep both names readable in narrow board columns.
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
    textSize = "xs",
}: {
    buyer: Party;
    owner: Party;
    assignedAgent?: DealAssignedAgent | null;
    currentUserId?: string | null;
    /** Opens deal / buyer context. Matches property-card manage taps. */
    onOpenBuyer?: () => void;
    onOpenOwner?: () => void;
    textSize?: "xs" | "sm";
}) {
    const showHandledBy = Boolean(assignedAgent) && assignedAgent?.id !== currentUserId;
    const textClass = textSize === "sm" ? "body-sm" : "body-xs";

    return (
        <div className={styles.people}>
            {[
                { person: owner, label: "Owner", type: "owner" as const, onOpen: onOpenOwner },
                { person: buyer, label: "Client", type: "buyer" as const, onOpen: onOpenBuyer },
            ].map(({ person, label, type, onOpen }) => (
                <div key={type} className={styles.personRow}>
                    <span className={`${textClass} text-ink-muted`}>{label}</span>
                    <UserAvatar name={person.name} imageUrl={person.avatarUrl} size="2xs" />
                    <ContactName
                        name={person.name}
                        contactId={person.id}
                        contactType={type}
                        onOpen={onOpen}
                        className={`${textClass} font-semibold text-brand-text ${styles.personName}`}
                    />
                </div>
            ))}

            {showHandledBy && assignedAgent ? (
                <div className="flex items-center gap-2 px-1">
                    <span className="body-xs text-ink-subtle">Handled by</span>
                    <UserAvatar
                        name={assignedAgent.name}
                        imageUrl={assignedAgent.avatarUrl}
                        size="xxs"
                    />
                    <span className="body-xs font-semibold wrap-anywhere text-ink-muted capitalize min-inline-0">
                        {assignedAgent.name}
                    </span>
                </div>
            ) : null}
        </div>
    );
}
