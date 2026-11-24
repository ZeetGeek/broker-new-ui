"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";

import { useQuery } from "@tanstack/react-query";

import { myListingsApi } from "@/lib/api/my-listings";
import { representativeApi } from "@/lib/api/representative";
import { summarizePropertyBrokers } from "@/lib/format/property-brokers";
import { useParams, useRouter, useSearchParams } from "@/lib/navigation";
import { BROKER_YOUR_LISTINGS_HREF, brokerPropertyEditHref } from "@/lib/routes/broker";
import {
    OWNER_PROPERTIES_HREF,
    OWNER_REQUESTS_HREF,
    ownerPropertyEditHref,
} from "@/lib/routes/owner";

import { EmptyState } from "@/components/empty-state";
import toast from "@/components/shared/app-toast";
import { Building2, RefreshCw } from "@/components/shared/icons";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";

import { AnalyticsSkeleton } from "@/features/properties/property-analytics/analytics-skeleton";
import { PropertyActionRail } from "@/features/properties/property-detail/property-action-rail";
import { PropertyDeleteDialog } from "@/features/properties/property-detail/property-delete-dialog";
import { PropertyDetailLayout } from "@/features/properties/property-detail/property-detail-layout";
import { PropertyDetailSkeleton } from "@/features/properties/property-detail/property-detail-skeleton";
import type { MyListingItem, MyListingStatus } from "@/features/properties/your-listings/types";
import { useAppSelector } from "@/store/hooks";

const STATUS_LABEL: Record<MyListingStatus, string> = {
    draft: "Draft",
    published: "Published",
    unpublished: "Unpublished",
};

const PropertyAnalyticsContent = dynamic(
    () =>
        import("../property-analytics/property-analytics-content").then(
            (module) => module.PropertyAnalyticsContent,
        ),
    { loading: () => <AnalyticsSkeleton /> },
);

const PropertyAnalyticsMetadata = dynamic(() =>
    import("../property-analytics/property-analytics-content").then(
        (module) => module.PropertyAnalyticsMetadata,
    ),
);

const PROPERTY_TABS = [
    { value: "info", label: "Property info", id: "property-info-tab" },
    { value: "analytics", label: "Analytics", id: "property-analytics-tab" },
] as const;

function OwnedPropertyDetail({
    listing,
    portal,
}: {
    listing: MyListingItem;
    portal: "broker" | "owner";
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab =
        portal === "broker" && searchParams.get("tab") === "analytics" ? "analytics" : "info";
    const [item, setItem] = useState(listing);
    const [busy, setBusy] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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

    const changeTab = (tab: "info" | "analytics") => {
        if (tab === activeTab) return;
        const url = new URL(window.location.href);
        if (tab === "analytics") url.searchParams.set("tab", "analytics");
        else url.searchParams.delete("tab");
        // Next synchronizes native history with useSearchParams. Keep the gallery,
        // local property state and scroll position while adding a Back/Forward entry.
        window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    };

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
            setIsDeleteOpen(false);
            toast.success("Moved to Deleted");
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
                navigation={
                    portal === "broker" ? (
                        <SlidingTabs
                            value={activeTab}
                            options={PROPERTY_TABS}
                            onValueChange={changeTab}
                            label="Property sections"
                            panelId="property-detail-panel"
                            height="var(--size-control-md)"
                        />
                    ) : undefined
                }
                panelLabelId={portal === "broker" ? `property-${activeTab}-tab` : undefined}
                headerMetadata={
                    activeTab === "analytics" ? (
                        <PropertyAnalyticsMetadata propertyId={item.id} listing={item} />
                    ) : undefined
                }
                analytics={
                    activeTab === "analytics" ? (
                        <PropertyAnalyticsContent propertyId={item.id} listing={item} />
                    ) : undefined
                }
                rail={
                    <PropertyActionRail
                        item={item}
                        portal={portal}
                        busy={busy}
                        onTogglePublish={() => void togglePublish()}
                        onRequestDelete={() => setIsDeleteOpen(true)}
                        editHref={editHref}
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
                        onOwnerAttached={() => {
                            void myListingsApi
                                .get(item.id)
                                .then((updated) => {
                                    if (updated) setItem(updated);
                                })
                                .catch(() =>
                                    toast.error(
                                        "Owner attached, but details could not refresh. Reload this page to try again.",
                                    ),
                                );
                        }}
                    />
                }
                mobileAction={
                    portal === "broker" ? (
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
            <PropertyDeleteDialog
                open={isDeleteOpen}
                onOpenChange={(open) => {
                    if (!open && !busy) setIsDeleteOpen(false);
                }}
                title={item.title}
                busy={busy}
                onConfirm={() => void handleDelete()}
            />
        </>
    );
}

function BrowsePropertyFallback({ portal }: { propertyId: string; portal: "broker" | "owner" }) {
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
        <EmptyState
            size="page"
            icon={Building2}
            heading="Property no longer available"
            description="It may have been removed. Open My Listings to choose another property."
            action={{ label: "Open My Listings", icon: Building2, href: BROKER_YOUR_LISTINGS_HREF }}
        />
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
        if (portal === "broker")
            return (
                <EmptyState
                    size="page"
                    variant="error"
                    icon={Building2}
                    heading="Could not load this property"
                    description="Check your connection and try again."
                    action={{
                        label: "Try again",
                        icon: RefreshCw,
                        onClick: () => void query.refetch(),
                        disabled: query.isFetching,
                    }}
                />
            );
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
