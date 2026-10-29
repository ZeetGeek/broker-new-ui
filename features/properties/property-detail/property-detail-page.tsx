"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { myListingsApi } from "@/lib/api/my-listings";
import { representativeApi } from "@/lib/api/representative";
import { summarizePropertyBrokers } from "@/lib/format/property-brokers";
import { useParams, useRouter } from "@/lib/navigation";
import {
    BROKER_OWNER_LISTINGS_HREF,
    BROKER_YOUR_LISTINGS_HREF,
    brokerPropertyAnalyticsHref,
    brokerPropertyEditHref,
} from "@/lib/routes/broker";
import {
    OWNER_PROPERTIES_HREF,
    OWNER_REQUESTS_HREF,
    ownerPropertyEditHref,
} from "@/lib/routes/owner";

import { Button } from "@/components/ui/button";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { PropertyActionRail } from "@/features/properties/property-detail/property-action-rail";
import { PropertyDetailLayout } from "@/features/properties/property-detail/property-detail-layout";
import { PropertyDetailSkeleton } from "@/features/properties/property-detail/property-detail-skeleton";
import { MarkSoldDialog } from "@/features/properties/your-listings/mark-sold-dialog";
import type { MyListingItem, MyListingStatus } from "@/features/properties/your-listings/types";
import { useAppSelector } from "@/store/hooks";

const STATUS_LABEL: Record<MyListingStatus, string> = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished",
};

function OwnedPropertyDetail({
    listing,
    portal,
}: {
    listing: MyListingItem;
    portal: "broker" | "owner";
}) {
    const router = useRouter();
    const [item, setItem] = useState(listing);
    const [busy, setBusy] = useState(false);
    const [soldOpen, setSoldOpen] = useState(false);
    const brokersQuery = useQuery({
        queryKey: ["owner-property-representations"],
        queryFn: () => representativeApi.ownerList(),
        enabled: portal === "owner",
    });
    const brokerSummary = brokersQuery.data
        ? summarizePropertyBrokers(brokersQuery.data, brokersQuery.dataUpdatedAt).get(item.id)
        : undefined;

    const listHref = portal === "owner" ? OWNER_PROPERTIES_HREF : BROKER_YOUR_LISTINGS_HREF;
    const editHref =
        portal === "owner" ? ownerPropertyEditHref(item.id) : brokerPropertyEditHref(item.id);
    const requestsHref =
        portal === "owner" ? OWNER_REQUESTS_HREF : `${BROKER_YOUR_LISTINGS_HREF}?tab=requests`;
    const backLabel = portal === "owner" ? "Properties" : "My Listings";

    const togglePublish = useCallback(async () => {
        if (busy || item.isSold) return;
        setBusy(true);
        try {
            const nextStatus: MyListingStatus =
                item.status === "published" ? "unpublished" : "published";
            const updated = await myListingsApi.setStatus(item.id, nextStatus);
            if (!updated) throw new Error("Couldn't update status");
            setItem(updated);
            toast.success(
                nextStatus === "published"
                    ? "Published. Brokers can now find it."
                    : "Property unpublished.",
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't update status");
        } finally {
            setBusy(false);
        }
    }, [busy, item]);

    const handleDelete = useCallback(async () => {
        setBusy(true);
        try {
            await myListingsApi.remove(item.id);
            toast.success("Property removed");
            router.push(listHref);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't remove property");
        } finally {
            setBusy(false);
        }
    }, [item.id, listHref, router]);

    return (
        <>
            <PropertyDetailLayout
                item={item}
                audience={portal}
                statusColor={
                    item.isSold ? "stone" : item.status === "published" ? "emerald" : "amber"
                }
                backHref={listHref}
                backLabel={backLabel}
                status={
                    item.isSold
                        ? "Sold"
                        : portal === "broker"
                          ? "Your custom property"
                          : STATUS_LABEL[item.status]
                }
                editHref={editHref}
                rail={
                    <PropertyActionRail
                        item={item}
                        portal={portal}
                        busy={busy}
                        onTogglePublish={() => void togglePublish()}
                        onRequestDelete={handleDelete}
                        onMarkSold={
                            portal === "broker" && !item.isSold
                                ? () => setSoldOpen(true)
                                : undefined
                        }
                        editHref={editHref}
                        analyticsHref={
                            portal === "broker" ? brokerPropertyAnalyticsHref(item.id) : undefined
                        }
                        requestsHref={portal === "owner" ? requestsHref : undefined}
                        brokers={brokerSummary?.brokers}
                        brokersState={
                            brokersQuery.isError
                                ? "error"
                                : brokersQuery.isPending
                                  ? "loading"
                                  : "ready"
                        }
                        onRetryBrokers={() => void brokersQuery.refetch()}
                    />
                }
                mobileAction={
                    portal === "broker" || item.isSold ? (
                        <Button variant="accent" size="lg" render={<Link href={editHref} />}>
                            Edit property
                        </Button>
                    ) : (
                        <Button
                            variant="accent"
                            size="lg"
                            disabled={busy}
                            loading={busy}
                            onClick={() => void togglePublish()}
                        >
                            {item.status === "published" ? "Unpublish" : "Publish property"}
                        </Button>
                    )
                }
            />
            {portal === "broker" ? (
                <MarkSoldDialog
                    open={soldOpen}
                    onOpenChange={setSoldOpen}
                    portal="broker"
                    propertyId={item.id}
                    propertyTitle={item.title || "This property"}
                    onSold={() => {
                        void myListingsApi
                            .get(item.id)
                            .then((updated) => {
                                if (updated) setItem(updated);
                                else setItem((current) => ({ ...current, isSold: true }));
                            })
                            .catch(() => {
                                setItem((current) => ({ ...current, isSold: true }));
                                toast.error(
                                    "Property marked sold, but details could not reload. Refresh to try again.",
                                );
                            });
                    }}
                />
            ) : null}
        </>
    );
}

function BrowsePropertyFallback({
    propertyId,
    portal,
}: {
    propertyId: string;
    portal: "broker" | "owner";
}) {
    if (portal === "owner") {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <h1 className="h3">Property not found</h1>
                <p className="body max-w-prose text-ink-muted">
                    This listing isn&apos;t in your inventory (or was removed).
                </p>
                <Button
                    variant="accent"
                    className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                    render={<Link href={OWNER_PROPERTIES_HREF} />}
                >
                    Back to properties
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
            <h1 className="h3">Property {propertyId}</h1>
            <p className="body max-w-prose text-ink-muted">
                This listing isn&apos;t in your inventory or may have been removed. Go back to Your
                listings to choose another property.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                {FEATURE_PLATFORM_OWNER ? (
                    <Button
                        variant="accent"
                        className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                        render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
                    >
                        Browse Marketplace
                    </Button>
                ) : null}
                <Button
                    variant="outline"
                    className="border-border-warm"
                    render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
                >
                    My Listings
                </Button>
            </div>
        </div>
    );
}

export function PropertyDetailPage({ portal = "broker" }: { portal?: "broker" | "owner" }) {
    const params = useParams<{ id: string }>();
    const propertyId = params.id;
    const userId = useAppSelector((state) => state.auth.user?.id);
    const query = useQuery({
        queryKey: ["owned-property-detail", userId, portal, propertyId],
        queryFn: () => myListingsApi.get(propertyId),
        staleTime: 0,
    });

    if (query.isPending) return <PropertyDetailSkeleton />;
    if (query.isError) {
        return (
            <div role="alert" className="flex flex-col items-start gap-4 py-16">
                <h1 className="h3">Could not load property</h1>
                <p className="body text-ink-muted">
                    The property could not be loaded. Check your connection or account access and
                    try again.
                </p>
                <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
                    Retry
                </Button>
                <Link href={portal === "owner" ? OWNER_PROPERTIES_HREF : BROKER_YOUR_LISTINGS_HREF}>
                    Back to listings
                </Link>
            </div>
        );
    }
    if (!query.data) return <BrowsePropertyFallback propertyId={propertyId} portal={portal} />;

    return <OwnedPropertyDetail key={propertyId} listing={query.data} portal={portal} />;
}
