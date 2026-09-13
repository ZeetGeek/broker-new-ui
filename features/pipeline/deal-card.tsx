"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

import {
    Check,
    CircleSlash,
    Eye,
    Handshake,
    MessageCircle,
    MoreHorizontal,
    Phone,
    PhoneCall,
    Pin,
    PinOff,
    StickyNote,
    Undo2,
} from "lucide-react";

import { isOverBudget } from "@/lib/api/pipeline";
import { formatAreaSqft } from "@/lib/format/area";
import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
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

import {
    daysInStage,
    daysWithoutMovement,
    type OtherBuyer,
} from "@/features/pipeline/deal-attention";
import { MoreBuyersPopover } from "@/features/pipeline/more-buyers-popover";
import { ContactedStageBlock } from "@/features/pipeline/stage-blocks/contacted-stage-block";
import { NegotiationStageBlock } from "@/features/pipeline/stage-blocks/negotiation-stage-block";
import { NewStageBlock } from "@/features/pipeline/stage-blocks/new-stage-block";
import { VisitStageBlock } from "@/features/pipeline/stage-blocks/visit-stage-block";
import { DEAL_OUTCOME_META, DEAL_STAGE_META, isOutcome } from "@/features/pipeline/stage-meta";
import {
    DEAL_STAGE_ORDER,
    type DealItem,
    type DealStage,
    type DealStatus,
    isLiveStage,
    nextStage,
    SLOW_AFTER_DAYS,
    STALLED_AFTER_DAYS,
} from "@/features/pipeline/types";

export type DealCardHandlers = {
    onView: (dealId: string) => void;
    onAdvance: (dealId: string, stage: DealStage) => void;
    onLogContact: (dealId: string, currentStatus: DealStatus) => void;
    onClose: (dealId: string) => void;
    onLose: (dealId: string) => void;
    onReopen: (dealId: string, stage: DealStage) => void;
    onMakeOffer: (dealId: string) => void;
    onPin: (dealId: string) => void;
    onNote: (dealId: string) => void;
};

function whatsappMessage(deal: DealItem): string {
    return `Hi ${deal.buyer.name}, this is about ${deal.property.title}. When can we talk?`;
}

function stopCard(event: MouseEvent) {
    event.stopPropagation();
}

function warningChip(deal: DealItem): { label: string; tone: "urgent" | "danger" } | null {
    const days = daysWithoutMovement(deal);
    if (days >= STALLED_AFTER_DAYS) return { label: `No response · ${days} days`, tone: "danger" };
    if (days >= SLOW_AFTER_DAYS) return { label: `No response · ${days} days`, tone: "urgent" };
    return null;
}

function CardChips({
    deal,
    otherBuyers,
    onView,
}: {
    deal: DealItem;
    otherBuyers: OtherBuyer[];
    onView: (dealId: string) => void;
}) {
    const chips: ReactNode[] = [];
    const warning = warningChip(deal);
    const overBudget = isOverBudget(deal);
    const stageDays = daysInStage(deal);

    if (warning) {
        chips.push(
            <span
                key="warning"
                className={cn(
                    "body-xs rounded-sm px-2 py-0.5 font-semibold",
                    warning.tone === "danger"
                        ? "bg-danger-soft text-danger"
                        : "bg-urgent-soft text-urgent",
                )}
            >
                {warning.label}
            </span>,
        );
    }

    if (overBudget && chips.length < 2) {
        chips.push(
            <span
                key="budget"
                className="body-xs rounded-sm bg-urgent-soft px-2 py-0.5 font-medium text-urgent"
            >
                Over budget
            </span>,
        );
    }

    if (otherBuyers.length > 0 && chips.length < 2) {
        chips.push(
            <MoreBuyersPopover
                key="buyers"
                count={otherBuyers.length}
                buyers={otherBuyers}
                onView={onView}
            />,
        );
    }

    if (chips.length < 2) {
        chips.push(
            <span
                key="stage"
                className="body-xs rounded-sm bg-surface-muted px-2 py-0.5 font-medium text-ink"
            >
                in stage {stageDays} {stageDays === 1 ? "day" : "days"}
            </span>,
        );
    }

    return <div className="flex flex-wrap items-center gap-1.5">{chips}</div>;
}

function FooterAction({
    href,
    label,
    onClick,
    children,
}: {
    href?: string;
    label: string;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
    children: ReactNode;
}) {
    const className = `
      body-xs flex flex-col items-center gap-0.5 rounded-sm px-1 py-0.5 font-medium text-ink
      hover:bg-surface-muted
    `;

    if (href) {
        return (
            <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                aria-label={label}
                onClick={stopCard}
                className={className}
            >
                {children}
                <span>{label}</span>
            </a>
        );
    }

    return (
        <button type="button" aria-label={label} onClick={onClick} className={className}>
            {children}
            <span>{label}</span>
        </button>
    );
}

function DealCardMenu({
    deal,
    handlers,
    isBusy,
    isPinned,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy: boolean;
    isPinned: boolean;
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
                        className="shrink-0 text-ink"
                        onClick={stopCard}
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
                <DropdownMenuItem onClick={() => handlers.onPin(deal.id)}>
                    {isPinned ? (
                        <PinOff aria-hidden strokeWidth={1.75} />
                    ) : (
                        <Pin aria-hidden strokeWidth={1.75} />
                    )}
                    {isPinned ? "Unpin" : "Pin to top"}
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
                        <DropdownMenuItem onClick={() => handlers.onMakeOffer(deal.id)}>
                            <Handshake aria-hidden strokeWidth={1.75} />
                            {deal.offerStatus === "rejected" || deal.offerStatus === "pending"
                                ? "Revise offer"
                                : "Make offer"}
                        </DropdownMenuItem>
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

function StageMiddle({ deal }: { deal: DealItem }) {
    if (deal.status === "new") return <NewStageBlock deal={deal} />;
    if (deal.status === "contacted") return <ContactedStageBlock deal={deal} />;
    if (deal.status === "visit") return <VisitStageBlock deal={deal} />;
    if (deal.status === "negotiation") return <NegotiationStageBlock deal={deal} />;
    return null;
}

export function DealCard({
    deal,
    handlers,
    isBusy = false,
    isDragging = false,
    isPinned = false,
    otherBuyers = [],
    dragHandleProps,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy?: boolean;
    layout?: "board" | "list";
    isDragging?: boolean;
    isPinned?: boolean;
    otherBuyers?: OtherBuyer[];
    dragHandleProps?: Record<string, unknown>;
}) {
    const live = isLiveStage(deal.status);
    const advance = live ? nextStage(deal.status as DealStage) : null;
    const outcome = isOutcome(deal.status) ? DEAL_OUTCOME_META[deal.status] : null;
    const OutcomeIcon = outcome?.icon;
    const canCall = Boolean(deal.buyer.phoneDigits);

    const primary = (() => {
        if (!live) return null;
        if (deal.status === "negotiation") {
            return {
                label:
                    deal.offerStatus === "rejected" || deal.offerStatus === "pending"
                        ? "Revise offer"
                        : "Make offer",
                onClick: () => handlers.onMakeOffer(deal.id),
            };
        }
        if (advance) {
            return {
                label: DEAL_STAGE_META[advance].advanceLabel,
                onClick: () => handlers.onAdvance(deal.id, advance),
            };
        }
        return null;
    })();

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
            {...dragHandleProps}
            aria-label={`${deal.buyer.name} on ${deal.property.title}`}
            tabIndex={0}
            onClick={openCard}
            onKeyDown={onKeyDown}
            className={cn(
                `
                  flex cursor-pointer flex-col justify-between gap-2 overflow-hidden rounded-card
                  border border-border-warm bg-surface p-3.5 shadow-xs
                  transition-[box-shadow,transform] duration-160 max-block-65 min-block-58
                  hover:-translate-y-0.5 hover:shadow-md
                `,
                isBusy && "pointer-events-none opacity-60",
                isDragging && "cursor-grabbing opacity-40 shadow-md",
                !live && "bg-surface-muted/40",
            )}
        >
            <div className="flex flex-col gap-2 min-block-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-inline-0">
                        <UserAvatar name={deal.buyer.name} size="sm" fallback="initials" />
                        <span className="body truncate font-semibold text-ink">
                            {deal.buyer.name}
                        </span>
                    </div>
                    <DealCardMenu
                        deal={deal}
                        handlers={handlers}
                        isBusy={isBusy}
                        isPinned={isPinned}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <p className="body-sm text-ink">
                        {deal.property.configLabel} · {deal.property.locality} ·{" "}
                        {formatAreaSqft(deal.property.areaSqft)}
                    </p>
                    <Badge variant="outline">{deal.property.isRent ? "Rent" : "Sale"}</Badge>
                </div>

                <Price
                    amountInr={deal.property.amountInr}
                    isRent={deal.property.isRent}
                    className="body font-bold"
                />

                <CardChips deal={deal} otherBuyers={otherBuyers} onView={handlers.onView} />

                {outcome && OutcomeIcon ? (
                    <Badge variant={outcome.badgeVariant} className="gap-1 inline-fit">
                        <OutcomeIcon aria-hidden className="block-3 inline-3" strokeWidth={2} />
                        {outcome.label}
                    </Badge>
                ) : null}

                {live ? <StageMiddle deal={deal} /> : null}
            </div>

            <div className="flex items-end justify-between gap-2">
                <div className="flex items-end gap-1">
                    {canCall ? (
                        <>
                            <FooterAction
                                href={formatTelUrl(deal.buyer.phoneDigits)}
                                label="Call"
                            >
                                <Phone aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                            </FooterAction>
                            <FooterAction
                                href={formatWhatsAppUrl(
                                    deal.buyer.phoneDigits,
                                    whatsappMessage(deal),
                                )}
                                label="WhatsApp"
                            >
                                <MessageCircle
                                    aria-hidden
                                    className="block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                            </FooterAction>
                        </>
                    ) : null}
                    <FooterAction
                        label="Note"
                        onClick={(event) => {
                            stopCard(event);
                            handlers.onNote(deal.id);
                        }}
                    >
                        <StickyNote
                            aria-hidden
                            className="block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                    </FooterAction>
                </div>

                {primary ? (
                    <Button
                        variant="default"
                        size="xs"
                        disabled={isBusy}
                        onClick={(event) => {
                            stopCard(event);
                            primary.onClick();
                        }}
                    >
                        {primary.label}
                    </Button>
                ) : null}
            </div>
        </article>
    );
}
