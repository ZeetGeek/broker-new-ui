"use client";

import { BellRing, MessageSquare } from "lucide-react";

import { formatDateShort, formatRelativePast } from "@/lib/format/date";
import { buildWhatsAppInviteUrl } from "@/lib/share/referral";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    buildInviteMessage,
    nudgeBlockedReason,
    nudgeState,
    REFERRAL_CHANNEL_LABEL,
    REFERRAL_ROLE_LABEL,
    REFERRAL_STATUS_META,
    referralStatusHint,
} from "@/features/referrals/referral-meta";
import { isNudgeable, type ReferralItem } from "@/features/referrals/types";

type ReferralDetailModalProps = {
    referral: ReferralItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inviterName: string;
    shareUrl: string;
    isBusy: boolean;
    now: Date;
    onNudge: (referralId: string) => void;
};

/**
 * One invite in full: who, where they got to, and every step on the way.
 *
 * The timeline is the reason this modal exists. "Invite sent" on a row does
 * not tell a broker whether the person ever looked, and that is exactly what
 * decides between nudging them and picking up the phone.
 */
export function ReferralDetailModal({
    referral,
    open,
    onOpenChange,
    inviterName,
    shareUrl,
    isBusy,
    now,
    onNudge,
}: ReferralDetailModalProps) {
    if (!referral) return null;

    const meta = REFERRAL_STATUS_META[referral.status];
    const StatusIcon = meta.icon;
    const nudge = nudgeState(referral, now);
    const blockedReason = nudgeBlockedReason(nudge);
    const message = buildInviteMessage({ inviterName, shareUrl });

    // Newest first — the last thing that happened is the thing being acted on.
    const history = [...referral.history].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="md"
            title={referral.person.name}
            description={referralStatusHint(referral)}
        >
            <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                    <UserAvatar
                        name={referral.person.name}
                        imageUrl={referral.person.avatarUrl}
                        size="lg"
                        className="shrink-0"
                    />

                    <div className="flex flex-1 flex-col gap-1 min-inline-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={meta.variant}>
                                <StatusIcon aria-hidden />
                                {meta.label}
                            </Badge>
                            {referral.role ? (
                                <Badge variant="outline">
                                    {REFERRAL_ROLE_LABEL[referral.role]}
                                </Badge>
                            ) : null}
                            {referral.creditsEarned > 0 ? (
                                <Badge variant="brand">
                                    {referral.creditsEarned} credits earned
                                </Badge>
                            ) : null}
                        </div>

                        <p className="body-sm text-ink-muted">
                            {referral.person.phoneDigits ? (
                                <PhoneNumber phoneDigits={referral.person.phoneDigits} />
                            ) : (
                                (referral.person.email ?? "—")
                            )}
                            {referral.person.agencyName ? ` · ${referral.person.agencyName}` : ""}
                            {referral.person.city ? ` · ${referral.person.city}` : ""}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-inner bg-surface-muted p-3">
                    <div className="flex flex-col gap-0.5">
                        <span className="eyebrow">Joined</span>
                        <span className="body-sm text-ink">
                            {formatDateShort(new Date(referral.invitedAt))} ·{" "}
                            {REFERRAL_CHANNEL_LABEL[referral.channel]}
                        </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <span className="eyebrow">Status</span>
                        <span className="body-sm text-ink">{meta.label}</span>
                    </div>
                </div>

                <section className="flex flex-col gap-3">
                    <h3 className="eyebrow">What has happened</h3>

                    <VirtualListBox
                        items={history}
                        getKey={(event) => event.id}
                        estimateItemHeight={64}
                        gap={0}
                        ariaLabel={`Activity for ${referral.person.name}`}
                        className="max-block-96"
                        renderItem={(event, index) => (
                            <div className="flex gap-3">
                                {/* Rail: a dot per event, joined by a line that
                                    stops at the last one so the timeline has an
                                    end rather than trailing off. */}
                                <div className="flex flex-col items-center gap-1 pbs-1.5">
                                    <span
                                        aria-hidden
                                        className={cn(
                                            "shrink-0 rounded-full block-2 inline-2",
                                            index === 0 ? "bg-brand" : "bg-border-warm",
                                        )}
                                    />
                                    {index < history.length - 1 ? (
                                        <span
                                            aria-hidden
                                            className="flex-1 bg-border-warm inline-px"
                                        />
                                    ) : null}
                                </div>

                                <div className="flex flex-1 flex-col pbe-3">
                                    <span className="body-sm text-ink">{event.label}</span>
                                    <span className="body-xs text-ink-subtle">
                                        {formatRelativePast(new Date(event.at), now)}
                                    </span>
                                </div>
                            </div>
                        )}
                    />
                </section>

                <div className="flex flex-wrap gap-2 border-bs border-border-warm pbs-4">
                    <Button
                        variant="secondary"
                        size="md"
                        nativeButton={false}
                        render={
                            <a
                                href={buildWhatsAppInviteUrl(message, referral.person.phoneDigits)}
                                target="_blank"
                                rel="noreferrer noopener"
                            />
                        }
                    >
                        <MessageSquare aria-hidden />
                        Message on WhatsApp
                    </Button>

                    {isNudgeable(referral.status) ? (
                        <div className="flex flex-col gap-1.5">
                            <Button
                                variant="default"
                                size="md"
                                loading={isBusy}
                                disabled={nudge.kind !== "allowed"}
                                onClick={() => onNudge(referral.id)}
                            >
                                <BellRing aria-hidden />
                                {isBusy ? "Nudging…" : "Nudge them"}
                            </Button>
                            {/* The reason sits under the button rather than in
                                a tooltip: on a phone there is no hover, so a
                                tooltip-only explanation never appears. */}
                            {blockedReason ? (
                                <p className="body-xs text-ink-subtle">{blockedReason}</p>
                            ) : null}
                        </div>
                    ) : referral.status === "awaiting_approval" ? (
                        // No button at all here. The only thing that moves this
                        // forward is an owner's decision, and offering an action
                        // that cannot affect it would be a lie about who is in
                        // control (docs/EMPTY_STATES.md rule 6).
                        <p className="body-sm self-center text-ink-muted">
                            Nothing to do — the owner has their request.
                        </p>
                    ) : null}
                </div>
            </div>
        </AppModal>
    );
}
