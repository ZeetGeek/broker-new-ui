"use client";

import { type MouseEvent, type PointerEvent, type ReactNode, useEffect, useState } from "react";
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
    UserPlus,
    UserRound,
    Users,
    X,
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

import { TextSegmentedToggle } from "@/components/shared/text-segmented-toggle";
import { AppImage } from "@/components/shared/app-image";
import { HoverScaleLayer, HoverScaleRoot } from "@/components/shared/hover-scale-media";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { PropertySaveButton } from "@/components/shared/property-save-button";
import { PropertySharePopover } from "@/components/shared/property-share-popover";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PROPERTY_CARD_PHOTO_CLASS = "relative shrink-0 overflow-hidden bg-surface-muted";
const PROPERTY_CARD_PHOTO_GRID_CLASS = "h-40 w-full";
const PROPERTY_CARD_PHOTO_LIST_CLASS = "w-36 min-h-36 self-stretch sm:w-44 md:w-52";

const BROWSE_CARD_PHOTO_FRAME_CLASS =
    "shrink-0 rounded-card p-1 shadow-md transition-[box-shadow,background] duration-160 group-hover:shadow-lg";
const BROWSE_CARD_PHOTO_FRAME_DEFAULT_CLASS = "bg-surface";
const BROWSE_CARD_PHOTO_FRAME_NEW_CLASS = `
  bg-gradient-to-br from-highlight via-brand-soft to-brand/55
  shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-highlight)_35%,transparent),var(--shadow-md)]
  group-hover:shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-highlight)_50%,transparent),var(--shadow-lg)]
`;
const BROWSE_CARD_PHOTO_FRAME_GRID_CLASS = "w-full";
const BROWSE_CARD_PHOTO_FRAME_LIST_CLASS =
    "w-[min(62%,28rem)] min-w-64 shrink-0 self-start sm:min-w-72";

const BROWSE_CARD_PHOTO_INNER_CLASS =
    "relative overflow-hidden rounded-[calc(var(--radius-card)-4px)] bg-surface-muted";
const BROWSE_CARD_PHOTO_INNER_GRID_CLASS = "aspect-[4/3] w-full";
const BROWSE_CARD_PHOTO_INNER_LIST_CLASS = "aspect-[5/4] w-full";

/*
 * Overlay (grid) browse card: the photo fills the whole card and the details sit
 * on a blurred panel over its lower part. The card is an `@container`, so the
 * clear photo band is `aspect-5/4` of the card width = 80cqi. The panel starts
 * 3.5rem above that band and fades in. Only the cover photo shows — no carousel.
 */
// `transform-gpu` gives the card its own layer: without it Chrome lets the
// backdrop-blur panel paint past `overflow-hidden` and the corners go square.
const OVERLAY_CARD_CLASS = `
  @container relative isolate flex flex-1 transform-gpu flex-col overflow-hidden rounded-card
  bg-brand-ink shadow-md transition-[box-shadow,translate] duration-160
  hover:-translate-y-0.5 hover:shadow-lg
`;
const OVERLAY_PHOTO_BAND_CLASS = "pointer-events-none aspect-5/4 shrink-0 inline-full";
const OVERLAY_PANEL_CLASS = `
  pointer-events-none relative z-10 -mbs-14 flex flex-col gap-3 px-4 pbs-14 pbe-4 text-surface
`;
const OVERLAY_PANEL_BLUR_CLASS = `
  absolute inset-0 -z-10 rounded-b-card backdrop-blur-xl
  [mask-image:linear-gradient(to_bottom,transparent,black_3.5rem)]
`;
const OVERLAY_PANEL_SCRIM_CLASS = `
  absolute inset-0 -z-10 rounded-b-card
  bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--color-brand-ink)_40%,transparent)_3.5rem,color-mix(in_oklab,var(--color-brand-ink)_80%,transparent))]
`;
const OVERLAY_ICON_BTN_CLASS = `
  pointer-events-auto relative rounded-full bg-ink/30 text-surface backdrop-blur-md block-10
  inline-10
  after:absolute after:-inset-1
  hover:bg-ink/45 hover:text-surface
`;

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

const BROWSE_REQUEST_LABEL = "Send request";
const BROWSE_REQUEST_PENDING_LABEL = "Sending…";
const BROWSE_REQUEST_CANCEL_LABEL = "Cancel request";
const BROWSE_REQUEST_CANCELLING_LABEL = "Cancelling…";
const BROWSE_REPRESENTING_LABEL = "Representing";
const BROWSE_INVITE_ACCEPT_LABEL = "Accept";
const BROWSE_INVITE_ACCEPTING_LABEL = "Accepting…";
const BROWSE_INVITE_CANCEL_LABEL = "Cancel invitation";
const BROWSE_INVITE_CANCELLING_LABEL = "Cancelling…";

const PROPERTY_CARD_TITLE_CLASS = "body truncate font-semibold tracking-wide text-ink capitalize";
const PROPERTY_CARD_LOCATION_CLASS = `
  body-sm flex items-center gap-1.5 tracking-wide text-ink-muted min-inline-0
`;
const PROPERTY_CARD_SPECS_CLASS = `
  body-sm flex flex-nowrap items-center gap-x-1.5 overflow-hidden tracking-wide text-ink-muted
`;

const BROWSE_REQUEST_TOOLTIP = {
    idle: "Ask the owner for permission to represent this property",
    pending: "Sending your request to the owner…",
    cancel: "Tap to cancel this request. You can send it again later.",
    cancelling: "Cancelling your request…",
    representing: "The owner already approved you for this listing.",
    inviteAccept: "Accept this invite. You'll get the owner's number straight away.",
    inviteCancel: "Turn this down. The owner can then ask another broker.",
} as const;

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
}) {
    const canCancel = Boolean(hasRequested && onCancelRequest);
    const canRespondToInvite = Boolean(isInvitePending && onAcceptInvite && onCancelInvite);
    const inviteBusy = Boolean(inviteActionPending);
    const tooltip = isRepresenting
        ? BROWSE_REQUEST_TOOLTIP.representing
        : canRespondToInvite
          ? undefined
          : canCancel
            ? isRequestPending
                ? BROWSE_REQUEST_TOOLTIP.cancelling
                : BROWSE_REQUEST_TOOLTIP.cancel
            : isRequestPending
              ? BROWSE_REQUEST_TOOLTIP.pending
              : BROWSE_REQUEST_TOOLTIP.idle;

    const statusClassName = `
      body-sm flex items-center justify-center gap-2 rounded-control border-2 border-brand
      bg-brand-soft px-4 font-semibold text-brand-text block-control-lg inline-full
    `;

    const representingStatus = (
        <div role="status" className={statusClassName}>
            <CircleCheck
                aria-hidden
                className="shrink-0 text-brand-text block-4 inline-4"
                strokeWidth={2}
            />
            {BROWSE_REPRESENTING_LABEL}
        </div>
    );

    const inviteButtons = (
        <div className="flex flex-col gap-2 inline-full">
            <Tooltip>
                <TooltipTrigger
                    render={
                        <span className="inline-flex inline-full">
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
            <Tooltip>
                <TooltipTrigger
                    render={
                        <span className="inline-flex inline-full">
                            <Button
                                type="button"
                                size="md"
                                variant="outline"
                                className="
                                  border-2 border-brand bg-brand-soft font-semibold text-brand-text
                                  inline-full
                                  hover:border-brand hover:bg-brand-soft-hover hover:text-brand-text
                                "
                                disabled={inviteBusy}
                                loading={inviteActionPending === "cancel"}
                                onClick={onCancelInvite}
                            >
                                {inviteActionPending === "cancel" ? (
                                    BROWSE_INVITE_CANCELLING_LABEL
                                ) : (
                                    <>
                                        <X
                                            aria-hidden
                                            className="block-4 inline-4"
                                            strokeWidth={2}
                                        />
                                        {BROWSE_INVITE_CANCEL_LABEL}
                                    </>
                                )}
                            </Button>
                        </span>
                    }
                />
                <TooltipContent side="top" className="text-center max-inline-xs">
                    {BROWSE_REQUEST_TOOLTIP.inviteCancel}
                </TooltipContent>
            </Tooltip>
        </div>
    );

    const cancelButton = (
        <Button
            type="button"
            size="md"
            variant="outline"
            className="
              border-2 border-brand bg-brand-soft font-semibold text-brand-text inline-full
              hover:border-brand hover:bg-brand-soft-hover hover:text-brand-text
            "
            disabled={isRequestPending}
            loading={isRequestPending}
            onClick={onCancelRequest}
        >
            {isRequestPending ? (
                BROWSE_REQUEST_CANCELLING_LABEL
            ) : (
                <>
                    <X aria-hidden className="block-4 inline-4" strokeWidth={2} />
                    {BROWSE_REQUEST_CANCEL_LABEL}
                </>
            )}
        </Button>
    );

    const requestButton = (
        <Button
            type="button"
            size="md"
            variant="accent"
            className="inline-full"
            disabled={isRequestPending}
            loading={isRequestPending}
            onClick={onRequest}
        >
            {isRequestPending ? BROWSE_REQUEST_PENDING_LABEL : BROWSE_REQUEST_LABEL}
        </Button>
    );

    const action = isRepresenting
        ? representingStatus
        : canRespondToInvite
          ? inviteButtons
          : canCancel
            ? cancelButton
            : requestButton;

    if (canRespondToInvite) {
        return <TooltipProvider>{action}</TooltipProvider>;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    render={<span className="inline-flex inline-full">{action}</span>}
                />
                <TooltipContent side="top" className="text-center max-inline-xs">
                    {tooltip}
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
};

export type PropertyCardProps = {
    className?: string;
    layout?: "grid" | "list";
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
    /** Saved (bookmarked) state. The Save button shows only when `onToggleSave` is set. */
    isSaved?: boolean;
    onToggleSave?: () => void;
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
    layout = "grid",
    fill = false,
}: {
    listing: BrowsePropertyCardListing;
    priority: boolean;
    imageSizes: string;
    layout?: "grid" | "list";
    /**
     * Fill the parent edge to edge with the cover photo only — no frame, chips,
     * or carousel (the overlay card renders its own chrome).
     */
    fill?: boolean;
}) {
    const alt = listing.title;
    const gallery =
        listing.imageSrcs && listing.imageSrcs.length > 0
            ? listing.imageSrcs
            : listing.imageSrc
              ? [listing.imageSrc]
              : [];
    const images = fill ? gallery.slice(0, 1) : gallery;
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
            className={
                fill
                    ? "absolute inset-0"
                    : cn(
                          BROWSE_CARD_PHOTO_FRAME_CLASS,
                          listing.isNew
                              ? BROWSE_CARD_PHOTO_FRAME_NEW_CLASS
                              : BROWSE_CARD_PHOTO_FRAME_DEFAULT_CLASS,
                          layout === "list"
                              ? BROWSE_CARD_PHOTO_FRAME_LIST_CLASS
                              : BROWSE_CARD_PHOTO_FRAME_GRID_CLASS,
                      )
            }
        >
            <HoverScaleRoot
                className={cn(
                    "group/photo",
                    fill
                        ? "relative overflow-hidden block-full inline-full"
                        : cn(
                              BROWSE_CARD_PHOTO_INNER_CLASS,
                              layout === "list"
                                  ? BROWSE_CARD_PHOTO_INNER_LIST_CLASS
                                  : BROWSE_CARD_PHOTO_INNER_GRID_CLASS,
                          ),
                )}
            >
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
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 px-4 text-center",
                            fill ? "aspect-5/4 inline-full" : "block-full inline-full",
                        )}
                    >
                        <Building2
                            aria-hidden
                            className="text-ink-subtle block-8 inline-8"
                            strokeWidth={1.5}
                        />
                        <p className="body-xs text-ink-subtle">No photos yet</p>
                    </div>
                )}

                {fill ? null : (
                    <>
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
                    </>
                )}

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
                                "inset-bs-1/2 inset-s-3.5",
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
                                "inset-bs-1/2 inset-e-3.5",
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
    const commissionInr = Math.round((baseAmountInr * listing.commissionPercent) / 100);
    const commissionLabel =
        activeMode === "rent" ? formatRentInr(commissionInr) : formatPriceInr(commissionInr);
    const hasCommission = listing.commissionPercent > 0 && baseAmountInr > 0;

    const commissionBadge = (
        <span
            className={cn(
                "body-sm shrink-0 font-medium tracking-wide text-brand",
                hasCommission && "cursor-help underline decoration-brand/30 underline-offset-2",
            )}
        >
            ({listing.commissionPercent}%)
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
                                    aria-label={`${listing.commissionPercent}% commission`}
                                >
                                    {commissionBadge}
                                </button>
                            }
                        />
                        <TooltipContent side="top" className="text-center max-inline-xs">
                            <p className="font-semibold tabular-nums">You get {commissionLabel}</p>
                            <p className="body-xs mbs-0.5 opacity-90">
                                {listing.commissionPercent}% of {priceLabel}
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

/** Glass chip for the overlay card photo — matches the Share / Save icon buttons. */
function OverlayChip({ dotClassName, children }: { dotClassName: string; children: ReactNode }) {
    return (
        <span
            className="
              body-xs inline-flex items-center gap-1.5 rounded-full bg-ink/30 px-2.5 py-1
              font-semibold tracking-wide whitespace-nowrap text-surface backdrop-blur-md
            "
        >
            <span aria-hidden className={cn("shrink-0 rounded-full block-1.5 inline-1.5", dotClassName)} />
            {children}
        </span>
    );
}

function OverlayStat({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 px-3 min-inline-0 first:ps-0 last:pe-0">
            <span className="body-xs truncate tracking-wide text-surface/70">{label}</span>
            <span className="body-sm truncate font-semibold tracking-wide tabular-nums">
                {children}
            </span>
        </div>
    );
}

function BrowseOverlayCommission({ listing }: { listing: BrowsePropertyCardListing }) {
    const isRentOnly = offersRent(listing) && !offersSale(listing);
    const baseAmountInr = isRentOnly ? (listing.rentAmountInr ?? 0) : (listing.saleAmountInr ?? 0);
    const commissionInr = Math.round((baseAmountInr * listing.commissionPercent) / 100);
    const commissionLabel = isRentOnly ? formatRentInr(commissionInr) : formatPriceInr(commissionInr);
    const baseLabel = isRentOnly ? formatRentInr(baseAmountInr) : formatPriceInr(baseAmountInr);

    return (
        <Tooltip>
            <TooltipTrigger
                delay={200}
                render={
                    <button
                        type="button"
                        className="
                          pointer-events-auto cursor-help border-0 bg-transparent p-0 text-start
                          text-inherit underline decoration-surface/30 underline-offset-2
                        "
                        aria-label={`${listing.commissionPercent}% commission`}
                    />
                }
            >
                {listing.commissionPercent}%
            </TooltipTrigger>
            <TooltipContent side="top" className="text-center max-inline-xs">
                <p className="font-semibold tabular-nums">You get {commissionLabel}</p>
                <p className="body-xs mbs-0.5 opacity-90">
                    {listing.commissionPercent}% of {baseLabel}
                </p>
            </TooltipContent>
        </Tooltip>
    );
}

/** Grid browse card: full-bleed photo with the details on a blurred panel. */
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
    className,
}: Extract<PropertyCardProps, { variant: "browse" }>) {
    const isRentOnly = offersRent(listing) && !offersSale(listing);
    const priceLabel = isRentOnly
        ? formatRentInr(listing.rentAmountInr ?? 0)
        : formatPriceInr(listing.saleAmountInr ?? 0);
    const hasCommission =
        listing.commissionPercent > 0 &&
        (isRentOnly ? (listing.rentAmountInr ?? 0) : (listing.saleAmountInr ?? 0)) > 0;
    const specsLabel = [formatBrowseCardArea(listing.areaSqft), listing.configLabel]
        .filter(Boolean)
        .join(" · ");

    return (
        <article className={cn(OVERLAY_CARD_CLASS, className)}>
            <Link href={detailsHref} prefetch={false} className="absolute inset-0">
                <BrowsePropertyCardPhoto
                    listing={listing}
                    priority={priority}
                    imageSizes={imageSizes}
                    fill
                />
            </Link>

            <div
                className="
                  pointer-events-none absolute inset-s-3 inset-bs-3 z-10 flex flex-wrap items-start
                  gap-1.5 pe-16
                "
            >
                {offersSale(listing) ? (
                    <OverlayChip dotClassName="bg-success-mid">For sale</OverlayChip>
                ) : null}
                {offersRent(listing) ? (
                    <OverlayChip dotClassName="bg-urgent-mid">For rent</OverlayChip>
                ) : null}
                {listing.isNew ? <OverlayChip dotClassName="bg-highlight">New</OverlayChip> : null}
            </div>

            <div className="absolute inset-e-3 inset-bs-3 z-20 flex flex-col gap-2">
                <PropertySharePopover
                    iconOnly
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
                    className={OVERLAY_ICON_BTN_CLASS}
                />
                {onToggleSave ? (
                    <PropertySaveButton
                        iconOnly
                        isSaved={isSaved}
                        title={listing.title}
                        onToggle={onToggleSave}
                        className={OVERLAY_ICON_BTN_CLASS}
                    />
                ) : null}
            </div>

            <div aria-hidden className={OVERLAY_PHOTO_BAND_CLASS} />

            <div className={OVERLAY_PANEL_CLASS}>
                <div aria-hidden className={OVERLAY_PANEL_BLUR_CLASS} />
                <div aria-hidden className={OVERLAY_PANEL_SCRIM_CLASS} />

                <div className="flex flex-col gap-1 min-inline-0">
                    <div className="flex items-baseline justify-between gap-3 min-inline-0">
                        <h3 className="max-inline-full min-inline-0">
                            <PropertyTitleLink
                                href={detailsHref}
                                className={cn(
                                    PROPERTY_CARD_TITLE_CLASS,
                                    "pointer-events-auto text-surface hover:text-surface",
                                )}
                            >
                                {listing.title}
                            </PropertyTitleLink>
                        </h3>
                        <span className="h5 shrink-0 font-semibold tracking-wide tabular-nums">
                            {priceLabel}
                        </span>
                    </div>
                    <p className="body-sm flex items-center gap-1.5 tracking-wide text-surface/75 min-inline-0">
                        <MapPin aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                        <span className="truncate capitalize">
                            {listing.locality}, {listing.city}
                        </span>
                    </p>
                    <p className="body-sm flex items-center gap-1.5 tracking-wide text-surface/75 min-inline-0">
                        <Maximize2 aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                        <span className="truncate">{specsLabel}</span>
                    </p>
                </div>

                <div
                    className="
                      grid auto-cols-fr grid-flow-col divide-x divide-surface/20 border-t
                      border-surface/20 pbs-3
                    "
                >
                    {hasCommission ? (
                        <OverlayStat label="Commission">
                            <BrowseOverlayCommission listing={listing} />
                        </OverlayStat>
                    ) : null}
                    {offersBoth(listing) ? (
                        <OverlayStat label="Rent">
                            {formatRentInr(listing.rentAmountInr ?? 0)}
                        </OverlayStat>
                    ) : null}
                    <OverlayStat label="Owner">
                        <span className="capitalize">{listing.owner.name}</span>
                    </OverlayStat>
                </div>

                <div className="pointer-events-auto">
                    <BrowseRequestAction
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
                </div>
            </div>
        </article>
    );
}

function BrowsePropertyCard(props: Extract<PropertyCardProps, { variant: "browse" }>) {
    if (props.layout !== "list") {
        return <BrowseOverlayPropertyCard {...props} />;
    }
    return <BrowseListPropertyCard {...props} />;
}

function BrowseListPropertyCard({
    listing,
    layout = "grid",
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
    className,
}: Extract<PropertyCardProps, { variant: "browse" }>) {
    const sharePriceLabel =
        offersRent(listing) && !offersSale(listing)
            ? formatRentInr(listing.rentAmountInr ?? 0)
            : formatPriceInr(listing.saleAmountInr ?? listing.rentAmountInr ?? 0);
    const isListView = layout === "list";

    return (
        <article
            className={cn(
                "flex min-inline-0",
                isListView ? "flex-row items-stretch gap-4" : "flex-1 flex-col gap-3 block-full",
                className,
            )}
        >
            <Link
                href={detailsHref}
                prefetch={false}
                className={cn("group block shrink-0 min-inline-0", isListView && "self-start")}
            >
                <BrowsePropertyCardPhoto
                    listing={listing}
                    priority={priority}
                    imageSizes={imageSizes}
                    layout={layout}
                />
            </Link>

            <div
                className={cn(
                    "flex flex-1 flex-col gap-2.5 px-2 min-inline-0",
                    isListView ? "self-stretch" : "min-block-0",
                )}
            >
                <div className="flex flex-1 items-stretch gap-2 min-block-0">
                    <div className="flex flex-1 flex-col gap-1.5 min-block-0 min-inline-0">
                        <div className="flex flex-col gap-1.5 min-inline-0">
                            <h3 className="max-inline-full min-inline-0">
                                <PropertyTitleLink
                                    href={detailsHref}
                                    className={PROPERTY_CARD_TITLE_CLASS}
                                >
                                    {listing.title}
                                </PropertyTitleLink>
                            </h3>
                            <p className={PROPERTY_CARD_LOCATION_CLASS}>
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate capitalize">
                                    {listing.locality}, {listing.city}
                                </span>
                            </p>
                        </div>

                        <BrowsePropertyCardSpecs listing={listing} />

                        <BrowsePropertyCardOwner owner={listing.owner} />
                    </div>

                    <div className="mbs-0.5 flex shrink-0 items-center gap-3 self-start">
                        {onToggleSave ? (
                            <PropertySaveButton
                                isSaved={isSaved}
                                title={listing.title}
                                onToggle={onToggleSave}
                                className="tracking-wide"
                            />
                        ) : null}
                        <PropertySharePopover
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
                                listingKind:
                                    offersRent(listing) && !offersSale(listing) ? "rent" : "sale",
                            }}
                            className="tracking-wide"
                        />
                    </div>
                </div>

                <div className="mbs-auto flex flex-col gap-2.5">
                    <BrowsePropertyCardPrice listing={listing} />

                    <BrowseRequestAction
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
                </div>
            </div>
        </article>
    );
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
    layout = "grid",
}: {
    listing: PropertyCardBase;
    priority: boolean;
    imageSizes: string;
    layout?: "grid" | "list";
}) {
    const alt = `${listing.configLabel} ${listing.propertyTypeLabel}`;

    return (
        <HoverScaleRoot
            className={cn(
                PROPERTY_CARD_PHOTO_CLASS,
                layout === "list" ? PROPERTY_CARD_PHOTO_LIST_CLASS : PROPERTY_CARD_PHOTO_GRID_CLASS,
            )}
        >
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
                {listing.isNew ? (
                    <Badge variant="brand">New</Badge>
                ) : (
                    <span aria-hidden />
                )}

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
    layout = "grid",
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
                layout === "list" ? "flex flex-row" : "flex flex-col",
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
                <PropertyCardPhoto
                    listing={listing}
                    priority={priority}
                    imageSizes={imageSizes}
                    layout={layout}
                />
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

function OwnedListingAction({
    href,
    isEdit,
    onEdit,
    onAddBuyer,
}: {
    href: string;
    isEdit: boolean;
    /** When set, editing opens in place instead of navigating to the edit page. */
    onEdit?: () => void;
    /** When set, a second button opens the buyer picker for this listing. */
    onAddBuyer?: () => void;
}) {
    const opensInModal = isEdit && onEdit != null;

    return (
        <TooltipProvider>
            <div className="flex gap-2">
                {onAddBuyer ? (
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    size="md"
                                    variant="outline"
                                    type="button"
                                    className="flex-1 border-border-warm"
                                    onClick={onAddBuyer}
                                >
                                    <UserPlus
                                        aria-hidden
                                        className="block-4 inline-4"
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

                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span
                                className={cn(
                                    "inline-flex",
                                    onAddBuyer ? "flex-[1.4]" : "inline-full",
                                )}
                            >
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
        hasRequested: false,
        saleAmountInr: listing.saleAmountInr,
        rentAmountInr: listing.rentAmountInr,
    };
}

function OwnedStatusBadge({ status }: { status: OwnedPropertyCardStatus }) {
    const variant = status === "published" ? "brand" : status === "draft" ? "outline" : "urgent";
    return <Badge variant={variant}>{OWNED_STATUS_LABEL[status]}</Badge>;
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

function OwnedPropertyCard({
    listing,
    layout = "grid",
    detailsHref,
    priority = false,
    imageSizes = "(max-width: 768px) 100vw, 50vw",
    editHref,
    onEdit,
    onAddBuyer,
    className,
}: Extract<PropertyCardProps, { variant: "owned" }>) {
    const browse = ownedToBrowseListing(listing);
    const isListView = layout === "list";
    const sharePriceLabel =
        offersRent(browse) && !offersSale(browse)
            ? formatRentInr(listing.rentAmountInr ?? 0)
            : formatPriceInr(listing.saleAmountInr ?? listing.rentAmountInr ?? 0);

    return (
        <article
            className={cn(
                "flex min-inline-0",
                isListView ? "flex-row items-stretch gap-4" : "flex-1 flex-col gap-3 block-full",
                className,
            )}
        >
            <Link
                href={detailsHref}
                prefetch={false}
                className={cn(
                    "group relative block shrink-0 min-inline-0",
                    isListView && `self-start`,
                )}
            >
                <BrowsePropertyCardPhoto
                    listing={browse}
                    priority={priority}
                    imageSizes={imageSizes}
                    layout={layout}
                />
                <div
                    className="
                      pointer-events-none absolute inset-e-4 inset-bs-4 z-20 flex flex-col items-end
                      gap-1.5
                    "
                >
                    <OwnedStatusBadge status={listing.status} />
                </div>
            </Link>

            <div
                className={cn(
                    "flex flex-1 flex-col gap-2.5 px-2 min-inline-0",
                    isListView ? "self-stretch" : "min-block-0",
                )}
            >
                <div className="flex items-start gap-2">
                    <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                        <div className="flex flex-col gap-1.5 min-inline-0">
                            <h3 className="max-inline-full min-inline-0">
                                <PropertyTitleLink
                                    href={detailsHref}
                                    className={PROPERTY_CARD_TITLE_CLASS}
                                >
                                    {listing.title}
                                </PropertyTitleLink>
                            </h3>
                            <p className={PROPERTY_CARD_LOCATION_CLASS}>
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate capitalize">
                                    {listing.locality}, {listing.city}
                                </span>
                            </p>
                        </div>
                        <BrowsePropertyCardSpecs listing={browse} />
                        {listing.ownerName ? (
                            <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                                <UserRound aria-hidden className="shrink-0 block-3.5 inline-3.5" />
                                <span className="truncate">Owner: {listing.ownerName}</span>
                                {listing.visibility === "private" ? (
                                    <Badge variant="neutral" className="shrink-0">
                                        Private
                                    </Badge>
                                ) : null}
                            </p>
                        ) : null}
                    </div>

                    <PropertySharePopover
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
                            listingKind:
                                offersRent(browse) && !offersSale(browse) ? "rent" : "sale",
                        }}
                        className="mbs-0.5 self-start tracking-wide"
                    />
                </div>

                <div className="mbs-auto flex flex-col gap-2.5">
                    <OwnedPropertyCardPrice listing={listing} />
                    <OwnedListingAction
                        href={editHref ?? detailsHref}
                        isEdit={Boolean(editHref)}
                        onEdit={onEdit}
                        onAddBuyer={onAddBuyer}
                    />
                </div>
            </div>
        </article>
    );
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
