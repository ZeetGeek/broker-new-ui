"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { myListingsApi } from "@/lib/api/my-listings";
import { BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";
import { OWNER_PROPERTIES_HREF } from "@/lib/routes/owner";

import { EmptyState, EmptyStateAction } from "@/components/empty-state";
import { AlertCircle, Building2, RefreshCw } from "@/components/shared/icons";

import { PropertyForm } from "@/features/properties/property-form";

export function PropertyEditPage({ portal = "broker" }: { portal?: "broker" | "owner" }) {
    const params = useParams<{ id: string }>();
    const propertyId = params.id;
    const query = useQuery({
        queryKey: ["edit-property", portal, propertyId],
        queryFn: () => myListingsApi.get(propertyId),
        staleTime: 0,
    });
    const listing = query.data;
    const listHref = portal === "owner" ? OWNER_PROPERTIES_HREF : BROKER_YOUR_LISTINGS_HREF;
    const backLabel = portal === "owner" ? "Back to properties" : "Back to My Listings";

    if (query.isPending) {
        return (
            <p role="status" className="body text-ink-muted">
                Loading property…
            </p>
        );
    }
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
            <EmptyState
                size="card"
                icon={AlertCircle}
                heading="Could not load property"
                variant="error"
                description="Check your connection or account access and try again."
            >
                <EmptyStateAction
                    label="Retry"
                    icon={RefreshCw}
                    onClick={() => void query.refetch()}
                    disabled={query.isFetching}
                />
                <Link href={listHref}>{backLabel}</Link>
            </EmptyState>
        );
    }

    if (!listing) {
        if (portal === "broker")
            return (
                <EmptyState
                    size="page"
                    icon={Building2}
                    heading="Property no longer available"
                    description="It may have been removed. Open My Listings to choose another property."
                    action={{
                        label: "Open My Listings",
                        icon: Building2,
                        href: BROKER_YOUR_LISTINGS_HREF,
                    }}
                />
            );
        return (
            <EmptyState
                size="card"
                icon={Building2}
                heading="Property not found"
                description="This listing isn't in your inventory (or was removed)."
            >
                <EmptyStateAction label={backLabel} icon={Building2} href={listHref} />
            </EmptyState>
        );
    }

    return (
        <div className="py-2">
            <PropertyForm
                mode="edit"
                portal={portal}
                propertyId={listing.id}
                initialListing={listing}
            />
        </div>
    );
}
