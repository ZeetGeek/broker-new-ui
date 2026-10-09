"use client";

import type { ReactNode } from "react";

import { addCollection, Icon } from "@iconify/react/offline";

import { formatAreaSqft } from "@/lib/format/area";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import {
    OVERLAY_GLASS_BUTTON_CLASS,
    OVERLAY_ICON_BUTTON_CLASS,
    OverlayCard,
    OverlayCardSummary,
    OverlayChip,
    OverlayPersonLine,
} from "@/components/shared/overlay-card";
import { AttachedBuyersRow, AttachedOwnerRow } from "@/components/shared/attached-people-row";
import { PhoneNumber } from "@/components/shared/phone-number";
import {
    PropertyCardMenu,
    type PropertyCardMenuContact,
} from "@/components/shared/property-card-menu";
import type { PropertyShareInput } from "@/lib/share/property";
import { Button } from "@/components/ui/button";

import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

export type DealCardListing = {
    propertyId: string;
    title: string;
    locality: string;
    city: string;
    areaSqft: number;
    bhk: number;
    propertyTypeLabel: string;
    /** e.g. "2 BHK" — used in share text / specs when present. */
    configLabel?: string;
    amountInr: number;
    isRent: boolean;
    commissionPercent: number;
    imageSrc: string;
};

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
    onManage?: () => void;
}) {
    return <AttachedBuyersRow buyers={buyers} onManage={onManage} />;
}

/** Exclusive owner attached to a broker listing — tap opens the owner picker. */
export function DealAttachedOwner({ name, onManage }: { name: string; onManage?: () => void }) {
    return <AttachedOwnerRow name={name} onManage={onManage} />;
}

/** Footer wrapper — one row of primary actions at the bottom. */
export function DealOverlayFooter({ children }: { children: ReactNode }) {
    return <div className="pointer-events-auto mbs-auto flex gap-2 inline-full">{children}</div>;
}

export function DealOverlayFooterRow({ children }: { children: ReactNode }) {
    return <div className="flex gap-2 inline-full">{children}</div>;
}

/** Outline-button class for the footer's secondary action. */
export function dealSecondaryButtonClass(): string {
    return OVERLAY_GLASS_BUTTON_CLASS;
}
