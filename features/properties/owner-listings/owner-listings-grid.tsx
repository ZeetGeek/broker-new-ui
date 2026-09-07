"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import { representativeApi } from "@/lib/api/representative";

import { PropertyCard } from "@/components/shared/property-card";

import {
    OWNER_LISTINGS_GRID_CLASS,
    OWNER_LISTINGS_LIST_CLASS,
} from "@/features/properties/owner-listings/owner-listings-grid-class";
import { toBrowsePropertyCardListing } from "@/features/properties/owner-listings/to-browse-property-card";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

export type OwnerListingsGridProps = {
    items: OwnerListingItem[];
    view?: OwnerListingsView;
};

export function OwnerListingsGrid({ items, view = "grid" }: OwnerListingsGridProps) {
    const [requestingId, setRequestingId] = useState<string | null>(null);
    const [requestedIds, setRequestedIds] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(
            items.filter((item) => item.hasRequested).map((item) => [item.id, true]),
        ),
    );

    const handleRequest = useCallback(
        async (id: string) => {
            if (requestingId || requestedIds[id]) return;

            setRequestingId(id);
            try {
                await representativeApi.requestRepresentation(id);
                setRequestedIds((prev) => ({ ...prev, [id]: true }));
                toast.success("Representation request sent");
            } catch (error) {
                const message =
                    error instanceof ApiError
                        ? error.message
                        : error instanceof Error
                          ? error.message
                          : "Could not send request";
                toast.error(message);
            } finally {
                setRequestingId(null);
            }
        },
        [requestingId, requestedIds],
    );

    const isListView = view === "list";

    return (
        <div className={isListView ? OWNER_LISTINGS_LIST_CLASS : OWNER_LISTINGS_GRID_CLASS}>
            {items.map((item, index) => {
                const listing = toBrowsePropertyCardListing(item);

                return (
                    <PropertyCard
                        key={item.id}
                        variant="browse"
                        layout={view}
                        listing={{
                            ...listing,
                            hasRequested: requestedIds[item.id] ?? listing.hasRequested,
                        }}
                        detailsHref={`/broker/properties/${item.id}`}
                        priority={index < 5}
                        imageSizes={
                            isListView
                                ? "(max-width: 768px) 55vw, 320px"
                                : "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                        }
                        isRequestPending={requestingId === item.id}
                        onRequest={() => void handleRequest(item.id)}
                    />
                );
            })}
        </div>
    );
}
