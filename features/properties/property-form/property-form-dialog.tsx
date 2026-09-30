"use client";

import { PropertyForm } from "@/features/properties/property-form";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export type PropertyFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    portal?: "broker" | "owner";
    /** Pass a listing to edit it; omit to add a new property. */
    listing?: MyListingItem | null;
    /** Called after a successful save so the caller can refresh its list. */
    onSaved?: (listing: MyListingItem) => void;
};

export function PropertyFormDialog({
    open,
    onOpenChange,
    portal = "broker",
    listing,
    onSaved,
}: PropertyFormDialogProps) {
    const mode = listing ? "edit" : "create";

    return (
        <PropertyForm
            // Remount per listing so the form never opens holding the previous
            // property's values.
            key={`${mode}-${listing?.id ?? "new"}-${open ? "open" : "closed"}`}
            mode={mode}
            portal={portal}
            propertyId={listing?.id}
            initialListing={listing}
            variant="dialog"
            open={open}
            onOpenChange={onOpenChange}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
        />
    );
}
