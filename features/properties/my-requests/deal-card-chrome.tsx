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
import { MarqueeText } from "@/components/shared/marquee-text";
import {
    OVERLAY_GLASS_BUTTON_CLASS,
    OVERLAY_ICON_BUTTON_CLASS,
    OverlayCard,
    OverlayCardSummary,
    OverlayChip,
    OverlayPersonLine,
} from "@/components/shared/overlay-card";
import { AvatarStack } from "@/components/shared/avatar-stack";
import { PhoneNumber } from "@/components/shared/phone-number";
import {
    PropertyCardMenu,
    type PropertyCardMenuContact,
} from "@/components/shared/property-card-menu";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import type { PropertyShareInput } from "@/lib/share/property";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";
import type { RequestsView } from "@/features/properties/my-requests/use-requests-view";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

const PHOTO_FRAME =
    "shrink-0 rounded-card bg-surface p-1 shadow-md transition-[box-shadow] duration-160 group-hover:shadow-lg";
const PHOTO_INNER =
    "relative overflow-hidden rounded-[calc(var(--radius-card)-4px)] bg-surface-muted";
const TITLE_CLASS = "body font-semibold tracking-wide text-ink capitalize";
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
    detailHref,
}: {
    listing: DealCardListing;
    view: RequestsView;
    stageBadge?: ReactNode;
    /** Defaults to the broker marketplace listing URL. */
    detailHref?: string;
}) {
    const isList = view === "list";
    const href = detailHref ?? brokerOwnerListingDetailHref(listing.propertyId);

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
                        isList ? "aspect-5/4 inline-full" : `aspect-4/3 inline-full`,
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

export function DealCardMeta({
    listing,
    detailHref,
}: {
    listing: DealCardListing;
    /** Defaults to the broker marketplace listing URL. */
    detailHref?: string;
}) {
    const href = detailHref ?? brokerOwnerListingDetailHref(listing.propertyId);
    const showBeds = listing.bhk > 0 && RESIDENTIAL.has(listing.propertyTypeLabel.toLowerCase());

    return (
        <div className="group/marquee flex flex-col gap-1.5 min-inline-0">
            <h3 className="max-inline-full min-inline-0">
                <PropertyTitleLink href={href} className={TITLE_CLASS}>
                    <MarqueeText text={listing.title} />
                </PropertyTitleLink>
            </h3>
            <p className={LOCATION_CLASS}>
                <MapPin aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                <MarqueeText text={`${listing.locality}, ${listing.city}`} className="capitalize" />
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
    className,
}: {
    name: string;
    phoneDigits: string;
    /** `overlay`: round glass on photo. `panel`: labeled footer button. */
    appearance?: "bare" | "overlay" | "panel";
    className?: string;
}) {
    const isOverlay = appearance === "overlay";
    const isPanel = appearance === "panel";

    if (isPanel) {
        return (
            <Button
                size="md"
                variant="outline"
                nativeButton={false}
                className={cn("flex-1", className)}
                render={
                    <a
                        href={formatWhatsAppUrl(phoneDigits)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${name}`}
                    />
                }
            >
                <Icon
                    icon="bi:whatsapp"
                    width={18}
                    height={18}
                    className="block-4.5 inline-4.5"
                    aria-hidden
                />
                WhatsApp
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size={isOverlay ? "icon" : "icon-sm"}
            nativeButton={false}
            className={cn(
                isOverlay ? OVERLAY_ICON_BUTTON_CLASS : BARE_ICON_BUTTON_CLASS,
                className,
            )}
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
                icon="bi:whatsapp"
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

export function dealShareInput(listing: DealCardListing): PropertyShareInput {
    return {
        id: listing.propertyId,
        title: listing.title,
        locality: listing.locality,
        city: listing.city,
        priceLabel: dealPriceLabel(listing),
        imageSrc: listing.imageSrc,
        configLabel: listing.configLabel,
        propertyTypeLabel: listing.propertyTypeLabel,
        areaSqft: listing.areaSqft,
        bhk: listing.bhk,
        listingKind: listing.isRent ? "rent" : "sale",
    };
}

/** Single ⋯ menu on the photo: Share › channels, Save, Message, WhatsApp, deal extras. */
export function DealCardPhotoToolbar({
    listing,
    isSaved = false,
    onToggleSave,
    contact,
    onOpenTimeline,
    onCancelRequest,
    tone = "overlay",
}: {
    listing: DealCardListing;
    isSaved?: boolean;
    onToggleSave?: () => void;
    contact?: PropertyCardMenuContact;
    onOpenTimeline?: () => void;
    onCancelRequest?: () => void;
    tone?: "overlay" | "plain";
}) {
    return (
        <PropertyCardMenu
            listing={dealShareInput(listing)}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
            contact={contact}
            onOpenTimeline={onOpenTimeline}
            onCancelRequest={onCancelRequest}
            tone={tone}
        />
    );
}

/**
 * Grid deal card. Status leads the chips. `muted` desaturates the photo for a
 * deal the broker can no longer act on, so live deals stand out while
 * scanning. Photo `actions` is the single ⋯ menu (share / save / contact).
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
    detailHref,
}: {
    listing: DealCardListing;
    configLabel: string;
    statusLabel: string;
    statusTone: DealStatusTone;
    muted?: boolean;
    isBusy?: boolean;
    actions?: ReactNode;
    children: ReactNode;
    /** Defaults to the broker marketplace listing URL. */
    detailHref?: string;
}) {
    const href = detailHref ?? brokerOwnerListingDetailHref(listing.propertyId);
    const specsLabel = [configLabel, formatAreaSqft(listing.areaSqft)].filter(Boolean).join(" · ");

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
                priceLabel={dealPriceLabel(listing)}
                headline={listing.title}
                locationLabel={`${listing.locality}, ${listing.city}`}
                specsLabel={specsLabel || undefined}
            />
            {children}
        </OverlayCard>
    );
}

/** Owner line (+ optional commission / phone) under the summary. */
export function DealOverlayStats({
    listing,
    ownerName,
    ownerPhoneDigits,
    personLabel = "Owner",
}: {
    listing: DealCardListing;
    ownerName: string;
    ownerPhoneDigits?: string;
    /** Owner-side cards pass "Broker". */
    personLabel?: string;
}) {
    const phoneHint = ownerPhoneDigits ? (
        <PhoneNumber phoneDigits={ownerPhoneDigits} className="text-inherit" />
    ) : undefined;
    const commissionHint =
        listing.commissionPercent > 0 ? `${listing.commissionPercent}% commission` : undefined;

    return (
        <div className="flex flex-col gap-1 min-inline-0">
            <OverlayPersonLine label={personLabel} name={ownerName} hint={phoneHint} />
            {commissionHint ? (
                <p className="body-sm tracking-wide text-ink-muted tabular-nums">
                    {commissionHint}
                </p>
            ) : null}
        </div>
    );
}

/** Attached buyers on an approved deal — tap opens the buyers modal. */
export function DealAttachedBuyers({
    buyers,
    onManage,
}: {
    buyers: Array<{ id: string; name: string; avatarUrl?: string }>;
    /** Opens the manage-buyers modal when the row is pressed. */
    onManage?: () => void;
}) {
    if (buyers.length === 0) return null;

    const countLabel = buyers.length === 1 ? "1 buyer" : `${buyers.length} buyers`;
    const names = buyers.map((buyer) => buyer.name).join(", ");

    const content = (
        <>
            <AvatarStack people={buyers} max={3} className="shrink-0" />
            <span className="flex min-inline-0 flex-col gap-0.5">
                <span className="body-sm font-semibold tracking-wide text-ink">{countLabel}</span>
                <span className="body-xs truncate tracking-wide text-ink-muted capitalize">
                    {names}
                </span>
            </span>
        </>
    );

    if (onManage) {
        return (
            <button
                type="button"
                onClick={onManage}
                className={cn(
                    `
                      flex items-center gap-2.5 px-3 py-2.5 text-start transition-colors
                      duration-160 inline-full rounded-control
                    `,
                    OVERLAY_GLASS_BUTTON_CLASS,
                )}
            >
                {content}
            </button>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-control",
                OVERLAY_GLASS_BUTTON_CLASS,
            )}
        >
            {content}
        </div>
    );
}

/** Footer wrapper — one row of primary actions at the bottom. */
export function DealOverlayFooter({ children }: { children: ReactNode }) {
    return <div className="pointer-events-auto mbs-auto flex gap-2 inline-full">{children}</div>;
}

export function DealOverlayFooterRow({ children }: { children: ReactNode }) {
    return <div className="flex gap-2 inline-full">{children}</div>;
}

/** Outline-button class for the footer's secondary action, per card tone. */
export function dealSecondaryButtonClass(tone: "light" | "overlay"): string {
    return tone === "overlay" ? OVERLAY_GLASS_BUTTON_CLASS : "border-border-warm";
}
