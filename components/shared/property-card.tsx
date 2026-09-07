"use client";

import { type MouseEvent, type PointerEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

import useEmblaCarousel from "embla-carousel-react";
import {
    Bath,
    BedDouble,
    Building2,
    Calendar,
    Camera,
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    Clock,
    MapPin,
    Maximize2,
    MessageCircle,
    Users,
} from "lucide-react";
import { useReducedMotion } from "motion/react";

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
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { AppImage } from "@/components/shared/app-image";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { PropertySharePopover } from "@/components/shared/property-share-popover";
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

const BROWSE_CARD_PHOTO_NAV_BTN_CLASS = `
  absolute inset-bs-1/2 z-10 flex -translate-y-1/2 items-center justify-center
  rounded-full bg-surface/95 text-ink transition-[opacity,transform] duration-160
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
const BROWSE_REQUEST_SENT_LABEL = "Request sent";

const BROWSE_REQUEST_TOOLTIP = {
    idle: "Ask the owner for permission to represent this property",
    pending: "Sending your request to the owner…",
    sent: "Waiting for the owner to approve. You'll hear back once they respond.",
} as const;

function BrowseRequestAction({
    hasRequested,
    isRequestPending,
    onRequest,
}: {
    hasRequested: boolean;
    isRequestPending: boolean;
    onRequest?: () => void;
}) {
    const tooltip = hasRequested
        ? BROWSE_REQUEST_TOOLTIP.sent
        : isRequestPending
          ? BROWSE_REQUEST_TOOLTIP.pending
          : BROWSE_REQUEST_TOOLTIP.idle;

    const sentStatus = (
        <div
            role="status"
            className="
              body-sm flex items-center justify-center gap-2 rounded-control border-2 border-brand
              bg-brand-soft px-4 font-semibold text-brand-text block-control-lg inline-full
            "
        >
            <CircleCheck
                aria-hidden
                className="shrink-0 text-brand-text block-4 inline-4"
                strokeWidth={2}
            />
            {BROWSE_REQUEST_SENT_LABEL}
        </div>
    );

    const requestButton = (
        <Button
            type="button"
            size="md"
            variant="accent"
            className="inline-full"
            disabled={isRequestPending}
            onClick={onRequest}
        >
            {isRequestPending ? BROWSE_REQUEST_PENDING_LABEL : BROWSE_REQUEST_LABEL}
        </Button>
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <span className="inline-flex inline-full">
                            {hasRequested ? sentStatus : requestButton}
                        </span>
                    }
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
};

export type PropertyCardProps = {
    className?: string;
    layout?: "grid" | "list";
    detailsHref: string;
    priority?: boolean;
    imageSizes?: string;
    onRequest?: () => void;
    isRequestPending?: boolean;
    onShare?: () => void;
    onOpenCrm?: () => void;
    crmHref?: string;
    editHref?: string;
} & (
    | { variant: "browse"; listing: BrowsePropertyCardListing }
    | { variant: "represented"; listing: RepresentedPropertyCardListing }
    | { variant: "owned"; listing: OwnedPropertyCardListing }
);

function formatBrowseCardArea(areaSqft: number): string {
    return `${Math.round(areaSqft).toLocaleString("en-IN")} sq.ft.`;
}

function formatBedLabel(bhk: number): string {
    return bhk === 1 ? "1 bed" : `${bhk} bed`;
}

function formatBathLabel(bhk: number): string {
    return bhk === 1 ? "1 bath" : `${bhk} bath`;
}

function BrowseSpecDivider() {
    return (
        <span aria-hidden className="text-ink-subtle/70">
            |
        </span>
    );
}

function BrowseSpecItem({ icon: Icon, label }: { icon: typeof Maximize2; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Icon aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
            {label}
        </span>
    );
}

function BrowsePropertyCardPhoto({
    listing,
    priority,
    imageSizes,
    layout = "grid",
}: {
    listing: BrowsePropertyCardListing;
    priority: boolean;
    imageSizes: string;
    layout?: "grid" | "list";
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
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "start",
        containScroll: "trimSnaps",
        dragFree: false,
        skipSnaps: false,
        watchDrag: canCarousel,
    });

    const syncCarouselState = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        syncCarouselState();
        emblaApi.on("select", syncCarouselState);
        emblaApi.on("reInit", syncCarouselState);
        return () => {
            emblaApi.off("select", syncCarouselState);
            emblaApi.off("reInit", syncCarouselState);
        };
    }, [emblaApi, syncCarouselState]);

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
        emblaApi?.scrollNext();
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
                layout === "list"
                    ? BROWSE_CARD_PHOTO_FRAME_LIST_CLASS
                    : BROWSE_CARD_PHOTO_FRAME_GRID_CLASS,
            )}
        >
            <div
                className={cn(
                    BROWSE_CARD_PHOTO_INNER_CLASS,
                    "group/photo",
                    layout === "list"
                        ? BROWSE_CARD_PHOTO_INNER_LIST_CLASS
                        : BROWSE_CARD_PHOTO_INNER_GRID_CLASS,
                )}
            >
                {images.length > 0 ? (
                    <div
                        ref={emblaRef}
                        className="overflow-hidden block-full inline-full"
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
                                    <AppImage
                                        src={src}
                                        alt={index === 0 ? alt : `${alt} — photo ${index + 1}`}
                                        fill
                                        sizes={imageSizes}
                                        priority={priority && index === 0}
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
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
                    {offersSale(listing) ? (
                        <Badge
                            className="
                              body-xs border-0 bg-brand font-semibold text-surface shadow-xs
                            "
                        >
                            For sale
                        </Badge>
                    ) : null}
                    {offersRent(listing) ? (
                        <Badge
                            className="
                              body-xs border border-urgent/30 bg-urgent-soft font-semibold
                              text-urgent shadow-xs
                            "
                        >
                            For rent
                        </Badge>
                    ) : null}
                </div>

                {listing.isNew ? (
                    <Badge
                        className="
                          body-xs absolute inset-e-3 inset-bs-3 z-10 border-0 bg-highlight
                          font-semibold text-highlight-ink shadow-xs
                        "
                    >
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
                                "inset-s-3.5",
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
                            onPointerDown={stopLinkNav}
                            className={cn(
                                BROWSE_CARD_PHOTO_NAV_BTN_CLASS,
                                "inset-e-3.5",
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
            </div>
        </div>
    );
}

function BrowsePropertyCardSpecs({ listing }: { listing: BrowsePropertyCardListing }) {
    const showBedBath =
        listing.bhk > 0 && RESIDENTIAL_PROPERTY_TYPES.has(listing.propertyTypeLabel);

    return (
        <div className="body-sm flex flex-wrap items-center gap-x-2.5 gap-y-1 text-ink-muted">
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
    const reduceMotion = useReducedMotion();
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
                "body-sm shrink-0 font-medium text-brand",
                hasCommission && "cursor-help underline decoration-brand/30 underline-offset-2",
            )}
        >
            ({listing.commissionPercent}%)
        </span>
    );

    return (
        <div className="flex items-center gap-2 min-inline-0">
            <div className="flex flex-1 items-baseline gap-1.5 min-inline-0">
                <span className="h5 truncate font-semibold text-ink tabular-nums">
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
                <div
                    role="group"
                    aria-label="Price type"
                    className="
                      inline-flex shrink-0 items-center gap-0.5 rounded-full border
                      border-border-warm bg-surface p-0.5 shadow-sm
                    "
                >
                    <AnimatedBackground
                        defaultValue={activeMode}
                        onValueChange={(id) => {
                            if (id === "sale" || id === "rent") setMode(id);
                        }}
                        className="rounded-full border border-brand bg-brand-soft shadow-none"
                        transition={reduceMotion ? { duration: 0 } : spring.snappy}
                    >
                        {(
                            [
                                { id: "sale", label: "Sale" },
                                { id: "rent", label: "Rent" },
                            ] as const
                        ).map((option) => {
                            const isActive = activeMode === option.id;

                            return (
                                <button
                                    key={option.id}
                                    data-id={option.id}
                                    type="button"
                                    aria-pressed={isActive}
                                    className={cn(
                                        `
                                          body-xs rounded-full px-2.5 py-0.5 font-semibold
                                          transition-[color] duration-160
                                        `,
                                        isActive
                                            ? "text-brand-text"
                                            : "text-ink-muted hover:text-ink",
                                    )}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </AnimatedBackground>
                </div>
            ) : null}
        </div>
    );
}

function BrowsePropertyCard({
    listing,
    layout = "grid",
    detailsHref,
    priority = false,
    imageSizes = "(max-width: 768px) 100vw, 50vw",
    onRequest,
    isRequestPending = false,
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
                isListView ? "flex-row items-stretch gap-4" : "flex-col gap-3 block-full",
                className,
            )}
        >
            <Link
                href={detailsHref}
                prefetch={false}
                className={cn(
                    "group block shrink-0 min-inline-0",
                    isListView && "self-start",
                )}
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
                <div className="flex items-start gap-2">
                    <Link
                        href={detailsHref}
                        prefetch={false}
                        className="flex flex-1 flex-col gap-2.5 min-inline-0"
                    >
                        <div className="flex flex-col gap-1.5 min-inline-0">
                            <h3 className="body truncate font-semibold text-ink">
                                {listing.title}
                            </h3>
                            <p
                                className="
                                  body-sm flex items-center gap-1.5 text-ink-muted min-inline-0
                                "
                            >
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate">
                                    {listing.locality}, {listing.city}
                                </span>
                            </p>
                        </div>

                        <BrowsePropertyCardSpecs listing={listing} />
                    </Link>

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
                        className="mbs-0.5"
                    />
                </div>

                <div className="mbs-auto flex flex-col gap-2.5">
                    <BrowsePropertyCardPrice listing={listing} />

                    <BrowseRequestAction
                        hasRequested={listing.hasRequested}
                        isRequestPending={isRequestPending}
                        onRequest={onRequest}
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
        <div
            className={cn(
                PROPERTY_CARD_PHOTO_CLASS,
                layout === "list" ? PROPERTY_CARD_PHOTO_LIST_CLASS : PROPERTY_CARD_PHOTO_GRID_CLASS,
            )}
        >
            {listing.imageSrc ? (
                <AppImage
                    src={listing.imageSrc}
                    alt={alt}
                    fill
                    sizes={imageSizes}
                    priority={priority}
                    className="
                      object-cover transition-transform duration-160
                      group-hover:scale-[1.02]
                    "
                />
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
                    <Badge className="border-brand-ink/20 bg-brand-ink text-surface">New</Badge>
                ) : (
                    <span aria-hidden />
                )}

                {listing.photoCount > 0 ? (
                    <Badge variant="neutral" className="ms-auto gap-1 bg-surface/90">
                        <Camera aria-hidden strokeWidth={1.75} />
                        {listing.photoCount}
                    </Badge>
                ) : null}
            </div>
        </div>
    );
}

function PropertyCardOwnerBlock({
    owner,
    variant,
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
                "group overflow-hidden rounded-card border border-border-warm bg-surface",
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

            <PropertyCardPhoto
                listing={listing}
                priority={priority}
                imageSizes={imageSizes}
                layout={layout}
            />

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
                    <p className="body-sm font-medium text-ink">{titleLine}</p>
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

function OwnedListingAction({
    href,
    isEdit,
}: {
    href: string;
    isEdit: boolean;
}) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <span className="inline-flex inline-full">
                            <Button
                                size="md"
                                variant="accent"
                                className="inline-full"
                                render={<Link href={href} prefetch={false} />}
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
    if (status === "published") {
        return (
            <Badge className="body-xs border-0 bg-brand-soft font-semibold text-brand-text shadow-xs">
                {OWNED_STATUS_LABEL[status]}
            </Badge>
        );
    }
    if (status === "draft") {
        return (
            <Badge className="body-xs border-0 bg-surface/95 font-semibold text-ink-muted shadow-xs">
                {OWNED_STATUS_LABEL[status]}
            </Badge>
        );
    }
    return (
        <Badge className="body-xs border-0 bg-urgent-soft font-semibold text-urgent shadow-xs">
            {OWNED_STATUS_LABEL[status]}
        </Badge>
    );
}

function OwnedPropertyCardPrice({ listing }: { listing: OwnedPropertyCardListing }) {
    const browse = ownedToBrowseListing(listing);
    const both = offersBoth(browse);
    const reduceMotion = useReducedMotion();
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
                <span className="h5 truncate font-semibold text-ink tabular-nums">{priceLabel}</span>
                <span className="body-sm shrink-0 font-medium text-brand">{requestLabel}</span>
            </div>
            {both ? (
                <div
                    role="group"
                    aria-label="Price type"
                    className="
                      inline-flex shrink-0 items-center gap-0.5 rounded-full border
                      border-border-warm bg-surface p-0.5 shadow-sm
                    "
                >
                    <AnimatedBackground
                        defaultValue={activeMode}
                        onValueChange={(id) => {
                            if (id === "sale" || id === "rent") setMode(id);
                        }}
                        className="rounded-full border border-brand bg-brand-soft shadow-none"
                        transition={reduceMotion ? { duration: 0 } : spring.snappy}
                    >
                        {(
                            [
                                { id: "sale", label: "Sale" },
                                { id: "rent", label: "Rent" },
                            ] as const
                        ).map((option) => {
                            const isActive = activeMode === option.id;

                            return (
                                <button
                                    key={option.id}
                                    data-id={option.id}
                                    type="button"
                                    aria-pressed={isActive}
                                    className={cn(
                                        `
                                          body-xs rounded-full px-2.5 py-0.5 font-semibold
                                          transition-[color] duration-160
                                        `,
                                        isActive
                                            ? "text-brand-text"
                                            : "text-ink-muted hover:text-ink",
                                    )}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </AnimatedBackground>
                </div>
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
                isListView ? "flex-row items-stretch gap-4" : "flex-col gap-3 block-full",
                className,
            )}
        >
            <Link
                href={detailsHref}
                prefetch={false}
                className={cn("group relative block shrink-0 min-inline-0", isListView && "self-start")}
            >
                <BrowsePropertyCardPhoto
                    listing={browse}
                    priority={priority}
                    imageSizes={imageSizes}
                    layout={layout}
                />
                <div className="pointer-events-none absolute inset-e-3 inset-bs-3 z-20 flex flex-col items-end gap-1.5">
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
                    <Link
                        href={detailsHref}
                        prefetch={false}
                        className="flex flex-1 flex-col gap-2.5 min-inline-0"
                    >
                        <div className="flex flex-col gap-1.5 min-inline-0">
                            <h3 className="body truncate font-semibold text-ink">{listing.title}</h3>
                            <p className="body-sm flex items-center gap-1.5 text-ink-muted min-inline-0">
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate">
                                    {listing.locality}, {listing.city}
                                </span>
                            </p>
                        </div>
                        <BrowsePropertyCardSpecs listing={browse} />
                    </Link>

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
                        className="mbs-0.5"
                    />
                </div>

                <div className="mbs-auto flex flex-col gap-2.5">
                    <OwnedPropertyCardPrice listing={listing} />
                    <OwnedListingAction
                        href={editHref ?? detailsHref}
                        isEdit={Boolean(editHref)}
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
