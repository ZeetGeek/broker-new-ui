"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import { representativeApi } from "@/lib/api/representative";
import { brokerOwnerListingDetailHref } from "@/lib/routes/broker";

import { PropertyCard } from "@/components/shared/property-card";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { toBrowsePropertyCardListing } from "@/features/properties/owner-listings/to-browse-property-card";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

export type OwnerListingsGridProps = {
    items: OwnerListingItem[];
    view?: OwnerListingsView;
};

const GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
];

const LIST_BREAKPOINTS = [{ minWidth: 768, columns: 2 }];

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
        <WindowVirtualGrid
            items={items}
            getKey={(item) => item.id}
            estimateRowHeight={isListView ? 268 : 528}
            gap={isListView ? 24 : 24}
            breakpoints={isListView ? LIST_BREAKPOINTS : GRID_BREAKPOINTS}
            ariaLabel="Owner listings"
            renderItem={(item, index) => {
                const listing = toBrowsePropertyCardListing(item);

                return (
                    <PropertyCard
                        variant="browse"
                        layout={view}
                        listing={{
                            ...listing,
                            hasRequested: requestedIds[item.id] ?? listing.hasRequested,
                        }}
                        detailsHref={brokerOwnerListingDetailHref(item.id)}
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
            }}
        />
    );
}
