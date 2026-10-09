"use client";

import type { ReactNode } from "react";

import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { ReferralRow, type ReferralRowHandlers } from "@/features/referrals/referral-row";
import type { ReferralItem } from "@/features/referrals/types";

type ReferralsListProps = {
    referrals: ReferralItem[];
    handlers: ReferralRowHandlers;
    inviterName: string;
    shareUrl: string;
    busyId: string | null;
    now: Date;
    /** Rendered inside the card when there is nothing to list. */
    emptyState?: ReactNode;
};

/**
 * The invites, as one bordered card of rows.
 *
 * No grouping. Sorting already puts the chaseable ones on top (see
 * `lib/api/referrals.ts`), so day headers would add furniture without changing
 * what the broker should act on next.
 */
export function ReferralsList({
    referrals,
    handlers,
    inviterName,
    shareUrl,
    busyId,
    now,
    emptyState,
}: ReferralsListProps) {
    return (
        <section
            className="overflow-hidden rounded-card border border-border-warm bg-surface"
            aria-label="Brokers you invited"
        >
            {referrals.length === 0 ? (
                emptyState
            ) : (
                <WindowVirtualGrid
                    items={referrals}
                    getKey={(referral) => referral.id}
                    estimateRowHeight={136}
                    gap={0}
                    overscan={4}
                    ariaLabel="Brokers you invited"
                    renderItem={(referral, index) => (
                        <ReferralRow
                            referral={referral}
                            handlers={handlers}
                            inviterName={inviterName}
                            shareUrl={shareUrl}
                            isBusy={busyId === referral.id}
                            now={now}
                            // The card's own border draws the last edge; a row
                            // border under it doubles the line.
                            className={index === referrals.length - 1 ? "border-be-0" : undefined}
                        />
                    )}
                />
            )}
        </section>
    );
}
