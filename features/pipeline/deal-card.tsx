"use client";

import { Fragment, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

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
import { getStoredUser } from "@/lib/auth/session";
import { formatAreaSqft } from "@/lib/format/area";
import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ChipOverflowPopover, type ChipTone } from "@/features/pipeline/chip-overflow-popover";
import {
    type AttentionTone,
    daysInStage,
    daysWithoutMovement,
    dealAttention,
    type OtherBuyer,
} from "@/features/pipeline/deal-attention";
import { DealPartiesPanel } from "@/features/pipeline/deal-parties-panel";
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

type ChipCandidate = {
    key: string;
    label: string;
    tone: ChipTone;
    /** Overrides the plain label span — e.g. the other-buyers popover trigger. */
    render?: ReactNode;
};

/** Blocker facts outrank money facts, which outrank plain neutral facts. */
const CHIP_TONE_RANK: Record<ChipTone, number> = { danger: 0, urgent: 1, neutral: 2 };

function chipToneClass(tone: ChipTone): string {
    if (tone === "danger") return "bg-danger-soft text-danger";
    if (tone === "urgent") return "bg-urgent-soft text-urgent";
    return "bg-surface-muted text-ink";
}

function buildChipCandidates(
    deal: DealItem,
    live: boolean,
    attention: AttentionTone,
    otherBuyers: OtherBuyer[],
    onView: (dealId: string) => void,
): ChipCandidate[] {
    const items: ChipCandidate[] = [];

    if (!deal.owner.isRepresentationActive) {
        items.push({ key: "repr", label: "Representation ended", tone: "danger" });
    }

    if (live) {
        if (attention !== "healthy") {
            const days = daysWithoutMovement(deal);
            items.push({
                key: "warning",
                label: `No response · ${days} ${days === 1 ? "day" : "days"}`,
                tone: attention === "quiet" ? "danger" : "urgent",
            });
        }

        if (isOverBudget(deal)) {
            items.push({ key: "budget", label: "Over budget", tone: "urgent" });
        }

        if (otherBuyers.length > 0) {
            items.push({
                key: "buyers",
                label: `${otherBuyers.length} more ${otherBuyers.length === 1 ? "buyer" : "buyers"}`,
                tone: "neutral",
                render: (
                    <MoreBuyersPopover
                        count={otherBuyers.length}
                        buyers={otherBuyers}
                        onView={onView}
                    />
                ),
            });
        }
    }

    return items;
}

/**
 * Never more than two chips on a card face. Everything past that ranks by
 * urgency into a "+N" pill instead of competing for the same two slots.
 */
function CardChips({
    deal,
    live,
    attention,
    otherBuyers,
    onView,
}: {
    deal: DealItem;
    live: boolean;
    attention: AttentionTone;
    otherBuyers: OtherBuyer[];
    onView: (dealId: string) => void;
}) {
    const ranked = buildChipCandidates(deal, live, attention, otherBuyers, onView).sort(
        (a, b) => CHIP_TONE_RANK[a.tone] - CHIP_TONE_RANK[b.tone],
    );
    const visible = ranked.slice(0, 2);
    const overflow = ranked.slice(2);

    if (visible.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {visible.map((chip) =>
                chip.render ? (
                    <Fragment key={chip.key}>{chip.render}</Fragment>
                ) : (
                    <span
                        key={chip.key}
                        className={cn(
                            "body-xs rounded-sm px-2 py-0.5 font-semibold",
                            chipToneClass(chip.tone),
                        )}
                    >
                        {chip.label}
                    </span>
                ),
            )}
            {overflow.length > 0 ? <ChipOverflowPopover items={overflow} /> : null}
        </div>
    );
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
      body-xs flex items-center gap-1 rounded-sm px-1.5 py-1 font-medium text-ink
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
    const attention: AttentionTone = live ? dealAttention(deal) : "healthy";
    const advance = live ? nextStage(deal.status as DealStage) : null;
    const outcome = isOutcome(deal.status) ? DEAL_OUTCOME_META[deal.status] : null;
    const OutcomeIcon = outcome?.icon;
    const canCall = Boolean(deal.buyer.phoneDigits);
    const stageDays = live ? daysInStage(deal) : 0;
    const currentUserId = getStoredUser()?.id ?? null;
    // The stage block itself already runs two lines in these cases — the
    // "in stage" caption would be a third, redundant time-reference and
    // would blow the card's height budget, so it steps aside instead.
    const stageBlockIsTwoLine =
        (deal.status === "contacted" && Boolean(deal.nextFollowUpAt)) ||
        (deal.status === "negotiation" && deal.offerAmountInr != null && deal.offerStatus != null);

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
                  border p-4 shadow-xs transition-[box-shadow,transform] duration-160 max-block-80
                  min-block-62
                  hover:-translate-y-0.5 hover:shadow-md
                `,
                isBusy && "pointer-events-none opacity-60",
                isDragging && "cursor-grabbing opacity-40 shadow-md",
                // Attention never tints the card. The chip row states the
                // stall in words with a day count; a tint would restate it
                // in colour alone and leave the board reading as an alarm.
                !live ? "border-border-warm bg-surface-muted/40" : "border-border-warm bg-surface",
            )}
        >
            <div className="flex flex-col gap-2 min-block-0">
                <div className="flex items-center gap-1.5">
                    <p className="body-sm flex-1 truncate text-ink min-inline-0">
                        {deal.property.configLabel} · {deal.property.locality} ·{" "}
                        {formatAreaSqft(deal.property.areaSqft)}
                    </p>
                    <Badge variant="outline" className="shrink-0">
                        {deal.property.isRent ? "Rent" : "Sale"}
                    </Badge>
                    <DealCardMenu
                        deal={deal}
                        handlers={handlers}
                        isBusy={isBusy}
                        isPinned={isPinned}
                    />
                </div>

                <Price
                    amountInr={deal.property.amountInr}
                    isRent={deal.property.isRent}
                    className="body font-bold"
                />

                <DealPartiesPanel
                    buyer={deal.buyer}
                    owner={deal.owner}
                    assignedAgent={deal.assignedAgent}
                    currentUserId={currentUserId}
                />

                <CardChips
                    deal={deal}
                    live={live}
                    attention={attention}
                    otherBuyers={otherBuyers}
                    onView={handlers.onView}
                />

                {outcome && OutcomeIcon ? (
                    <Badge variant={outcome.badgeVariant} className="gap-1 inline-fit">
                        <OutcomeIcon aria-hidden className="block-3 inline-3" strokeWidth={2} />
                        {outcome.label}
                    </Badge>
                ) : null}

                {live ? (
                    <div className="flex flex-col gap-3">
                        <StageMiddle deal={deal} />
                        {deal.status !== "new" && stageDays >= 1 && !stageBlockIsTwoLine ? (
                            <p className="body-xs text-ink-muted">
                                In stage {stageDays} {stageDays === 1 ? "day" : "days"}
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="flex items-end justify-between gap-2">
                <div className="flex items-end gap-1">
                    {canCall ? (
                        <>
                            <FooterAction href={formatTelUrl(deal.buyer.phoneDigits)} label="Call">
                                <Phone
                                    aria-hidden
                                    className="block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
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
