"use client";

import { PropertyCard } from "@/components/shared/property-card";

import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
import {
    OWNER_LISTINGS_GRID_CLASS,
    OWNER_LISTINGS_LIST_CLASS,
} from "@/features/properties/owner-listings/owner-listings-grid-class";
import { toBrowsePropertyCardListing } from "@/features/properties/owner-listings/to-browse-property-card";
import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

export type OwnerListingsGridProps = {
    items: OwnerListingItem[];
    view?: OwnerListingsView;
};

export function OwnerListingsGrid({ items, view = "grid" }: OwnerListingsGridProps) {
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
                        listing={listing}
                        detailsHref={`/broker/properties/${item.id}`}
                        priority={index < 5}
                        imageSizes={
                            isListView
                                ? "(max-width: 640px) 160px, 224px"
                                : "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                        }
                    />
                );
            })}
        </div>
    );
}
