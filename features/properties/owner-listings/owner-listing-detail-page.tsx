"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ChevronLeft, Lock, MapPin, MessageCircle, Phone } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { representativeApi } from "@/lib/api/representative";
import { formatPhoneIn, formatWhatsAppUrl } from "@/lib/format/phone";
import { BROKER_OWNER_LISTINGS_HREF, BROKER_REQUESTS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import { amenityLabel } from "@/lib/validation/property";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    buildPropertyFacts,
    factColumnsClass,
    listedAgoLabel,
} from "@/features/properties/property-detail/property-detail-facts";
import { PropertyDetailSkeleton } from "@/features/properties/property-detail/property-detail-skeleton";
import { PropertyGallery } from "@/features/properties/property-detail/property-gallery";
import { PropertyPriceBlock } from "@/features/properties/property-detail/property-price-block";
import { mapPropertyListingToMyItem } from "@/features/properties/your-listings/map-my-listing";
import type { MyListingItem } from "@/features/properties/your-listings/types";

type RepresentationStanding = {
    id: string;
    status: string;
    initiatedBy?: string | null;
};

type OwnerListingDetail = {
    listing: MyListingItem;
    ownerName: string;
    ownerAvatarUrl?: string;
    ownerPhoneDigits?: string;
    representation: RepresentationStanding | null;
    commissionPercent: number | null;
};

function digitsOnly(value: string | null | undefined): string {
    return (value ?? "").replace(/\D/g, "");
}

function normalizePhoneDigits(value: string | null | undefined): string | undefined {
    const digits = digitsOnly(value);
    if (!digits) return undefined;
    return digits.length > 10 ? digits.slice(-10) : digits;
}

function standingLabel(standing: RepresentationStanding | null): string {
    if (!standing) return "Available to request";
    if (standing.status === "accepted") return "Representing";
    if (standing.status === "pending") {
        return standing.initiatedBy === "owner" ? "Invite pending" : "Request pending";
    }
    return "Available to request";
}

function OwnerContactCard({ detail }: { detail: OwnerListingDetail }) {
    const accepted = detail.representation?.status === "accepted";
    const phone = accepted ? detail.ownerPhoneDigits : undefined;

    return (
        <section className="flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-5">
            <h2 className="eyebrow">Owner contact</h2>
            <div className="flex items-center gap-3">
                <UserAvatar name={detail.ownerName} imageUrl={detail.ownerAvatarUrl} size="lg" />
                <div className="flex flex-col gap-0.5 min-inline-0">
                    <p className="body truncate font-semibold text-ink">{detail.ownerName}</p>
                    {accepted ? (
                        <p className="body-sm text-brand">Contact unlocked</p>
                    ) : (
                        <p className="body-sm text-ink-muted">
                            Unlocks after the owner approves you
                        </p>
                    )}
                </div>
            </div>

            {accepted && phone ? (
                <div className="flex flex-col gap-2">
                    <p className="body tabular text-ink">{formatPhoneIn(phone)}</p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-border-warm"
                            render={<a href={`tel:+91${phone}`} />}
                        >
                            <Phone
                                aria-hidden
                                className="block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                            Call
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-border-warm"
                            render={
                                <a
                                    href={formatWhatsAppUrl(phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                />
                            }
                        >
                            <MessageCircle
                                aria-hidden
                                className="block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                            WhatsApp
                        </Button>
                    </div>
                </div>
            ) : accepted ? (
                <p className="body-sm text-ink-muted">
                    Representation accepted — contact details will appear once the owner has a phone
                    on file.
                </p>
            ) : (
                <div className="flex flex-col gap-2 rounded-control bg-surface-muted p-3">
                    <p className="body-sm inline-flex items-center gap-1.5 text-ink-muted">
                        <Lock aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                        Phone hidden — unlocks after approval
                    </p>
                    <p className="body-sm text-ink-muted">Email hidden — unlocks after approval</p>
                </div>
            )}
        </section>
    );
}

function OwnerListingActionRail({
    detail,
    busy,
    onRequest,
}: {
    detail: OwnerListingDetail;
    busy: boolean;
    onRequest: () => void;
}) {
    const standing = detail.representation;
    const status = standing?.status;
    const accepted = status === "accepted";
    const pending = status === "pending";

    return (
        <aside className="flex flex-col gap-4 self-start lg:sticky lg:inset-bs-24">
            <div
                className={cn(
                    "flex flex-col gap-4 rounded-card border p-5",
                    accepted
                        ? "border-brand/20 bg-brand-soft"
                        : "border-border-warm bg-surface-muted",
                )}
            >
                <div className="flex flex-col gap-1">
                    <p className="h6 text-ink">{standingLabel(standing)}</p>
                    <p className="body-sm text-ink-muted">
                        {accepted
                            ? "You represent this listing. Owner contact is unlocked."
                            : pending
                              ? standing?.initiatedBy === "owner"
                                  ? "The owner invited your agency — answer it from Requests."
                                  : "Your request is with the owner. We’ll notify you when they respond."
                              : "Ask the owner for representation to unlock contact details."}
                    </p>
                </div>

                {accepted ? (
                    <Button
                        size="lg"
                        className="rounded-control bg-brand text-surface hover:bg-brand-text"
                        render={<Link href={BROKER_REQUESTS_HREF} />}
                    >
                        Open in Requests
                    </Button>
                ) : pending && standing?.initiatedBy === "owner" ? (
                    <Button
                        size="lg"
                        className="rounded-control bg-brand text-surface hover:bg-brand-text"
                        render={<Link href={BROKER_REQUESTS_HREF} />}
                    >
                        Review invite
                    </Button>
                ) : pending ? (
                    <Button size="lg" disabled variant="outline" className="rounded-control">
                        Requested — pending
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        disabled={busy}
                        onClick={onRequest}
                        className="rounded-control bg-brand text-surface hover:bg-brand-text"
                    >
                        {busy ? "Sending…" : "Request to represent"}
                    </Button>
                )}
            </div>

            <OwnerContactCard detail={detail} />

            {detail.commissionPercent != null && detail.commissionPercent > 0 ? (
                <div className="rounded-card border border-border-warm bg-surface p-5">
                    <p className="eyebrow">Commission</p>
                    <p className="h5 tabular mbs-1 text-ink">{detail.commissionPercent}%</p>
                    <p className="body-sm mbs-1 text-ink-muted">
                        Shared by the owner for this listing.
                    </p>
                </div>
            ) : null}
        </aside>
    );
}

function OwnerListingDetailView({ initial }: { initial: OwnerListingDetail }) {
    const [detail, setDetail] = useState(initial);
    const [busy, setBusy] = useState(false);
    const [descriptionOpen, setDescriptionOpen] = useState(false);

    const item = detail.listing;
    const facts = useMemo(() => buildPropertyFacts(item), [item]);
    const isLongDescription = item.description.length > 320;

    const handleRequest = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        try {
            const rep = await representativeApi.requestRepresentation(item.id);
            setDetail((prev) => ({
                ...prev,
                representation: {
                    id: rep.id,
                    status: rep.status,
                    initiatedBy: rep.initiatedBy,
                },
            }));
            toast.success("Representation request sent");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not send request";
            toast.error(message);
        } finally {
            setBusy(false);
        }
    }, [busy, item.id]);

    const canRequest =
        !detail.representation || !["pending", "accepted"].includes(detail.representation.status);

    return (
        <div className="flex flex-col gap-6 pbe-24 lg:pbe-8">
            <Link
                href={BROKER_OWNER_LISTINGS_HREF}
                className="
                  body-sm inline-flex items-center gap-1 font-medium text-ink-muted
                  transition-colors duration-160 inline-fit
                  hover:text-ink
                "
            >
                <ChevronLeft aria-hidden className="block-4 inline-4" strokeWidth={2} />
                Owner listings
            </Link>

            <PropertyGallery
                title={item.title}
                imageSrcs={item.imageSrcs}
                overlay={
                    <>
                        <Badge className="border-0 bg-surface/95 text-ink shadow-xs">
                            {standingLabel(detail.representation)}
                        </Badge>
                        <Badge className="border-0 bg-surface/95 text-ink-muted shadow-xs">
                            Listed {listedAgoLabel(item.listedDaysAgo).toLowerCase()}
                        </Badge>
                    </>
                }
            />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)] lg:gap-10">
                <div className="flex flex-col gap-8 min-inline-0">
                    <header className="flex flex-col gap-3">
                        <h1 className="h2 text-ink">{item.title}</h1>
                        <p className="body flex items-start gap-1.5 text-ink-muted">
                            <MapPin
                                aria-hidden
                                className="mbs-0.5 shrink-0 block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            <span>
                                {item.locality}
                                {item.city ? `, ${item.city}` : ""}
                            </span>
                        </p>
                    </header>

                    <section className="rounded-card border border-border-warm bg-surface p-5 sm:p-6">
                        <PropertyPriceBlock item={item} />
                    </section>

                    <section className="flex flex-col gap-4">
                        <h2 className="eyebrow">Property details</h2>
                        <dl
                            className={cn(
                                `
                                  grid grid-cols-2 overflow-hidden rounded-card border
                                  border-border-warm bg-surface
                                `,
                                factColumnsClass(facts.length),
                            )}
                        >
                            {facts.map((fact) => (
                                <div
                                    key={fact.key}
                                    className="
                                      flex flex-col gap-1 bg-surface p-4
                                      shadow-[inset_-1px_-1px_0_0_var(--color-border-warm)]
                                    "
                                >
                                    <dt className="body-xs text-ink-muted">{fact.label}</dt>
                                    <dd className="body font-semibold text-ink">{fact.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    {item.description.trim() ? (
                        <section className="flex flex-col gap-3">
                            <h2 className="eyebrow">About this property</h2>
                            <p
                                className={
                                    isLongDescription && !descriptionOpen
                                        ? "body line-clamp-5 whitespace-pre-wrap text-ink-muted"
                                        : "body whitespace-pre-wrap text-ink-muted"
                                }
                            >
                                {item.description}
                            </p>
                            {isLongDescription ? (
                                <button
                                    type="button"
                                    onClick={() => setDescriptionOpen((open) => !open)}
                                    className="
                                      body-sm font-semibold text-brand underline-offset-4 inline-fit
                                      hover:underline
                                    "
                                >
                                    {descriptionOpen ? "Show less" : "Read more"}
                                </button>
                            ) : null}
                        </section>
                    ) : null}

                    {item.amenities.length > 0 ? (
                        <section className="flex flex-col gap-3">
                            <h2 className="eyebrow">Amenities</h2>
                            <ul className="flex flex-wrap gap-2">
                                {item.amenities.map((amenity) => (
                                    <li
                                        key={amenity}
                                        className="
                                          body-sm rounded-control border border-border-warm
                                          bg-surface px-3.5 py-1.5 font-medium text-ink
                                        "
                                    >
                                        {amenityLabel(amenity)}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}
                </div>

                <OwnerListingActionRail
                    detail={detail}
                    busy={busy}
                    onRequest={() => void handleRequest()}
                />
            </div>

            <div
                className="
                  fixed inset-x-0 inset-be-0 z-30 flex items-center gap-3 border-bs
                  border-border-warm bg-surface/95 p-3 backdrop-blur-sm
                  lg:hidden
                "
            >
                {canRequest ? (
                    <Button
                        type="button"
                        size="lg"
                        disabled={busy}
                        onClick={() => void handleRequest()}
                        className="flex-1 rounded-control bg-brand text-surface hover:bg-brand-text"
                    >
                        {busy ? "Sending…" : "Request to represent"}
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        className="flex-1 rounded-control bg-brand text-surface hover:bg-brand-text"
                        render={<Link href={BROKER_REQUESTS_HREF} />}
                    >
                        {detail.representation?.status === "accepted"
                            ? "Open in Requests"
                            : "View request"}
                    </Button>
                )}
            </div>
        </div>
    );
}

function NotFoundState() {
    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <h1 className="h3">Listing not found</h1>
            <p className="body max-w-prose text-ink-muted">
                This owner listing may be private, unpublished, or no longer available.
            </p>
            <Button
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
            >
                Back to owner listings
            </Button>
        </div>
    );
}

export function OwnerListingDetailPage() {
    const params = useParams<{ id: string }>();
    const propertyId = params.id;
    const [detail, setDetail] = useState<OwnerListingDetail | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        void propertiesApi
            .browseById(propertyId)
            .then((raw) => {
                if (cancelled) return;
                const listing = mapPropertyListingToMyItem(raw);
                const commissionRaw = Number(raw.commissionPercent);
                setDetail({
                    listing,
                    ownerName: raw.ownerName?.trim() || raw.organizationName?.trim() || "Owner",
                    ownerAvatarUrl: raw.ownerAvatarUrl ?? undefined,
                    ownerPhoneDigits: normalizePhoneDigits(raw.ownerPhone),
                    representation: raw.representation
                        ? {
                              id: raw.representation.id,
                              status: raw.representation.status,
                              initiatedBy: raw.representation.initiatedBy,
                          }
                        : null,
                    commissionPercent:
                        Number.isFinite(commissionRaw) && commissionRaw > 0 ? commissionRaw : null,
                });
            })
            .catch(() => {
                if (!cancelled) setDetail(null);
            });

        return () => {
            cancelled = true;
        };
    }, [propertyId]);

    if (detail === undefined) return <PropertyDetailSkeleton />;
    if (!detail) return <NotFoundState />;

    return <OwnerListingDetailView initial={detail} />;
}
