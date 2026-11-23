"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { type AttachableProperty, listAttachableProperties } from "@/lib/api/attachable-properties";
import { clientsApi } from "@/lib/api/clients";

import toast from "@/components/shared/app-toast";
import { mapAttachablePropertyToPicker } from "@/components/shared/map-to-property-picker-property";
import { PropertyPicker } from "@/components/shared/property-picker";

import type { BuyerRow } from "@/features/contacts/types";

/** Minimal buyer shape — works after create before the list row is refetched. */
export type AttachBuyerTarget = {
    id: string;
    name: string;
    attachedProperties?: BuyerRow["attachedProperties"];
};

export function AttachBuyerPropertiesModal({
    open,
    onOpenChange,
    buyer,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buyer: AttachBuyerTarget;
    onSaved: () => void;
}) {
    const [properties, setProperties] = useState<AttachableProperty[]>([]);
    const [attachedIds, setAttachedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [retryVersion, setRetryVersion] = useState(0);
    const [pickerKey, setPickerKey] = useState(0);

    useEffect(() => {
        if (!open) return undefined;

        let cancelled = false;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setIsLoading(true);
            setLoadError(false);
            setProperties([]);
            const already = (buyer.attachedProperties ?? []).map((item) => item.id);
            setAttachedIds(already);

            void listAttachableProperties(controller.signal)
                .then((rows) => {
                    if (cancelled) return;
                    setProperties(rows);
                    setPickerKey((value) => value + 1);
                })
                .catch(() => {
                    if (cancelled) return;
                    setLoadError(true);
                    setProperties([]);
                })
                .finally(() => {
                    if (!cancelled) setIsLoading(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [buyer.id, buyer.attachedProperties, open, retryVersion]);

    const unlinked = useMemo(
        () => properties.filter((property) => !attachedIds.includes(property.id)),
        [properties, attachedIds],
    );

    const pickerProperties = useMemo(() => unlinked.map(mapAttachablePropertyToPicker), [unlinked]);

    const handleSave = useCallback(
        (ids: string[]) => {
            if (isLoading || isSaving || loadError) return;
            const toAttach = ids.filter((id) => !attachedIds.includes(id));
            if (toAttach.length === 0) {
                onOpenChange(false);
                return;
            }

            setIsSaving(true);
            void clientsApi
                .attachClientToProperties(buyer.id, toAttach)
                .then(() => {
                    toast.success(
                        toAttach.length === 1
                            ? "Client linked to the property."
                            : `Client linked to ${toAttach.length} properties.`,
                    );
                    onSaved();
                    onOpenChange(false);
                })
                .catch((error) => {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "Could not link properties. Try again.",
                    );
                })
                .finally(() => setIsSaving(false));
        },
        [attachedIds, buyer.id, onOpenChange, onSaved, isLoading, isSaving, loadError],
    );

    const linkedCount = attachedIds.length;
    const description =
        linkedCount > 0
            ? `Choose more properties to link to ${buyer.name}. ${linkedCount} already linked — those stay.`
            : `Choose properties to link to ${buyer.name}.`;

    return (
        <PropertyPicker
            key={pickerKey}
            open={open}
            onOpenChange={(next) => {
                if (!isSaving) onOpenChange(next);
            }}
            multiple
            properties={pickerProperties}
            value={[]}
            onConfirm={handleSave}
            title="Attach properties"
            description={description}
            confirmLabel={isSaving ? "Saving…" : "Save links"}
            confirmDisabled={isLoading || isSaving || loadError}
            closeOnConfirm={false}
            loading={isLoading}
            errorText={loadError ? "Could not load properties. Try again." : undefined}
            onRetry={() => setRetryVersion((value) => value + 1)}
            emptyHeading="No available properties yet"
            emptyDescription={
                linkedCount > 0
                    ? "This client is already linked to every listing you can attach."
                    : "Add a property to My Listings, then link this client here."
            }
            filteredEmptyHeading="No properties match your search"
            filteredEmptyDescription="Try a different title, locality or city."
            searchPlaceholder="Search by title, locality or city"
        />
    );
}
