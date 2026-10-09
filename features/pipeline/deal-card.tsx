"use client";

import {
    Fragment,
    type KeyboardEvent,
    type MouseEvent,
    type ReactNode,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

import { addCollection, Icon } from "@iconify/react/offline";
import {
    Building2,
    Check,
    CircleSlash,
    Eye,
    GripVertical,
    Handshake,
    MapPin,
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
import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { OverlayCardActions, OVERLAY_GLASS_BUTTON_CLASS } from "@/components/shared/overlay-card";
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
    type DealProperty,
    type DealStage,
    type DealStatus,
    isLiveStage,
    nextStage,
} from "@/features/pipeline/types";
import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

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

function stopCard(event: { stopPropagation: () => void }) {
    event.stopPropagation();
}

/** Menu actions must not bubble — a click-through after the menu closes would open the deal. */
function runMenuAction(event: { stopPropagation: () => void }, action: () => void) {
    event.stopPropagation();
    action();
}

/** Matches owned property cards: `Office · 54 Sqft`. */
function formatCardArea(areaSqft: number): string {
    return `${Math.round(areaSqft).toLocaleString("en-IN")} Sqft`;
}

const CHROME_ICON_BUTTON_CLASS = `
  flex shrink-0 items-center justify-center rounded-full border border-border-warm bg-surface
  text-ink-muted block-control-sm inline-control-sm
  hover:border-ink/20 hover:bg-surface-muted hover:text-ink
`;

/** Same surface + hover as the broker profile menu. */
const DEAL_MENU_SURFACE_CLASS = `
  t-dropdown t-profile-menu animate-none! min-inline-56 rounded-inner border border-border-warm
  bg-surface p-3 text-ink shadow-lg ring-0
  before:backdrop-blur-none
  data-closed:animate-none!
  data-open:animate-none!
  **:data-[slot$=-item]:data-highlighted:bg-surface-muted!
  **:data-[slot$=-item]:data-highlighted:text-ink!
  **:data-[slot$=-item]:focus:bg-surface-muted!
  **:data-[slot$=-item]:focus:text-ink!
  **:data-[variant=destructive]:data-highlighted:bg-danger-soft!
  **:data-[variant=destructive]:data-highlighted:text-danger!
  **:data-[variant=destructive]:focus:bg-danger-soft!
  **:data-[variant=destructive]:focus:text-danger!
`;

const DEAL_MENU_ITEM_CLASS = `
  body-sm h-9 cursor-pointer gap-2.5 rounded-inner px-3 font-medium text-ink
  focus:bg-surface-muted! focus:text-ink!
  data-highlighted:bg-surface-muted! data-highlighted:text-ink!
  not-data-[variant=destructive]:focus:**:text-ink!
  not-data-[variant=destructive]:data-highlighted:**:text-ink!
`;

const DEAL_MENU_ICON_CLASS = "menu-stroke-icon shrink-0 block-4 inline-4 text-ink!";
const DEAL_MENU_SEPARATOR_CLASS = "mx-0! my-2.5 bg-border-warm inline-full!";

/** Stage-colored dashed border with tunable dash length / gap. */
function PinnedDashBorder({ toneClass }: { toneClass: string }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [box, setBox] = useState({ w: 0, h: 0 });

    useLayoutEffect(() => {
        const host = svgRef.current?.parentElement;
        if (!host) return;

        const sync = () => {
            setBox({ w: host.clientWidth, h: host.clientHeight });
        };
        sync();

        const observer = new ResizeObserver(sync);
        observer.observe(host);
        return () => observer.disconnect();
    }, []);

    // Keep stroke thin; lengthen dashes + gaps vs CSS border-dashed.
    const stroke = 1.5;
    const inset = stroke / 2;
    // Matches --radius-card (20px), inset so the curve sits on the card edge.
    const radius = Math.max(0, 20 - inset);

    return (
        <svg
            ref={svgRef}
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 z-[1] overflow-visible", toneClass)}
            width={box.w || "100%"}
            height={box.h || "100%"}
        >
            {box.w > 0 && box.h > 0 ? (
                <rect
                    x={inset}
                    y={inset}
                    width={box.w - stroke}
                    height={box.h - stroke}
                    rx={radius}
                    ry={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeDasharray="7 6"
                    strokeLinecap="round"
                />
            ) : null}
        </svg>
    );
}

/** Single cover thumb — leads the card row so the eye hits photo, then price. */
function DealCoverImage({ property, muted = false }: { property: DealProperty; muted?: boolean }) {
    const src = property.imageSrc || property.imageSrcs?.[0] || null;
    const extraCount =
        property.photoCount != null && property.photoCount > 1 ? property.photoCount - 1 : 0;

    return (
        <div
            className="
              relative shrink-0 overflow-hidden rounded-[8px] bg-surface-muted aspect-square
              inline-24
            "
            aria-hidden={!src}
        >
            {src ? (
                <AppImage
                    src={src}
                    alt={property.title}
                    fill
                    sizes="96px"
                    className={cn("object-cover", muted && "grayscale-60")}
                />
            ) : (
                <div className="flex items-center justify-center text-ink-subtle block-full inline-full">
                    <Building2 className="block-6 inline-6" strokeWidth={1.5} />
                </div>
            )}
            {extraCount > 0 ? (
                <span
                    className="
                      absolute inset-e-1 inset-be-1 rounded-full bg-ink/65 px-1.5 py-0.5 body-xs
                      font-semibold tabular-nums text-surface
                    "
                >
                    +{extraCount}
                </span>
            ) : null}
        </div>
    );
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
 * Soft chips under the summary — blockers and competing buyers. Stage and
 * sale/rent sit in the card chrome above the photo strip.
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
                            "body-xs rounded-full px-2.5 py-0.5 font-semibold tracking-wide",
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

/**
 * The grip that starts a drag. Only this starts one — the card face stays a
 * link to the deal, and call / WhatsApp keep working.
 *
 * `touch-none` is required: without it the browser claims the gesture for
 * scrolling and the drag never begins on a phone.
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
                        className={cn(
                            CHROME_ICON_BUTTON_CLASS,
                            "touch-none cursor-grab active:cursor-grabbing",
                        )}
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
    onMenuAction,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy: boolean;
    isPinned: boolean;
    /** Called before every menu action so the card can ignore the click-through. */
    onMenuAction?: () => void;
}) {
    const live = isLiveStage(deal.status);

    function act(event: { stopPropagation: () => void }, action: () => void) {
        runMenuAction(event, () => {
            onMenuAction?.();
            action();
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isBusy}
                        aria-label={`More actions for ${deal.buyer.name}`}
                        className={CHROME_ICON_BUTTON_CLASS}
                        onClick={stopCard}
                    />
                }
            >
                <MoreHorizontal aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className={DEAL_MENU_SURFACE_CLASS}
                onClick={stopCard}
                onPointerDown={stopCard}
            >
                <DropdownMenuItem
                    className={DEAL_MENU_ITEM_CLASS}
                    onClick={(event) => act(event, () => handlers.onView(deal.id))}
                >
                    <Eye aria-hidden className={DEAL_MENU_ICON_CLASS} strokeWidth={1.75} />
                    View details
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={DEAL_MENU_ITEM_CLASS}
                    onClick={(event) => act(event, () => handlers.onPin(deal.id))}
                >
                    {isPinned ? (
                        <PinOff aria-hidden className={DEAL_MENU_ICON_CLASS} strokeWidth={1.75} />
                    ) : (
                        <Pin aria-hidden className={DEAL_MENU_ICON_CLASS} strokeWidth={1.75} />
                    )}
                    {isPinned ? "Unpin" : "Pin to top"}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={DEAL_MENU_ITEM_CLASS}
                    onClick={(event) => act(event, () => handlers.onNote(deal.id))}
                >
                    <StickyNote aria-hidden className={DEAL_MENU_ICON_CLASS} strokeWidth={1.75} />
                    Add a note
                </DropdownMenuItem>

                {live ? (
                    <>
                        <DropdownMenuSeparator className={DEAL_MENU_SEPARATOR_CLASS} />
                        <DropdownMenuItem
                            className={DEAL_MENU_ITEM_CLASS}
                            onClick={(event) =>
                                act(event, () => handlers.onLogContact(deal.id, deal.status))
                            }
                        >
                            <PhoneCall
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                                strokeWidth={1.75}
                            />
                            Log a call
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className={DEAL_MENU_ITEM_CLASS}
                            onClick={(event) => act(event, () => handlers.onMakeOffer(deal.id))}
                        >
                            <Handshake
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                                strokeWidth={1.75}
                            />
                            {deal.offerStatus === "rejected" || deal.offerStatus === "pending"
                                ? "Revise offer"
                                : "Make offer"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={DEAL_MENU_SEPARATOR_CLASS} />
                        {DEAL_STAGE_ORDER.filter((stage) => stage !== deal.status).map((stage) => (
                            <DropdownMenuItem
                                key={stage}
                                className={DEAL_MENU_ITEM_CLASS}
                                onClick={(event) =>
                                    act(event, () => handlers.onAdvance(deal.id, stage))
                                }
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "shrink-0 rounded-full block-2 inline-2",
                                        DEAL_STAGE_META[stage].dotClass,
                                    )}
                                />
                                Move to {DEAL_STAGE_META[stage].label.toLowerCase()}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className={DEAL_MENU_SEPARATOR_CLASS} />
                        <DropdownMenuItem
                            className={DEAL_MENU_ITEM_CLASS}
                            onClick={(event) => act(event, () => handlers.onClose(deal.id))}
                        >
                            <Check
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                                strokeWidth={1.75}
                            />
                            Mark as sold
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className={DEAL_MENU_ITEM_CLASS}
                            variant="destructive"
                            onClick={(event) => act(event, () => handlers.onLose(deal.id))}
                        >
                            <CircleSlash
                                aria-hidden
                                className={cn(DEAL_MENU_ICON_CLASS, "is-danger")}
                                strokeWidth={1.75}
                            />
                            Mark as lost
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuSeparator className={DEAL_MENU_SEPARATOR_CLASS} />
                        <DropdownMenuItem
                            className={DEAL_MENU_ITEM_CLASS}
                            onClick={(event) =>
                                act(event, () => handlers.onReopen(deal.id, "contacted"))
                            }
                        >
                            <Undo2
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                                strokeWidth={1.75}
                            />
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

/**
 * Board deal card — same photo → price → people → CTA rhythm as owned
 * property cards (`OverlayCard`), so Pipeline and Your listings feel like
 * one product. Field actions are labeled Call / WhatsApp; overflow + drag
 * sit on the photo like the property-card menu.
 */
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
    const stageMeta = live ? DEAL_STAGE_META[deal.status as DealStage] : null;
    const canCall = Boolean(deal.buyer.phoneDigits);
    const stageDays = live ? daysInStage(deal) : 0;
    const currentUserId = getStoredUser()?.id ?? null;
    const ignoreCardClickUntilRef = useRef(0);
    const headline = [deal.property.configLabel, formatCardArea(deal.property.areaSqft)]
        .filter(Boolean)
        .join(" · ");
    const locationLabel = `${deal.property.locality}, ${deal.property.city}`;
    const metaParts = [
        live && stageDays >= 1 ? `${stageDays}d in stage` : null,
        deal.property.propertyTypeLabel || null,
    ].filter(Boolean);

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

    function guardMenuAction() {
        // Menu portals unmount on select; the same click can land on the card.
        ignoreCardClickUntilRef.current = Date.now() + 400;
    }

    function openCard() {
        if (isBusy) return;
        if (Date.now() < ignoreCardClickUntilRef.current) return;
        handlers.onView(deal.id);
    }

    function onKeyDown(event: KeyboardEvent<HTMLElement>) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openCard();
        }
    }

    return (
        <article
            aria-label={`${deal.buyer.name} on ${deal.property.title}${isPinned ? ", pinned" : ""}`}
            tabIndex={0}
            onClick={openCard}
            onKeyDown={onKeyDown}
            className={cn(
                `
                  group/marquee relative isolate flex transform-gpu cursor-pointer flex-col
                  overflow-hidden rounded-card border bg-surface shadow-md
                  transition-[box-shadow,border-color] duration-160 inline-full
                  hover:shadow-lg
                `,
                isPinned ? "border-transparent" : "border-border-warm",
                isBusy && "pointer-events-none opacity-60",
                isDragging && "cursor-grabbing opacity-40",
                !live && "bg-surface-muted/40",
            )}
        >
            {isPinned ? (
                <PinnedDashBorder toneClass={stageMeta?.pinnedBorderClass ?? "text-ink-muted"} />
            ) : null}
            <div
                className="
                  pointer-events-none relative z-10 flex flex-1 flex-col gap-2.5 px-4 py-4 text-ink
                  [&_a]:pointer-events-auto [&_button]:pointer-events-auto
                "
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-inline-0">
                        {stageMeta ? (
                            <span
                                className={cn(
                                    `
                                      body-xs inline-flex items-center gap-1.5 rounded-full px-2.5
                                      py-1 font-semibold tracking-wide
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
                                  body-xs inline-flex items-center gap-1.5 rounded-full
                                  bg-surface-muted px-2.5 py-1 font-semibold tracking-wide text-ink
                                "
                            >
                                <OutcomeIcon
                                    aria-hidden
                                    className="block-3 inline-3"
                                    strokeWidth={2}
                                />
                                {outcome.label}
                            </span>
                        ) : null}
                        <span
                            className={cn(
                                `
                                  body-xs inline-flex items-center gap-1.5 rounded-full px-2.5 py-1
                                  font-semibold tracking-wide
                                `,
                                deal.property.isRent
                                    ? "bg-urgent-soft text-urgent"
                                    : "bg-brand-soft text-brand-text",
                            )}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    "rounded-full block-1.5 inline-1.5",
                                    deal.property.isRent ? "bg-urgent-mid" : "bg-success-mid",
                                )}
                            />
                            {deal.property.isRent ? "For rent" : "For sale"}
                        </span>
                    </div>

                    <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
                        {isPinned ? (
                            <span
                                className={cn(
                                    `
                                      flex items-center justify-center rounded-full border
                                      block-control-sm inline-control-sm
                                    `,
                                    stageMeta?.pinnedBadgeClass ??
                                        "border-border-warm bg-surface-muted text-ink-muted",
                                )}
                                aria-label="Pinned to top"
                                title="Pinned to top"
                            >
                                <Pin aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                            </span>
                        ) : null}
                        <DealCardMenu
                            deal={deal}
                            handlers={handlers}
                            isBusy={isBusy}
                            isPinned={isPinned}
                            onMenuAction={guardMenuAction}
                        />
                        {dragHandleProps ? (
                            <DragHandle
                                ref={dragHandleRef}
                                label={`Reorder or move ${deal.buyer.name} on ${deal.property.title}`}
                                {...dragHandleProps}
                            />
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-3 min-inline-0">
                    <DealCoverImage property={deal.property} muted={!live} />

                    <div className="flex flex-1 flex-col gap-1 min-inline-0">
                        <Price
                            amountInr={deal.property.amountInr}
                            isRent={deal.property.isRent}
                            className="h5 font-semibold tracking-wide"
                        />
                        <h3 className="body truncate font-semibold tracking-wide text-ink capitalize">
                            {headline || deal.property.title}
                        </h3>
                        <p
                            className="
                              body-sm flex items-center gap-1.5 tracking-wide text-ink-muted
                              min-inline-0
                            "
                        >
                            <MapPin
                                aria-hidden
                                className="shrink-0 block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                            <span className="truncate capitalize">{locationLabel}</span>
                        </p>
                        {metaParts.length > 0 ? (
                            <p className="body-sm tracking-wide text-ink-muted">
                                {metaParts.join(" · ")}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
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

                <DealPartiesPanel
                    buyer={deal.buyer}
                    owner={deal.owner}
                    assignedAgent={deal.assignedAgent}
                    currentUserId={currentUserId}
                    onOpenBuyer={openCard}
                    onOpenOwner={openCard}
                />

                {live ? (
                    <OverlayCardActions className="flex-col gap-2">
                        {canCall ? (
                            <div className="flex gap-2">
                                <Button
                                    size="md"
                                    variant="outline"
                                    nativeButton={false}
                                    className={cn("flex-1", OVERLAY_GLASS_BUTTON_CLASS)}
                                    render={
                                        <a
                                            href={formatTelUrl(deal.buyer.phoneDigits)}
                                            onClick={stopCard}
                                        />
                                    }
                                >
                                    <Phone
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    Call
                                </Button>
                                <Button
                                    size="md"
                                    variant="outline"
                                    nativeButton={false}
                                    className={cn("flex-1", OVERLAY_GLASS_BUTTON_CLASS)}
                                    render={
                                        <a
                                            href={formatWhatsAppUrl(
                                                deal.buyer.phoneDigits,
                                                whatsappMessage(deal),
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={stopCard}
                                        />
                                    }
                                >
                                    <Icon
                                        icon="bi:whatsapp"
                                        width={16}
                                        height={16}
                                        className="block-4 inline-4"
                                        aria-hidden
                                    />
                                    WhatsApp
                                </Button>
                            </div>
                        ) : null}

                        {primary ? (
                            <Button
                                variant="accent"
                                size="md"
                                disabled={isBusy}
                                className="inline-full font-semibold"
                                onClick={(event) => {
                                    stopCard(event);
                                    primary.onClick();
                                }}
                            >
                                {primary.label}
                            </Button>
                        ) : null}
                    </OverlayCardActions>
                ) : null}
            </div>
        </article>
    );
}
