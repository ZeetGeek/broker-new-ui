"use client";

import {
    brokerPropertyDetailHref,
    brokerPropertyEditHref,
} from "@/lib/routes/broker";

import { PropertyCard } from "@/components/shared/property-card";

import {
    MY_LISTINGS_GRID_CLASS,
    MY_LISTINGS_LIST_CLASS,
} from "@/features/properties/your-listings/my-listings-grid-class";
import { toOwnedPropertyCardListing } from "@/features/properties/your-listings/to-owned-property-card";
import type { MyListingItem } from "@/features/properties/your-listings/types";
import type { MyListingsView } from "@/features/properties/your-listings/use-my-listings-view";

export type MyListingsGridProps = {
    items: MyListingItem[];
    view?: MyListingsView;
};

export function MyListingsGrid({ items, view = "grid" }: MyListingsGridProps) {
    const isListView = view === "list";

    return (
        <div className={isListView ? MY_LISTINGS_LIST_CLASS : MY_LISTINGS_GRID_CLASS}>
            {items.map((item, index) => {
                const listing = toOwnedPropertyCardListing(item);

                return (
                    <PropertyCard
                        key={item.id}
                        variant="owned"
                        layout={view}
                        listing={listing}
                        detailsHref={brokerPropertyDetailHref(item.id)}
                        editHref={brokerPropertyEditHref(item.id)}
                        priority={index < 5}
                        imageSizes={
                            isListView
                                ? "(max-width: 768px) 55vw, 320px"
                                : "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                        }
                    />
                );
            })}
        </div>
    );
}
