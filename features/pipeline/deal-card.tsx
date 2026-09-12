"use client";

import { useState } from "react";
import Link from "next/link";

import {
    ArrowRight,
    CalendarClock,
    Check,
    CircleSlash,
    Eye,
    Handshake,
    Lock,
    MessageCircle,
    MoreHorizontal,
    PhoneCall,
    TriangleAlert,
    Undo2,
} from "lucide-react";

import { daysSince, hasUpcomingVisit, isOverBudget, isStalled } from "@/lib/api/pipeline";
import { formatAreaSqft } from "@/lib/format/area";
import { formatRelativePast, formatShowingWhen } from "@/lib/format/date";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr } from "@/lib/format/price";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
    DEAL_LOST_REASON_LABEL,
    DEAL_OUTCOME_META,
    DEAL_STAGE_META,
    isOutcome,
} from "@/features/pipeline/stage-meta";
import {
    DEAL_STAGE_ORDER,
    type DealItem,
    type DealStage,
    type DealStatus,
    isLiveStage,
    nextStage,
} from "@/features/pipeline/types";

export type DealCardHandlers = {
    onView: (dealId: string) => void;
    onAdvance: (dealId: string, stage: DealStage) => void;
    onLogContact: (dealId: string, currentStatus: DealStatus) => void;
    onClose: (dealId: string) => void;
    onLose: (dealId: string) => void;
    onReopen: (dealId: string, stage: DealStage) => void;
    onMakeOffer: (dealId: string) => void;
};

/** Broker can submit/revise unless the lead is closed or an offer is already pending. */
export function canMakeOffer(deal: DealItem): boolean {
    if (!isLiveStage(deal.status)) return false;
    return deal.offerStatus !== "pending";
}

/**
 * The single line telling the broker what to do next. Ordered by urgency so
 * only the most pressing thing speaks — a card that nags three times is a
 * card the broker learns to ignore.
 */
function nextStepLine(deal: DealItem): { text: string; tone: "urgent" | "muted" | "brand" } | null {
    if (isOutcome(deal.status)) {
        if (deal.status === "lost" && deal.lostReason) {
            return { text: DEAL_LOST_REASON_LABEL[deal.lostReason], tone: "muted" };
        }
        if (deal.status === "closed" && deal.closedAmountInr != null) {
            return { text: `Sold for ${formatPriceInr(deal.closedAmountInr)}`, tone: "brand" };
        }
        return null;
    }

    if (hasUpcomingVisit(deal) && deal.nextVisitAt) {
        return {
            text: `Visit ${formatShowingWhen(new Date(deal.nextVisitAt), new Date())}`,
            tone: "brand",
        };
    }

    if (deal.offerStatus === "pending" && deal.offerAmountInr != null) {
        return {
            text: `Offer of ${formatPriceInr(deal.offerAmountInr)} pending owner response.`,
            tone: "brand",
        };
    }

    if (deal.offerStatus === "rejected") {
        return {
            text:
                deal.offerAmountInr != null
                    ? `Offer of ${formatPriceInr(deal.offerAmountInr)} was rejected. Revise it.`
                    : "Offer was rejected. Revise it.",
            tone: "urgent",
        };
    }

    if (isStalled(deal)) {
        const since = daysSince(deal.lastContactedAt ?? deal.stageEnteredAt) ?? 0;
        return { text: `No contact for ${since} days. Call them.`, tone: "urgent" };
    }

    if (deal.status === "new" && !deal.lastContactedAt) {
        return { text: "Call the buyer about this property.", tone: "muted" };
    }

    if (deal.status === "visit" && !deal.nextVisitAt) {
        return { text: "Book the visit.", tone: "muted" };
    }

    return null;
}

/**
 * Who owns the property, and how to reach them. The broker typed none of
 * this: it arrived with the listing when the owner approved them.
 *
 * The number is consent-gated the same way it is on a request card. If
 * representation has lapsed, the name stays and the contact buttons go, so
 * the card never offers a call the broker is no longer allowed to make.
 */
function DealOwnerRow({ deal }: { deal: DealItem }) {
    const { owner } = deal;
    const canContact = owner.isRepresentationActive && Boolean(owner.phoneDigits);

    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-inline-0">
                <UserAvatar name={owner.name} imageUrl={owner.avatarUrl} size="sm" />

                <div className="min-inline-0">
                    <div className="flex items-center gap-1.5">
                        <span className="body-sm truncate font-medium text-ink">{owner.name}</span>
                        {!owner.isRepresentationActive ? (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <span className="flex shrink-0 items-center text-ink-muted">
                                            <Lock
                                                aria-hidden
                                                className="block-3.5 inline-3.5"
                                                strokeWidth={1.75}
                                            />
                                        </span>
                                    }
                                />
                                <TooltipContent>
                                    You no longer represent this property, so the owner&apos;s
                                    number is hidden.
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </div>

                    {canContact && owner.phoneDigits ? (
                        <PhoneNumber
                            phoneDigits={owner.phoneDigits}
                            className="body-xs text-ink-muted"
                        />
                    ) : (
                        <span className="body-xs text-ink-muted">Owner</span>
                    )}
                </div>
            </div>

            {canContact && owner.phoneDigits ? (
                <div className="flex shrink-0 items-center gap-1.5">
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="outline"
                                    size="icon-xs"
                                    nativeButton={false}
                                    className="shrink-0 border-border-warm text-brand"
                                    render={
                                        <a
                                            href={formatWhatsAppUrl(owner.phoneDigits)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`Message ${owner.name} on WhatsApp`}
                                        />
                                    }
                                />
                            }
                        >
                            <MessageCircle aria-hidden strokeWidth={1.75} />
                        </TooltipTrigger>
                        <TooltipContent>Message {owner.name} on WhatsApp.</TooltipContent>
                    </Tooltip>
                </div>
            ) : null}
        </div>
    );
}

/** The buyer, and the one-tap way to reach them. */
function DealBuyerRow({ deal }: { deal: DealItem }) {
    const overBudget = isOverBudget(deal);

    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-inline-0">
                <UserAvatar name={deal.buyer.name} imageUrl={deal.buyer.avatarUrl} size="sm" />

                <div className="min-inline-0">
                    <div className="flex items-center gap-1.5">
                        <span className="body-sm truncate font-medium text-ink">
                            {deal.buyer.name}
                        </span>
                        {overBudget ? (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <span className="flex shrink-0 items-center text-urgent">
                                            <TriangleAlert
                                                aria-hidden
                                                className="block-3.5 inline-3.5"
                                                strokeWidth={1.75}
                                            />
                                        </span>
                                    }
                                />
                                <TooltipContent>
                                    Asking price is above what this buyer said they would pay
                                    {deal.buyer.budgetMaxInr != null
                                        ? ` (${formatPriceInr(deal.buyer.budgetMaxInr)}).`
                                        : "."}
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </div>
                    <span className="body-xs text-ink-muted">Buyer</span>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                variant="outline"
                                size="icon-xs"
                                nativeButton={false}
                                className="shrink-0 border-border-warm text-brand"
                                render={
                                    <a
                                        href={formatWhatsAppUrl(deal.buyer.phoneDigits)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Message ${deal.buyer.name} on WhatsApp`}
                                    />
                                }
                            />
                        }
                    >
                        <MessageCircle aria-hidden strokeWidth={1.75} />
                    </TooltipTrigger>
                    <TooltipContent>Message {deal.buyer.name} on WhatsApp.</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

function DealCardMenu({
    deal,
    handlers,
    isBusy,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy: boolean;
}) {
    const live = isLiveStage(deal.status);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        disabled={isBusy}
                        aria-label={`More actions for ${deal.buyer.name}`}
                        className="shrink-0 text-ink-muted"
                    />
                }
            >
                <MoreHorizontal aria-hidden strokeWidth={1.75} />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-inline-52">
                <DropdownMenuItem onClick={() => handlers.onView(deal.id)}>
                    <Eye aria-hidden strokeWidth={1.75} />
                    View details
                </DropdownMenuItem>

                {live ? (
                    <>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => handlers.onLogContact(deal.id, deal.status)}
                        >
                            <PhoneCall aria-hidden strokeWidth={1.75} />
                            Log a call
                        </DropdownMenuItem>

                        {canMakeOffer(deal) ? (
                            <DropdownMenuItem onClick={() => handlers.onMakeOffer(deal.id)}>
                                <Handshake aria-hidden strokeWidth={1.75} />
                                {deal.offerStatus === "rejected" ? "Revise offer" : "Make offer"}
                            </DropdownMenuItem>
                        ) : null}

                        <DropdownMenuSeparator />

                        {DEAL_STAGE_ORDER.filter((stage) => stage !== deal.status).map((stage) => (
                            <DropdownMenuItem
                                key={stage}
                                onClick={() => handlers.onAdvance(deal.id, stage)}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "rounded-full block-2 inline-2",
                                        DEAL_STAGE_META[stage].dotClass,
                                    )}
                                />
                                Move to {DEAL_STAGE_META[stage].label.toLowerCase()}
                            </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => handlers.onClose(deal.id)}>
                            <Check aria-hidden strokeWidth={1.75} />
                            Mark as sold
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlers.onLose(deal.id)}>
                            <CircleSlash aria-hidden strokeWidth={1.75} />
                            Mark as lost
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlers.onReopen(deal.id, "contacted")}>
                            <Undo2 aria-hidden strokeWidth={1.75} />
                            Put back on the board
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function DealCard({
    deal,
    handlers,
    isBusy = false,
    /** Board columns are narrow; the list view has room for more. */
    layout = "board",
    isDragging = false,
    dragHandleProps,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy?: boolean;
    layout?: "board" | "list";
    isDragging?: boolean;
    dragHandleProps?: Record<string, unknown>;
}) {
    const [showDetail, setShowDetail] = useState(false);

    const live = isLiveStage(deal.status);
    const step = nextStepLine(deal);
    const advance = live ? nextStage(deal.status as DealStage) : null;
    const outcome = isOutcome(deal.status) ? DEAL_OUTCOME_META[deal.status] : null;
    const OutcomeIcon = outcome?.icon;

    return (
        <article
            {...dragHandleProps}
            aria-label={`${deal.buyer.name} on ${deal.property.title}`}
            className={cn(
                `
                  group/deal flex flex-col gap-3 rounded-card border border-border-warm bg-surface
                  p-3 transition-[box-shadow,border-color,opacity] duration-160
                  hover:border-ink/15 hover:shadow-md
                `,
                isBusy && "pointer-events-none opacity-60",
                isDragging && "opacity-40",
                !live && "bg-surface-muted/40",
            )}
        >
            {/* Property leads: it is the thing being sold, and the photo is
                the fastest way for a broker to recognise which deal this is. */}
            <div className="flex items-start gap-2.5">
                <Link
                    href={brokerPropertyDetailHref(deal.property.id)}
                    className="
                      shrink-0 rounded-inner
                      focus-visible:outline-2 focus-visible:outline-brand
                    "
                    aria-label={`Open ${deal.property.title}`}
                >
                    <PropertyThumb src={deal.property.imageSrc} alt={deal.property.title} />
                </Link>

                <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="max-inline-full min-inline-0">
                            <PropertyTitleLink
                                href={brokerPropertyDetailHref(deal.property.id)}
                                className="body-sm truncate font-semibold"
                            >
                                {deal.property.configLabel} · {deal.property.locality}
                            </PropertyTitleLink>
                        </h3>
                        <DealCardMenu deal={deal} handlers={handlers} isBusy={isBusy} />
                    </div>

                    <div className="flex flex-wrap items-baseline gap-x-2">
                        <Price
                            amountInr={deal.property.amountInr}
                            isRent={deal.property.isRent}
                            className="body-sm font-semibold"
                        />
                        <span className="body-xs text-ink-subtle">
                            {formatAreaSqft(deal.property.areaSqft)}
                        </span>
                    </div>
                </div>
            </div>

            {outcome && OutcomeIcon ? (
                <Badge variant={outcome.badgeVariant} className="gap-1 inline-fit">
                    <OutcomeIcon aria-hidden className="block-3 inline-3" strokeWidth={2} />
                    {outcome.label}
                </Badge>
            ) : null}

            {/* Both sides of the deal, in a quiet inset so they read as one
                unit rather than two more rows of card content. */}
            <div className="flex flex-col gap-2.5 rounded-inner bg-surface-muted/60 p-2.5">
                <DealBuyerRow deal={deal} />
                <div className="border-bs border-border-warm" />
                <DealOwnerRow deal={deal} />
            </div>

            {step ? (
                <p
                    className={cn(
                        "body-xs flex items-start gap-1.5",
                        step.tone === "urgent" && "text-urgent",
                        step.tone === "brand" && "text-brand-text",
                        step.tone === "muted" && "text-ink-muted",
                    )}
                >
                    {step.tone === "urgent" ? (
                        <TriangleAlert
                            aria-hidden
                            className="mbs-px shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                    ) : step.tone === "brand" ? (
                        <CalendarClock
                            aria-hidden
                            className="mbs-px shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                    ) : null}
                    <span className="text-pretty">{step.text}</span>
                </p>
            ) : null}

            {deal.note && (layout === "list" || showDetail) ? (
                <p className="body-xs text-pretty text-ink-muted">{deal.note}</p>
            ) : null}

            {live && advance ? (
                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handlers.onView(deal.id)}
                        className="justify-center inline-full"
                    >
                        <Eye aria-hidden strokeWidth={1.75} />
                        View
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handlers.onAdvance(deal.id, advance)}
                        className="justify-center inline-full"
                    >
                        {DEAL_STAGE_META[advance].advanceLabel}
                        <ArrowRight aria-hidden strokeWidth={1.75} />
                    </Button>
                </div>
            ) : null}

            {live && !advance && canMakeOffer(deal) ? (
                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handlers.onView(deal.id)}
                        className="justify-center inline-full"
                    >
                        <Eye aria-hidden strokeWidth={1.75} />
                        View
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handlers.onMakeOffer(deal.id)}
                        className="justify-center inline-full"
                    >
                        {deal.offerStatus === "rejected" ? "Revise offer" : "Make offer"}
                        <Handshake aria-hidden strokeWidth={1.75} />
                    </Button>
                </div>
            ) : null}

            {live && !advance && !canMakeOffer(deal) ? (
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handlers.onView(deal.id)}
                    className="justify-center inline-full"
                >
                    <Eye aria-hidden strokeWidth={1.75} />
                    View
                </Button>
            ) : null}

            {!live ? (
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handlers.onView(deal.id)}
                    className="justify-center inline-full"
                >
                    <Eye aria-hidden strokeWidth={1.75} />
                    View
                </Button>
            ) : null}

            {deal.note && layout === "board" && !showDetail ? (
                <button
                    type="button"
                    onClick={() => setShowDetail(true)}
                    className="body-xs text-start text-ink-subtle hover:text-ink-muted"
                >
                    Show note
                </button>
            ) : null}

            {!live && deal.resolvedAt ? (
                <p className="body-xs text-ink-subtle">
                    {deal.status === "closed" ? "Sold" : "Lost"}{" "}
                    {formatRelativePast(new Date(deal.resolvedAt), new Date())}
                </p>
            ) : null}
        </article>
    );
}
