"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { type PublicPropertyListing, propertiesApi } from "@/lib/api/properties";
import { offersRent, offersSale } from "@/lib/format/listing-availability";
import { cn } from "@/lib/utils";
import { amenityLabel } from "@/lib/validation/property";

import { Building2, MapPin, UserRound } from "@/components/shared/icons";
import { Logo } from "@/components/shared/logo";
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

function PublicHeader() {
    return (
        <header className="border-be border-border-warm bg-surface">
            <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 max-inline-6xl sm:px-6">
                <Logo size="sm" />
                <Button variant="outline" size="sm" render={<Link href="/login" />}>
                    Sign in
                </Button>
            </div>
        </header>
    );
}

function ListedByCard({ listing }: { listing: PublicPropertyListing }) {
    const listedBy = listing.listedBy;
    const isBroker = listedBy?.type === "broker";
    const name = isBroker ? listedBy?.name?.trim() || "Broker" : "Property owner";

    return (
        <aside className="flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-5 sm:p-6 lg:sticky lg:inset-bs-6 lg:self-start">
            <p className="eyebrow">Listed by</p>
            <div className="flex items-center gap-3 min-inline-0">
                {isBroker ? (
                    <UserAvatar
                        name={name}
                        imageUrl={listedBy?.avatarUrl ?? undefined}
                        size="md"
                        className="shrink-0"
                    />
                ) : (
                    <span className="flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand block-10 inline-10">
                        <UserRound aria-hidden className="block-5 inline-5" strokeWidth={1.75} />
                    </span>
                )}
                <div className="min-inline-0">
                    <p className="body truncate font-semibold text-ink">{name}</p>
                    <p className="body-sm text-ink-muted">
                        {isBroker ? "Broker on YesBroker" : "Listed directly by the owner"}
                    </p>
                </div>
            </div>
            <p className="body-sm text-ink-muted">
                Interested? Reply to the person who shared this link, or sign in to YesBroker to
                connect.
            </p>
            <Button variant="accent" size="lg" render={<Link href="/login" />}>
                Sign in to YesBroker
            </Button>
        </aside>
    );
}

function NotFoundState() {
    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Building2 aria-hidden className="text-brand block-8 inline-8" strokeWidth={1.75} />
            <h1 className="h3">This property is not available</h1>
            <p className="body max-w-prose text-ink-muted">
                The link may be old, or the listing is no longer published.
            </p>
            <Button variant="outline" render={<Link href="/" />}>
                Go to YesBroker
            </Button>
        </div>
    );
}

function PublicPropertyView({ listing }: { listing: PublicPropertyListing }) {
    const item = useMemo(() => mapPropertyListingToMyItem(listing), [listing]);
    const facts = useMemo(() => buildPropertyFacts(item), [item]);
    const [descriptionOpen, setDescriptionOpen] = useState(false);
    const isLongDescription = item.description.length > 320;
    const isSold = Boolean(listing.isSold);

    return (
        <div className="flex flex-col gap-6">
            <PropertyGallery
                title={item.title}
                imageSrcs={item.imageSrcs}
                overlay={
                    <>
                        {isSold ? (
                            <Badge color="red" blur="dark">
                                Sold
                            </Badge>
                        ) : null}
                        {offersSale(item) ? (
                            <Badge color="emerald" blur="dark">
                                For sale
                            </Badge>
                        ) : null}
                        {offersRent(item) ? (
                            <Badge color="orange" blur="dark">
                                For rent
                            </Badge>
                        ) : null}
                        <Badge color="sky" blur="dark">
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
                        <PropertyPriceBlock item={item} hideCommission />
                    </section>

                    {facts.length > 0 ? (
                        <section className="flex flex-col gap-4">
                            <h2 className="eyebrow">Property details</h2>
                            <dl
                                className={cn(
                                    "grid grid-cols-2 overflow-hidden rounded-card border border-border-warm bg-surface",
                                    factColumnsClass(facts.length),
                                )}
                            >
                                {facts.map((fact) => (
                                    <div
                                        key={fact.key}
                                        className="flex flex-col gap-1 bg-surface p-4 shadow-[inset_-1px_-1px_0_0_var(--color-border-warm)]"
                                    >
                                        <dt className="body-xs text-ink-muted">{fact.label}</dt>
                                        <dd className="body font-semibold text-ink">
                                            {fact.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ) : null}

                    {item.description.trim() ? (
                        <section className="flex flex-col gap-3">
                            <h2 className="eyebrow">About this property</h2>
                            <p
                                className={cn(
                                    "body whitespace-pre-wrap text-ink-muted",
                                    isLongDescription && !descriptionOpen && "line-clamp-5",
                                )}
                            >
                                {item.description}
                            </p>
                            {isLongDescription ? (
                                <button
                                    type="button"
                                    onClick={() => setDescriptionOpen((open) => !open)}
                                    className="body-sm font-semibold text-brand underline-offset-4 inline-fit hover:underline"
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
                                        className="body-sm rounded-control border border-border-warm bg-surface px-3.5 py-1.5 font-medium text-ink"
                                    >
                                        {amenityLabel(amenity)}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}
                </div>

                <ListedByCard listing={listing} />
            </div>
        </div>
    );
}

/** No-login page behind a shared property link (`/property/:id`). */
export function PublicPropertyPage() {
    const params = useParams<{ id: string }>();
    const propertyId = params.id;

    const query = useQuery({
        queryKey: ["public-property", propertyId],
        queryFn: ({ signal }) => propertiesApi.getPublic(propertyId, signal),
        retry: (failureCount, error) =>
            !(error instanceof ApiError && (error.status === 404 || error.status === 400)) &&
            failureCount < 1,
    });

    return (
        <div className="flex min-block-dvh flex-col bg-canvas">
            <PublicHeader />
            <main className="mx-auto inline-full max-inline-6xl px-4 py-6 sm:px-6 sm:py-8">
                {query.isPending ? (
                    <PropertyDetailSkeleton />
                ) : query.isError || !query.data ? (
                    <NotFoundState />
                ) : (
                    <PublicPropertyView listing={query.data} />
                )}
            </main>
        </div>
    );
}
