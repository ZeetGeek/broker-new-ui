"use client";

import { type KeyboardEvent, useLayoutEffect, useRef, useState } from "react";

import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPropertyCardName } from "@/lib/format/property-card-name";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { HoldToConfirmMenuItem } from "@/components/shared/hold-to-confirm-menu-item";
import {
    Building2,
    CallIcon,
    GripVertical,
    MapPin,
    Pin,
    PropertyMenuIcon,
    WhatsAppIcon,
} from "@/components/shared/icons";
import { OVERLAY_GLASS_BUTTON_CLASS, OverlayCardActions } from "@/components/shared/overlay-card";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";
import { DealPartiesPanel } from "@/features/pipeline/deal-parties-panel";
import { NegotiationStageBlock } from "@/features/pipeline/stage-blocks/negotiation-stage-block";
import { VisitStageBlock } from "@/features/pipeline/stage-blocks/visit-stage-block";
import { DEAL_OUTCOME_META, DEAL_STAGE_META, isOutcome } from "@/features/pipeline/stage-meta";
import {
    DEAL_STAGE_ORDER,
    type DealItem,
    type DealProperty,
    type DealStage,
    type DealStatus,
    isLiveStage,
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

function stopCard(event: { stopPropagation: () => void }) {
    event.stopPropagation();
}

/** Menu actions must not bubble — a click-through after the menu closes would open the deal. */
function runMenuAction(event: { stopPropagation: () => void }, action: () => void) {
    event.stopPropagation();
    action();
}

const CHROME_ICON_BUTTON_CLASS = `
  flex shrink-0 items-center justify-center rounded-full border border-border-warm bg-surface
  text-ink-muted block-control-sm inline-control-sm
  hover:border-ink/20 hover:bg-surface-muted hover:text-ink
`;

/** Same surface, row rhythm, and hover treatment as the property listing menu. */
const DEAL_MENU_SURFACE_CLASS = `
  t-dropdown t-profile-menu animate-none! min-inline-56 rounded-card border border-border-warm
  bg-surface p-1.5 text-ink shadow-xl ring-0
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
  body-sm min-block-11 cursor-pointer gap-3 rounded-inner px-3 font-medium text-ink
  focus:bg-surface-muted! focus:text-ink!
  data-highlighted:bg-surface-muted! data-highlighted:text-ink!
  not-data-[variant=destructive]:focus:**:text-ink!
  not-data-[variant=destructive]:data-highlighted:**:text-ink!
`;

const DEAL_MENU_ICON_CLASS = "menu-stroke-icon shrink-0 text-ink! block-4.5! inline-4.5!";
const DEAL_MENU_SEPARATOR_CLASS = "mx-1.5 my-1.5 bg-border-warm";

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
            className={cn("pointer-events-none absolute inset-0 z-1 overflow-visible", toneClass)}
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
              relative aspect-square shrink-0 overflow-hidden rounded-[8px] bg-surface-muted
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
                <div
                    className="
                      flex items-center justify-center text-ink-subtle block-full inline-full
                    "
                >
                    <Building2 className="block-6 inline-6" strokeWidth={1.5} />
                </div>
            )}
            {extraCount > 0 ? (
                <span
                    className="
                      body-xs absolute inset-e-1 inset-be-1 rounded-full bg-ink/65 px-1.5 py-0.5
                      font-semibold text-surface tabular-nums
                    "
                >
                    +{extraCount}
                </span>
            ) : null}
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
                            "cursor-grab touch-none active:cursor-grabbing",
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
    const [open, setOpen] = useState(false);

    function act(event: { stopPropagation: () => void }, action: () => void) {
        runMenuAction(event, () => {
            onMenuAction?.();
            action();
        });
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
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
                <PropertyMenuIcon name="dots" aria-hidden className="block-4 inline-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className={DEAL_MENU_SURFACE_CLASS}
                onClick={stopCard}
                onPointerDown={stopCard}
            >
                <DropdownMenuGroup aria-label="Work on this deal">
                    <DropdownMenuItem
                        className={DEAL_MENU_ITEM_CLASS}
                        onClick={(event) => act(event, () => handlers.onView(deal.id))}
                    >
                        <PropertyMenuIcon
                            name="view"
                            aria-hidden
                            className={DEAL_MENU_ICON_CLASS}
                        />
                        View details
                    </DropdownMenuItem>
                    {live ? (
                        <DropdownMenuItem
                            className={DEAL_MENU_ITEM_CLASS}
                            onClick={(event) =>
                                act(event, () => handlers.onLogContact(deal.id, deal.status))
                            }
                        >
                            <PropertyMenuIcon
                                name="phone"
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                            />
                            Log a call
                        </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                        className={DEAL_MENU_ITEM_CLASS}
                        onClick={(event) => act(event, () => handlers.onNote(deal.id))}
                    >
                        <PropertyMenuIcon
                            name="note"
                            aria-hidden
                            className={DEAL_MENU_ICON_CLASS}
                        />
                        Add a note
                    </DropdownMenuItem>
                    {live && FEATURE_PLATFORM_OWNER ? (
                        <DropdownMenuItem
                            className={DEAL_MENU_ITEM_CLASS}
                            onClick={(event) => act(event, () => handlers.onMakeOffer(deal.id))}
                        >
                            <PropertyMenuIcon
                                name="handshake"
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                            />
                            {deal.offerStatus === "rejected" || deal.offerStatus === "pending"
                                ? "Revise offer"
                                : "Make offer"}
                        </DropdownMenuItem>
                    ) : null}
                </DropdownMenuGroup>
                <DropdownMenuSeparator className={DEAL_MENU_SEPARATOR_CLASS} />
                <DropdownMenuGroup aria-label="Deal progress">
                    {live ? (
                        <>
                            {DEAL_STAGE_ORDER.filter((stage) => stage !== deal.status).map(
                                (stage) => (
                                    <DropdownMenuItem
                                        key={stage}
                                        className={DEAL_MENU_ITEM_CLASS}
                                        onClick={(event) =>
                                            act(event, () => handlers.onAdvance(deal.id, stage))
                                        }
                                    >
                                        <span
                                            aria-hidden
                                            className="flex shrink-0 items-center justify-center block-4.5 inline-4.5"
                                        >
                                            <span
                                                className={cn(
                                                    "rounded-full block-2 inline-2",
                                                    DEAL_STAGE_META[stage].dotClass,
                                                )}
                                            />
                                        </span>
                                        Move to {DEAL_STAGE_META[stage].label.toLowerCase()}
                                    </DropdownMenuItem>
                                ),
                            )}
                            <DropdownMenuItem
                                className={DEAL_MENU_ITEM_CLASS}
                                onClick={(event) => act(event, () => handlers.onClose(deal.id))}
                            >
                                <PropertyMenuIcon
                                    name="check"
                                    aria-hidden
                                    className={DEAL_MENU_ICON_CLASS}
                                />
                                Mark as sold
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <DropdownMenuItem
                            className={DEAL_MENU_ITEM_CLASS}
                            onClick={(event) =>
                                act(event, () => handlers.onReopen(deal.id, "contacted"))
                            }
                        >
                            <PropertyMenuIcon
                                name="reopen"
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                            />
                            Put back on the board
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator className={DEAL_MENU_SEPARATOR_CLASS} />
                <DropdownMenuGroup aria-label="Organize this deal">
                    <DropdownMenuItem
                        closeOnClick={false}
                        className={DEAL_MENU_ITEM_CLASS}
                        onClick={(event) => act(event, () => handlers.onPin(deal.id))}
                    >
                        {isPinned ? (
                            <PropertyMenuIcon
                                name="unpin"
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                            />
                        ) : (
                            <PropertyMenuIcon
                                name="pin"
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                            />
                        )}
                        {isPinned ? "Unpin" : "Pin to top"}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                {live ? (
                    <>
                        <DropdownMenuSeparator className={DEAL_MENU_SEPARATOR_CLASS} />
                        <DropdownMenuGroup aria-label="Mark deal as lost">
                            <HoldToConfirmMenuItem
                                label="Hold to mark as lost"
                                icon="lost"
                                onComplete={() => {
                                    onMenuAction?.();
                                    setOpen(false);
                                    handlers.onLose(deal.id);
                                }}
                            />
                        </DropdownMenuGroup>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function StageMiddle({ deal }: { deal: DealItem }) {
    if (deal.status === "visit") return <VisitStageBlock deal={deal} />;
    if (deal.status === "negotiation") return <NegotiationStageBlock deal={deal} />;
    return null;
}

/**
 * Board deal card — same photo → price → people → CTA rhythm as owned
 * property cards (`OverlayCard`), so Pipeline and My Listings feel like
 * one product. Field actions are labeled Call / WhatsApp; overflow + drag
 * sit on the photo like the property-card menu.
 */
export function DealCard({
    deal,
    handlers,
    isBusy = false,
    isDragging = false,
    isPinned = false,
    dragHandleRef,
    dragHandleProps,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy?: boolean;
    isDragging?: boolean;
    isPinned?: boolean;
    /** dnd-kit's activator ref. Marks the handle as what starts a drag. */
    dragHandleRef?: (element: HTMLElement | null) => void;
    /** Listeners + a11y attributes for the handle. Absent on a static card. */
    dragHandleProps?: Record<string, unknown>;
}) {
    const live = isLiveStage(deal.status);
    const outcome = isOutcome(deal.status) ? DEAL_OUTCOME_META[deal.status] : null;
    const OutcomeIcon = outcome?.icon;
    const stageMeta = live ? DEAL_STAGE_META[deal.status as DealStage] : null;
    const canCall = Boolean(deal.buyer.phoneDigits);
    const ownerPhone = deal.owner.isRepresentationActive ? deal.owner.phoneDigits : undefined;
    const ignoreCardClickUntilRef = useRef(0);
    const headline =
        formatPropertyCardName(deal.property.propertyTypeLabel, deal.property.areaSqft, {
            bhk: deal.property.bhk,
        }) || deal.property.configLabel;
    const locationLabel = [
        ...new Set([deal.property.locality, deal.property.city].filter(Boolean)),
    ].join(", ");

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
                  pointer-events-none relative z-10 flex flex-1 flex-col gap-2.5 p-4 text-ink
                  [&_a]:pointer-events-auto
                  [&_button]:pointer-events-auto
                "
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-inline-0">
                        {outcome && OutcomeIcon ? (
                            <Badge color={deal.status === "closed" ? "emerald" : "stone"}>
                                <OutcomeIcon
                                    aria-hidden
                                    className="block-3 inline-3"
                                    strokeWidth={2}
                                />
                                {outcome.label}
                            </Badge>
                        ) : null}
                        <Badge color={deal.property.isRent ? "orange" : "emerald"}>
                            {deal.property.isRent ? "For rent" : "For sale"}
                        </Badge>
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
                        <PriceWithCommission
                            amountInr={deal.property.amountInr}
                            isRent={deal.property.isRent}
                            commissionPercent={deal.property.commissionPercent}
                            commissionAmountInr={deal.property.commissionAmountInr}
                            audience="broker"
                            size="lg"
                            showEmptyTip
                        />
                        <h3
                            className="
                              body truncate font-semibold tracking-wide text-ink capitalize
                            "
                        >
                            {headline || deal.property.title}
                        </h3>
                        {locationLabel ? (
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
                        ) : null}
                    </div>
                </div>

                {deal.status === "visit" || deal.status === "negotiation" ? (
                    <StageMiddle deal={deal} />
                ) : null}

                <DealPartiesPanel
                    buyer={deal.buyer}
                    owner={deal.owner}
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
                                    className={cn(
                                        "flex-1 min-inline-0",
                                        OVERLAY_GLASS_BUTTON_CLASS,
                                    )}
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
                                    <WhatsAppIcon className="block-4 inline-4" aria-hidden />
                                    WhatsApp
                                </Button>
                                <Button
                                    size="md"
                                    variant="accent"
                                    nativeButton={!ownerPhone}
                                    disabled={!ownerPhone}
                                    className="flex-1 min-inline-0"
                                    render={
                                        ownerPhone ? (
                                            <a href={formatTelUrl(ownerPhone)} onClick={stopCard} />
                                        ) : undefined
                                    }
                                >
                                    <CallIcon
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    Call Owner
                                </Button>
                            </div>
                        ) : null}
                    </OverlayCardActions>
                ) : null}
            </div>
        </article>
    );
}
