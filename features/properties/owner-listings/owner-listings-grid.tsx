"use client";

import { useCallback, useState } from "react";

import { PropertyCard } from "@/components/shared/property-card";

import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
import { OWNER_LISTINGS_GRID_CLASS } from "@/features/properties/owner-listings/owner-listings-grid-class";
import { toBrowsePropertyCardListing } from "@/features/properties/owner-listings/to-browse-property-card";

export type OwnerListingsGridProps = {
    items: OwnerListingItem[];
};

export function OwnerListingsGrid({ items }: OwnerListingsGridProps) {
    const [requestingId, setRequestingId] = useState<string | null>(null);
    const [requestedIds, setRequestedIds] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(items.filter((item) => item.hasRequested).map((item) => [item.id, true])),
    );

    const handleRequest = useCallback((id: string) => {
        setRequestingId(id);
        window.setTimeout(() => {
            setRequestedIds((prev) => ({ ...prev, [id]: true }));
            setRequestingId(null);
        }, 600);
    }, []);

    return (
        <div className={OWNER_LISTINGS_GRID_CLASS}>
            {items.map((item, index) => {
                const listing = toBrowsePropertyCardListing(item);

                return (
                    <PropertyCard
                        key={item.id}
                        variant="browse"
                        listing={{
                            ...listing,
                            hasRequested: requestedIds[item.id] ?? listing.hasRequested,
                        }}
                        detailsHref={`/broker/properties/${item.id}`}
                        priority={index < 5}
                        imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                        isRequestPending={requestingId === item.id}
                        onRequest={() => handleRequest(item.id)}
                    />
                );
            })}
        </div>
    );
}
