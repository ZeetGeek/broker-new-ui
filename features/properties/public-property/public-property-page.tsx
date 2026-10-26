"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { propertiesApi, type PublicPropertyListing } from "@/lib/api/properties";
import { toLegacyAmountFields } from "@/lib/format/listing-availability";
import { formatPrice, formatRent } from "@/lib/format/price";

import { CurrencyScope } from "@/components/auth/market-currency-scope";
import { Building2, Clock, MapPin, MessageCircle } from "@/components/shared/icons";
import { PropertySharePopover } from "@/components/shared/property-share-popover";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { listedAgoLabel } from "@/features/properties/property-detail/property-detail-facts";
import { PropertyDetailContent } from "@/features/properties/property-detail/property-detail-layout";
import { PropertyDetailSkeleton } from "@/features/properties/property-detail/property-detail-skeleton";
import { PropertyGallery } from "@/features/properties/property-detail/property-gallery";
import { PropertyPriceBlock } from "@/features/properties/property-detail/property-price-block";
import { mapPropertyListingToMyItem } from "@/features/properties/your-listings/map-my-listing";

import { PublicPropertyShell } from "./public-property-shell";

import styles from "@/features/properties/property-detail/property-detail.module.css";

function PublicPropertyView({ listing }: { listing: PublicPropertyListing }) {
    const item = useMemo(() => mapPropertyListingToMyItem(listing), [listing]);
    const { amountInr, isRent } = toLegacyAmountFields(item);
    const sold = Boolean(listing.isSold || item.isSold);
    const name = listing.listedBy?.name?.trim();
    const location = [...new Set([item.locality, item.city, item.country].filter(Boolean))].join(
        ", ",
    );
    return (
        <div className={`${styles.page} ${styles.publicPage}`}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.publicTitle}>{item.title}</h1>
                    <div className={styles.propertyMeta}>
                        {location ? (
                            <span className={styles.location}>
                                <MapPin size={18} strokeWidth={1.75} aria-hidden />
                                {location}
                            </span>
                        ) : null}
                        <Badge
                            color={
                                sold
                                    ? "stone"
                                    : item.transactionType === "rent"
                                      ? "orange"
                                      : "emerald"
                            }
                        >
                            {sold
                                ? "Sold"
                                : item.transactionType === "both"
                                  ? "For sale & rent"
                                  : item.transactionType === "rent"
                                    ? "For rent"
                                    : "For sale"}
                        </Badge>
                        <span className={styles.listed}>
                            <Clock size={15} aria-hidden />
                            Listed {listedAgoLabel(item.listedDaysAgo).toLowerCase()}
                        </span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <PropertySharePopover
                        iconOnly
                        className={styles.circleButton}
                        listing={{
                            id: item.id,
                            title: item.title,
                            locality: item.locality,
                            city: item.city,
                            priceLabel:
                                (isRent ? item.rentAmountInr : item.saleAmountInr) == null
                                    ? "Price on request"
                                    : isRent
                                      ? formatRent(amountInr)
                                      : formatPrice(amountInr),
                            imageSrc: item.imageSrc,
                            propertyTypeLabel: item.propertyTypeLabel,
                            configLabel: item.configLabel,
                            areaSqft: item.areaSqft,
                            bhk: item.bhk,
                            listingKind: isRent ? "rent" : "sale",
                        }}
                    />
                </div>
            </header>
            <div className={styles.fullWidthGallery}>
                <PropertyGallery title={item.title} imageSrcs={item.imageSrcs} />
            </div>
            <div className={styles.bodyGrid}>
                <PropertyDetailContent
                    item={item}
                    revealAddress={false}
                    locationHint="For the exact address or a viewing, contact the person who shared this property with you."
                />
                <aside className={styles.rail} aria-label="Property price and enquiries">
                    <section className={styles.actionCard}>
                        <p className={styles.priceLabel}>
                            {item.transactionType === "rent" ? "Monthly rent" : "Asking price"}
                        </p>
                        <PropertyPriceBlock item={item} compact hideCommission />
                        {sold ? (
                            <p className={styles.publicNotice}>
                                This property has been sold. Ask the person who shared it about
                                other available properties.
                            </p>
                        ) : null}
                    </section>
                    <section className={styles.contact}>
                        <h2>Interested in this property?</h2>
                        {name ? (
                            <div className={styles.contactIdentity}>
                                <UserAvatar
                                    name={name}
                                    imageUrl={listing.listedBy?.avatarUrl ?? undefined}
                                    size="md"
                                />
                                <div>
                                    <strong>{name}</strong>
                                    <p>
                                        {listing.listedBy?.type === "broker"
                                            ? "Listed by a broker"
                                            : "Listed by the owner"}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                        <div className={styles.publicEnquiry}>
                            <MessageCircle size={22} strokeWidth={1.75} aria-hidden />
                            <p>
                                Reply to the person who sent you this link to ask a question or
                                arrange a viewing.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

/** Buyer/tenant preview: no account required and no CRM or commission information. */
export function PublicPropertyPage() {
    const { id } = useParams<{ id: string }>();
    const query = useQuery({
        queryKey: ["public-property", id],
        queryFn: ({ signal }) => propertiesApi.getPublic(id, signal),
        retry: (count, error) =>
            !(error instanceof ApiError && [400, 404].includes(error.status)) && count < 1,
    });
    const unavailable =
        query.isError && query.error instanceof ApiError && [400, 404].includes(query.error.status);
    return (
        <PublicPropertyShell>
            {query.isPending ? (
                <PropertyDetailSkeleton isPublic />
            ) : query.isError ? (
                <div className={styles.publicError} role={unavailable ? "status" : "alert"}>
                    <Building2 size={32} strokeWidth={1.75} aria-hidden />
                    <h1>
                        {unavailable
                            ? "This property is no longer available"
                            : "Couldn't load this property"}
                    </h1>
                    <p>
                        {unavailable
                            ? "Ask the person who sent this link for an updated property."
                            : "Check your connection and try again."}
                    </p>
                    {!unavailable ? (
                        <Button variant="outline" onClick={() => void query.refetch()}>
                            Try again
                        </Button>
                    ) : null}
                </div>
            ) : (
                // A shared link opens for anyone, signed in or not, from any
                // country — so prices follow the listing, not the viewer.
                <CurrencyScope currency={query.data.currency}>
                    <PublicPropertyView key={id} listing={query.data} />
                </CurrencyScope>
            )}
        </PublicPropertyShell>
    );
}
