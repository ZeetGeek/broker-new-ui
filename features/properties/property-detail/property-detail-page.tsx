"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ChevronLeft, MapPin } from "lucide-react";

import { myListingsApi } from "@/lib/api/my-listings";
import { toLegacyAmountFields } from "@/lib/format/listing-availability";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import {
    BROKER_OWNER_LISTINGS_HREF,
    BROKER_YOUR_LISTINGS_HREF,
    brokerPropertyEditHref,
} from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import { amenityLabel } from "@/lib/validation/property";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { PropertyActionRail } from "@/features/properties/property-detail/property-action-rail";
import { PropertyDeleteDialog } from "@/features/properties/property-detail/property-delete-dialog";
import {
    buildPropertyFacts,
    factColumnsClass,
    listedAgoLabel,
} from "@/features/properties/property-detail/property-detail-facts";
import { PropertyDetailSkeleton } from "@/features/properties/property-detail/property-detail-skeleton";
import { PropertyGallery } from "@/features/properties/property-detail/property-gallery";
import { PropertyPriceBlock } from "@/features/properties/property-detail/property-price-block";
import type { MyListingItem, MyListingStatus } from "@/features/properties/your-listings/types";

const STATUS_LABEL: Record<MyListingStatus, string> = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished",
};

const STATUS_VARIANT: Record<MyListingStatus, "brand" | "neutral" | "urgent"> = {
    draft: "neutral",
    published: "brand",
    unpublished: "urgent",
};

function OwnedPropertyDetail({ listing }: { listing: MyListingItem }) {
    const router = useRouter();
    const [item, setItem] = useState(listing);
    const [busy, setBusy] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [descriptionOpen, setDescriptionOpen] = useState(false);

    const facts = useMemo(() => buildPropertyFacts(item), [item]);

    const shareListing = useMemo(() => {
        const { amountInr, isRent } = toLegacyAmountFields(item);
        return {
            id: item.id,
            title: item.title,
            locality: item.locality,
            city: item.city,
            priceLabel: isRent ? formatRentInr(amountInr) : formatPriceInr(amountInr),
            imageSrc: item.imageSrc,
            configLabel: item.configLabel,
            propertyTypeLabel: item.propertyTypeLabel,
            areaSqft: item.areaSqft,
            bhk: item.bhk,
            listingKind: isRent ? ("rent" as const) : ("sale" as const),
        };
    }, [item]);

    const togglePublish = useCallback(async () => {
        setBusy(true);
        const nextStatus: MyListingStatus =
            item.status === "published" ? "unpublished" : "published";
        const updated = await myListingsApi.setStatus(item.id, nextStatus);
        setBusy(false);

        if (!updated) {
            toast.error("Couldn't update status");
            return;
        }

        setItem(updated);
        toast.success(
            nextStatus === "published"
                ? "Published. Brokers can now find it."
                : "Unpublished. Brokers can no longer find it.",
        );
    }, [item.id, item.status]);

    const handleDelete = useCallback(async () => {
        setBusy(true);
        const ok = await myListingsApi.remove(item.id);
        setBusy(false);

        if (!ok) {
            toast.error("Couldn't remove property");
            return;
        }

        setDeleteOpen(false);
        toast.success("Property removed");
        router.push(BROKER_YOUR_LISTINGS_HREF);
    }, [item.id, router]);

    const isLongDescription = item.description.length > 320;

    return (
        <div className="flex flex-col gap-6 pbe-24 lg:pbe-8">
            <Link
                href={BROKER_YOUR_LISTINGS_HREF}
                className="
                  body-sm inline-flex items-center gap-1 font-medium text-ink-muted
                  transition-colors duration-160 inline-fit
                  hover:text-ink
                "
            >
                <ChevronLeft aria-hidden className="block-4 inline-4" strokeWidth={2} />
                Your listings
            </Link>

            <PropertyGallery
                title={item.title}
                imageSrcs={item.imageSrcs}
                editHref={brokerPropertyEditHref(item.id)}
                overlay={
                    <>
                        <Badge
                            variant={STATUS_VARIANT[item.status]}
                            className="border-0 bg-surface/95 text-ink shadow-xs"
                        >
                            {STATUS_LABEL[item.status]}
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
                                {item.address}, {item.locality}, {item.city} {item.pinCode}
                            </span>
                        </p>
                    </header>

                    <section
                        className="rounded-card border border-border-warm bg-surface p-5 sm:p-6"
                    >
                        <PropertyPriceBlock item={item} />
                    </section>

                    <section className="flex flex-col gap-4">
                        <h2 className="eyebrow">Property details</h2>
                        {/* Separators are per-cell ring insets rather than a
                            background showing through `gap-px`: the column count
                            changes per breakpoint, and any gap-based rule leaves a
                            stray coloured cell wherever the total does not divide. */}
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

                <PropertyActionRail
                    item={item}
                    busy={busy}
                    onTogglePublish={() => void togglePublish()}
                    onRequestDelete={() => setDeleteOpen(true)}
                    shareListing={shareListing}
                />
            </div>

            {/* Cheap Android phones are the primary device — the publish action
                must stay reachable without scrolling back to the rail. */}
            <div
                className="
                  fixed inset-x-0 inset-be-0 z-30 flex items-center gap-3 border-bs
                  border-border-warm bg-surface/95 p-3 backdrop-blur-sm
                  lg:hidden
                "
            >
                <Button
                    type="button"
                    size="lg"
                    disabled={busy}
                    onClick={() => void togglePublish()}
                    className={
                        item.status === "published"
                            ? `
                              flex-1 rounded-control border border-border-warm bg-surface-muted
                              text-ink
                            `
                            : "flex-1 rounded-control bg-brand text-surface hover:bg-brand-text"
                    }
                >
                    {item.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="rounded-control border-border-warm"
                    render={<Link href={`${BROKER_YOUR_LISTINGS_HREF}?tab=requests`} />}
                >
                    Requests
                    {item.inboundRequestCount > 0 ? (
                        <span className="tabular ms-1 rounded-md bg-brand px-1.5 text-surface">
                            {item.inboundRequestCount}
                        </span>
                    ) : null}
                </Button>
            </div>

            <PropertyDeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title={item.title}
                busy={busy}
                onConfirm={() => void handleDelete()}
            />
        </div>
    );
}

function BrowsePropertyFallback({ propertyId }: { propertyId: string }) {
    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <h1 className="h3">Property {propertyId}</h1>
            <p className="body max-w-prose text-ink-muted">
                This listing isn&apos;t in your inventory. Open Owner listings to request
                representation, or go back to your own properties.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                <Button
                    className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                    render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
                >
                    Browse owner listings
                </Button>
                <Button
                    variant="outline"
                    className="border-border-warm"
                    render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
                >
                    Your listings
                </Button>
            </div>
        </div>
    );
}

export function PropertyDetailPage() {
    const params = useParams<{ id: string }>();
    const propertyId = params.id;
    const [listing, setListing] = useState<MyListingItem | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        void myListingsApi.get(propertyId).then((item) => {
            if (!cancelled) setListing(item);
        });
        return () => {
            cancelled = true;
        };
    }, [propertyId]);

    if (listing === undefined) return <PropertyDetailSkeleton />;
    if (!listing) return <BrowsePropertyFallback propertyId={propertyId} />;

    return <OwnedPropertyDetail listing={listing} />;
}
