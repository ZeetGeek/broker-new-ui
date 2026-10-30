"use client";

import toast from "react-hot-toast";
import Link from "next/link";

import { addCollection, Icon } from "@iconify/react/offline";

import { formatAreaSqft } from "@/lib/format/area";
import { offersRent, offersSale } from "@/lib/format/listing-availability";
import { formatPhoneIn, formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPrice, formatRent } from "@/lib/format/price";
import type { PropertyBrokersSummary } from "@/lib/format/property-brokers";
import { formatPropertyCardName } from "@/lib/format/property-card-name";
import { formatRepresentationExpiry, formatRepresentedSince } from "@/lib/format/representation";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import {
    AttachedBrokersRow,
    AttachedBuyersRow,
    InvitedBrokersRow,
} from "@/components/shared/attached-people-row";
import { HoverScaleLayer, HoverScaleRoot } from "@/components/shared/hover-scale-media";
import {
    Building2,
    Calendar,
    CallIcon,
    Camera,
    Check,
    CircleCheck,
    Clock,
    MapPin,
    Send,
    UserPlus,
    Users,
    WhatsAppIcon,
    X,
} from "@/components/shared/icons";
import {
    OVERLAY_GLASS_BUTTON_CLASS,
    OverlayCard,
    OverlayCardActions,
    OverlayCardSummary,
    OverlayPersonAttachLine,
    OverlayPersonLine,
} from "@/components/shared/overlay-card";
import { PhoneNumber } from "@/components/shared/phone-number";
import {
    type CommissionAudience,
    ListingAskPrices,
    PriceWithCommission,
} from "@/components/shared/price-with-commission";
import { PropertyCardMenu } from "@/components/shared/property-card-menu";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import tablerMenuIcons from "@/components/shared/tabler-menu.json";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { REPRESENTATION_REMINDER_LIMIT } from "@/config/constants";

addCollection(tablerMenuIcons as Parameters<typeof addCollection>[0]);

const PROPERTY_CARD_PHOTO_CLASS = "relative shrink-0 overflow-hidden bg-surface-muted h-40 w-full";

const BROWSE_ASK_LABEL = "Ask to sell";
const BROWSE_ASK_PENDING_LABEL = "Sending…";
const BROWSE_REPRESENTING_LABEL = "You're representing";
const BROWSE_INVITE_ACCEPT_LABEL = "Accept";
const BROWSE_INVITE_ACCEPTING_LABEL = "Accepting…";
const BROWSE_INVITE_DECLINE_LABEL = "Cancel";
const BROWSE_INVITE_DECLINING_LABEL = "Cancelling…";

const BROWSE_STATUS = {
    waiting: "Waiting for the owner",
    invited: "Owner invited you",
    representing: "You can work this listing",
} as const;

const BROWSE_REQUEST_TOOLTIP = {
    idle: "Ask the owner for permission to sell this property",
    pending: "Sending your request…",
    remind: "Send the owner a reminder about your request",
    remindersUsed: "You already used both reminders for this request",
    withdraw: "Cancel this request. You can ask again later.",
    representing: "The owner already approved you for this listing",
    inviteAccept: "Accept the invite and get the owner's number",
    inviteDecline: "Cancel this invite. The owner can ask someone else",
} as const;

const BROWSE_WITHDRAW_LABEL = "Cancel request";
const BROWSE_WITHDRAWING_LABEL = "Cancelling…";
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
    isCancelPending = false,
    isRemindPending = false,
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
    isCancelPending?: boolean;
    isRemindPending?: boolean;
    inviteActionPending?: "accept" | "cancel";
    onRequest?: () => void;
    onCancelRequest?: () => void;
    onAcceptInvite?: () => void;
    onCancelInvite?: () => void;
    /** `overlay` = white listing-card panel; `light` = list-row chrome. */
    tone?: "light" | "overlay";
}) {
    const canWithdraw = Boolean(hasRequested && onCancelRequest);
    const waitingBusy = isCancelPending || isRemindPending;
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
                                    <span className="inline-flex flex-1 min-inline-0">
                                        <Button
                                            type="button"
                                            size="md"
                                            variant="outline"
                                            className={cn("inline-full", outlineClass)}
                                            disabled={inviteBusy}
                                            loading={inviteActionPending === "cancel"}
                                            onClick={onCancelInvite}
                                        >
                                            {inviteActionPending === "cancel" ? (
                                                BROWSE_INVITE_DECLINING_LABEL
                                            ) : (
                                                <>
                                                    <X
                                                        aria-hidden
                                                        className="block-4 inline-4"
                                                        strokeWidth={2}
                                                    />
                                                    {BROWSE_INVITE_DECLINE_LABEL}
                                                </>
                                            )}
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
                                    <span className="inline-flex flex-1 min-inline-0">
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
        // Remind lives in the photo ⋯ menu under Chat here.
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
                                        disabled={waitingBusy}
                                        loading={isCancelPending}
                                        onClick={onCancelRequest}
                                    >
                                        {isCancelPending ? (
                                            BROWSE_WITHDRAWING_LABEL
                                        ) : (
                                            <>
                                                <Icon
                                                    icon="tabler:x"
                                                    width={16}
                                                    height={16}
                                                    className="shrink-0 block-4 inline-4"
                                                    aria-hidden
                                                />
                                                {BROWSE_WITHDRAW_LABEL}
                                            </>
                                        )}
                                    </Button>
                                </span>
                            }
                        />
                        <TooltipContent side="top" className="text-center max-inline-xs">
                            {BROWSE_REQUEST_TOOLTIP.withdraw}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        );
    }

    if (!onRequest) return null;

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
    /** Bedrooms / BHK. 0 when not applicable (e.g. shop, office). */
    bhk?: number;
    /** Bathrooms. Null/0 when unset or not applicable. */
    bathrooms?: number | null;
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
    commissionPercent?: number | null;
    commissionAmount?: number | null;
};

export type OwnedPropertyCardStatus = "draft" | "published" | "unpublished";

export type OwnedPropertyCardListing = Omit<PropertyCardBase, "owner"> & {
    title: string;
    locality: string;
    city: string;
    bhk: number;
    bathrooms?: number | null;
    status: OwnedPropertyCardStatus;
    /** Owner marked it sold — shows a Sold chip and hides selling actions. */
    isSold?: boolean;
    inboundRequestCount: number;
    listedDaysAgo: number;
    saleAmountInr: number | null;
    rentAmountInr: number | null;
    /** Sale commission percent. Null or 0 when the owner left it blank. */
    commissionPercent?: number | null;
    /** Fixed rent brokerage in INR. Null or 0 when unset. */
    commissionAmount?: number | null;
    ownerName?: string | null;
    /** Exclusive owner mobile — enables WhatsApp / Call on the card footer. */
    ownerPhoneDigits?: string | null;
    visibility?: "private" | "marketplace";
    /** Buyers linked to this listing — shown as the Requests & Invitations avatar stack. */
    attachedClients?: Array<{ id: string; name: string; avatarUrl?: string }>;
};

export type PropertyCardProps = {
    className?: string;
    detailsHref: string;
    priority?: boolean;
    imageSizes?: string;
    onRequest?: () => void;
    /** Withdraw a pending broker request — ⋯ menu while waiting. */
    onCancelRequest?: () => void;
    /** Remind the owner on a pending request. */
    onRemind?: () => void;
    /** When false, reminder stays visible but disabled. */
    canRemind?: boolean;
    /** Reminders already sent on this pending request. */
    remindersUsed?: number;
    /** Max reminders for this request. Defaults to REPRESENTATION_REMINDER_LIMIT. */
    remindersLimit?: number;
    /** Open chat with the owner — ⋯ menu once a request is sent. */
    onChat?: () => void;
    /** Open request timeline — ⋯ menu once a request is sent. */
    onOpenTimeline?: () => void;
    isRequestPending?: boolean;
    /** Cancel button loading — do not share with remind. */
    isCancelPending?: boolean;
    /** Remind button loading — do not share with cancel. */
    isRemindPending?: boolean;
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
    /** Owner cards: invite a broker to this specific property. */
    onInviteBroker?: () => void;
    brokerSummary?: PropertyBrokersSummary;
    brokerSummaryState?: "loading" | "error" | "ready";
    /** Owned cards: open lead analytics for this listing. */
    onAnalytics?: () => void;
    /** Owned cards: ask to delete this listing (caller shows confirm). */
    onDelete?: () => void;
    /** Owner cards: mark this listing as sold (caller shows confirm). */
    onMarkSold?: () => void;
    /** Saved (bookmarked) state. The Save button shows only when `onToggleSave` is set. */
    isSaved?: boolean;
    onToggleSave?: () => void;
    /** Browse grid cards: listed this week in the broker's service areas — highlighted card. */
    isNewInYourArea?: boolean;
    /**
     * Who is reading the price. Brokers see "You get". Owners see "Broker gets".
     * Browse cards are always the broker marketplace.
     */
    audience?: CommissionAudience;
} & (
    | { variant: "browse"; listing: BrowsePropertyCardListing }
    | { variant: "represented"; listing: RepresentedPropertyCardListing }
    | { variant: "owned"; listing: OwnedPropertyCardListing }
);

/** Grid browse card: clear photo on top, essentials in a solid panel below. */
function BrowseOverlayPropertyCard({
    listing,
    detailsHref,
    priority = false,
    imageSizes = "(max-width: 768px) 100vw, 50vw",
    onRequest,
    onCancelRequest,
    onRemind,
    canRemind = true,
    remindersUsed = 0,
    remindersLimit = REPRESENTATION_REMINDER_LIMIT,
    onChat,
    onOpenTimeline,
    isRequestPending = false,
    isCancelPending = false,
    isRemindPending = false,
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
        ? formatRent(listing.rentAmountInr ?? 0)
        : formatPrice(listing.saleAmountInr ?? 0);
    const headline =
        formatPropertyCardName(listing.propertyTypeLabel, listing.areaSqft, {
            bhk: listing.bhk,
            bathrooms: listing.bathrooms,
        }) || listing.title;

    return (
        <OverlayCard
            href={detailsHref}
            imageSrc={listing.imageSrc ?? listing.imageSrcs?.[0]}
            images={listing.imageSrcs}
            imageAlt={listing.title}
            imageSizes={imageSizes}
            priority={priority}
            sweep={listing.isNew}
            className={className}
            chips={
                <>
                    {offersSale(listing) ? (
                        <Badge color="emerald" blur="dark">
                            For sale
                        </Badge>
                    ) : null}
                    {offersRent(listing) ? (
                        <Badge color="orange" blur="dark">
                            For rent
                        </Badge>
                    ) : null}
                    {listing.isNew ? (
                        <Badge color="lime" blur="dark" pulse={isNewInYourArea}>
                            New
                        </Badge>
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
                    contact={
                        listing.hasRequested && onChat
                            ? { name: listing.owner.name, onMessage: onChat }
                            : undefined
                    }
                    onRemind={listing.hasRequested ? onRemind : undefined}
                    canRemind={canRemind}
                    remindersUsed={remindersUsed}
                    remindersLimit={remindersLimit}
                    onOpenTimeline={listing.hasRequested ? onOpenTimeline : undefined}
                />
            }
        >
            <div className="flex flex-1 flex-col gap-3.5 min-inline-0">
                <OverlayCardSummary
                    href={detailsHref}
                    price={<ListingAskPrices listing={listing} />}
                    headline={headline}
                    locationLabel={`${listing.locality}, ${listing.city}`}
                />

                <OverlayPersonLine
                    label="Owner"
                    name={listing.owner.name}
                    avatarUrl={listing.owner.avatarUrl}
                />
            </div>

            <OverlayCardActions>
                <BrowseRequestAction
                    tone="overlay"
                    hasRequested={listing.hasRequested}
                    isRepresenting={listing.isRepresenting}
                    isInvitePending={listing.isInvitePending}
                    isRequestPending={isRequestPending}
                    isCancelPending={isCancelPending}
                    isRemindPending={isRemindPending}
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
    return <Badge color={isRent ? "orange" : "emerald"}>{isRent ? "For rent" : "For sale"}</Badge>;
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
                {listing.isNew ? (
                    <Badge color="lime" blur="dark">
                        New
                    </Badge>
                ) : (
                    <span aria-hidden />
                )}

                {listing.photoCount > 0 ? (
                    <Badge color="sky" blur="dark" className="ms-auto">
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
                <WhatsAppIcon aria-hidden strokeWidth={1.75} />
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
    const titleLine =
        formatPropertyCardName(listing.propertyTypeLabel, listing.areaSqft, {
            bhk: listing.bhk,
            bathrooms: listing.bathrooms,
        }) || `${listing.configLabel} · ${formatAreaSqft(listing.areaSqft)}`;

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
                    <PriceWithCommission
                        amountInr={listing.amountInr}
                        isRent={listing.isRent}
                        commissionPercent={listing.commissionPercent}
                        commissionAmountInr={listing.commissionAmount}
                        audience="broker"
                        size="md"
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
                        className="flex-1 border-border-warm min-inline-0"
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
                                `
                                  flex-1 bg-brand-ink text-surface min-inline-0
                                  hover:bg-brand-ink/90
                                `,
                            )}
                        >
                            Open in CRM
                        </Link>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            className="
                              flex-1 bg-brand-ink text-surface min-inline-0
                              hover:bg-brand-ink/90
                            "
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
const OWNED_ATTACH_OWNER_LABEL = "Attach owner";
const OWNED_CHANGE_OWNER_LABEL = "Change owner";

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
        bathrooms: listing.bathrooms,
        brokerSlotsOpen: 0,
        brokerSlotsTotal: 0,
        commissionPercent: listing.commissionPercent ?? 0,
        commissionAmount: listing.commissionAmount ?? 0,
        hasRequested: false,
        saleAmountInr: listing.saleAmountInr,
        rentAmountInr: listing.rentAmountInr,
    };
}

/** Bottom bar for broker inventory: WhatsApp (outline) + Call (brand). */
function OwnedContactSplitBar({
    ownerName,
    ownerPhoneDigits,
}: {
    ownerName: string;
    ownerPhoneDigits?: string | null;
}) {
    const digits = ownerPhoneDigits?.replace(/\D/g, "") ?? "";
    const canContact = digits.length >= 10;
    const phoneLabel = canContact ? formatPhoneIn(digits) : null;
    const tip = phoneLabel ?? "Attach an owner with a phone number first";

    return (
        <div
            className="pointer-events-auto flex gap-2 inline-full"
            onClick={(event) => event.stopPropagation()}
        >
            <Tooltip>
                <TooltipTrigger
                    render={
                        canContact ? (
                            <Button
                                variant="outline"
                                size="md"
                                nativeButton={false}
                                className="flex-1 min-inline-0"
                                render={
                                    <a
                                        href={formatWhatsAppUrl(digits)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`WhatsApp ${ownerName} at ${phoneLabel}`}
                                    />
                                }
                            />
                        ) : (
                            <Button
                                variant="outline"
                                size="md"
                                type="button"
                                disabled
                                className="flex-1 min-inline-0"
                                aria-label="WhatsApp unavailable — attach an owner first"
                            />
                        )
                    }
                >
                    <WhatsAppIcon
                        aria-hidden
                        strokeWidth={1.75}
                        className="shrink-0 block-4.5 inline-4.5"
                    />
                    WhatsApp
                </TooltipTrigger>
                <TooltipContent side="top">{tip}</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger
                    render={
                        canContact ? (
                            <Button
                                variant="accent"
                                size="md"
                                nativeButton={false}
                                className="flex-1 min-inline-0"
                                render={
                                    <a
                                        href={formatTelUrl(digits)}
                                        aria-label={`Call owner ${ownerName} at ${phoneLabel}`}
                                    />
                                }
                            />
                        ) : (
                            <Button
                                variant="accent"
                                size="md"
                                type="button"
                                disabled
                                className="flex-1 min-inline-0"
                                aria-label="Call owner unavailable — attach an owner first"
                            />
                        )
                    }
                >
                    <CallIcon
                        aria-hidden
                        strokeWidth={1.75}
                        className="shrink-0 block-4.5 inline-4.5"
                    />
                    Call Owner
                </TooltipTrigger>
                <TooltipContent side="top">{tip}</TooltipContent>
            </Tooltip>
        </div>
    );
}

/**
 * Broker/owner inventory card — same overlay chrome as Marketplace and My
 * Deals. Empty Owner / Buyers rows use link "Attach owner" / "Attach buyers";
 * the ⋯ menu still offers those actions. Footer is WhatsApp + Call.
 */
function OwnedOverlayPropertyCard({
    listing,
    detailsHref,
    priority = false,
    imageSizes = "(max-width: 768px) 100vw, 50vw",
    onEdit,
    onAddBuyer,
    onAttachOwner,
    onInviteBroker,
    brokerSummary,
    brokerSummaryState,
    onAnalytics,
    onDelete,
    onMarkSold,
    isSaved = false,
    onToggleSave,
    audience = "broker",
    className,
}: Extract<PropertyCardProps, { variant: "owned" }>) {
    const isSold = Boolean(listing.isSold);
    const browse = ownedToBrowseListing(listing);
    const isRentOnly = offersRent(browse) && !offersSale(browse);
    const sharePriceLabel = isRentOnly
        ? formatRent(listing.rentAmountInr ?? 0)
        : formatPrice(listing.saleAmountInr ?? listing.rentAmountInr ?? 0);
    const headline =
        formatPropertyCardName(listing.propertyTypeLabel, listing.areaSqft, {
            bhk: listing.bhk,
            bathrooms: listing.bathrooms,
        }) || listing.title;
    const buyers = listing.attachedClients ?? [];
    const ownerName = listing.ownerName?.trim() ?? "";
    const ownerPhoneDigits = listing.ownerPhoneDigits?.replace(/\D/g, "") ?? "";
    const hasOwner = ownerName.length > 0;
    const hasBuyers = buyers.length > 0;
    const hasOwnerPhone = ownerPhoneDigits.length >= 10;
    const hasWorkingBrokers = (brokerSummary?.brokers.length ?? 0) > 0;
    /** Broker inventory only — owner portal uses Invite broker instead. */
    const showContactBar = hasOwner && Boolean(onAttachOwner || onAddBuyer);
    const isAddBuyerBlocked = audience === "broker" && !hasOwner;
    const handleAddBuyer = onAddBuyer
        ? () => {
              if (isAddBuyerBlocked) {
                  toast.error("Attach an owner first to enable attaching clients.", {
                      id: "listing-owner-required",
                  });
                  return;
              }
              onAddBuyer();
          }
        : undefined;

    return (
        <TooltipProvider>
            <OverlayCard
                href={detailsHref}
                imageSrc={listing.imageSrc ?? listing.imageSrcs?.[0]}
                images={listing.imageSrcs}
                imageAlt={listing.title}
                imageSizes={imageSizes}
                priority={priority}
                // A listing nobody can see yet, or one already sold, reads as inactive.
                muted={isSold || listing.status !== "published"}
                className={className}
                chips={
                    <>
                        {!isSold && listing.status === "unpublished" ? (
                            <Badge color="red" blur="dark">
                                {OWNED_STATUS_LABEL.unpublished}
                            </Badge>
                        ) : null}
                        {offersSale(browse) ? (
                            <Badge color="emerald" blur="dark">
                                For sale
                            </Badge>
                        ) : null}
                        {offersRent(browse) ? (
                            <Badge color="orange" blur="dark">
                                For rent
                            </Badge>
                        ) : null}
                        {listing.visibility === "private" ? (
                            <Badge color="violet" blur="dark">
                                Private
                            </Badge>
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
                            listingKind:
                                offersRent(browse) && !offersSale(browse) ? "rent" : "sale",
                        }}
                        onEdit={onEdit}
                        onAnalytics={onAnalytics}
                        onDelete={onDelete}
                        onMarkSold={isSold ? undefined : onMarkSold}
                        isSaved={isSaved}
                        onToggleSave={onToggleSave}
                        isDraft={listing.status === "draft"}
                        onAttachOwner={onAttachOwner}
                        attachOwnerLabel={
                            hasOwner ? OWNED_CHANGE_OWNER_LABEL : OWNED_ATTACH_OWNER_LABEL
                        }
                        onAddBuyer={handleAddBuyer}
                        isAddBuyerBlocked={isAddBuyerBlocked}
                        contact={
                            hasOwnerPhone
                                ? {
                                      name: ownerName || "Owner",
                                      phoneDigits: ownerPhoneDigits,
                                  }
                                : undefined
                        }
                    />
                }
            >
                <div className="flex flex-col gap-3.5 min-inline-0">
                    <div className="flex items-center gap-2">
                        <span className="body-sm text-ink-muted">Status</span>
                        <Badge
                            color={
                                isSold || listing.status === "unpublished"
                                    ? "red"
                                    : listing.status === "published"
                                      ? "emerald"
                                      : "amber"
                            }
                        >
                            {isSold ? "Sold" : OWNED_STATUS_LABEL[listing.status]}
                        </Badge>
                    </div>

                    <OverlayCardSummary
                        href={detailsHref}
                        price={<ListingAskPrices listing={browse} audience={audience} />}
                        headline={headline}
                        locationLabel={`${listing.locality}, ${listing.city}`}
                    />

                    {hasOwner ? (
                        <OverlayPersonLine label="Owner" name={ownerName} />
                    ) : onAttachOwner ? (
                        <OverlayPersonAttachLine
                            label="Owner"
                            actionLabel={OWNED_ATTACH_OWNER_LABEL}
                            onAttach={onAttachOwner}
                        />
                    ) : null}

                    {hasBuyers || onAddBuyer ? (
                        <AttachedBuyersRow
                            buyers={buyers}
                            onAttach={handleAddBuyer}
                            isAttachBlocked={isAddBuyerBlocked}
                        />
                    ) : null}
                </div>

                <OverlayCardActions className="flex-col gap-2">
                    {isSold ? (
                        <p
                            className="
                              body-sm rounded-control bg-surface-muted px-3 py-2 text-center
                              font-medium text-ink-muted
                            "
                        >
                            Sold — no longer shown to brokers
                        </p>
                    ) : onInviteBroker ? (
                        <>
                            {brokerSummaryState === "loading" ? (
                                <p className="body-sm text-ink-muted" role="status">
                                    Loading brokers…
                                </p>
                            ) : brokerSummaryState === "error" ? (
                                <p className="body-sm text-danger" role="status">
                                    Couldn&apos;t load brokers
                                </p>
                            ) : null}
                            {brokerSummaryState === "ready" &&
                            (brokerSummary?.pendingInvitations.length ?? 0) > 0 ? (
                                <InvitedBrokersRow
                                    brokers={brokerSummary!.pendingInvitations}
                                    onManage={onInviteBroker}
                                />
                            ) : null}
                            {brokerSummaryState === "ready" && brokerSummary?.brokers.length ? (
                                <AttachedBrokersRow
                                    brokers={brokerSummary.brokers}
                                    onManage={onInviteBroker}
                                />
                            ) : null}
                            {!hasWorkingBrokers && listing.status !== "published" ? (
                                <p
                                    className="
                                      body-xs rounded-control bg-amber-50 px-3 py-2 font-medium
                                      text-pending
                                    "
                                >
                                    Publish this property to invite brokers
                                </p>
                            ) : null}
                            {!hasWorkingBrokers ? (
                                <Button
                                    size="md"
                                    variant="accent"
                                    type="button"
                                    className="inline-full min-block-12"
                                    disabled={listing.status !== "published"}
                                    onClick={onInviteBroker}
                                >
                                    <UserPlus aria-hidden strokeWidth={1.75} />
                                    Invite broker
                                </Button>
                            ) : null}
                        </>
                    ) : null}

                    {showContactBar ? (
                        <OwnedContactSplitBar
                            ownerName={ownerName || "Owner"}
                            ownerPhoneDigits={hasOwnerPhone ? ownerPhoneDigits : null}
                        />
                    ) : audience === "broker" && !hasOwner && (onAttachOwner || onAddBuyer) ? (
                        <p
                            className="
                              body-xs flex items-center justify-center rounded-control
                              bg-surface-muted px-3 py-2 text-center font-medium text-ink/70
                              inline-full min-block-11
                            "
                        >
                            Attach an owner to enable calls and WhatsApp.
                        </p>
                    ) : null}
                </OverlayCardActions>
            </OverlayCard>
        </TooltipProvider>
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
