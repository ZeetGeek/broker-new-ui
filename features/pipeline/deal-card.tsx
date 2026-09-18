"use client";

import { Fragment, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import {
    Check,
    CircleSlash,
    Eye,
    GripVertical,
    Handshake,
    MapPin,
    Maximize2,
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
import { PropertyThumb } from "@/components/shared/property-thumb";
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
    return "bg-surface-muted text-ink-muted";
}

function buildChipCandidates(
    deal: DealItem,
    live: boolean,
    attention: AttentionTone,
    otherBuyers: OtherBuyer[],
    onView: (dealId: string) => void,
): ChipCandidate[] {
    const items: ChipCandidate[] = [];

    if (deal.property.isExclusiveProperty) {
        items.push({ key: "exclusive", label: "Exclusive property", tone: "neutral" });
    }

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

        // Neutral, not urgent. This fires on a large share of a typical board,
        // and docs/DESIGN.md §1.3 reserves orange for an actual deadline — an
        // "alert" that appears on half the cards has stopped being one.
        if (isOverBudget(deal)) {
            items.push({ key: "budget", label: "Over budget", tone: "neutral" });
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
 * One chip on a card face. Everything past that ranks by urgency into a "+N"
 * pill instead of competing for the same slot — at fourteen cards a column,
 * a second chip per card reads as texture rather than as a signal.
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
    // Exclusive is informational and should stay visible beside blockers when space allows.
    const exclusive = ranked.find((chip) => chip.key === "exclusive");
    const rest = ranked.filter((chip) => chip.key !== "exclusive");
    const visible = exclusive ? [exclusive, ...rest.slice(0, 1)] : rest.slice(0, 1);
    const overflow = exclusive ? rest.slice(1) : rest.slice(1);

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
    // Always visible, icon-only. The accessible name lives on `aria-label` and
    // the tooltip explains the glyph on pointer devices — these are the
    // broker's most frequent field actions, so they never hide behind hover.
    const className = `
      flex items-center justify-center rounded-control text-ink-muted block-control-sm
      inline-control-sm
      hover:bg-surface-muted hover:text-ink
    `;

    const trigger = href ? (
        <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            aria-label={label}
            onClick={stopCard}
            className={className}
        >
            {children}
        </a>
    ) : (
        <button type="button" aria-label={label} onClick={onClick} className={className}>
            {children}
        </button>
    );

    return (
        <Tooltip>
            <TooltipTrigger render={trigger} />
            <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
    );
}

/**
 * The grip that starts a drag. Only this starts one — the card face stays a
 * link to the deal, and the call / WhatsApp / note buttons keep working.
 *
 * `touch-none` is required, not cosmetic: without it the browser claims the
 * gesture for scrolling and the drag never begins on a phone.
 */
function DragHandle({
    ref,
    label,
    ...props
}: {
    ref?: (element: HTMLElement | null) => void;
    label: string;
} & Record<string, unknown>) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <button
                        ref={ref}
                        type="button"
                        aria-label={label}
                        onClick={stopCard}
                        className="
                          flex cursor-grab touch-none items-center justify-center rounded-control
                          text-ink-muted block-control-sm inline-control-sm
                          hover:bg-surface-muted hover:text-ink
                          active:cursor-grabbing
                        "
                        {...props}
                    />
                }
            >
                <GripVertical aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </TooltipTrigger>
            <TooltipContent side="bottom">Drag to move</TooltipContent>
        </Tooltip>
    );
}

function DealCardMenu({
    deal,
    handlers,
    isBusy,
    isPinned,
    className,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy: boolean;
    isPinned: boolean;
    /** Lets the board card recolour the trigger for use over a photo. */
    className?: string;
}) {
    const live = isLiveStage(deal.status);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isBusy}
                        aria-label={`More actions for ${deal.buyer.name}`}
                        // Same box, radius and ink as FooterAction, so the
                        // menu reads as one of the card's field actions.
                        className={cn(
                            `
                              shrink-0 rounded-control text-ink-muted block-control-sm
                              inline-control-sm
                              hover:bg-surface-muted hover:text-ink
                            `,
                            className,
                        )}
                        onClick={stopCard}
                    />
                }
            >
                <MoreHorizontal aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
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
    dragHandleRef,
    dragHandleProps,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy?: boolean;
    layout?: "board" | "list";
    isDragging?: boolean;
    isPinned?: boolean;
    otherBuyers?: OtherBuyer[];
    /** dnd-kit's activator ref. Marks the handle as what starts a drag. */
    dragHandleRef?: (element: HTMLElement | null) => void;
    /** Listeners + a11y attributes for the handle. Absent on a static card. */
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
            aria-label={`${deal.buyer.name} on ${deal.property.title}`}
            tabIndex={0}
            onClick={openCard}
            onKeyDown={onKeyDown}
            className={cn(
                // Hover changes the border only — no lift, no shadow step. At
                // fourteen cards a column the card does not need to move to
                // show it is the one under the cursor. The resting shadow is
                // `sm`, so hover has somewhere to go later if it ever needs it.
                //
                // Height is auto. A fixed height clipped the stage block on
                // whichever stage happened to carry two lines, and no single
                // number is right for all four — so the card sizes to what it
                // actually holds.
                `
                  group flex cursor-pointer flex-col justify-between gap-2 rounded-card border p-5
                  shadow-sm
                  hover:border-ink/25
                `,
                isBusy && "pointer-events-none opacity-60",
                isDragging && "cursor-grabbing opacity-40",
                // Attention never tints the card. The chip row states the
                // stall in words with a day count; a tint would restate it
                // in colour alone and leave the board reading as an alarm.
                !live ? "border-border-warm bg-surface-muted/40" : "border-border-warm bg-surface",
            )}
        >
            <div className="flex flex-col gap-4 min-block-0">
                {/* The photo spans the card instead of sitting as a square
                    beside the text. In a 288px column a thumb left the title
                    about 160px to live in, which is what made the header read
                    as cramped — full width gives every line the whole card and
                    gives the photo enough area to be worth showing. */}
                <PropertyThumb
                    src={deal.property.imageSrc || null}
                    alt={deal.property.title}
                    className="border border-border-warm"
                    // Aspect ratio, not a fixed height. `fill` + object-cover
                    // always crops to the box, so a hard height decided how
                    // much of every photo to throw away; 4:3 is the shape most
                    // property photos are already taken in, so the crop is
                    // close to none.
                    sizeClassName="aspect-[4/3] inline-full"
                    sizes="(max-width: 1024px) 288px, 320px"
                    iconClassName="block-8 inline-8"
                    hoverScale={false}
                />

                <div className="flex flex-col gap-1.5 min-inline-0">
                    {/* Title and price share the top line — the two facts a
                        broker matches on first, and pairing them keeps the
                        card from spending three stacked lines on the header. */}
                    <div className="flex items-baseline justify-between gap-2">
                        <p className="body-sm truncate font-semibold text-ink">
                            {deal.property.title}
                        </p>
                        <Price
                            amountInr={deal.property.amountInr}
                            isRent={deal.property.isRent}
                            className="body-sm shrink-0 font-semibold text-brand"
                        />
                    </div>

                    {/* Locality and area, iconed the way the property cards
                        spec them (MapPin / Maximize2, 12px, 1.75 stroke) so the
                        same facts look the same across the product. */}
                    <p
                        className="
                          body-xs flex flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold
                          text-ink-muted min-inline-0
                        "
                    >
                        <span className="flex items-center gap-1 min-inline-0">
                            <MapPin
                                aria-hidden
                                className="shrink-0 block-3 inline-3"
                                strokeWidth={1.75}
                            />
                            <span className="truncate">{deal.property.locality}</span>
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                            <Maximize2
                                aria-hidden
                                className="shrink-0 block-3 inline-3"
                                strokeWidth={1.75}
                            />
                            {formatAreaSqft(deal.property.areaSqft)} · {deal.property.configLabel}
                            {live && deal.status !== "new" && stageDays >= 1
                                ? ` · ${stageDays}d in stage`
                                : ""}
                        </span>
                    </p>
                </div>

                <DealPartiesPanel
                    buyer={deal.buyer}
                    owner={deal.owner}
                    assignedAgent={deal.assignedAgent}
                    currentUserId={currentUserId}
                />

                {/* Everything below the parties is stage-dependent, and so is
                    the one part of the card whose height varies. It sizes to
                    its content: capping it here is what cut the stage block
                    off mid-line. */}
                <div className="flex flex-col gap-2 font-medium">
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

                    {live ? <StageMiddle deal={deal} /> : null}
                </div>
            </div>

            <div
                className="
                  mbs-2 flex items-center justify-between gap-2 border-bs border-border-warm pbs-3
                "
            >
                <div className="flex items-center gap-1">
                    {canCall ? (
                        <>
                            <FooterAction href={formatTelUrl(deal.buyer.phoneDigits)} label="Call">
                                <Phone
                                    aria-hidden
                                    className="block-4 inline-4"
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
                                    className="block-4 inline-4"
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
                        <StickyNote aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    </FooterAction>
                    {/* The overflow menu is one more field action, so it sits
                        with the others and is styled as one rather than
                        floating over the photo. */}
                    <DealCardMenu
                        deal={deal}
                        handlers={handlers}
                        isBusy={isBusy}
                        isPinned={isPinned}
                    />

                    {dragHandleProps ? (
                        <DragHandle
                            ref={dragHandleRef}
                            label={`Reorder or move ${deal.buyer.name} on ${deal.property.title}`}
                            {...dragHandleProps}
                        />
                    ) : null}
                </div>

                {primary ? (
                    <Button
                        variant="surface"
                        size="sm"
                        disabled={isBusy}
                        // The card's own hover no longer repaints this button.
                        // Swapping it to solid dark on card-hover made the
                        // whole row twitch every time the pointer crossed a
                        // card; the button now answers to its own hover only.
                        className="shrink-0 font-semibold"
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
