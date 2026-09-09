"use client";

import { ArrowRight, BellRing, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react";

import { formatRelativePast } from "@/lib/format/date";
import { buildWhatsAppInviteUrl } from "@/lib/share/referral";
import { cn } from "@/lib/utils";

import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
    buildInviteMessage,
    isStaleReferral,
    nudgeBlockedReason,
    nudgeState,
    REFERRAL_CHANNEL_LABEL,
    REFERRAL_ROLE_ICON,
    REFERRAL_ROLE_LABEL,
    REFERRAL_STATUS_META,
    referralStatusHint,
} from "@/features/referrals/referral-meta";
import { isNudgeable, type ReferralItem, referralNextStep } from "@/features/referrals/types";

export type ReferralRowHandlers = {
    onNudge: (referralId: string) => void;
    onCancel: (referralId: string) => void;
    onOpen: (referralId: string) => void;
};

type ReferralRowProps = {
    referral: ReferralItem;
    handlers: ReferralRowHandlers;
    /** The broker doing the inviting — their name signs the message. */
    inviterName: string;
    shareUrl: string;
    isBusy?: boolean;
    now: Date;
    className?: string;
};

/**
 * One invite, as a task-list row.
 *
 * Laid out to answer three questions in reading order: who is this, where did
 * they get to, and what do I do about it. The action lives at the end so a
 * column of rows has one action column rather than buttons scattered by
 * status.
 */
export function ReferralRow({
    referral,
    handlers,
    inviterName,
    shareUrl,
    isBusy = false,
    now,
    className,
}: ReferralRowProps) {
    const meta = REFERRAL_STATUS_META[referral.status];
    const StatusIcon = meta.icon;
    const RoleIcon = referral.role ? REFERRAL_ROLE_ICON[referral.role] : null;

    const isStale = isStaleReferral(referral, now);
    const nudge = nudgeState(referral, now);
    const blockedReason = nudgeBlockedReason(nudge);
    const nextStep = referralNextStep(referral);
    /** Only a person who has not signed up can have their invite withdrawn. */
    const canWithdraw = referral.joinedAt === null && referral.status !== "expired";

    const firstName = referral.person.name.split(" ")[0];
    const message = buildInviteMessage({ inviterName, shareUrl });

    return (
        <article
            className={cn(
                `
                  group/row flex gap-3 border-be border-border-warm bg-surface px-3 py-3.5
                  transition-colors duration-160
                  hover:bg-surface-muted/50
                  sm:gap-4 sm:px-4
                `,
                // Gone quiet: a tinted ground so the rows worth chasing are
                // findable without reading every badge.
                isStale && "bg-urgent-soft/40 hover:bg-urgent-soft/60",
                isBusy && "pointer-events-none opacity-60",
                className,
            )}
            aria-busy={isBusy || undefined}
        >
            <UserAvatar
                name={referral.person.name}
                imageUrl={referral.person.avatarUrl}
                size="md"
                className="shrink-0"
            />

            <div className="flex flex-1 flex-col gap-1 min-inline-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <button
                        type="button"
                        onClick={() => handlers.onOpen(referral.id)}
                        className="
                          body truncate rounded-control text-start font-semibold text-ink
                          outline-none max-inline-full
                          hover:underline
                          focus-visible:ring-2 focus-visible:ring-brand
                        "
                    >
                        {referral.person.name}
                    </button>

                    {/* Role only once they have picked one. A guess before
                        signup would be a label the row cannot stand behind. */}
                    {referral.role && RoleIcon ? (
                        <Badge variant="outline">
                            <RoleIcon aria-hidden />
                            {REFERRAL_ROLE_LABEL[referral.role]}
                        </Badge>
                    ) : null}

                    <Badge variant={meta.variant}>
                        <StatusIcon aria-hidden />
                        {meta.label}
                    </Badge>

                    {isStale ? <Badge variant="urgent">Gone quiet</Badge> : null}
                </div>

                <p className="body-sm text-ink-muted">{referralStatusHint(referral)}</p>

                <div
                    className="
                      body-xs flex flex-wrap items-center gap-x-2 gap-y-0.5 text-ink-subtle
                    "
                >
                    <PhoneNumber phoneDigits={referral.person.phoneDigits} />
                    <span aria-hidden>·</span>
                    {/* Every relative time says what it is timing — a bare
                        "3 days ago" next to a phone number invites a guess. */}
                    <span>Invited {formatRelativePast(new Date(referral.invitedAt), now)}</span>
                    <span aria-hidden>·</span>
                    <span>{REFERRAL_CHANNEL_LABEL[referral.channel]}</span>
                </div>

                {nextStep ? (
                    <p className="body-xs flex items-center gap-1 text-ink-muted">
                        <ArrowRight aria-hidden className="text-ink-subtle block-3 inline-3" />
                        Next: {nextStep}
                    </p>
                ) : null}
            </div>

            <div className="flex shrink-0 items-start gap-2">
                {referral.creditsEarned > 0 ? (
                    <span className="body-sm tabular pbs-1.5 font-semibold text-brand">
                        +{referral.creditsEarned}
                    </span>
                ) : null}

                {isNudgeable(referral.status) ? (
                    blockedReason ? (
                        <Tooltip>
                            {/* A disabled button swallows its own events, so
                                the tooltip hangs off a wrapper. Without this
                                the explanation never appears. */}
                            <TooltipTrigger render={<span className="inline-flex" />}>
                                <Button variant="secondary" size="sm" disabled>
                                    <BellRing aria-hidden />
                                    <span className="hidden sm:inline">Nudge</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{blockedReason}</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlers.onNudge(referral.id)}
                            aria-label={`Nudge ${firstName}`}
                        >
                            <BellRing aria-hidden />
                            <span className="hidden sm:inline">Nudge</span>
                        </Button>
                    )
                ) : null}

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`More for ${referral.person.name}`}
                            >
                                <MoreHorizontal aria-hidden />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            render={
                                <a
                                    href={buildWhatsAppInviteUrl(
                                        message,
                                        referral.person.phoneDigits,
                                    )}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                />
                            }
                        >
                            <MessageSquare aria-hidden />
                            Message on WhatsApp
                        </DropdownMenuItem>

                        {canWithdraw ? (
                            <DropdownMenuItem
                                onClick={() => handlers.onCancel(referral.id)}
                                className="text-danger"
                            >
                                <Trash2 aria-hidden />
                                Withdraw invite
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </article>
    );
}
