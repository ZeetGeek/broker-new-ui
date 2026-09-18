"use client";

import { type KeyboardEvent, type MouseEvent } from "react";

import {
    AlertCircle,
    CalendarClock,
    Clock,
    Images,
    MapPin,
    MessageCircle,
    Move3d,
    Phone,
    StickyNote,
} from "lucide-react";

import { isOverBudget } from "@/lib/api/pipeline";
import { getStoredUser } from "@/lib/auth/session";
import { formatAreaSqft } from "@/lib/format/area";
import { formatDateShort, formatRelativePast, formatShowingWhen } from "@/lib/format/date";
import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { Price } from "@/components/shared/price";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import { daysInStage, type OtherBuyer } from "@/features/pipeline/deal-attention";
import type { DealCardHandlers } from "@/features/pipeline/deal-card";
import { DEAL_OUTCOME_META, DEAL_STAGE_META, isOutcome } from "@/features/pipeline/stage-meta";
import { type DealItem, type DealStage, isLiveStage, nextStage } from "@/features/pipeline/types";

function stopCard(event: MouseEvent) {
    event.stopPropagation();
}

function whatsappMessage(deal: DealItem): string {
    return `Hi ${deal.buyer.name}, this is about ${deal.property.title}. When can we talk?`;
}

/**
 * The single most useful line on a CRM card: what this deal needs next, and
 * whether it is late. Ordered by urgency, not by field — an overdue follow-up
 * outranks a booked visit, because only one of them is already a problem.
 */
function nextAction(deal: DealItem, now: Date): { label: string; isOverdue: boolean } | null {
    if (!isLiveStage(deal.status)) return null;

    if (deal.nextFollowUpAt) {
        const due = new Date(deal.nextFollowUpAt);
        const isOverdue = due.getTime() < now.getTime();
        return {
            label: isOverdue
                ? `Follow-up overdue · ${formatDateShort(due)}`
                : `Follow up ${formatDateShort(due)}`,
            isOverdue,
        };
    }

    if (deal.nextVisitAt) {
        const at = new Date(deal.nextVisitAt);
        if (at.getTime() >= now.getTime()) {
            return { label: `Visit ${formatShowingWhen(at, now)}`, isOverdue: false };
        }
    }

    if (deal.lastContactedAt) {
        return {
            label: `Last contact ${formatRelativePast(new Date(deal.lastContactedAt), now)}`,
            isOverdue: false,
        };
    }

    return { label: "No contact logged yet", isOverdue: false };
}

/** The gap between the ask and what the buyer said they could spend. */
function budgetGap(deal: DealItem): string | null {
    const budget = deal.buyer.budgetMaxInr;
    if (budget == null || !isOverBudget(deal)) return null;
    return `Budget ${formatPriceInr(budget)} · over by ${formatPriceInr(
        deal.property.amountInr - budget,
    )}`;
}

function PartyCell({ name, role, avatarUrl }: { name: string; role: string; avatarUrl?: string }) {
    return (
        <div className="flex items-center gap-2.5 min-inline-0">
            <UserAvatar
                name={name}
                imageUrl={avatarUrl}
                size="xs"
                fallback="character"
                className="shrink-0"
            />
            <div className="flex flex-col min-inline-0">
                <span className="body-xs text-ink-subtle">{role}</span>
                <span className="body-sm truncate font-semibold text-ink">{name}</span>
            </div>
        </div>
    );
}

function ActionButton({
    href,
    label,
    onClick,
    children,
}: {
    href?: string;
    label: string;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
    children: React.ReactNode;
}) {
    const className = `
      body-sm flex flex-1 items-center justify-center gap-2 rounded-control border
      border-border-warm bg-surface font-medium text-ink block-control-lg
      hover:border-ink/25 hover:bg-surface-muted
    `;

    if (href) {
        return (
            <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                onClick={stopCard}
                className={className}
            >
                {children}
                {label}
            </a>
        );
    }

    return (
        <button type="button" onClick={onClick} className={className}>
            {children}
            {label}
        </button>
    );
}

/**
 * The full-detail deal card used in List view, where one deal owns a whole row
 * and there is room to lead with the photo. The board keeps the compact card —
 * a column showing one-and-a-half deals is not a pipeline you can scan.
 */
export function DealCardRich({
    deal,
    handlers,
    isBusy = false,
    otherBuyers = [],
    photoCount,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy?: boolean;
    otherBuyers?: OtherBuyer[];
    /** Total photos on the listing, when the API sent them. */
    photoCount?: number;
}) {
    const now = new Date();
    const live = isLiveStage(deal.status);
    const stageMeta = live ? DEAL_STAGE_META[deal.status as DealStage] : null;
    const outcome = isOutcome(deal.status) ? DEAL_OUTCOME_META[deal.status] : null;
    const OutcomeIcon = outcome?.icon;
    const advance = live ? nextStage(deal.status as DealStage) : null;
    const canCall = Boolean(deal.buyer.phoneDigits);
    const action = nextAction(deal, now);
    const gap = budgetGap(deal);
    const stageDays = live ? daysInStage(deal) : 0;
    const currentUserId = getStoredUser()?.id ?? null;
    const showHandledBy = Boolean(deal.assignedAgent) && deal.assignedAgent?.id !== currentUserId;

    const primary = (() => {
        if (!live) return null;
        if (deal.status === "negotiation") {
            return {
                label:
                    deal.offerStatus === "rejected" || deal.offerStatus === "pending"
                        ? "Revise offer"
                        : "Make offer",
                icon: Move3d,
                onClick: () => handlers.onMakeOffer(deal.id),
            };
        }
        if (advance) {
            return {
                label: DEAL_STAGE_META[advance].advanceLabel,
                icon: DEAL_STAGE_META[advance].icon,
                onClick: () => handlers.onAdvance(deal.id, advance),
            };
        }
        return null;
    })();

    const PrimaryIcon = primary?.icon;

    function openCard() {
        if (!isBusy) handlers.onView(deal.id);
    }

    function onKeyDown(event: KeyboardEvent<HTMLElement>) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openCard();
        }
    }

    return (
        <article
            aria-label={`${deal.buyer.name} on ${deal.property.title}`}
            tabIndex={0}
            onClick={openCard}
            onKeyDown={onKeyDown}
            className={cn(
                `
                  flex cursor-pointer flex-col overflow-hidden rounded-card border
                  border-border-warm shadow-sm
                  hover:border-ink/25
                `,
                isBusy && "pointer-events-none opacity-60",
                live ? "bg-surface" : "bg-surface-muted/40",
            )}
        >
            <div className="relative block-52">
                {deal.property.imageSrc ? (
                    <AppImage
                        src={deal.property.imageSrc}
                        alt={deal.property.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                    />
                ) : (
                    // Designed empty state, never a broken image — docs/DESIGN.md §4.5.
                    <div
                        className="
                          flex flex-col items-center justify-center gap-1 bg-surface-muted
                          block-full
                        "
                    >
                        <Images
                            aria-hidden
                            className="text-ink-subtle block-6 inline-6"
                            strokeWidth={1.5}
                        />
                        <p className="body-xs text-ink-subtle">No photos yet</p>
                    </div>
                )}

                <div className="absolute inset-bs-0 flex items-start justify-between p-3">
                    {stageMeta ? (
                        <span
                            className={cn(
                                `
                                  body-xs flex items-center gap-1.5 rounded-control px-2.5 py-1
                                  font-semibold
                                `,
                                stageMeta.pillClass,
                            )}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    "rounded-full block-1.5 inline-1.5",
                                    stageMeta.dotClass,
                                )}
                            />
                            {stageMeta.label}
                        </span>
                    ) : outcome && OutcomeIcon ? (
                        <span
                            className="
                              body-xs flex items-center gap-1.5 rounded-control bg-surface px-2.5
                              py-1 font-semibold text-ink
                            "
                        >
                            <OutcomeIcon aria-hidden className="block-3 inline-3" strokeWidth={2} />
                            {outcome.label}
                        </span>
                    ) : (
                        <span />
                    )}

                    {photoCount && photoCount > 1 ? (
                        <span
                            className="
                              body-xs flex items-center gap-1 rounded-control bg-ink/60 px-2 py-1
                              font-medium text-white
                            "
                        >
                            <Images aria-hidden className="block-3 inline-3" strokeWidth={2} />
                            {photoCount}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                    <h3 className="h6 truncate text-ink">
                        {deal.property.configLabel} · {deal.property.locality}
                    </h3>

                    <div
                        className="
                          body-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-muted
                        "
                    >
                        <span className="flex items-center gap-1.5">
                            <MapPin aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            {deal.property.locality}, {deal.property.city}
                        </span>
                        <span aria-hidden className="text-border-warm">
                            |
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Move3d aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            {formatAreaSqft(deal.property.areaSqft)}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Price
                        amountInr={deal.property.amountInr}
                        isRent={deal.property.isRent}
                        className="h5 text-brand"
                    />

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {deal.property.isExclusiveProperty ? (
                            <span
                                className="
                                  body-xs rounded-control bg-surface-muted px-2.5 py-1
                                  font-semibold text-ink-muted
                                "
                            >
                                Exclusive property
                            </span>
                        ) : null}
                        {!deal.owner.isRepresentationActive ? (
                            <span
                                className="
                                  body-xs flex items-center gap-1.5 rounded-control bg-danger-soft
                                  px-2.5 py-1 font-semibold text-danger
                                "
                            >
                                <AlertCircle
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={2}
                                />
                                Representation ended
                            </span>
                        ) : gap ? (
                            <span
                                className="
                                  body-xs flex items-center gap-1.5 rounded-control bg-urgent-soft
                                  px-2.5 py-1 font-semibold text-urgent
                                "
                            >
                                <AlertCircle
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={2}
                                />
                                {gap}
                            </span>
                        ) : null}
                    </div>
                </div>

                <div
                    className="
                      grid grid-cols-2 items-center gap-3 divide-x divide-border-warm rounded-inner
                      bg-surface-muted p-3
                    "
                >
                    <PartyCell name={deal.buyer.name} role="Buyer" />
                    <div className="ps-3 min-inline-0">
                        <PartyCell
                            name={deal.owner.name}
                            role="Owner"
                            avatarUrl={deal.owner.avatarUrl}
                        />
                    </div>
                </div>

                <div className="body-sm flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {action ? (
                        <span
                            className={cn(
                                "flex items-center gap-1.5",
                                action.isOverdue ? "font-semibold text-urgent" : "text-ink-muted",
                            )}
                        >
                            {action.isOverdue ? (
                                <CalendarClock
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                            ) : (
                                <Clock
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                            )}
                            {action.label}
                        </span>
                    ) : null}

                    {live && stageDays >= 1 ? (
                        <span className="text-ink-subtle">{stageDays}d in stage</span>
                    ) : null}

                    {otherBuyers.length > 0 ? (
                        <span className="text-ink-subtle">
                            {otherBuyers.length} other{" "}
                            {otherBuyers.length === 1 ? "buyer" : "buyers"} on this property
                        </span>
                    ) : null}
                </div>

                {showHandledBy && deal.assignedAgent ? (
                    <div className="flex items-center gap-1.5">
                        <span className="body-xs text-ink-subtle">Handled by</span>
                        <UserAvatar
                            name={deal.assignedAgent.name}
                            imageUrl={deal.assignedAgent.avatarUrl}
                            size="xxs"
                            fallback="character"
                        />
                        <span className="body-xs truncate font-medium text-ink-muted">
                            {deal.assignedAgent.name}
                        </span>
                    </div>
                ) : null}

                {live ? (
                    <>
                        <div className="flex items-center gap-2">
                            {canCall ? (
                                <>
                                    <ActionButton
                                        href={formatTelUrl(deal.buyer.phoneDigits)}
                                        label="Call"
                                    >
                                        <Phone
                                            aria-hidden
                                            className="block-4 inline-4"
                                            strokeWidth={1.75}
                                        />
                                    </ActionButton>
                                    <ActionButton
                                        href={formatWhatsAppUrl(
                                            deal.buyer.phoneDigits,
                                            whatsappMessage(deal),
                                        )}
                                        label="WhatsApp"
                                    >
                                        <MessageCircle
                                            aria-hidden
                                            className="block-4 inline-4"
                                            strokeWidth={1.75}
                                        />
                                    </ActionButton>
                                </>
                            ) : null}
                            <ActionButton
                                label="Note"
                                onClick={(event) => {
                                    stopCard(event);
                                    handlers.onNote(deal.id);
                                }}
                            >
                                <StickyNote
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                            </ActionButton>
                        </div>

                        {primary && PrimaryIcon ? (
                            <Button
                                variant="default"
                                size="lg"
                                disabled={isBusy}
                                className="inline-full"
                                onClick={(event) => {
                                    stopCard(event);
                                    primary.onClick();
                                }}
                            >
                                <PrimaryIcon aria-hidden strokeWidth={1.75} />
                                {primary.label}
                            </Button>
                        ) : null}
                    </>
                ) : null}
            </div>
        </article>
    );
}
