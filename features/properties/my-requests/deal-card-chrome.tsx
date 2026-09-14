"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { addCollection, Icon } from "@iconify/react/offline";
import { Bath, BedDouble, MapPin, Maximize2 } from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { HoverScaleLayer, HoverScaleRoot } from "@/components/shared/hover-scale-media";
import {
    OVERLAY_GLASS_BUTTON_CLASS,
    OVERLAY_ICON_BUTTON_CLASS,
    OverlayCard,
    OverlayCardSummary,
    OverlayChip,
    OverlayStat,
    OverlayStatsRow,
} from "@/components/shared/overlay-card";
import { PhoneNumber } from "@/components/shared/phone-number";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import whatsappIcons from "@/features/properties/my-requests/selfhst-whatsapp.json";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

const PHOTO_FRAME =
    "shrink-0 rounded-card bg-surface p-1 shadow-md transition-[box-shadow] duration-160 group-hover:shadow-lg";
const PHOTO_INNER =
    "relative overflow-hidden rounded-[calc(var(--radius-card)-4px)] bg-surface-muted";
const TITLE_CLASS = "body truncate font-semibold tracking-wide text-ink capitalize";
const LOCATION_CLASS =
    "body-sm flex items-center gap-1.5 tracking-wide text-ink-muted min-inline-0";
const SPECS_CLASS =
    "body-sm flex flex-nowrap items-center gap-x-1.5 overflow-hidden tracking-wide text-ink-muted";
const RESIDENTIAL = new Set(["apartment", "villa", "penthouse"]);

export type DealCardListing = {
    propertyId: string;
    title: string;
    locality: string;
    city: string;
    areaSqft: number;
    bhk: number;
    propertyTypeLabel: string;
    amountInr: number;
    isRent: boolean;
    commissionPercent: number;
    imageSrc: string;
};

export function DealCardShell({
    view,
    isBusy,
    children,
    className,
}: {
    view: RequestsView;
    isBusy?: boolean;
    children: ReactNode;
    className?: string;
}) {
    const isList = view === "list";

    return (
        <article
            className={cn(
                "flex min-inline-0",
                isList ? "flex-row items-stretch gap-4" : "flex-1 flex-col gap-3 block-full",
                isBusy && "pointer-events-none opacity-60",
                className,
            )}
        >
            {children}
        </article>
    );
}

export function DealCardPhoto({
    listing,
    view,
    stageBadge,
}: {
    listing: DealCardListing;
    view: RequestsView;
    stageBadge?: ReactNode;
}) {
    const isList = view === "list";
    const href = brokerOwnerListingDetailHref(listing.propertyId);

    return (
        <Link
            href={href}
            prefetch={false}
            className={cn("group relative block shrink-0 min-inline-0", isList && "self-start")}
        >
            <div
                className={cn(
                    PHOTO_FRAME,
                    isList
                        ? `
                          shrink-0 self-start inline-[min(62%,28rem)] min-inline-64
                          sm:min-inline-72
                        `
                        : `inline-full`,
                )}
            >
                <HoverScaleRoot
                    className={cn(
                        PHOTO_INNER,
                        isList
                            ? "aspect-5/4 inline-full"
                            : `aspect-4/3 inline-full`,
                    )}
                >
                    {listing.imageSrc ? (
                        <HoverScaleLayer className="absolute inset-0">
                            <AppImage
                                src={listing.imageSrc}
                                alt=""
                                fill
                                sizes={
                                    isList
                                        ? "(max-width: 768px) 55vw, 320px"
                                        : "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                                }
                                className="object-cover"
                            />
                        </HoverScaleLayer>
                    ) : null}

                    <div
                        className="
                          absolute inset-s-3 inset-bs-3 z-10 flex flex-wrap items-start gap-1.5
                        "
                    >
                        <Badge variant={listing.isRent ? "urgent" : "brand"}>
                            {listing.isRent ? "For rent" : "For sale"}
                        </Badge>
                    </div>
                </HoverScaleRoot>
            </div>
            {stageBadge ? (
                <div
                    className="
                      pointer-events-none absolute inset-e-4 inset-bs-4 z-20 flex flex-col items-end
                      gap-1.5
                    "
                >
                    {stageBadge}
                </div>
            ) : null}
        </Link>
    );
}

export function DealCardBody({ view, children }: { view: RequestsView; children: ReactNode }) {
    return (
        <div
            className={cn(
                "flex flex-1 flex-col gap-2.5 px-2 min-inline-0",
                view === "list" ? "self-stretch" : "min-block-0",
            )}
        >
            {children}
        </div>
    );
}

export function DealCardMeta({ listing }: { listing: DealCardListing }) {
    const href = brokerOwnerListingDetailHref(listing.propertyId);
    const showBeds = listing.bhk > 0 && RESIDENTIAL.has(listing.propertyTypeLabel.toLowerCase());

    return (
        <div className="flex flex-col gap-1.5 min-inline-0">
            <h3 className="max-inline-full min-inline-0">
                <PropertyTitleLink href={href} className={TITLE_CLASS}>
                    {listing.title}
                </PropertyTitleLink>
            </h3>
            <p className={LOCATION_CLASS}>
                <MapPin aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                <span className="truncate capitalize">
                    {listing.locality}, {listing.city}
                </span>
            </p>
            <div className={SPECS_CLASS}>
                <span className="inline-flex items-center gap-1">
                    <Maximize2 aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                    {formatAreaSqft(listing.areaSqft)}
                </span>
                {showBeds ? (
                    <>
                        <span aria-hidden className="text-ink-subtle/70">
                            ·
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <BedDouble
                                aria-hidden
                                className="block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                            {listing.bhk === 1 ? "1 Bed" : `${listing.bhk} Bed`}
                        </span>
                        <span aria-hidden className="text-ink-subtle/70">
                            ·
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Bath aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                            {listing.bhk === 1 ? "1 Bath" : `${listing.bhk} Bath`}
                        </span>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export function DealCardPrice({ listing }: { listing: DealCardListing }) {
    const priceLabel = listing.isRent
        ? formatRentInr(listing.amountInr)
        : formatPriceInr(listing.amountInr);

    return (
        <div className="flex flex-1 items-baseline gap-1.5 min-inline-0">
            <span className="h5 truncate font-semibold tracking-wide text-ink tabular-nums">
                {priceLabel}
            </span>
            {listing.commissionPercent > 0 ? (
                <span className="body-sm shrink-0 font-medium tracking-wide text-brand">
                    ({listing.commissionPercent}%)
                </span>
            ) : null}
        </div>
    );
}

export function DealCardFooter({ children }: { children: ReactNode }) {
    return <div className="flex gap-2">{children}</div>;
}

const BARE_ICON_BUTTON_CLASS =
    "shrink-0 bg-transparent p-0 hover:bg-transparent block-6! inline-6!";

export function DealWhatsAppButton({
    name,
    phoneDigits,
    appearance = "bare",
}: {
    name: string;
    phoneDigits: string;
    /** `overlay`: round glass button for the top of a photo card. */
    appearance?: "bare" | "overlay";
}) {
    const isOverlay = appearance === "overlay";

    return (
        <Button
            variant="ghost"
            size={isOverlay ? "icon" : "icon-sm"}
            nativeButton={false}
            className={isOverlay ? OVERLAY_ICON_BUTTON_CLASS : BARE_ICON_BUTTON_CLASS}
            render={
                <a
                    href={formatWhatsAppUrl(phoneDigits)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Message ${name} on WhatsApp`}
                />
            }
        >
            <Icon
                icon="selfhst:whatsapp"
                width={isOverlay ? 20 : 24}
                height={isOverlay ? 20 : 24}
                className={isOverlay ? "block-5 inline-5" : "block-6 inline-6"}
                aria-hidden
            />
        </Button>
    );
}

/* ------------------------------------------------------------------ */
/* Grid view: overlay card (full-bleed photo, details on a blur panel) */
/* ------------------------------------------------------------------ */

export type DealStatusTone = "waiting" | "action" | "success" | "danger" | "closed";

const STATUS_DOT_CLASS: Record<DealStatusTone, string> = {
    waiting: "bg-surface/70",
    action: "bg-urgent-mid",
    success: "bg-success-mid",
    danger: "bg-danger-mid",
    closed: "bg-ink-subtle",
};

const OVERLAY_IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw";

export function dealPriceLabel(listing: DealCardListing): string {
    return listing.isRent ? formatRentInr(listing.amountInr) : formatPriceInr(listing.amountInr);
}

/**
 * Grid deal card. Status leads the chips. `muted` desaturates the photo for a
 * deal the broker can no longer act on, so live deals stand out while
 * scanning. `actions` go top-right (menu, chat, WhatsApp); `children` go under
 * the summary (message, stats, footer).
 */
export function DealOverlayCard({
    listing,
    configLabel,
    statusLabel,
    statusTone,
    muted = false,
    isBusy = false,
    actions,
    children,
}: {
    listing: DealCardListing;
    configLabel: string;
    statusLabel: string;
    statusTone: DealStatusTone;
    muted?: boolean;
    isBusy?: boolean;
    actions?: ReactNode;
    children: ReactNode;
}) {
    const href = brokerOwnerListingDetailHref(listing.propertyId);
    const specsLabel = [formatAreaSqft(listing.areaSqft), configLabel].filter(Boolean).join(" · ");

    return (
        <OverlayCard
            href={href}
            imageSrc={listing.imageSrc}
            imageAlt={listing.title}
            imageSizes={OVERLAY_IMAGE_SIZES}
            muted={muted}
            className={cn(isBusy && "pointer-events-none opacity-60")}
            chips={
                <>
                    <OverlayChip
                        dotClassName={STATUS_DOT_CLASS[statusTone]}
                        pulse={statusTone === "action"}
                    >
                        {statusLabel}
                    </OverlayChip>
                    <OverlayChip dotClassName={listing.isRent ? "bg-urgent-mid" : "bg-success-mid"}>
                        {listing.isRent ? "For rent" : "For sale"}
                    </OverlayChip>
                </>
            }
            actions={actions}
        >
            <OverlayCardSummary
                href={href}
                title={listing.title}
                priceLabel={dealPriceLabel(listing)}
                locationLabel={`${listing.locality}, ${listing.city}`}
                specsLabel={specsLabel}
            />
            {children}
        </OverlayCard>
    );
}

/** Commission + owner. The owner's number shows once the deal is live. */
export function DealOverlayStats({
    listing,
    ownerName,
    ownerPhoneDigits,
}: {
    listing: DealCardListing;
    ownerName: string;
    ownerPhoneDigits?: string;
}) {
    return (
        <OverlayStatsRow>
            {listing.commissionPercent > 0 ? (
                <OverlayStat label="Commission">{listing.commissionPercent}%</OverlayStat>
            ) : null}
            <OverlayStat
                label="Owner"
                hint={
                    ownerPhoneDigits ? (
                        <PhoneNumber phoneDigits={ownerPhoneDigits} className="text-inherit" />
                    ) : undefined
                }
            >
                <span className="capitalize">{ownerName}</span>
            </OverlayStat>
        </OverlayStatsRow>
    );
}

/** Footer wrapper for the overlay panel — re-enables the pointer for tooltip wrappers. */
export function DealOverlayFooter({ children }: { children: ReactNode }) {
    return <div className="pointer-events-auto flex gap-2">{children}</div>;
}

/** Outline-button class for the footer's secondary action, per card tone. */
export function dealSecondaryButtonClass(tone: "light" | "overlay"): string {
    return tone === "overlay" ? OVERLAY_GLASS_BUTTON_CLASS : "border-border-warm";
}
