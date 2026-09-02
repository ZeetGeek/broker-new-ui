"use client";

import Link from "next/link";

import {
    Building2,
    Calendar,
    Camera,
    CircleCheck,
    Clock,
    Lock,
    MapPin,
    MessageCircle,
    Percent,
    Users,
} from "lucide-react";

import { brokerSlotsLabel } from "@/lib/format/broker-slots";
import { formatAreaSqft } from "@/lib/format/area";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import {
    formatRepresentationExpiry,
    formatRepresentedSince,
} from "@/lib/format/representation";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

const PROPERTY_CARD_PHOTO_CLASS = "relative h-40 shrink-0 overflow-hidden bg-surface-muted";

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
    locality: string;
    city: string;
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
        <div className={PROPERTY_CARD_PHOTO_CLASS}>
            {listing.imageSrc ? (
                <AppImage
                    src={listing.imageSrc}
                    alt={alt}
                    fill
                    sizes={imageSizes}
                    priority={priority}
                    className="object-cover transition-transform duration-160 group-hover:scale-[1.02]"
                />
            ) : (
                <div className="flex block-full inline-full flex-col items-center justify-center gap-2 px-4 text-center">
                    <Building2
                        aria-hidden
                        className="block-8 inline-8 text-ink-subtle"
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

function BrokerSlotsBar({
    openCount,
    totalCount,
}: {
    openCount: number;
    totalCount: number;
}) {
    const takenCount = Math.max(0, totalCount - openCount);

    return (
        <div className="flex flex-col gap-2">
            <div
                className="flex gap-1"
                role="img"
                aria-label={brokerSlotsLabel(openCount, totalCount)}
            >
                {Array.from({ length: totalCount }).map((_, index) => (
                    <span
                        key={index}
                        className={cn(
                            "h-1.5 flex-1 rounded-full",
                            index < takenCount ? "bg-brand-ink" : "bg-border-warm",
                        )}
                    />
                ))}
            </div>
            <p className="body-xs text-ink-muted">{brokerSlotsLabel(openCount, totalCount)}</p>
        </div>
    );
}

function PropertyCardOwnerBlock({
    owner,
    variant,
}: {
    owner: PropertyCardOwner;
    variant: PropertyCardProps["variant"];
}) {
    if (variant === "browse") {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                    <UserAvatar name={owner.name} imageUrl={owner.avatarUrl} size="sm" />
                    <p className="body-sm font-medium text-ink">{owner.name}</p>
                </div>
                <div className="
                  flex items-center justify-center gap-2 rounded-control border border-border-warm
                  bg-surface-muted px-3 py-2
                ">
                    <Lock aria-hidden className="block-3.5 inline-3.5 shrink-0 text-ink-subtle" strokeWidth={1.75} />
                    <p className="body-xs text-ink-muted">Contact unlocks after approval</p>
                </div>
            </div>
        );
    }

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
            <div className="flex min-w-0 items-center gap-2.5">
                <UserAvatar name={owner.name} imageUrl={owner.avatarUrl} size="sm" />
                <div className="min-w-0">
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

function RepresentedMeta({
    listing,
}: {
    listing: RepresentedPropertyCardListing;
}) {
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
                <Clock aria-hidden className="block-3.5 inline-3.5 shrink-0" strokeWidth={1.75} />
                <p className={cn("body-xs", expiry.isUrgent && "font-medium")}>{expiry.label}</p>
            </div>

            <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                <Users aria-hidden className="block-3.5 inline-3.5 shrink-0" strokeWidth={1.75} />
                {sharedLabel}
            </p>

            <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                <Calendar aria-hidden className="block-3.5 inline-3.5 shrink-0" strokeWidth={1.75} />
                {visitLabel} · {clientLabel}
            </p>
        </div>
    );
}

function BrowseMeta({ listing }: { listing: BrowsePropertyCardListing }) {
    return (
        <div className="flex flex-col gap-2.5">
            <BrokerSlotsBar
                openCount={listing.brokerSlotsOpen}
                totalCount={listing.brokerSlotsTotal}
            />
            <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                <Percent aria-hidden className="block-3.5 inline-3.5 shrink-0" strokeWidth={1.75} />
                Owner offers {listing.commissionPercent}% commission
            </p>
        </div>
    );
}

export function PropertyCard(props: PropertyCardProps) {
    const {
        className,
        detailsHref,
        priority = false,
        imageSizes = "(max-width: 768px) 100vw, 50vw",
        onRequest,
        isRequestPending = false,
        onShare,
        onOpenCrm,
        crmHref,
    } = props;
    const { listing, variant } = props;

    const titleLine = `${listing.configLabel} ${listing.propertyTypeLabel} · ${formatAreaSqft(listing.areaSqft)}`;
    const locationLine =
        variant === "browse"
            ? `${listing.locality}, ${listing.city}`
            : listing.fullAddress;

    return (
        <article
            className={cn(
                `
                  group flex flex-col overflow-hidden rounded-card border border-border-warm
                  bg-surface
                `,
                className,
            )}
        >
            {variant === "represented" ? (
                <div className="
                  flex items-center gap-2 bg-brand-deep px-3 py-2 text-surface
                ">
                    <CircleCheck aria-hidden className="block-4 inline-4 shrink-0" strokeWidth={1.75} />
                    <p className="body-xs font-medium">
                        {formatRepresentedSince(listing.representedSince)}
                    </p>
                </div>
            ) : null}

            <PropertyCardPhoto listing={listing} priority={priority} imageSizes={imageSizes} />

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
                            className="mt-0.5 block-3.5 inline-3.5 shrink-0"
                            strokeWidth={1.75}
                        />
                        <span>{locationLine}</span>
                    </p>
                </div>

                <PropertyCardOwnerBlock owner={listing.owner} variant={variant} />

                {variant === "browse" ? (
                    <BrowseMeta listing={listing} />
                ) : (
                    <RepresentedMeta listing={listing} />
                )}

                <div className="mt-auto flex gap-2 pbs-1">
                    {variant === "browse" ? (
                        <Link
                            href={detailsHref}
                            prefetch={false}
                            className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "flex-1 border-border-warm",
                            )}
                        >
                            Details
                        </Link>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 border-border-warm"
                            onClick={onShare}
                        >
                            Share
                        </Button>
                    )}

                    {variant === "browse" ? (
                        <Button
                            type="button"
                            size="sm"
                            className="flex-[1.4] bg-brand-ink text-surface hover:bg-brand-ink/90"
                            disabled={listing.hasRequested || isRequestPending}
                            onClick={onRequest}
                        >
                            {listing.hasRequested
                                ? "Requested"
                                : isRequestPending
                                  ? "Requesting…"
                                  : "Request to represent"}
                        </Button>
                    ) : crmHref ? (
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
