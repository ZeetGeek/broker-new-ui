"use client";

import type { ReactNode } from "react";

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
 * `lib/api/referrals.ts`), and day headers over a list this short would be
 * more furniture than signal.
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
            {referrals.length === 0
                ? emptyState
                : referrals.map((referral, index) => (
                      <ReferralRow
                          key={referral.id}
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
                  ))}
        </section>
    );
}
