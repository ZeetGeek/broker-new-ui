"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
    Bath,
    BedDouble,
    Building2,
    MapPin,
    Maximize2,
    Pencil,
    Share2,
    Trash2,
} from "lucide-react";

import { myListingsApi } from "@/lib/api/my-listings";
import { formatAreaSqft } from "@/lib/format/area";
import {
    brokerPropertyEditHref,
    BROKER_OWNER_LISTINGS_HREF,
    BROKER_YOUR_LISTINGS_HREF,
} from "@/lib/routes/broker";
import { buildPropertyShareUrl } from "@/lib/share/property";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { Price } from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { MyListingItem, MyListingStatus } from "@/features/properties/your-listings/types";

const STATUS_LABEL: Record<MyListingStatus, string> = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished",
};

function statusClass(status: MyListingStatus): string {
    if (status === "published") return "bg-brand-soft text-brand-text";
    if (status === "draft") return "bg-surface-muted text-ink-muted";
    return "bg-urgent-soft text-urgent";
}

function amenityLabel(value: string): string {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function OwnedPropertyDetail({ listing }: { listing: MyListingItem }) {
    const router = useRouter();
    const [item, setItem] = useState(listing);
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const primaryIsRent =
        item.transactionType === "rent" ||
        (item.transactionType === "both" && item.saleAmountInr == null);
    const amountInr = primaryIsRent
        ? (item.rentAmountInr ?? item.saleAmountInr ?? 0)
        : (item.saleAmountInr ?? item.rentAmountInr ?? 0);

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
                ? "Property published. Brokers can now see it."
                : "Property unpublished",
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
        toast.success("Property removed");
        router.push(BROKER_YOUR_LISTINGS_HREF);
    }, [item.id, router]);

    const handleShare = useCallback(() => {
        const url = buildPropertyShareUrl(item.id);
        void navigator.clipboard?.writeText(url).then(
            () => toast.success("Link copied"),
            () => toast.success(url),
        );
    }, [item.id]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-2 min-inline-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="display-md">{item.title}</h1>
                        <Badge className={statusClass(item.status)}>
                            {STATUS_LABEL[item.status]}
                        </Badge>
                    </div>
                    <p className="body flex items-center gap-1.5 text-ink-muted">
                        <MapPin
                            aria-hidden
                            className="shrink-0 block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        {item.address}, {item.locality}, {item.city} {item.pinCode}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-border-warm"
                        onClick={handleShare}
                    >
                        <Share2 aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        Share
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="border-border-warm"
                        render={<Link href={brokerPropertyEditHref(item.id)} />}
                    >
                        <Pencil aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        Edit
                    </Button>
                    <Button
                        type="button"
                        className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                        disabled={busy}
                        onClick={() => void togglePublish()}
                    >
                        {item.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {item.imageSrcs.map((src, index) => (
                    <div
                        key={`${src}-${index}`}
                        className={cn(
                            "relative overflow-hidden rounded-card bg-surface-muted aspect-[4/3]",
                            index === 0 && "sm:col-span-2 lg:col-span-2 lg:row-span-2 lg:aspect-auto lg:min-h-80",
                        )}
                    >
                        <AppImage
                            src={src}
                            alt={`${item.title} photo ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes={
                                index === 0
                                    ? "(max-width: 1024px) 100vw, 66vw"
                                    : "(max-width: 1024px) 50vw, 33vw"
                            }
                            priority={index === 0}
                        />
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="flex flex-col gap-5 rounded-card border border-border-warm bg-surface p-5">
                    <div className="flex flex-wrap gap-4">
                        <Price
                            amountInr={amountInr}
                            isRent={primaryIsRent}
                            className="h4 font-semibold text-brand"
                        />
                        {item.transactionType === "both" &&
                        item.saleAmountInr != null &&
                        item.rentAmountInr != null ? (
                            <Price
                                amountInr={
                                    primaryIsRent ? item.saleAmountInr : item.rentAmountInr
                                }
                                isRent={!primaryIsRent}
                                className="body font-semibold text-ink-muted"
                            />
                        ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3 body-sm text-ink-muted">
                        {item.bhk > 0 ? (
                            <span className="inline-flex items-center gap-1.5">
                                <BedDouble
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                {item.bhk} bed
                            </span>
                        ) : null}
                        {item.bhk > 0 ? (
                            <span className="inline-flex items-center gap-1.5">
                                <Bath
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                {item.bhk} bath
                            </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5">
                            <Maximize2
                                aria-hidden
                                className="block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            {formatAreaSqft(item.areaSqft)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Building2
                                aria-hidden
                                className="block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            {item.propertyTypeLabel} · {item.furnishingLabel}
                        </span>
                    </div>

                    <div>
                        <h2 className="h6 mb-2">About this property</h2>
                        <p className="body text-ink-muted whitespace-pre-wrap">{item.description}</p>
                    </div>

                    {item.amenities.length > 0 ? (
                        <div>
                            <h2 className="h6 mb-2">Amenities</h2>
                            <div className="flex flex-wrap gap-2">
                                {item.amenities.map((amenity) => (
                                    <span
                                        key={amenity}
                                        className="body-sm rounded-full bg-surface-muted px-3 py-1 text-ink"
                                    >
                                        {amenityLabel(amenity)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                <aside className="flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-5">
                    <div>
                        <p className="body-xs text-ink-muted">Inbound requests</p>
                        <p className="tabular h5 font-semibold text-ink">
                            {item.inboundRequestCount}
                        </p>
                    </div>
                    <div>
                        <p className="body-xs text-ink-muted">Listed</p>
                        <p className="body font-medium text-ink">
                            {item.listedDaysAgo === 0
                                ? "Today"
                                : item.listedDaysAgo === 1
                                  ? "1 day ago"
                                  : `${item.listedDaysAgo} days ago`}
                        </p>
                    </div>
                    {item.availableFrom ? (
                        <div>
                            <p className="body-xs text-ink-muted">Available from</p>
                            <p className="body font-medium text-ink">{item.availableFrom}</p>
                        </div>
                    ) : null}

                    <div className="mt-auto flex flex-col gap-2 border-t border-border-warm pt-4">
                        {!confirmDelete ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="border-danger/40 text-danger hover:bg-danger-soft"
                                disabled={busy}
                                onClick={() => setConfirmDelete(true)}
                            >
                                <Trash2
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                Delete property
                            </Button>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <p className="body-sm text-ink-muted">
                                    &ldquo;{item.title}&rdquo; will be removed permanently.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 border-border-warm"
                                        onClick={() => setConfirmDelete(false)}
                                    >
                                        Keep
                                    </Button>
                                    <Button
                                        type="button"
                                        className="flex-1 bg-danger text-surface hover:bg-danger/90"
                                        disabled={busy}
                                        onClick={() => void handleDelete()}
                                    >
                                        {busy ? "Removing…" : "Delete"}
                                    </Button>
                                </div>
                            </div>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            className="border-border-warm"
                            render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
                        >
                            Back to listings
                        </Button>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function BrowsePropertyFallback({ propertyId }: { propertyId: string }) {
    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <h1 className="display-md">Property {propertyId}</h1>
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

    if (listing === undefined) {
        return (
            <div className="flex flex-col gap-4 py-4">
                <div className="h-10 w-64 animate-pulse rounded-control bg-surface-muted" />
                <div className="h-72 animate-pulse rounded-card bg-surface-muted" />
                <div className="h-40 animate-pulse rounded-card bg-surface-muted" />
            </div>
        );
    }

    if (!listing) {
        return <BrowsePropertyFallback propertyId={propertyId} />;
    }

    return <OwnedPropertyDetail listing={listing} />;
}
