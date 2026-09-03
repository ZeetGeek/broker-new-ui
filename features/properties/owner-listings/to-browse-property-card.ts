import type { BrowsePropertyCardListing } from "@/components/shared/property-card";

import type { OwnerListingItem } from "@/features/properties/owner-listings/types";
import { formatPropertyTypeLabel } from "@/lib/format/owner-listings-labels";
import { toLegacyAmountFields } from "@/lib/format/listing-availability";

export function toBrowsePropertyCardListing(item: OwnerListingItem): BrowsePropertyCardListing {
    const legacy = toLegacyAmountFields(item);

    return {
        id: item.id,
        title: `${item.locality} ${formatPropertyTypeLabel(item.propertyTypeLabel)}`,
        configLabel: item.configLabel,
        propertyTypeLabel: item.propertyTypeLabel,
        areaSqft: item.areaSqft,
        amountInr: legacy.amountInr,
        isRent: legacy.isRent,
        saleAmountInr: item.saleAmountInr,
        rentAmountInr: item.rentAmountInr,
        imageSrc: item.imageSrc,
        imageSrcs: item.imageSrcs,
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
