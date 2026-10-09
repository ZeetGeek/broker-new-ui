"use client";

import { type MouseEvent, type PointerEvent, useEffect, useState } from "react";
import Link from "next/link";

import useEmblaCarousel from "embla-carousel-react";
import {
    Bath,
    BedDouble,
    Building2,
    Calendar,
    Camera,
    Check,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    Clock,
    MapPin,
    Maximize2,
    MessageCircle,
    Send,
    UserPlus,
    UserRound,
    Users,
    Trash2,
} from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import {
    defaultPriceMode,
    type ListingPriceMode,
    offersBoth,
    offersRent,
    offersSale,
} from "@/lib/format/listing-availability";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { formatRepresentationExpiry, formatRepresentedSince } from "@/lib/format/representation";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { HoverScaleLayer, HoverScaleRoot } from "@/components/shared/hover-scale-media";
import {
    OVERLAY_GLASS_BUTTON_CLASS,
    OverlayCard,
    OverlayCardActions,
    OverlayCardSummary,
    OverlayChip,
    OverlayPersonLine,
} from "@/components/shared/overlay-card";
import { AttachedBuyersRow, AttachedOwnerRow } from "@/components/shared/attached-people-row";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { PropertyCardMenu } from "@/components/shared/property-card-menu";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { TextSegmentedToggle } from "@/components/shared/text-segmented-toggle";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PROPERTY_CARD_PHOTO_CLASS = "relative shrink-0 overflow-hidden bg-surface-muted h-40 w-full";

const BROWSE_CARD_PHOTO_FRAME_CLASS =
    "shrink-0 rounded-card p-1 shadow-md transition-[box-shadow,background] duration-160 group-hover:shadow-lg w-full";
const BROWSE_CARD_PHOTO_FRAME_DEFAULT_CLASS = "bg-surface";
const BROWSE_CARD_PHOTO_FRAME_NEW_CLASS = `
  bg-gradient-to-br from-highlight via-brand-soft to-brand/55
  shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-highlight)_35%,transparent),var(--shadow-md)]
  group-hover:shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-highlight)_50%,transparent),var(--shadow-lg)]
`;

const BROWSE_CARD_PHOTO_INNER_CLASS =
    "relative overflow-hidden rounded-[calc(var(--radius-card)-4px)] bg-surface-muted aspect-[4/3] w-full";

const BROWSE_CARD_PHOTO_NAV_BTN_CLASS = `
  absolute z-10 flex -translate-y-1/2 items-center justify-center
  rounded-control bg-surface/95 text-ink transition-[opacity,transform] duration-160
  block-7 inline-7
  shadow-[inset_0_-2px_0_0_rgba(111,123,144,0.1)]
  hover:bg-surface
  disabled:pointer-events-none disabled:opacity-0
  focus-visible:opacity-100 focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-ring/40
`;

const RESIDENTIAL_PROPERTY_TYPES = new Set(["apartment", "villa", "penthouse"]);

const BROWSE_ASK_LABEL = "Ask to sell";
const BROWSE_ASK_PENDING_LABEL = "Sending…";
const BROWSE_WITHDRAW_LABEL = "Withdraw";
const BROWSE_WITHDRAWING_LABEL = "Withdrawing…";
const BROWSE_REPRESENTING_LABEL = "You're representing";
const BROWSE_INVITE_ACCEPT_LABEL = "Accept";
const BROWSE_INVITE_ACCEPTING_LABEL = "Accepting…";
const BROWSE_INVITE_DECLINE_LABEL = "Decline";
const BROWSE_INVITE_DECLINING_LABEL = "Declining…";

const PROPERTY_CARD_TITLE_CLASS = "body truncate font-semibold tracking-wide text-ink capitalize";
const PROPERTY_CARD_LOCATION_CLASS = `
  body-sm flex items-center gap-1.5 tracking-wide text-ink-muted min-inline-0
`;
const PROPERTY_CARD_SPECS_CLASS = `
  body-sm flex flex-nowrap items-center gap-x-1.5 overflow-hidden tracking-wide text-ink-muted
`;

const BROWSE_STATUS = {
    waiting: "Waiting for the owner",
    invited: "Owner invited you",
    representing: "You can work this listing",
} as const;

const BROWSE_REQUEST_TOOLTIP = {
    idle: "Ask the owner for permission to sell this property",
    pending: "Sending your request…",
    withdraw: "Take back your request. You can ask again later.",
    withdrawing: "Withdrawing your request…",
    representing: "The owner already approved you for this listing",
    inviteAccept: "Accept the invite and get the owner's number",
    inviteDecline: "Turn this down. The owner can ask someone else",
} as const;

function BrowseActionHint({ children }: { children: string }) {
    return (
        <p className="body-xs text-center font-medium tracking-wide text-ink-muted">{children}</p>
    );
}

function BrowseRequestAction({
    hasRequested,
    isRepresenting,
    isInvitePending,
    isRequestPending,
    inviteActionPending,
    onRequest,
    onCancelRequest,
    onAcceptInvite,
    onCancelInvite,
    tone = "light",
}: {
    hasRequested: boolean;
    isRepresenting?: boolean;
    isInvitePending?: boolean;
    isRequestPending: boolean;
    inviteActionPending?: "accept" | "cancel";
    onRequest?: () => void;
    onCancelRequest?: () => void;
    onAcceptInvite?: () => void;
    onCancelInvite?: () => void;
    /** `overlay` = white listing-card panel; `light` = list-row chrome. */
    tone?: "light" | "overlay";
}) {
    const canWithdraw = Boolean(hasRequested && onCancelRequest);
    const canRespondToInvite = Boolean(isInvitePending && onAcceptInvite && onCancelInvite);
    const inviteBusy = Boolean(inviteActionPending);
    const outlineClass =
        tone === "overlay"
            ? OVERLAY_GLASS_BUTTON_CLASS
            : "border-2 border-border-warm bg-surface text-ink hover:border-ink/25 hover:bg-surface-muted";
    const representingClass = cn(
        `
          body-sm flex items-center justify-center gap-2 rounded-control px-4 font-semibold
          block-control-lg inline-full
        `,
        tone === "overlay"
            ? "border-2 border-brand/25 bg-brand-soft text-brand-text"
            : "border-2 border-brand bg-brand-soft text-brand-text",
    );

    if (isRepresenting) {
        return (
            <div className="flex flex-col gap-1.5 inline-full">
                <BrowseActionHint>{BROWSE_STATUS.representing}</BrowseActionHint>
                <div role="status" className={representingClass}>
                    <CircleCheck
                        aria-hidden
                        className="shrink-0 block-4 inline-4"
                        strokeWidth={2}
                    />
                    {BROWSE_REPRESENTING_LABEL}
                </div>
            </div>
        );
    }

    if (canRespondToInvite) {
        return (
            <TooltipProvider>
                <div className="flex flex-col gap-1.5 inline-full">
                    <BrowseActionHint>{BROWSE_STATUS.invited}</BrowseActionHint>
                    <div className="flex gap-2">
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <span className="inline-flex flex-1">
                                        <Button
                                            type="button"
                                            size="md"
                                            variant="outline"
                                            className={cn("inline-full", outlineClass)}
                                            disabled={inviteBusy}
                                            loading={inviteActionPending === "cancel"}
                                            onClick={onCancelInvite}
                                        >
                                            {inviteActionPending === "cancel"
                                                ? BROWSE_INVITE_DECLINING_LABEL
                                                : BROWSE_INVITE_DECLINE_LABEL}
                                        </Button>
                                    </span>
                                }
                            />
                            <TooltipContent side="top" className="text-center max-inline-xs">
                                {BROWSE_REQUEST_TOOLTIP.inviteDecline}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <span className="inline-flex flex-[1.5]">
                                        <Button
                                            type="button"
                                            size="md"
                                            variant="accent"
                                            className="inline-full"
                                            disabled={inviteBusy}
                                            loading={inviteActionPending === "accept"}
                                            onClick={onAcceptInvite}
                                        >
                                            {inviteActionPending === "accept" ? (
                                                BROWSE_INVITE_ACCEPTING_LABEL
                                            ) : (
                                                <>
                                                    <Check
                                                        aria-hidden
                                                        className="block-4 inline-4"
                                                        strokeWidth={2}
                                                    />
                                                    {BROWSE_INVITE_ACCEPT_LABEL}
                                                </>
                                            )}
                                        </Button>
                                    </span>
                                }
                            />
                            <TooltipContent side="top" className="text-center max-inline-xs">
                                {BROWSE_REQUEST_TOOLTIP.inviteAccept}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </TooltipProvider>
        );
    }

    if (canWithdraw) {
        return (
            <TooltipProvider>
                <div className="flex flex-col gap-1.5 inline-full">
                    <BrowseActionHint>{BROWSE_STATUS.waiting}</BrowseActionHint>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <span className="inline-flex inline-full">
                                    <Button
                                        type="button"
                                        size="md"
                                        variant="outline"
                                        className={cn("inline-full", outlineClass)}
                                        disabled={isRequestPending}
                                        loading={isRequestPending}
                                        onClick={onCancelRequest}
                                    >
                                        {isRequestPending
                                            ? BROWSE_WITHDRAWING_LABEL
                                            : BROWSE_WITHDRAW_LABEL}
                                    </Button>
                                </span>
                            }
                        />
                        <TooltipContent side="top" className="text-center max-inline-xs">
                            {isRequestPending
                                ? BROWSE_REQUEST_TOOLTIP.withdrawing
                                : BROWSE_REQUEST_TOOLTIP.withdraw}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <span className="inline-flex inline-full">
                            <Button
                                type="button"
                                size="md"
                                variant="accent"
                                className="inline-full"
                                disabled={isRequestPending}
                                loading={isRequestPending}
                                onClick={onRequest}
                            >
                                {isRequestPending ? (
                                    BROWSE_ASK_PENDING_LABEL
                                ) : (
                                    <>
                                        <Send
                                            aria-hidden
                                            className="block-4 inline-4"
                                            strokeWidth={1.75}
                                        />
                                        {BROWSE_ASK_LABEL}
                                    </>
                                )}
                            </Button>
                        </span>
                    }
                />
                <TooltipContent side="top" className="text-center max-inline-xs">
                    {isRequestPending
                        ? BROWSE_REQUEST_TOOLTIP.pending
                        : BROWSE_REQUEST_TOOLTIP.idle}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export type PropertyCardOwner = {
    name: string;
    avatarUrl?: string;
    phoneDigits?: string;
    /** Where the owner is based, e.g. "Adajan, Surat". Hidden when absent. */
    locationLabel?: string;
    /** Broker-facing owner profile. Name becomes a link when set. */
    profileHref?: string;
};

type PropertyCardBase = {
    id: string;
    configLabel: string;
    propertyTypeLabel: string;
    areaSqft: number;
    amountInr: number;
    isRent: boolean;
    imageSrc?: string | null;
    /** Gallery for browse card carousel. Falls back to `[imageSrc]` when absent. */
    imageSrcs?: string[];
    photoCount: number;
    isNew?: boolean;
    owner: PropertyCardOwner;
};

export type BrowsePropertyCardListing = PropertyCardBase & {
    title: string;
    locality: string;
    city: string;
    bhk: number;
    brokerSlotsOpen: number;
    brokerSlotsTotal: number;
    commissionPercent: number;
    /** Fixed rent brokerage in INR. 0 when unset. */
    commissionAmount: number;
    hasRequested: boolean;
    isRepresenting?: boolean;
    isInvitePending?: boolean;
    pendingRepresentationId?: string;
    pendingInvitationId?: string;
    saleAmountInr: number | null;
    rentAmountInr: number | null;
};

export type RepresentedPropertyCardListing = PropertyCardBase & {
    fullAddress: string;
    representedSince: Date;
    representationEndsAt: Date;
    sharedBrokerCount: number;
    visitsBookedCount: number;
    clientsMatchedCount: number;
};

export type OwnedPropertyCardStatus = "draft" | "published" | "unpublished";

export type OwnedPropertyCardListing = Omit<PropertyCardBase, "owner"> & {
    title: string;
    locality: string;
    city: string;
    bhk: number;
    status: OwnedPropertyCardStatus;
    inboundRequestCount: number;
    listedDaysAgo: number;
    saleAmountInr: number | null;
    rentAmountInr: number | null;
    ownerName?: string | null;
    visibility?: "private" | "marketplace";
    /** Buyers linked to this listing — shown as the My deals avatar stack. */
    attachedClients?: Array<{ id: string; name: string; avatarUrl?: string }>;
};

export type PropertyCardProps = {
    className?: string;
    detailsHref: string;
    priority?: boolean;
    imageSizes?: string;
    onRequest?: () => void;
    /** Withdraw a pending broker request. Shown whenever the request is still pending. */
    onCancelRequest?: () => void;
    isRequestPending?: boolean;
    onAcceptInvite?: () => void;
    onCancelInvite?: () => void;
    inviteActionPending?: "accept" | "cancel";
    onShare?: () => void;
    onOpenCrm?: () => void;
    crmHref?: string;
    editHref?: string;
    /** Owned cards: open the edit form in a modal instead of following editHref. */
    onEdit?: () => void;
    /** Owned cards: open the buyer picker for this listing. */
    onAddBuyer?: () => void;
    /** Owned cards: attach an exclusive owner CRM contact. */
    onAttachOwner?: () => void;
    /** Owned cards: ask to delete this listing (caller shows confirm). */
    onDelete?: () => void;
    /** Saved (bookmarked) state. The Save button shows only when `onToggleSave` is set. */
    isSaved?: boolean;
    onToggleSave?: () => void;
    /** Browse grid cards: listed this week in the broker's service areas — highlighted card. */
    isNewInYourArea?: boolean;
} & (
    | { variant: "browse"; listing: BrowsePropertyCardListing }
    | { variant: "represented"; listing: RepresentedPropertyCardListing }
    | { variant: "owned"; listing: OwnedPropertyCardListing }
);

function formatBrowseCardArea(areaSqft: number): string {
    return `${Math.round(areaSqft).toLocaleString("en-IN")} sqft`;
}

function formatBedLabel(bhk: number): string {
    return bhk === 1 ? "1 Bed" : `${bhk} Bed`;
}

function formatBathLabel(bhk: number): string {
    return bhk === 1 ? "1 Bath" : `${bhk} Bath`;
}

function BrowseSpecDivider() {
    return (
        <span aria-hidden className="text-ink-subtle/70">
            ·
        </span>
    );
}

function BrowseSpecItem({ icon: Icon, label }: { icon: typeof Maximize2; label: string }) {
    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Icon aria-hidden className="shrink-0 block-3 inline-3" strokeWidth={1.75} />
            {label}
        </span>
    );
}

function BrowsePropertyCardPhoto({
    listing,
    priority,
    imageSizes,
}: {
    listing: BrowsePropertyCardListing;
    priority: boolean;
    imageSizes: string;
}) {
    const alt = listing.title;
    const images =
        listing.imageSrcs && listing.imageSrcs.length > 0
            ? listing.imageSrcs
            : listing.imageSrc
              ? [listing.imageSrc]
              : [];
    const canCarousel = images.length > 1;
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [preparedThrough, setPreparedThrough] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "start",
        containScroll: "trimSnaps",
        dragFree: false,
        skipSnaps: false,
        watchDrag: canCarousel,
    });

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => {
            const nextIndex = emblaApi.selectedScrollSnap();
            setSelectedIndex(nextIndex);
            setPreparedThrough((current) => Math.max(current, nextIndex));
            setCanScrollPrev(emblaApi.canScrollPrev());
            setCanScrollNext(emblaApi.canScrollNext());
        };
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
        // Defer initial sync so we don't setState synchronously in the effect body.
        const frame = requestAnimationFrame(onSelect);
        return () => {
            cancelAnimationFrame(frame);
            emblaApi.off("select", onSelect);
            emblaApi.off("reInit", onSelect);
        };
    }, [emblaApi]);

    const stopLinkNav = (event: MouseEvent | PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const scrollPrev = (event: MouseEvent) => {
        stopLinkNav(event);
        emblaApi?.scrollPrev();
    };

    const scrollNext = (event: MouseEvent) => {
        stopLinkNav(event);
        setPreparedThrough((current) => Math.max(current, selectedIndex + 1));
        emblaApi?.scrollNext();
    };

    const prepareNextImage = () => {
        if (!canScrollNext) return;
        setPreparedThrough((current) => Math.max(current, selectedIndex + 1));
    };

    const dotCount = Math.min(images.length || 1, 5);
    const activeDot =
        images.length > dotCount
            ? Math.min(
                  Math.floor((selectedIndex / Math.max(images.length - 1, 1)) * (dotCount - 1)),
                  dotCount - 1,
              )
            : selectedIndex;

    return (
        <div
            className={cn(
                BROWSE_CARD_PHOTO_FRAME_CLASS,
                listing.isNew
                    ? BROWSE_CARD_PHOTO_FRAME_NEW_CLASS
                    : BROWSE_CARD_PHOTO_FRAME_DEFAULT_CLASS,
            )}
        >
            <HoverScaleRoot className={cn(BROWSE_CARD_PHOTO_INNER_CLASS, "group/photo")}>
                {images.length > 0 ? (
                    <HoverScaleLayer className="absolute inset-0">
                        <div
                            ref={emblaRef}
                            className="overflow-hidden block-full inline-full"
                            onPointerEnter={prepareNextImage}
                            onPointerDown={prepareNextImage}
                            aria-roledescription="carousel"
                            aria-label={`${alt} photos`}
                        >
                            <div className="flex touch-pan-y block-full">
                                {images.map((src, index) => (
                                    <div
                                        key={`${src}-${index}`}
                                        className="relative shrink-0 grow-0 basis-full min-inline-0"
                                        role="group"
                                        aria-roledescription="slide"
                                        aria-label={`Photo ${index + 1} of ${images.length}`}
                                    >
                                        {index <= preparedThrough ? (
                                            <AppImage
                                                src={src}
                                                alt={
                                                    index === 0
                                                        ? alt
                                                        : `${alt} — photo ${index + 1}`
                                                }
                                                fill
                                                sizes={imageSizes}
                                                priority={priority && index === 0}
                                                className="object-cover"
                                            />
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </HoverScaleLayer>
                ) : (
                    <div
                        className="
                          flex flex-col items-center justify-center gap-2 px-4 text-center
                          block-full inline-full
                        "
                    >
                        <Building2
                            aria-hidden
                            className="text-ink-subtle block-8 inline-8"
                            strokeWidth={1.5}
                        />
                        <p className="body-xs text-ink-subtle">No photos yet</p>
                    </div>
                )}

                <div
                    className="
                      absolute inset-s-3 inset-bs-3 z-10 flex flex-wrap items-start gap-1.5
                    "
                >
                    {offersSale(listing) ? <Badge variant="brand">For sale</Badge> : null}
                    {offersRent(listing) ? <Badge variant="urgent">For rent</Badge> : null}
                </div>

                {listing.isNew ? (
                    <Badge variant="brand" className="absolute inset-e-3 inset-bs-3 z-10">
                        New
                    </Badge>
                ) : null}

                {canCarousel ? (
                    <>
                        <button
                            type="button"
                            aria-label="Previous photo"
                            disabled={!canScrollPrev}
                            onClick={scrollPrev}
                            onPointerDown={stopLinkNav}
                            className={cn(
                                BROWSE_CARD_PHOTO_NAV_BTN_CLASS,
                                "inset-s-3.5 inset-bs-1/2",
                                `
                                  opacity-0
                                  group-focus-within/photo:opacity-100
                                  group-hover/photo:opacity-100
                                `,
                            )}
                        >
                            <ChevronLeft
                                aria-hidden
                                className="block-3.5 inline-3.5"
                                strokeWidth={2}
                            />
                        </button>
                        <button
                            type="button"
                            aria-label="Next photo"
                            disabled={!canScrollNext}
                            onClick={scrollNext}
                            onPointerDown={(event) => {
                                stopLinkNav(event);
                                prepareNextImage();
                            }}
                            className={cn(
                                BROWSE_CARD_PHOTO_NAV_BTN_CLASS,
                                "inset-e-3.5 inset-bs-1/2",
                                `
                                  opacity-0
                                  group-focus-within/photo:opacity-100
                                  group-hover/photo:opacity-100
                                `,
                            )}
                        >
                            <ChevronRight
                                aria-hidden
                                className="block-3.5 inline-3.5"
                                strokeWidth={2}
                            />
                        </button>

                        <div
                            className="
                              absolute inset-x-0 inset-be-3 z-10 flex items-center justify-center
                              gap-1.5
                            "
                            aria-hidden
                        >
                            {Array.from({ length: dotCount }).map((_, index) => (
                                <span
                                    key={index}
                                    className={cn(
                                        `
                                          rounded-full bg-surface/90
                                          transition-[inline-size,opacity] duration-160
                                        `,
                                        "block-1.5",
                                        index === activeDot
                                            ? "opacity-100 inline-4"
                                            : "opacity-60 inline-1.5",
                                    )}
                                />
                            ))}
                        </div>
                    </>
                ) : null}
            </HoverScaleRoot>
        </div>
    );
}

function BrowsePropertyCardOwner({ owner }: { owner: PropertyCardOwner }) {
    return (
        <div className="mbs-auto flex items-center gap-2 py-1.5 min-inline-0">
            <UserAvatar
                name={owner.name}
                imageUrl={owner.avatarUrl}
                size="sm"
                className="shrink-0"
            />
            <div className="flex flex-col min-inline-0">
                <Button
                    variant="link"
                    size="sm"
                    nativeButton={owner.profileHref ? false : undefined}
                    render={
                        owner.profileHref ? (
                            <Link href={owner.profileHref} prefetch={false} />
                        ) : undefined
                    }
                    className="
                      body-sm justify-start gap-1.5 truncate p-0 font-medium tracking-wide text-ink
                      capitalize block-auto max-inline-full min-inline-0
                    "
                >
                    {owner.name}
                </Button>
                {owner.locationLabel ? (
                    <p
                        className="
                          body-xs flex items-center gap-1 tracking-wide text-ink-muted min-inline-0
                        "
                    >
                        <MapPin
                            aria-hidden
                            className="shrink-0 block-3 inline-3"
                            strokeWidth={1.75}
                        />
                        <span className="truncate capitalize">{owner.locationLabel}</span>
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function BrowsePropertyCardSpecs({ listing }: { listing: BrowsePropertyCardListing }) {
    const showBedBath =
        listing.bhk > 0 && RESIDENTIAL_PROPERTY_TYPES.has(listing.propertyTypeLabel);

    return (
        <div className={PROPERTY_CARD_SPECS_CLASS}>
            <BrowseSpecItem icon={Maximize2} label={formatBrowseCardArea(listing.areaSqft)} />
            {showBedBath ? (
                <>
                    <BrowseSpecDivider />
                    <BrowseSpecItem icon={BedDouble} label={formatBedLabel(listing.bhk)} />
                    <BrowseSpecDivider />
                    <BrowseSpecItem icon={Bath} label={formatBathLabel(listing.bhk)} />
                </>
            ) : null}
        </div>
    );
}

function BrowsePropertyCardPrice({ listing }: { listing: BrowsePropertyCardListing }) {
    const both = offersBoth(listing);
    const [mode, setMode] = useState<ListingPriceMode>(() => defaultPriceMode(listing));

    const activeMode: ListingPriceMode = both ? mode : offersSale(listing) ? "sale" : "rent";

    const priceLabel =
        activeMode === "rent"
            ? formatRentInr(listing.rentAmountInr ?? 0)
            : formatPriceInr(listing.saleAmountInr ?? 0);

    const baseAmountInr =
        activeMode === "rent" ? (listing.rentAmountInr ?? 0) : (listing.saleAmountInr ?? 0);
    const rentCommissionInr = listing.commissionAmount > 0 ? listing.commissionAmount : 0;
    const saleCommissionInr =
        listing.commissionPercent > 0
            ? Math.round((baseAmountInr * listing.commissionPercent) / 100)
            : 0;
    const commissionInr = activeMode === "rent" ? rentCommissionInr : saleCommissionInr;
    const commissionLabel =
        activeMode === "rent" ? formatRentInr(commissionInr) : formatPriceInr(commissionInr);
    const hasCommission = commissionInr > 0 && (activeMode === "rent" || baseAmountInr > 0);

    const commissionBadge = (
        <span
            className={cn(
                "body-sm shrink-0 font-medium tracking-wide text-brand",
                hasCommission && "cursor-help underline decoration-brand/30 underline-offset-2",
            )}
        >
            {activeMode === "rent"
                ? formatPriceInr(rentCommissionInr)
                : `(${listing.commissionPercent}%)`}
        </span>
    );

    return (
        <div className="flex items-center gap-2 min-inline-0">
            <div className="flex flex-1 items-baseline gap-1.5 min-inline-0">
                <span className="h5 truncate font-semibold tracking-wide text-ink tabular-nums">
                    {priceLabel}
                </span>
                {hasCommission ? (
                    <Tooltip>
                        <TooltipTrigger
                            delay={200}
                            render={
                                <button
                                    type="button"
                                    className="inline-flex border-0 bg-transparent p-0"
                                    aria-label={
                                        activeMode === "rent"
                                            ? `Commission ${formatPriceInr(rentCommissionInr)}`
                                            : `${listing.commissionPercent}% commission`
                                    }
                                >
                                    {commissionBadge}
                                </button>
                            }
                        />
                        <TooltipContent side="top" className="text-center max-inline-xs">
                            <p className="font-semibold tabular-nums">You get {commissionLabel}</p>
                            <p className="body-xs mbs-0.5 opacity-90">
                                {activeMode === "rent"
                                    ? "Fixed rent brokerage"
                                    : `${listing.commissionPercent}% of ${priceLabel}`}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    commissionBadge
                )}
            </div>

            {both ? (
                <TextSegmentedToggle
                    size="sm"
                    value={activeMode}
                    onValueChange={setMode}
                    ariaLabel="Price type"
                    options={[
                        { value: "sale", label: "Sale" },
                        { value: "rent", label: "Rent" },
                    ]}
                />
            ) : null}
        </div>
    );
}

/** Hover target for a listing price — shows the broker's cut. */
function BrowsePriceWithCommission({
    priceLabel,
    mode,
    commissionInr,
    commissionPercent,
    className,
}: {
    priceLabel: string;
    mode: "sale" | "rent";
    commissionInr: number;
    commissionPercent: number;
    className?: string;
}) {
    const hasCommission =
        commissionInr > 0 && (mode === "rent" || (mode === "sale" && commissionPercent > 0));
    const commissionLabel =
        mode === "rent" ? formatRentInr(commissionInr) : formatPriceInr(commissionInr);

    const priceEl = (
        <span
            className={cn(
                className,
                hasCommission &&
                    "cursor-help underline decoration-brand/30 underline-offset-2 decoration-from-font",
            )}
        >
            {priceLabel}
        </span>
    );

    if (!hasCommission) return priceEl;

    return (
        <Tooltip>
            <TooltipTrigger
                delay={200}
                render={
                    <button
                        type="button"
                        className="inline border-0 bg-transparent p-0 text-start text-inherit"
                        aria-label={
                            mode === "rent"
                                ? `Commission ${formatPriceInr(commissionInr)}`
                                : `${commissionPercent}% commission`
                        }
                    >
                        {priceEl}
                    </button>
                }
            />
            <TooltipContent side="top" className="text-center max-inline-xs">
                <p className="font-semibold tabular-nums">You get {commissionLabel}</p>
                <p className="body-xs mbs-0.5 opacity-90">
                    {mode === "rent"
                        ? "Fixed rent brokerage"
                        : `${commissionPercent}% of ${priceLabel}`}
                </p>
            </TooltipContent>
        </Tooltip>
    );
}

function BrowseOverlayPrices({ listing }: { listing: BrowsePropertyCardListing }) {
    const isRentOnly = offersRent(listing) && !offersSale(listing);
    const both = offersBoth(listing);
    const saleLabel = formatPriceInr(listing.saleAmountInr ?? 0);
    const rentLabel = formatRentInr(listing.rentAmountInr ?? 0);
    const saleCommissionInr =
        listing.commissionPercent > 0 && (listing.saleAmountInr ?? 0) > 0
            ? Math.round(((listing.saleAmountInr ?? 0) * listing.commissionPercent) / 100)
            : 0;
    const rentCommissionInr = listing.commissionAmount > 0 ? listing.commissionAmount : 0;

    const body = isRentOnly ? (
        <BrowsePriceWithCommission
            priceLabel={rentLabel}
            mode="rent"
            commissionInr={rentCommissionInr}
            commissionPercent={0}
            className="h5 font-semibold tracking-wide tabular-nums text-brand"
        />
    ) : (
        <div className="flex flex-col gap-0.5 min-inline-0">
            <BrowsePriceWithCommission
                priceLabel={saleLabel}
                mode="sale"
                commissionInr={saleCommissionInr}
                commissionPercent={listing.commissionPercent}
                className="h5 font-semibold tracking-wide tabular-nums text-brand"
            />
            {both ? (
                <p className="body-sm tracking-wide text-ink-muted">
                    Also{" "}
                    <BrowsePriceWithCommission
                        priceLabel={rentLabel}
                        mode="rent"
                        commissionInr={rentCommissionInr}
                        commissionPercent={0}
                        className="font-semibold tabular-nums text-ink"
                    />{" "}
                    rent
                </p>
            ) : null}
        </div>
    );

    return <TooltipProvider>{body}</TooltipProvider>;
}

/** Grid browse card: clear photo on top, essentials in a solid panel below. */
function BrowseOverlayPropertyCard({
    listing,
    detailsHref,
    priority = false,
    imageSizes = "(max-width: 768px) 100vw, 50vw",
    onRequest,
    onCancelRequest,
    isRequestPending = false,
    onAcceptInvite,
    onCancelInvite,
    inviteActionPending,
    isSaved = false,
    onToggleSave,
    isNewInYourArea = false,
    className,
}: Extract<PropertyCardProps, { variant: "browse" }>) {
    const isRentOnly = offersRent(listing) && !offersSale(listing);
    const priceLabel = isRentOnly
        ? formatRentInr(listing.rentAmountInr ?? 0)
        : formatPriceInr(listing.saleAmountInr ?? 0);
    const headline = [listing.configLabel, formatBrowseCardArea(listing.areaSqft)]
        .filter(Boolean)
        .join(" · ");

    return (
        <OverlayCard
            href={detailsHref}
            imageSrc={listing.imageSrc ?? listing.imageSrcs?.[0]}
            imageAlt={listing.title}
            imageSizes={imageSizes}
            priority={priority}
            sweep={listing.isNew}
            className={className}
            chips={
                <>
                    {offersSale(listing) ? (
                        <OverlayChip dotClassName="bg-success-mid">For sale</OverlayChip>
                    ) : null}
                    {offersRent(listing) ? (
                        <OverlayChip dotClassName="bg-urgent-mid">For rent</OverlayChip>
                    ) : null}
                    {listing.isNew ? (
                        <OverlayChip dotClassName="bg-highlight" pulse={isNewInYourArea}>
                            New
                        </OverlayChip>
                    ) : null}
                </>
            }
            actions={
                <PropertyCardMenu
                    listing={{
                        id: listing.id,
                        title: listing.title,
                        locality: listing.locality,
                        city: listing.city,
                        priceLabel,
                        imageSrc: listing.imageSrc ?? listing.imageSrcs?.[0] ?? null,
                        configLabel: listing.configLabel,
                        propertyTypeLabel: listing.propertyTypeLabel,
                        areaSqft: listing.areaSqft,
                        bhk: listing.bhk,
                        listingKind: isRentOnly ? "rent" : "sale",
                    }}
                    isSaved={isSaved}
                    onToggleSave={onToggleSave}
                />
            }
        >
            <div className="flex flex-col gap-1.5 min-inline-0">
                <OverlayCardSummary
                    href={detailsHref}
                    price={<BrowseOverlayPrices listing={listing} />}
                    headline={headline || listing.title}
                    locationLabel={`${listing.locality}, ${listing.city}`}
                />

                <OverlayPersonLine label="Owner" name={listing.owner.name} />
            </div>

            <OverlayCardActions>
                <BrowseRequestAction
                    tone="overlay"
                    hasRequested={listing.hasRequested}
                    isRepresenting={listing.isRepresenting}
                    isInvitePending={listing.isInvitePending}
                    isRequestPending={isRequestPending}
                    inviteActionPending={inviteActionPending}
                    onRequest={onRequest}
                    onCancelRequest={onCancelRequest}
                    onAcceptInvite={onAcceptInvite}
                    onCancelInvite={onCancelInvite}
                />
            </OverlayCardActions>
        </OverlayCard>
    );
}

function BrowsePropertyCard(props: Extract<PropertyCardProps, { variant: "browse" }>) {
    return <BrowseOverlayPropertyCard {...props} />;
}

function TransactionBadge({ isRent }: { isRent: boolean }) {
    return (
        <Badge variant="neutral" className="body-xs font-medium">
            {isRent ? "For rent" : "For sale"}
        </Badge>
    );
}

function PropertyCardPhoto({
    listing,
    priority,
    imageSizes,
}: {
    listing: PropertyCardBase;
    priority: boolean;
    imageSizes: string;
}) {
    const alt = `${listing.configLabel} ${listing.propertyTypeLabel}`;

    return (
        <HoverScaleRoot className={PROPERTY_CARD_PHOTO_CLASS}>
            {listing.imageSrc ? (
                <HoverScaleLayer className="absolute inset-0">
                    <AppImage
                        src={listing.imageSrc}
                        alt={alt}
                        fill
                        sizes={imageSizes}
                        priority={priority}
                        className="object-cover"
                    />
                </HoverScaleLayer>
            ) : (
                <div
                    className="
                      flex flex-col items-center justify-center gap-2 px-4 text-center block-full
                      inline-full
                    "
                >
                    <Building2
                        aria-hidden
                        className="text-ink-subtle block-8 inline-8"
                        strokeWidth={1.5}
                    />
                    <p className="body-xs text-ink-subtle">No photos yet</p>
                </div>
            )}

            <div className="absolute inset-0 flex items-start justify-between gap-2 p-3">
                {listing.isNew ? <Badge variant="brand">New</Badge> : <span aria-hidden />}

                {listing.photoCount > 0 ? (
                    <Badge variant="neutral" className="ms-auto gap-1">
                        <Camera aria-hidden strokeWidth={1.75} />
                        {listing.photoCount}
                    </Badge>
                ) : null}
            </div>
        </HoverScaleRoot>
    );
}

function PropertyCardOwnerBlock({
    owner,
    variant: _variant,
}: {
    owner: PropertyCardOwner;
    variant: "represented";
}) {
    if (!owner.phoneDigits) {
        return (
            <div className="flex items-center gap-2.5">
                <UserAvatar name={owner.name} imageUrl={owner.avatarUrl} size="sm" />
                <p className="body-sm font-medium text-ink">{owner.name}</p>
            </div>
        );
    }

    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-inline-0">
                <UserAvatar name={owner.name} imageUrl={owner.avatarUrl} size="sm" />
                <div className="min-inline-0">
                    <p className="body-sm font-medium text-ink">{owner.name}</p>
                    <PhoneNumber
                        phoneDigits={owner.phoneDigits}
                        className="body-xs text-ink-muted"
                    />
                </div>
            </div>
            <Button
                variant="outline"
                size="icon-sm"
                className="shrink-0 border-border-warm text-brand"
                render={
                    <a
                        href={formatWhatsAppUrl(owner.phoneDigits)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${owner.name}`}
                        onClick={(event) => event.stopPropagation()}
                    />
                }
            >
                <MessageCircle aria-hidden strokeWidth={1.75} />
            </Button>
        </div>
    );
}

function RepresentedMeta({ listing }: { listing: RepresentedPropertyCardListing }) {
    const expiry = formatRepresentationExpiry(listing.representationEndsAt);
    const visitLabel =
        listing.visitsBookedCount === 1
            ? "1 visit booked"
            : `${listing.visitsBookedCount} visits booked`;
    const clientLabel =
        listing.clientsMatchedCount === 1
            ? "1 client matched"
            : `${listing.clientsMatchedCount} clients matched`;
    const sharedLabel =
        listing.sharedBrokerCount === 1
            ? "Shared with 1 other broker"
            : `Shared with ${listing.sharedBrokerCount} other brokers`;

    return (
        <div className="flex flex-col gap-2.5">
            <div
                className={cn(
                    "flex items-center gap-2 rounded-control px-3 py-2",
                    expiry.isUrgent
                        ? "bg-urgent-soft text-urgent"
                        : "bg-surface-muted text-ink-muted",
                )}
            >
                <Clock aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                <p className={cn("body-xs", expiry.isUrgent && "font-medium")}>{expiry.label}</p>
            </div>

            <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                <Users aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                {sharedLabel}
            </p>

            <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                <Calendar
                    aria-hidden
                    className="shrink-0 block-3.5 inline-3.5"
                    strokeWidth={1.75}
                />
                {visitLabel} · {clientLabel}
            </p>
        </div>
    );
}

function RepresentedPropertyCard({
    listing,
    detailsHref,
    priority = false,
    imageSizes = "(max-width: 768px) 100vw, 50vw",
    onShare,
    onOpenCrm,
    crmHref,
    className,
}: Extract<PropertyCardProps, { variant: "represented" }>) {
    const titleLine = `${listing.configLabel} ${listing.propertyTypeLabel} · ${formatAreaSqft(listing.areaSqft)}`;

    return (
        <article
            className={cn(
                "overflow-hidden rounded-card border border-border-warm bg-surface",
                "flex flex-col",
                className,
            )}
        >
            <div className="flex items-center gap-2 bg-brand-deep px-3 py-2 text-surface">
                <CircleCheck aria-hidden className="shrink-0 block-4 inline-4" strokeWidth={1.75} />
                <p className="body-xs font-medium">
                    {formatRepresentedSince(listing.representedSince)}
                </p>
            </div>

            <Link href={detailsHref} prefetch={false} className="block min-inline-0">
                <PropertyCardPhoto listing={listing} priority={priority} imageSizes={imageSizes} />
            </Link>

            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <Price
                        amountInr={listing.amountInr}
                        isRent={listing.isRent}
                        className="h6 font-semibold"
                    />
                    <TransactionBadge isRent={listing.isRent} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <h3 className="max-inline-full min-inline-0">
                        <PropertyTitleLink href={detailsHref} className="body-sm font-medium">
                            {titleLine}
                        </PropertyTitleLink>
                    </h3>
                    <p className="body-xs flex items-start gap-1.5 text-ink-muted">
                        <MapPin
                            aria-hidden
                            className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        <span>{listing.fullAddress}</span>
                    </p>
                </div>

                <PropertyCardOwnerBlock owner={listing.owner} variant="represented" />

                <RepresentedMeta listing={listing} />

                <div className="mbs-auto flex gap-2 pbs-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 border-border-warm"
                        onClick={onShare}
                    >
                        Share
                    </Button>

                    {crmHref ? (
                        <Link
                            href={crmHref}
                            prefetch={false}
                            className={cn(
                                buttonVariants({ size: "sm" }),
                                "flex-[1.4] bg-brand-ink text-surface hover:bg-brand-ink/90",
                            )}
                        >
                            Open in CRM
                        </Link>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            className="flex-[1.4] bg-brand-ink text-surface hover:bg-brand-ink/90"
                            onClick={onOpenCrm}
                        >
                            Open in CRM
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
}

const OWNED_EDIT_LABEL = "Edit property";
const OWNED_OPEN_LABEL = "Open";
const OWNED_EDIT_TOOLTIP = "Update price, photos, and other listing details";
const OWNED_OPEN_TOOLTIP = "View this listing's full details";
const OWNED_ADD_BUYER_LABEL = "Add buyer";
const OWNED_ADD_BUYER_TOOLTIP = "Pick which buyers you will show this property to";
const OWNED_ATTACH_OWNER_LABEL = "Attach owner";
const OWNED_CHANGE_OWNER_LABEL = "Change owner";
const OWNED_ATTACH_OWNER_TOOLTIP = "Link one exclusive owner contact to this listing";
const OWNED_CHANGE_OWNER_TOOLTIP = "Replace the exclusive owner on this listing";
const OWNED_DELETE_LABEL = "Delete";
const OWNED_DELETE_TOOLTIP = "Remove this listing permanently";

function OwnedListingAction({
    href,
    isEdit,
    onEdit,
    onAddBuyer,
    onAttachOwner,
    hasAttachedOwner = false,
    onDelete,
}: {
    href: string;
    isEdit: boolean;
    /** When set, editing opens in place instead of navigating to the edit page. */
    onEdit?: () => void;
    /** When set, a second button opens the buyer picker for this listing. */
    onAddBuyer?: () => void;
    /** When set, opens the exclusive-owner picker for this listing. */
    onAttachOwner?: () => void;
    /** True when an exclusive owner is already linked — button becomes Change owner. */
    hasAttachedOwner?: boolean;
    /** When set, shows a delete control; caller owns the confirm dialog. */
    onDelete?: () => void;
}) {
    const opensInModal = isEdit && onEdit != null;
    const attachLabel = hasAttachedOwner ? OWNED_CHANGE_OWNER_LABEL : OWNED_ATTACH_OWNER_LABEL;
    const attachTooltip = hasAttachedOwner
        ? OWNED_CHANGE_OWNER_TOOLTIP
        : OWNED_ATTACH_OWNER_TOOLTIP;

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-2">
                {onAttachOwner || onAddBuyer ? (
                    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 -mis-2">
                        {onAttachOwner ? (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            type="button"
                                            className="text-ink-muted hover:text-ink"
                                            onClick={onAttachOwner}
                                        >
                                            <UserRound
                                                aria-hidden
                                                className="block-3.5 inline-3.5"
                                                strokeWidth={1.75}
                                            />
                                            {attachLabel}
                                        </Button>
                                    }
                                />
                                <TooltipContent side="top" className="text-center max-inline-xs">
                                    {attachTooltip}
                                </TooltipContent>
                            </Tooltip>
                        ) : null}

                        {onAddBuyer ? (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            type="button"
                                            className="text-ink-muted hover:text-ink"
                                            onClick={onAddBuyer}
                                        >
                                            <UserPlus
                                                aria-hidden
                                                className="block-3.5 inline-3.5"
                                                strokeWidth={1.75}
                                            />
                                            {OWNED_ADD_BUYER_LABEL}
                                        </Button>
                                    }
                                />
                                <TooltipContent side="top" className="text-center max-inline-xs">
                                    {OWNED_ADD_BUYER_TOOLTIP}
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </div>
                ) : null}

                <div className="flex gap-2">
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <span className="inline-flex flex-1 min-inline-0">
                                    <Button
                                        size="md"
                                        variant="accent"
                                        className="inline-full"
                                        type={opensInModal ? "button" : undefined}
                                        onClick={opensInModal ? onEdit : undefined}
                                        render={
                                            opensInModal ? undefined : (
                                                <Link href={href} prefetch={false} />
                                            )
                                        }
                                    >
                                        {isEdit ? OWNED_EDIT_LABEL : OWNED_OPEN_LABEL}
                                    </Button>
                                </span>
                            }
                        />
                        <TooltipContent side="top" className="text-center max-inline-xs">
                            {isEdit ? OWNED_EDIT_TOOLTIP : OWNED_OPEN_TOOLTIP}
                        </TooltipContent>
                    </Tooltip>

                    {onDelete ? (
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        size="md"
                                        variant="outline"
                                        type="button"
                                        aria-label={OWNED_DELETE_LABEL}
                                        className="
                                          shrink-0 border-border-warm text-danger
                                          hover:bg-danger/10 hover:text-danger
                                        "
                                        onClick={onDelete}
                                    >
                                        <Trash2
                                            aria-hidden
                                            className="block-4 inline-4"
                                            strokeWidth={1.75}
                                        />
                                    </Button>
                                }
                            />
                            <TooltipContent side="top" className="text-center max-inline-xs">
                                {OWNED_DELETE_TOOLTIP}
                            </TooltipContent>
                        </Tooltip>
                    ) : null}
                </div>
            </div>
        </TooltipProvider>
    );
}

const OWNED_STATUS_LABEL: Record<OwnedPropertyCardStatus, string> = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished",
};

function ownedToBrowseListing(listing: OwnedPropertyCardListing): BrowsePropertyCardListing {
    return {
        id: listing.id,
        title: listing.title,
        configLabel: listing.configLabel,
        propertyTypeLabel: listing.propertyTypeLabel,
        areaSqft: listing.areaSqft,
        amountInr: listing.amountInr,
        isRent: listing.isRent,
        imageSrc: listing.imageSrc,
        imageSrcs: listing.imageSrcs,
        photoCount: listing.photoCount,
        isNew: listing.isNew,
        owner: { name: "You" },
        locality: listing.locality,
        city: listing.city,
        bhk: listing.bhk,
        brokerSlotsOpen: 0,
        brokerSlotsTotal: 0,
        commissionPercent: 0,
        commissionAmount: 0,
        hasRequested: false,
        saleAmountInr: listing.saleAmountInr,
        rentAmountInr: listing.rentAmountInr,
    };
}

function OwnedStatusBadge({ status }: { status: OwnedPropertyCardStatus }) {
    const variant = status === "published" ? "brand" : status === "draft" ? "outline" : "urgent";
    return <Badge variant={variant}>{OWNED_STATUS_LABEL[status]}</Badge>;
}

/** Dot colour per listing status, for the overlay card's status chip. */
const OWNED_STATUS_DOT_CLASS: Record<OwnedPropertyCardStatus, string> = {
    published: "bg-success-mid",
    draft: "bg-highlight",
    unpublished: "bg-ink-subtle",
};

function formatListedLabel(listedDaysAgo: number): string {
    if (listedDaysAgo <= 0) return "Today";
    if (listedDaysAgo === 1) return "1 day";
    if (listedDaysAgo < 30) return `${listedDaysAgo} days`;
    const months = Math.round(listedDaysAgo / 30);
    return months === 1 ? "1 month" : `${months} months`;
}

function formatRequestsValue(inboundRequestCount: number): string {
    if (inboundRequestCount === 0) return "None yet";
    return inboundRequestCount === 1 ? "1 broker" : `${inboundRequestCount} brokers`;
}

/** Grid owned card: clear photo on top, essentials in a solid panel below. */
function OwnedOverlayPropertyCard({
    listing,
    detailsHref,
    priority = false,
    imageSizes = "(max-width: 768px) 100vw, 50vw",
    onEdit,
    onAddBuyer,
    onAttachOwner,
    onDelete,
    className,
}: Extract<PropertyCardProps, { variant: "owned" }>) {
    const browse = ownedToBrowseListing(listing);
    const both = offersBoth(browse);
    const isRentOnly = offersRent(browse) && !offersSale(browse);
    const priceLabel = isRentOnly
        ? formatRentInr(listing.rentAmountInr ?? 0)
        : formatPriceInr(listing.saleAmountInr ?? 0);
    const sharePriceLabel =
        offersRent(browse) && !offersSale(browse)
            ? formatRentInr(listing.rentAmountInr ?? 0)
            : formatPriceInr(listing.saleAmountInr ?? listing.rentAmountInr ?? 0);
    const headline = [listing.configLabel, formatBrowseCardArea(listing.areaSqft)]
        .filter(Boolean)
        .join(" · ");
    const metaParts = [
        listing.inboundRequestCount === 0
            ? "No requests"
            : formatRequestsValue(listing.inboundRequestCount),
        `Listed ${formatListedLabel(listing.listedDaysAgo)}`,
    ];
    const buyers = listing.attachedClients ?? [];
    const hasOwner = Boolean(listing.ownerName?.trim());
    const hasBuyers = buyers.length > 0;
    const showAttachOwnerButton = Boolean(onAttachOwner && !hasOwner);
    const showAddBuyerButton = Boolean(onAddBuyer && !hasBuyers);

    return (
        <OverlayCard
            href={detailsHref}
            imageSrc={listing.imageSrc ?? listing.imageSrcs?.[0]}
            imageAlt={listing.title}
            imageSizes={imageSizes}
            priority={priority}
            // A listing nobody can see yet reads as inactive while scanning.
            muted={listing.status !== "published"}
            className={className}
            chips={
                <>
                    <OverlayChip dotClassName={OWNED_STATUS_DOT_CLASS[listing.status]}>
                        {OWNED_STATUS_LABEL[listing.status]}
                    </OverlayChip>
                    {offersSale(browse) ? (
                        <OverlayChip dotClassName="bg-success-mid">For sale</OverlayChip>
                    ) : null}
                    {offersRent(browse) ? (
                        <OverlayChip dotClassName="bg-urgent-mid">For rent</OverlayChip>
                    ) : null}
                    {listing.visibility === "private" ? (
                        <OverlayChip dotClassName="bg-surface/70">Private</OverlayChip>
                    ) : null}
                </>
            }
            actions={
                <PropertyCardMenu
                    listing={{
                        id: listing.id,
                        title: listing.title,
                        locality: listing.locality,
                        city: listing.city,
                        priceLabel: sharePriceLabel,
                        imageSrc: listing.imageSrc ?? listing.imageSrcs?.[0] ?? null,
                        configLabel: listing.configLabel,
                        propertyTypeLabel: listing.propertyTypeLabel,
                        areaSqft: listing.areaSqft,
                        bhk: listing.bhk,
                        listingKind: offersRent(browse) && !offersSale(browse) ? "rent" : "sale",
                    }}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            }
        >
            <div className="flex flex-col gap-1.5 min-inline-0">
                <OverlayCardSummary
                    href={detailsHref}
                    price={
                        <div className="flex flex-col gap-0.5 min-inline-0">
                            <p className="h5 font-semibold tracking-wide tabular-nums text-brand">
                                {priceLabel}
                            </p>
                            {both ? (
                                <p className="body-sm tracking-wide text-ink-muted tabular-nums">
                                    Also {formatRentInr(listing.rentAmountInr ?? 0)} rent
                                </p>
                            ) : null}
                        </div>
                    }
                    headline={headline || listing.title}
                    locationLabel={`${listing.locality}, ${listing.city}`}
                />

                <p className="body-sm tracking-wide text-ink-muted">{metaParts.join(" · ")}</p>
            </div>

            <OverlayCardActions className="flex-col gap-2">
                {hasOwner && onAttachOwner ? (
                    <AttachedOwnerRow name={listing.ownerName!} onManage={onAttachOwner} />
                ) : null}

                {hasBuyers && onAddBuyer ? (
                    <AttachedBuyersRow buyers={buyers} onManage={onAddBuyer} />
                ) : null}

                {showAttachOwnerButton || showAddBuyerButton ? (
                    <div className="flex gap-2">
                        {showAttachOwnerButton ? (
                            <Button
                                size="md"
                                variant="outline"
                                type="button"
                                className={cn(
                                    showAddBuyerButton ? "flex-1" : "inline-full",
                                    OVERLAY_GLASS_BUTTON_CLASS,
                                )}
                                onClick={onAttachOwner}
                            >
                                <UserRound
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                {OWNED_ATTACH_OWNER_LABEL}
                            </Button>
                        ) : null}
                        {showAddBuyerButton ? (
                            <Button
                                size="md"
                                variant="accent"
                                type="button"
                                className={showAttachOwnerButton ? "flex-1" : "inline-full"}
                                onClick={onAddBuyer}
                            >
                                <UserPlus
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                {OWNED_ADD_BUYER_LABEL}
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </OverlayCardActions>
        </OverlayCard>
    );
}

function OwnedPropertyCardPrice({ listing }: { listing: OwnedPropertyCardListing }) {
    const browse = ownedToBrowseListing(listing);
    const both = offersBoth(browse);
    const [mode, setMode] = useState<ListingPriceMode>(() => defaultPriceMode(browse));
    const activeMode: ListingPriceMode = both ? mode : offersSale(browse) ? "sale" : "rent";
    const priceLabel =
        activeMode === "rent"
            ? formatRentInr(listing.rentAmountInr ?? 0)
            : formatPriceInr(listing.saleAmountInr ?? 0);

    const requestLabel =
        listing.inboundRequestCount === 0
            ? "(0 req)"
            : listing.inboundRequestCount === 1
              ? "(1 req)"
              : `(${listing.inboundRequestCount} req)`;

    return (
        <div className="flex items-center gap-2 min-inline-0">
            <div className="flex flex-1 items-baseline gap-1.5 min-inline-0">
                <span className="h5 truncate font-semibold tracking-wide text-ink tabular-nums">
                    {priceLabel}
                </span>
                <span className="body-sm shrink-0 font-medium tracking-wide text-brand">
                    {requestLabel}
                </span>
            </div>
            {both ? (
                <TextSegmentedToggle
                    size="sm"
                    value={activeMode}
                    onValueChange={setMode}
                    ariaLabel="Price type"
                    options={[
                        { value: "sale", label: "Sale" },
                        { value: "rent", label: "Rent" },
                    ]}
                />
            ) : null}
        </div>
    );
}

function OwnedPropertyCard(props: Extract<PropertyCardProps, { variant: "owned" }>) {
    return <OwnedOverlayPropertyCard {...props} />;
}

export function PropertyCard(props: PropertyCardProps) {
    if (props.variant === "browse") {
        return <BrowsePropertyCard {...props} />;
    }
    if (props.variant === "owned") {
        return <OwnedPropertyCard {...props} />;
    }

    return <RepresentedPropertyCard {...props} />;
}
