"use client";

import {
    brokerPropertyDetailHref,
    brokerPropertyEditHref,
} from "@/lib/routes/broker";
import {
    ownerPropertyDetailHref,
    ownerPropertyEditHref,
} from "@/lib/routes/owner";

import { PropertyCard } from "@/components/shared/property-card";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";

import { toOwnedPropertyCardListing } from "@/features/properties/your-listings/to-owned-property-card";
import type { MyListingItem } from "@/features/properties/your-listings/types";
import type { MyListingsView } from "@/features/properties/your-listings/use-my-listings-view";

export type MyListingsGridProps = {
    items: MyListingItem[];
    view?: MyListingsView;
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

const LIST_BREAKPOINTS = [{ minWidth: 768, columns: 2 }];

export function MyListingsGrid({
    items,
    view = "grid",
    portal = "broker",
    onEditListing,
    onAddBuyer,
    onAttachOwner,
    onDeleteListing,
}: MyListingsGridProps) {
    const isListView = view === "list";
    const detailHref = portal === "owner" ? ownerPropertyDetailHref : brokerPropertyDetailHref;
    const editHref = portal === "owner" ? ownerPropertyEditHref : brokerPropertyEditHref;

    return (
        <WindowVirtualGrid
            items={items}
            getKey={(item) => item.id}
            estimateRowHeight={isListView ? 224 : 580}
            gap={24}
            breakpoints={isListView ? LIST_BREAKPOINTS : GRID_BREAKPOINTS}
            ariaLabel="Your listings"
            renderItem={(item, index) => {
                const listing = toOwnedPropertyCardListing(item);

                return (
                    <PropertyCard
                        variant="owned"
                        layout={view}
                        listing={listing}
                        detailsHref={detailHref(item.id)}
                        editHref={editHref(item.id)}
                        onEdit={onEditListing ? () => onEditListing(item) : undefined}
                        onAddBuyer={onAddBuyer ? () => onAddBuyer(item) : undefined}
                        onAttachOwner={onAttachOwner ? () => onAttachOwner(item) : undefined}
                        onDelete={onDeleteListing ? () => onDeleteListing(item) : undefined}
                        priority={index === 0}
                        imageSizes={
                            isListView
                                ? "(max-width: 768px) 55vw, 320px"
                                : "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                        }
                    />
                );
            }}
        />
    );
}
