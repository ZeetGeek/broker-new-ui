"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { myListingsApi } from "@/lib/api/my-listings";
import { BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";
import { OWNER_PROPERTIES_HREF } from "@/lib/routes/owner";

import { Button } from "@/components/ui/button";

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
    const backLabel = portal === "owner" ? "Back to properties" : "Back to your listings";

    if (query.isPending) {
        return (
            <p role="status" className="body text-ink-muted">
                Loading property…
            </p>
        );
    }
    if (query.isError) {
        return (
            <div role="alert" className="flex flex-col items-start gap-4 py-16">
                <h1 className="h3">Could not load property</h1>
                <p className="body text-ink-muted">
                    Check your connection or account access and try again.
                </p>
                <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
                    Retry
                </Button>
                <Link href={listHref}>{backLabel}</Link>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <h1 className="display-md">Property not found</h1>
                <p className="body text-ink-muted">
                    This listing isn&apos;t in your inventory (or was removed).
                </p>
                <Button
                    className="bg-brand text-surface hover:bg-brand/90"
                    render={<Link href={listHref} />}
                >
                    {backLabel}
                </Button>
            </div>
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
