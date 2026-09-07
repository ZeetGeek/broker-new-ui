"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { myListingsApi } from "@/lib/api/my-listings";
import { BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";

import { Button } from "@/components/ui/button";

import { PropertyForm } from "@/features/properties/property-form";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export function PropertyEditPage() {
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
            <div className="flex flex-col gap-4 py-6">
                <div className="animate-pulse rounded-control bg-surface-muted block-8 inline-48" />
                <div className="animate-pulse rounded-card bg-surface-muted block-64" />
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
                    className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                    render={<Link href={BROKER_YOUR_LISTINGS_HREF} />}
                >
                    Back to your listings
                </Button>
            </div>
        );
    }

    return (
        <div className="py-2">
            <PropertyForm mode="edit" propertyId={listing.id} initialListing={listing} />
        </div>
    );
}
