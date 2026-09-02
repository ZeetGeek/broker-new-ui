import type { BrowsePropertyCardListing } from "@/components/shared/property-card";

import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
import { formatPropertyTypeLabel } from "@/lib/format/owner-listings-labels";

export function toBrowsePropertyCardListing(item: OwnerListingItem): BrowsePropertyCardListing {
    return {
        id: item.id,
        title: `${item.locality} ${formatPropertyTypeLabel(item.propertyTypeLabel)}`,
        configLabel: item.configLabel,
        propertyTypeLabel: item.propertyTypeLabel,
        areaSqft: item.areaSqft,
        amountInr: item.amountInr,
        isRent: item.isRent,
        imageSrc: item.imageSrc,
        photoCount: item.photoCount,
        isNew: item.isNew,
        bhk: item.bhk,
        locality: item.locality,
        city: item.city,
        brokerSlotsOpen: item.brokerSlotsOpen,
        brokerSlotsTotal: item.brokerSlotsTotal,
        commissionPercent: item.commissionPercent,
        hasRequested: item.hasRequested,
        owner: {
            name: item.ownerName,
            avatarUrl: item.ownerAvatarUrl,
        },
    };
}
