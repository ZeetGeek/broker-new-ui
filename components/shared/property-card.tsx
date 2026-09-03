"use client";

import Link from "next/link";

import {
    Bath,
    BedDouble,
    Building2,
    Calendar,
    Camera,
    CircleCheck,
    Clock,
    MapPin,
    Maximize2,
    MessageCircle,
    Users,
} from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { formatRepresentationExpiry, formatRepresentedSince } from "@/lib/format/representation";
import { cn } from "@/lib/utils";

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
    "shrink-0 rounded-card bg-surface p-1 shadow-md transition-shadow duration-160 group-hover:shadow-lg";
const BROWSE_CARD_PHOTO_FRAME_GRID_CLASS = "w-full";
const BROWSE_CARD_PHOTO_FRAME_LIST_CLASS = "w-40 sm:w-48 md:w-56";

const BROWSE_CARD_PHOTO_INNER_CLASS =
    "relative overflow-hidden rounded-[calc(var(--radius-card)-4px)] bg-surface-muted";
const BROWSE_CARD_PHOTO_INNER_GRID_CLASS = "aspect-[4/3] w-full";
const BROWSE_CARD_PHOTO_INNER_LIST_CLASS = "aspect-[4/3] min-h-40 w-full";

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
};

export type RepresentedPropertyCardListing = PropertyCardBase & {
    fullAddress: string;
    representedSince: Date;
    representationEndsAt: Date;
    sharedBrokerCount: number;
    visitsBookedCount: number;
    clientsMatchedCount: number;
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
} & (
    | { variant: "browse"; listing: BrowsePropertyCardListing }
    | { variant: "represented"; listing: RepresentedPropertyCardListing }
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
    const dotCount = Math.min(Math.max(listing.photoCount, 1), 5);

    return (
        <div
            className={cn(
                BROWSE_CARD_PHOTO_FRAME_CLASS,
                layout === "list"
                    ? BROWSE_CARD_PHOTO_FRAME_LIST_CLASS
                    : BROWSE_CARD_PHOTO_FRAME_GRID_CLASS,
            )}
        >
            <div
                className={cn(
                    BROWSE_CARD_PHOTO_INNER_CLASS,
                    layout === "list"
                        ? BROWSE_CARD_PHOTO_INNER_LIST_CLASS
                        : BROWSE_CARD_PHOTO_INNER_GRID_CLASS,
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

                {listing.isNew ? (
                    <Badge
                        className="
                          body-xs absolute inset-e-3 inset-bs-3 border-0 bg-surface font-semibold
                          text-ink shadow-xs
                        "
                    >
                        New
                    </Badge>
                ) : null}

                {listing.photoCount > 1 ? (
                    <div
                        className="
                          absolute inset-x-0 inset-be-3 flex items-center justify-center gap-1.5
                        "
                        aria-hidden
                    >
                        {Array.from({ length: dotCount }).map((_, index) => (
                            <span
                                key={index}
                                className={cn(
                                    "rounded-full bg-surface/90 block-1.5",
                                    index === 0 ? "opacity-100 inline-4" : "opacity-60 inline-1.5",
                                )}
                            />
                        ))}
                    </div>
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
    const priceLabel = listing.isRent
        ? formatRentInr(listing.amountInr)
        : formatPriceInr(listing.amountInr);
    const isListView = layout === "list";

    return (
        <article
            className={cn(
                "flex min-inline-0",
                isListView ? "flex-row items-start gap-4" : "flex-col gap-3",
                className,
            )}
        >
            <Link href={detailsHref} prefetch={false} className="group block shrink-0 min-inline-0">
                <BrowsePropertyCardPhoto
                    listing={listing}
                    priority={priority}
                    imageSizes={imageSizes}
                    layout={layout}
                />
            </Link>

            <div className="flex flex-1 flex-col gap-2.5 px-2 min-inline-0">
                <Link
                    href={detailsHref}
                    prefetch={false}
                    className="flex flex-col gap-2.5 min-inline-0"
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

                    <BrowsePropertyCardSpecs listing={listing} />
                </Link>

                <div className="flex items-baseline gap-1.5">
                    <span className="h5 truncate font-semibold text-ink tabular-nums">
                        {priceLabel}
                    </span>
                    <span className="body-sm shrink-0 font-medium text-brand">
                        ({listing.commissionPercent}%)
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="min-inline-0 flex-1">
                        <BrowseRequestAction
                            hasRequested={listing.hasRequested}
                            isRequestPending={isRequestPending}
                            onRequest={onRequest}
                        />
                    </div>
                    <PropertySharePopover
                        listing={{
                            id: listing.id,
                            title: listing.title,
                            locality: listing.locality,
                            city: listing.city,
                            priceLabel,
                        }}
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

export function PropertyCard(props: PropertyCardProps) {
    if (props.variant === "browse") {
        return <BrowsePropertyCard {...props} />;
    }

    return <RepresentedPropertyCard {...props} />;
}
