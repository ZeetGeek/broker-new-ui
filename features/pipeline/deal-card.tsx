"use client";
import { useRef, useState } from "react";

import { formatDateIn } from "@/lib/format/date";
import { formatPhoneIn, formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPropertyCardName } from "@/lib/format/property-card-name";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { CardLink } from "@/components/shared/card-link";
import { DangerMenuItem } from "@/components/shared/danger-menu-item";
import { IconButton } from "@/components/shared/icon-button";
import {
    CallIcon,
    CircleCheck,
    LostIcon,
    MapPin,
    Pin,
    PinOff,
    PropertyMenuIcon,
    WhatsAppIcon,
} from "@/components/shared/icons";
import {
    mobileActionClass,
    MobileActionDrawer,
    mobileActionGroupClass,
} from "@/components/shared/mobile-action-drawer";
import { OverlayCardActions } from "@/components/shared/overlay-card";
import { Price } from "@/components/shared/price";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
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
import { canPutBackOnBoard } from "@/features/pipeline/sale-mode";
import { NegotiationStageBlock } from "@/features/pipeline/stage-blocks/negotiation-stage-block";
import { VisitStageBlock } from "@/features/pipeline/stage-blocks/visit-stage-block";
import { DEAL_STAGE_META, isRevisingOffer, lostReasonLabel } from "@/features/pipeline/stage-meta";
import {
    DEAL_STAGE_ORDER,
    type DealItem,
    type DealProperty,
    type DealStage,
    type DealStatus,
    isLiveStage,
} from "@/features/pipeline/types";

import styles from "./deal-card.module.css";

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

const PINNED_HOVER_COLOR: Record<DealStage, string> = {
    new: "hover:text-stage-1",
    contacted: "hover:text-stage-2",
    visit: "hover:text-stage-3",
    negotiation: "hover:text-stage-4",
};

const CHROME_ICON_BUTTON_CLASS = "shrink-0";

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
  text-sm min-block-10 pointer-coarse:min-block-11 cursor-pointer gap-2.5 rounded-inner px-3 font-medium text-ink
  focus:bg-surface-muted! focus:text-ink!
  data-highlighted:bg-surface-muted! data-highlighted:text-ink!
  not-data-[variant=destructive]:focus:**:text-ink!
  not-data-[variant=destructive]:data-highlighted:**:text-ink!
`;

const DEAL_MENU_ICON_CLASS = "menu-stroke-icon shrink-0 text-ink! block-4.5! inline-4.5!";
const DEAL_MENU_SEPARATOR_CLASS = "my-1";

/** Small square property thumbnail keeps the pipeline card compact. */
function DealCoverImage({ property }: { property: DealProperty }) {
    const src = property.imageSrc || property.imageSrcs?.[0] || null;

    return (
        <PropertyCoverImage
            src={src}
            alt={property.title}
            size={80}
            className={styles.photo}
            draggable={false}
        />
    );
}

function DealCardMenu({
    deal,
    handlers,
    isBusy,
    onMenuAction,
    isPinned = false,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy: boolean;
    isPinned?: boolean;
    /** Called before every menu action so the card can ignore the click-through. */
    onMenuAction?: () => void;
}) {
    const live = isLiveStage(deal.status);
    const mobile = useMobileMenu();
    const [open, setOpen] = useState(false);
    const afterClose = useRef<(() => void) | null>(null);

    function selectMobileAction(action: () => void) {
        onMenuAction?.();
        afterClose.current = action;
        setOpen(false);
    }

    function act(event: { stopPropagation: () => void }, action: () => void) {
        runMenuAction(event, () => {
            onMenuAction?.();
            action();
        });
    }

    const trigger = (
        <IconButton
            size="sm"
            disabled={isBusy}
            aria-label={`More actions for ${deal.buyer.name}`}
            className={CHROME_ICON_BUTTON_CLASS}
            onClick={stopCard}
        >
            <PropertyMenuIcon name="dots" aria-hidden className="block-4 inline-4" />
        </IconButton>
    );

    if (mobile) {
        return (
            <MobileActionDrawer
                open={open}
                onOpenChange={setOpen}
                onOpenChangeComplete={(nextOpen) => {
                    if (nextOpen) return;
                    const action = afterClose.current;
                    afterClose.current = null;
                    action?.();
                }}
                title="Deal actions"
                description={`${deal.buyer.name} · ${deal.property.title}`}
                trigger={trigger}
            >
                <div className={mobileActionGroupClass}>
                    <button
                        type="button"
                        className={mobileActionClass}
                        onClick={() => selectMobileAction(() => handlers.onView(deal.id))}
                    >
                        <PropertyMenuIcon name="view" aria-hidden />
                        View details
                    </button>
                    {live ? (
                        <button
                            type="button"
                            className={mobileActionClass}
                            onClick={() =>
                                selectMobileAction(() =>
                                    handlers.onLogContact(deal.id, deal.status),
                                )
                            }
                        >
                            <PropertyMenuIcon name="phone" aria-hidden />
                            Log a call
                        </button>
                    ) : null}
                    <button
                        type="button"
                        className={mobileActionClass}
                        onClick={() => selectMobileAction(() => handlers.onNote(deal.id))}
                    >
                        <PropertyMenuIcon name="note" aria-hidden />
                        Add a note
                    </button>
                    <button
                        type="button"
                        className={mobileActionClass}
                        onClick={() => selectMobileAction(() => handlers.onPin(deal.id))}
                    >
                        {isPinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
                        {isPinned ? "Unpin deal" : "Pin deal to top"}
                    </button>
                    {live ? (
                        <button
                            type="button"
                            className={mobileActionClass}
                            disabled={isBusy || deal.property.isSold}
                            onClick={() => selectMobileAction(() => handlers.onMakeOffer(deal.id))}
                        >
                            <PropertyMenuIcon name="handshake" aria-hidden />
                            {FEATURE_PLATFORM_OWNER
                                ? isRevisingOffer(deal.offerStatus)
                                    ? "Revise offer"
                                    : "Make offer"
                                : deal.offerAmountInr != null
                                  ? "Update offer"
                                  : "Record offer"}
                        </button>
                    ) : null}
                </div>

                {live || canPutBackOnBoard(deal) ? (
                    <div className={mobileActionGroupClass}>
                        {live ? (
                            <>
                                {DEAL_STAGE_ORDER.filter((stage) => stage !== deal.status).map(
                                    (stage) => (
                                        <button
                                            key={stage}
                                            type="button"
                                            className={mobileActionClass}
                                            onClick={() =>
                                                selectMobileAction(() =>
                                                    handlers.onAdvance(deal.id, stage),
                                                )
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
                                        </button>
                                    ),
                                )}
                                <button
                                    type="button"
                                    className={mobileActionClass}
                                    onClick={() =>
                                        selectMobileAction(() => handlers.onClose(deal.id))
                                    }
                                >
                                    <PropertyMenuIcon name="check" aria-hidden />
                                    Mark as sold
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className={mobileActionClass}
                                onClick={() =>
                                    selectMobileAction(() =>
                                        handlers.onReopen(deal.id, "contacted"),
                                    )
                                }
                            >
                                <PropertyMenuIcon name="reopen" aria-hidden />
                                Put back on the board
                            </button>
                        )}
                    </div>
                ) : null}

                {live ? (
                    <div className={mobileActionGroupClass}>
                        <button
                            type="button"
                            className={mobileActionClass}
                            data-destructive="true"
                            onClick={() => selectMobileAction(() => handlers.onLose(deal.id))}
                        >
                            <PropertyMenuIcon name="lost" aria-hidden />
                            Mark as lost
                        </button>
                    </div>
                ) : null}
            </MobileActionDrawer>
        );
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger render={trigger} />

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
                    {live ? (
                        <DropdownMenuItem
                            className={DEAL_MENU_ITEM_CLASS}
                            disabled={isBusy || deal.property.isSold}
                            onClick={(event) => act(event, () => handlers.onMakeOffer(deal.id))}
                        >
                            <PropertyMenuIcon
                                name="handshake"
                                aria-hidden
                                className={DEAL_MENU_ICON_CLASS}
                            />
                            {FEATURE_PLATFORM_OWNER
                                ? isRevisingOffer(deal.offerStatus)
                                    ? "Revise offer"
                                    : "Make offer"
                                : deal.offerAmountInr != null
                                  ? "Update offer"
                                  : "Record offer"}
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
                    ) : !canPutBackOnBoard(deal) ? null : (
                        // On a sold property only the sold deal of the broker's own
                        // listing comes back (the property is then available again).
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
                {live ? (
                    <>
                        <DropdownMenuSeparator className={DEAL_MENU_SEPARATOR_CLASS} />
                        <DropdownMenuGroup aria-label="Mark deal as lost">
                            <DangerMenuItem
                                label="Mark as lost"
                                icon="lost"
                                onSelect={() => {
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

function StageMiddle({ deal, onMakeOffer }: { deal: DealItem; onMakeOffer?: () => void }) {
    // Keep the saved offer visible even if the broker later changes the stage.
    return (
        <>
            {deal.status === "visit" ? <VisitStageBlock deal={deal} /> : null}
            {deal.offerAmountInr != null || deal.status === "negotiation" ? (
                <NegotiationStageBlock deal={deal} onMakeOffer={onMakeOffer} />
            ) : null}
        </>
    );
}

/**
 * Board deal card — same photo → price → people → CTA rhythm as owned
 * property cards (`OverlayCard`), so Pipeline and My Listings feel like
 * one product. Field actions are labeled Call / WhatsApp; pin and overflow
 * sit on the photo like the property-card menu.
 */
export function DealCard({
    deal,
    handlers,
    isBusy = false,
    isDragging = false,
    isPinned = false,
}: {
    deal: DealItem;
    handlers: DealCardHandlers;
    isBusy?: boolean;
    isDragging?: boolean;
    isPinned?: boolean;
}) {
    const live = isLiveStage(deal.status);
    const resolved = deal.resolvedAt ? new Date(deal.resolvedAt) : null;
    const hasResolvedDate = resolved != null && Number.isFinite(resolved.getTime());
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

    return (
        <article
            aria-label={`${deal.buyer.name} on ${deal.property.title}${isPinned ? ", pinned" : ""}`}
            data-linked-card
            className={cn(
                `
                  group/marquee relative isolate flex transform-gpu cursor-pointer flex-col
                  overflow-hidden rounded-card border bg-surface shadow-md
                  transition-[box-shadow,border-color] duration-160 inline-full
                  hover:shadow-lg
                `,
                styles.card,
                "border-border-warm",
                isBusy && "pointer-events-none opacity-60",
                isDragging && "cursor-grabbing opacity-40",
                !live && "block-full",
            )}
        >
            {!isBusy && !isDragging ? (
                <CardLink
                    href={`/broker/pipeline/${encodeURIComponent(deal.id)}`}
                    label={`Open ${deal.buyer.name} on ${deal.property.title}`}
                    onOpen={openCard}
                />
            ) : null}
            <div
                className={cn(
                    "pointer-events-none relative z-10 flex flex-1 flex-col gap-3 text-ink [&_a]:pointer-events-auto [&_button]:pointer-events-auto",
                    styles.panel,
                )}
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-inline-0">
                        <Badge
                            color={deal.property.isRent ? "orange" : "emerald"}
                            className="px-2 py-0.75"
                        >
                            {deal.property.isRent ? "For rent" : "For sale"}
                        </Badge>
                    </div>

                    <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <IconButton
                                        size="sm"
                                        type="button"
                                        disabled={isBusy}
                                        aria-label={
                                            isPinned ? "Unpin property" : "Pin property to top"
                                        }
                                        aria-pressed={isPinned}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handlers.onPin(deal.id);
                                        }}
                                        className={cn(
                                            CHROME_ICON_BUTTON_CLASS,
                                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
                                            isPinned && "bg-current/10 hover:bg-current/20",
                                            isPinned &&
                                                (stageMeta?.labelClass ?? "text-brand-text"),
                                            isPinned &&
                                                (live
                                                    ? PINNED_HOVER_COLOR[deal.status as DealStage]
                                                    : "hover:text-brand-text"),
                                        )}
                                    />
                                }
                            >
                                {isPinned ? (
                                    <PinOff
                                        aria-hidden
                                        className="block-3.5 inline-3.5"
                                        strokeWidth={1.75}
                                    />
                                ) : (
                                    <Pin
                                        aria-hidden
                                        className="block-3.5 inline-3.5"
                                        strokeWidth={1.75}
                                    />
                                )}
                            </TooltipTrigger>
                            <TooltipContent>
                                {isPinned ? "Unpin property" : "Pin property to top"}
                            </TooltipContent>
                        </Tooltip>
                        <DealCardMenu
                            deal={deal}
                            handlers={handlers}
                            isBusy={isBusy}
                            onMenuAction={guardMenuAction}
                            isPinned={isPinned}
                        />
                    </div>
                </div>
                <div className={styles.summary}>
                    <DealCoverImage property={deal.property} />
                    <div className={styles.summaryDetails}>
                        <PriceWithCommission
                            amountInr={deal.property.amountInr}
                            isRent={deal.property.isRent}
                            commissionPercent={deal.property.commissionPercent}
                            commissionAmountInr={deal.property.commissionAmountInr}
                            audience="broker"
                            size="md"
                            className={styles.askPrice}
                            showEmptyTip
                        />
                        <h3 className="body-sm font-semibold text-ink capitalize min-inline-0">
                            <Link
                                data-card-title
                                href={`/broker/pipeline/${encodeURIComponent(deal.id)}`}
                                prefetch={false}
                                draggable={false}
                                className={styles.titleLink}
                                title={headline || deal.property.title}
                                onClick={stopCard}
                                onNavigate={(event) => {
                                    event.preventDefault();
                                    openCard();
                                }}
                            >
                                {headline || deal.property.title}
                            </Link>
                        </h3>
                        {locationLabel ? (
                            <p
                                className="
                              body-xs flex items-start gap-1.5 tracking-wide text-ink-muted
                              min-inline-0
                            "
                            >
                                <MapPin
                                    aria-hidden
                                    className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="wrap-anywhere capitalize min-inline-0">
                                    {locationLabel}
                                </span>
                            </p>
                        ) : null}
                    </div>
                </div>

                <StageMiddle
                    deal={deal}
                    onMakeOffer={
                        live && !isBusy && !deal.property.isSold
                            ? () => handlers.onMakeOffer(deal.id)
                            : undefined
                    }
                />

                {!live ? (
                    <div
                        className={cn(
                            styles.outcome,
                            "rounded-inner border",
                            deal.status === "closed"
                                ? "border-stage-4-soft/70 bg-stage-4-soft/15 text-brand-text"
                                : "border-danger/20 bg-danger-soft/40 text-danger",
                        )}
                    >
                        <div className={styles.outcomeHeader}>
                            <p className="body-xs flex items-center gap-1.5 font-semibold min-inline-0">
                                {deal.status === "closed" ? (
                                    <CircleCheck
                                        aria-hidden
                                        className="shrink-0 block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                ) : (
                                    <LostIcon
                                        aria-hidden
                                        className="shrink-0 block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                )}
                                {deal.status === "closed" ? "Completed" : "Lost"}
                            </p>
                            <p className="body-xs shrink-0 whitespace-nowrap text-inherit tabular-nums">
                                {hasResolvedDate ? (
                                    <time dateTime={deal.resolvedAt!}>
                                        {formatDateIn(resolved)}
                                    </time>
                                ) : (
                                    "Date unavailable"
                                )}
                            </p>
                        </div>
                        {deal.status === "closed" ? (
                            deal.closedAmountInr != null && deal.closedAmountInr > 0 ? (
                                <p className={styles.outcomeAmount}>
                                    <span className="body-xs text-brand-text">Closed at</span>
                                    <Price
                                        amountInr={deal.closedAmountInr}
                                        isRent={deal.property.isRent}
                                        className="body-sm font-semibold text-brand-text"
                                    />
                                </p>
                            ) : (
                                <p className="body-xs text-brand-text">
                                    Closing amount not recorded
                                </p>
                            )
                        ) : (
                            <p className="body-xs leading-relaxed wrap-anywhere text-danger">
                                <span className="sr-only">Reason: </span>
                                {deal.lostReason
                                    ? lostReasonLabel(deal.lostReason)
                                    : "No reason recorded"}
                            </p>
                        )}
                    </div>
                ) : null}

                <DealPartiesPanel
                    textSize={live ? "xs" : "sm"}
                    buyer={deal.buyer}
                    owner={deal.owner}
                    onOpenBuyer={openCard}
                    onOpenOwner={openCard}
                />

                <OverlayCardActions className="flex-col gap-2">
                    {/* The owner's phone does not depend on the client's: a
                        client with no number must not hide "Call owner". */}
                    {canCall || ownerPhone ? (
                        <div className={styles.contactActions}>
                            {canCall ? (
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Button
                                                size="md"
                                                variant="outline"
                                                nativeButton={false}
                                                className={cn(
                                                    live ? "text-xs" : "text-sm",
                                                    styles.contactButton,
                                                )}
                                                render={
                                                    <a
                                                        href={formatWhatsAppUrl(
                                                            deal.buyer.phoneDigits,
                                                            whatsappMessage(deal),
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`WhatsApp client ${deal.buyer.name} at ${formatPhoneIn(deal.buyer.phoneDigits)}`}
                                                        onClick={stopCard}
                                                    />
                                                }
                                            />
                                        }
                                    >
                                        <WhatsAppIcon
                                            aria-hidden
                                            strokeWidth={1.75}
                                            className="shrink-0 block-4.5 inline-4.5"
                                        />
                                        WhatsApp
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {formatPhoneIn(deal.buyer.phoneDigits)}
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            size="md"
                                            variant="accent"
                                            nativeButton={!ownerPhone}
                                            disabled={!ownerPhone}
                                            className={cn(
                                                live ? "text-xs" : "text-sm",
                                                styles.contactButton,
                                            )}
                                            render={
                                                ownerPhone ? (
                                                    <a
                                                        href={formatTelUrl(ownerPhone)}
                                                        aria-label={`Call owner ${deal.owner.name} at ${formatPhoneIn(ownerPhone)}`}
                                                        onClick={stopCard}
                                                    />
                                                ) : undefined
                                            }
                                        />
                                    }
                                >
                                    <CallIcon
                                        aria-hidden
                                        className="shrink-0 block-4.5 inline-4.5"
                                        strokeWidth={1.75}
                                    />
                                    Call owner
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    {ownerPhone
                                        ? formatPhoneIn(ownerPhone)
                                        : "Owner contact unavailable"}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : null}
                </OverlayCardActions>
            </div>
        </article>
    );
}
