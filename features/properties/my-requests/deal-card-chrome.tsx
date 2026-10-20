"use client";

import type { ReactNode } from "react";

import { addCollection, Icon } from "@iconify/react/offline";

import { formatPhoneIn, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { formatPropertyCardName } from "@/lib/format/property-card-name";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";
import type { PropertyShareInput } from "@/lib/share/property";
import { cn } from "@/lib/utils";

import { AttachedBuyersRow, AttachedOwnerRow } from "@/components/shared/attached-people-row";
import {
    OVERLAY_GLASS_BUTTON_CLASS,
    OVERLAY_ICON_BUTTON_CLASS,
    OverlayCard,
    OverlayCardSummary,
    OverlayPersonLine,
} from "@/components/shared/overlay-card";
import {
    type CommissionAudience,
    PriceWithCommission,
} from "@/components/shared/price-with-commission";
import {
    PropertyCardMenu,
    type PropertyCardMenuContact,
} from "@/components/shared/property-card-menu";
import { Badge, type BadgeColor } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";
import tablerContactIcons from "@/features/properties/my-requests/tabler-contact.json";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);
addCollection(tablerContactIcons as Parameters<typeof addCollection>[0]);

export type DealCardListing = {
    propertyId: string;
    title: string;
    locality: string;
    city: string;
    areaSqft: number;
    bhk: number;
    bathrooms?: number | null;
    propertyTypeLabel: string;
    /** e.g. "2 BHK" — used in share text / specs when present. */
    configLabel?: string;
    amountInr: number;
    isRent: boolean;
    commissionPercent: number;
    /** Fixed rent brokerage in INR. Absent or 0 when the owner left it blank. */
    commissionAmount?: number | null;
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
                    icon="tabler:brand-whatsapp"
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
                icon="tabler:brand-whatsapp"
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

const STATUS_BADGE_COLOR: Record<DealStatusTone, BadgeColor> = {
    waiting: "amber",
    action: "orange",
    success: "emerald",
    danger: "red",
    closed: "stone",
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

/** Single ⋯ menu on the photo: Share › channels, Save, Message, deal extras. */
export function DealCardPhotoToolbar({
    listing,
    isSaved = false,
    onToggleSave,
    contact,
    onAddBuyer,
    onRemind,
    canRemind,
    remindersUsed,
    remindersLimit,
    onOpenTimeline,
    onCancelRequest,
    tone = "overlay",
}: {
    listing: DealCardListing;
    isSaved?: boolean;
    onToggleSave?: () => void;
    contact?: PropertyCardMenuContact;
    onAddBuyer?: () => void;
    onRemind?: () => void;
    canRemind?: boolean;
    remindersUsed?: number;
    remindersLimit?: number;
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
            onAddBuyer={onAddBuyer}
            onRemind={onRemind}
            canRemind={canRemind}
            remindersUsed={remindersUsed}
            remindersLimit={remindersLimit}
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
    audience = "broker",
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
    /** Owner-side cards say "Broker gets". Broker cards say "You get". */
    audience?: CommissionAudience;
}) {
    const href = detailHref ?? brokerOwnerListingDetailHref(listing.propertyId);
    const headline =
        formatPropertyCardName(listing.propertyTypeLabel, listing.areaSqft, {
            bhk: listing.bhk,
            bathrooms: listing.bathrooms,
        }) ||
        configLabel ||
        listing.title;

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
                    <Badge
                        color={STATUS_BADGE_COLOR[statusTone]}
                        blur="dark"
                        pulse={statusTone === "action"}
                    >
                        {statusLabel}
                    </Badge>
                    <Badge color={listing.isRent ? "orange" : "emerald"} blur="dark">
                        {listing.isRent ? "For rent" : "For sale"}
                    </Badge>
                </>
            }
            actions={actions}
        >
            <OverlayCardSummary
                href={href}
                price={
                    <PriceWithCommission
                        amountInr={listing.amountInr}
                        isRent={listing.isRent}
                        commissionPercent={listing.commissionPercent}
                        commissionAmountInr={listing.commissionAmount}
                        audience={audience}
                        className="h5 font-semibold tracking-wide"
                    />
                }
                headline={headline}
                locationLabel={`${listing.locality}, ${listing.city}`}
            />
            {children}
        </OverlayCard>
    );
}

/** Owner line under the summary. Call lives in the ⋯ menu. */
export function DealOverlayStats({
    ownerName,
    ownerAvatarUrl,
    personLabel = "Owner",
}: {
    listing: DealCardListing;
    ownerName: string;
    ownerAvatarUrl?: string;
    /** Kept for callers; Call moved to the card ⋯ menu. */
    ownerPhoneDigits?: string;
    /** Owner-side cards pass "Broker". */
    personLabel?: string;
}) {
    return <OverlayPersonLine label={personLabel} name={ownerName} avatarUrl={ownerAvatarUrl} />;
}

function ChatUnreadBadge({ count }: { count: number }) {
    if (count <= 0) return null;

    return (
        <span
            aria-hidden
            className="
              tabular body-xs absolute -inset-e-1.5 -inset-bs-1.5 flex items-center justify-center
              rounded-full bg-surface px-1 font-semibold text-brand ring-2 ring-brand/40 block-5
              min-inline-5
            "
        >
            {count > 9 ? "9+" : count}
        </span>
    );
}

/**
 * Bottom bar: WhatsApp (outline) + Chat (brand). Number on WhatsApp hover.
 */
export function DealContactSplitBar({
    ownerName,
    ownerPhoneDigits,
    onChat,
    unreadMessageCount = 0,
}: {
    ownerName: string;
    ownerPhoneDigits: string;
    onChat: () => void;
    unreadMessageCount?: number;
}) {
    const phoneLabel = formatPhoneIn(ownerPhoneDigits);
    const unread = Math.max(0, unreadMessageCount);

    return (
        <div
            className="pointer-events-auto flex gap-2 inline-full"
            onClick={(event) => event.stopPropagation()}
        >
            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            variant="outline"
                            size="md"
                            nativeButton={false}
                            className="flex-1 min-inline-0"
                            render={
                                <a
                                    href={formatWhatsAppUrl(ownerPhoneDigits)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`WhatsApp ${ownerName} at ${phoneLabel}`}
                                />
                            }
                        />
                    }
                >
                    <Icon
                        icon="tabler:brand-whatsapp"
                        width={18}
                        height={18}
                        className="shrink-0 block-4.5 inline-4.5"
                        aria-hidden
                    />
                    WhatsApp
                </TooltipTrigger>
                <TooltipContent side="top">{phoneLabel}</TooltipContent>
            </Tooltip>

            <Button
                variant="accent"
                size="md"
                type="button"
                className="relative flex-1 min-inline-0"
                onClick={onChat}
                aria-label={
                    unread > 0
                        ? `Chat with ${ownerName}, ${unread} unread`
                        : `Chat with ${ownerName}`
                }
            >
                <Icon
                    icon="tabler:message"
                    width={18}
                    height={18}
                    className="shrink-0 block-4.5 inline-4.5"
                    aria-hidden
                />
                Chat
                <ChatUnreadBadge count={unread} />
            </Button>
        </div>
    );
}

/** Attached buyers on an approved deal. Attach buyer lives in the ⋯ menu. */
export function DealAttachedBuyers({
    buyers,
}: {
    buyers: Array<{ id: string; name: string; avatarUrl?: string }>;
}) {
    return <AttachedBuyersRow buyers={buyers} />;
}

/** Exclusive owner attached to a broker listing — tap opens the owner picker. */
export function DealAttachedOwner({ name, onManage }: { name: string; onManage?: () => void }) {
    return <AttachedOwnerRow name={name} onManage={onManage} />;
}

/** Footer wrapper — one row of primary actions at the bottom. */
export function DealOverlayFooter({
    children,
    pin = true,
}: {
    children: ReactNode;
    /** When false, leave pinning to a parent (e.g. stacked with contact bar). */
    pin?: boolean;
}) {
    return (
        <div className={cn("pointer-events-auto flex gap-2 inline-full", pin && "mbs-auto")}>
            {children}
        </div>
    );
}

export function DealOverlayFooterRow({ children }: { children: ReactNode }) {
    return <div className="flex gap-2 inline-full">{children}</div>;
}

/** Outline-button class for the footer's secondary action. */
export function dealSecondaryButtonClass(): string {
    return OVERLAY_GLASS_BUTTON_CLASS;
}
