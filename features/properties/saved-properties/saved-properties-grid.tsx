"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import { findPendingBrokerRepresentationId, representativeApi } from "@/lib/api/representative";
import { brokerOwnerListingDetailHref, brokerPropertyDetailHref } from "@/lib/routes/broker";

import { PropertyCard } from "@/components/shared/property-card";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { toBrowsePropertyCardListing } from "@/features/properties/owner-listings/to-browse-property-card";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
import type { SavedProperty } from "@/features/properties/saved-properties/map-saved-property";
import { toOwnedPropertyCardListing } from "@/features/properties/your-listings/to-owned-property-card";

const GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
];

type RequestOverride = string | false | true;

function mutationErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return fallback;
}

export function SavedPropertiesGrid({
    items,
    onUnsave,
}: {
    items: SavedProperty[];
    onUnsave: (id: string) => void;
}) {
    const [busyId, setBusyId] = useState<string | null>(null);
    const [requestOverrides, setRequestOverrides] = useState<Record<string, RequestOverride>>({});

    const representationIdFor = useCallback(
        (item: OwnerListingItem): string | undefined => {
            const override = requestOverrides[item.id];
            if (override === false) return undefined;
            if (typeof override === "string") return override;
            return item.pendingRepresentationId;
        },
        [requestOverrides],
    );

    const hasRequested = useCallback(
        (item: OwnerListingItem): boolean => {
            const override = requestOverrides[item.id];
            if (override === false) return false;
            if (override === true || typeof override === "string") return true;
            return item.hasRequested;
        },
        [requestOverrides],
    );

    const handleRequest = useCallback(
        async (item: OwnerListingItem) => {
            if (busyId || hasRequested(item) || item.isRepresenting || item.isInvitePending) return;

            setBusyId(item.id);
            try {
                const representation = await representativeApi.requestRepresentation(item.id);
                setRequestOverrides((prev) => ({
                    ...prev,
                    [item.id]: representation.id || true,
                }));
                toast.success("Request sent. The owner will be notified.");
            } catch (error) {
                toast.error(mutationErrorMessage(error, "Could not send request"));
            } finally {
                setBusyId(null);
            }
        },
        [busyId, hasRequested],
    );

    const handleCancelRequest = useCallback(
        async (item: OwnerListingItem) => {
            if (busyId || !hasRequested(item)) return;

            setBusyId(item.id);
            try {
                let representationId = representationIdFor(item);
                if (!representationId) {
                    representationId = await findPendingBrokerRepresentationId(item.id);
                }
                if (!representationId) {
                    toast.error("Could not cancel request");
                    return;
                }
                await representativeApi.withdraw(representationId);
                setRequestOverrides((prev) => ({ ...prev, [item.id]: false }));
                toast.success("Request cancelled");
            } catch (error) {
                toast.error(mutationErrorMessage(error, "Could not cancel request"));
            } finally {
                setBusyId(null);
            }
        },
        [busyId, hasRequested, representationIdFor],
    );

    return (
        <WindowVirtualGrid
            items={items}
            getKey={(item) => item.id}
            estimateRowHeight={520}
            gap={24}
            breakpoints={GRID_BREAKPOINTS}
            ariaLabel="Saved properties"
            renderItem={(item, index) => {
                if (item.source === "your-listing") {
                    return (
                        <PropertyCard
                            variant="owned"
                            listing={toOwnedPropertyCardListing(item.listing)}
                            detailsHref={brokerPropertyDetailHref(item.id)}
                            priority={index === 0}
                            imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                            isSaved
                            onToggleSave={() => onUnsave(item.id)}
                        />
                    );
                }

                const listing = toBrowsePropertyCardListing(item.listing);
                const requested = hasRequested(item.listing);
                const canAsk =
                    !item.listing.isRepresenting && !requested && !item.listing.isInvitePending;

                return (
                    <PropertyCard
                        variant="browse"
                        listing={{
                            ...listing,
                            hasRequested: requested,
                            pendingRepresentationId: representationIdFor(item.listing),
                        }}
                        detailsHref={brokerOwnerListingDetailHref(item.id)}
                        priority={index === 0}
                        imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                        isRequestPending={busyId === item.id}
                        onRequest={canAsk ? () => void handleRequest(item.listing) : undefined}
                        onCancelRequest={
                            requested ? () => void handleCancelRequest(item.listing) : undefined
                        }
                        isSaved
                        onToggleSave={() => onUnsave(item.id)}
                    />
                );
            }}
        />
    );
}
