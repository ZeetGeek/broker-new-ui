"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { myListingsApi } from "@/lib/api/my-listings";
import { propertiesApi } from "@/lib/api/properties";
import { collectPropertyPages } from "@/lib/properties/list-criteria";

import toast from "@/components/shared/app-toast";
import { mapMyListingToPicker } from "@/components/shared/map-to-property-picker-property";
import { PropertyPicker } from "@/components/shared/property-picker";

import type { OwnerRow } from "@/features/contacts/types";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export function AttachOwnerToListingModal({
    open,
    onOpenChange,
    owner,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    owner: OwnerRow;
    onSaved: () => void;
}) {
    const [listings, setListings] = useState<MyListingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [retryVersion, setRetryVersion] = useState(0);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setLoading(true);
            setLoadError(false);
            setListings([]);
            void collectPropertyPages((page) => myListingsApi.list({ page }, controller.signal))
                .then((items) => {
                    if (!controller.signal.aborted) setListings(items);
                })
                .catch(() => {
                    if (!controller.signal.aborted) setLoadError(true);
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        }, 0);
        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [open, retryVersion]);

    const pickerProperties = useMemo(
        () =>
            listings.map((listing) => ({
                ...mapMyListingToPicker(listing),
                statusChips: listing.exclusiveOwnerId
                    ? [
                          {
                              label:
                                  listing.exclusiveOwnerId === owner.id
                                      ? "Already attached"
                                      : "Has another owner",
                              color: "stone" as const,
                          },
                      ]
                    : undefined,
            })),
        [listings, owner.id],
    );

    const attach = useCallback(
        (selectedId: string | null) => {
            if (!selectedId || busy || loading || loadError) return;
            setBusy(true);
            void propertiesApi
                .attachExclusiveOwner(selectedId, owner.id)
                .then(() => {
                    toast.success(`Attached ${owner.name} to listing`);
                    onSaved();
                    onOpenChange(false);
                })
                .catch((error) => {
                    toast.error(
                        error instanceof Error ? error.message : "Couldn't attach owner to listing",
                    );
                })
                .finally(() => setBusy(false));
        },
        [busy, loading, loadError, onOpenChange, onSaved, owner.id, owner.name],
    );

    return (
        <PropertyPicker
            open={open}
            onOpenChange={(next) => {
                if (!busy) onOpenChange(next);
            }}
            title="Attach to listing"
            description={`Pick one of your listings to link ${owner.name} as the exclusive owner.`}
            properties={pickerProperties}
            value={null}
            onConfirm={attach}
            commitOnSelect={false}
            closeOnConfirm={false}
            confirmLabel={busy ? "Attaching…" : "Attach to listing"}
            confirmDisabled={busy || loading || loadError}
            loading={loading}
            errorText={loadError ? "Couldn't load your listings. Try again." : undefined}
            onRetry={() => setRetryVersion((current) => current + 1)}
            emptyHeading="No listings yet"
            emptyDescription="Add a property in My Listings first, then attach this owner."
        />
    );
}
