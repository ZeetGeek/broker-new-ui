import type { PropertyListing } from "@/lib/api/properties";

import { mapBrowseListingToOwnerItem } from "@/features/properties/owner-listings/map-browse-listing";
import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
import { mapPropertyListingToMyItem } from "@/features/properties/your-listings/map-my-listing";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export type SavedProperty =
    | { id: string; source: "owner-listing"; listing: OwnerListingItem }
    | { id: string; source: "your-listing"; listing: MyListingItem };

/**
 * Broker inventory carries edit permission, a private flag, or an exclusive
 * owner. Owner-pool bookmarks do not.
 */
function isCallerInventory(listing: PropertyListing): boolean {
    return (
        listing.permissions?.canEdit === true ||
        listing.visibility === "private" ||
        Boolean(listing.exclusiveOwnerId) ||
        Boolean(listing.exclusiveOwner)
    );
}

export function mapSavedProperty(listing: PropertyListing): SavedProperty {
    if (isCallerInventory(listing)) {
        const item = mapPropertyListingToMyItem({ ...listing, isBookmarked: true });
        return { id: item.id, source: "your-listing", listing: item };
    }

    const item = mapBrowseListingToOwnerItem({ ...listing, isBookmarked: true });
    return { id: item.id, source: "owner-listing", listing: item };
}
