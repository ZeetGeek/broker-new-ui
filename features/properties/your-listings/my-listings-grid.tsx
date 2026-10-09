"use client";

import { brokerPropertyDetailHref, brokerPropertyEditHref } from "@/lib/routes/broker";
import { ownerPropertyDetailHref, ownerPropertyEditHref } from "@/lib/routes/owner";

import { PropertyCard } from "@/components/shared/property-card";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { toOwnedPropertyCardListing } from "@/features/properties/your-listings/to-owned-property-card";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export type MyListingsGridProps = {
    items: MyListingItem[];
    /** Owner inventory uses `/owner/properties/*` instead of broker routes. */
    portal?: "broker" | "owner";
    /** When set, "Edit property" opens a modal instead of the edit route. */
    onEditListing?: (listing: MyListingItem) => void;
    /** When set, each card offers "Add buyer" for that listing. */
    onAddBuyer?: (listing: MyListingItem) => void;
    /** When set, each card offers "Attach owner" for that listing. */
    onAttachOwner?: (listing: MyListingItem) => void;
    /** When set, each card offers delete (caller shows confirm). */
    onDeleteListing?: (listing: MyListingItem) => void;
};

const GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
];

export function MyListingsGrid({
    items,
    portal = "broker",
    onEditListing,
    onAddBuyer,
    onAttachOwner,
    onDeleteListing,
}: MyListingsGridProps) {
    const detailHref = portal === "owner" ? ownerPropertyDetailHref : brokerPropertyDetailHref;
    const editHref = portal === "owner" ? ownerPropertyEditHref : brokerPropertyEditHref;

    return (
        <WindowVirtualGrid
            items={items}
            getKey={(item) => item.id}
            estimateRowHeight={520}
            gap={24}
            breakpoints={GRID_BREAKPOINTS}
            ariaLabel="Your listings"
            renderItem={(item, index) => {
                const listing = toOwnedPropertyCardListing(item);

                return (
                    <PropertyCard
                        variant="owned"
                        listing={listing}
                        detailsHref={detailHref(item.id)}
                        editHref={editHref(item.id)}
                        onEdit={onEditListing ? () => onEditListing(item) : undefined}
                        onAddBuyer={onAddBuyer ? () => onAddBuyer(item) : undefined}
                        onAttachOwner={onAttachOwner ? () => onAttachOwner(item) : undefined}
                        onDelete={onDeleteListing ? () => onDeleteListing(item) : undefined}
                        priority={index === 0}
                        imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                    />
                );
            }}
        />
    );
}
