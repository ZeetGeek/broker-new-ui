import { toLegacyAmountFields } from "@/lib/format/listing-availability";
import { formatPlaceName, formatPropertyTypeLabel } from "@/lib/format/owner-listings-labels";
import { brokerOwnerProfileHref } from "@/lib/routes/broker";

import type { BrowsePropertyCardListing } from "@/components/shared/property-card";

import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

export function toBrowsePropertyCardListing(item: OwnerListingItem): BrowsePropertyCardListing {
    const legacy = toLegacyAmountFields(item);
    const locality = formatPlaceName(item.locality);
    const city = formatPlaceName(item.city);

    return {
        id: item.id,
        title: `${locality} ${formatPropertyTypeLabel(item.propertyTypeLabel)}`,
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
        locality,
        city,
        brokerSlotsOpen: item.brokerSlotsOpen,
        brokerSlotsTotal: item.brokerSlotsTotal,
        commissionPercent: item.commissionPercent,
        commissionAmount: item.commissionAmount,
        hasRequested: item.hasRequested,
        isRepresenting: item.isRepresenting,
        isInvitePending: item.isInvitePending,
        pendingRepresentationId: item.pendingRepresentationId,
        pendingInvitationId: item.pendingInvitationId,
        owner: {
            name: formatPlaceName(item.ownerName),
            avatarUrl: item.ownerAvatarUrl,
            locationLabel: item.ownerLocationLabel
                ? formatPlaceName(item.ownerLocationLabel)
                : undefined,
            profileHref: item.ownerUserId ? brokerOwnerProfileHref(item.ownerUserId) : undefined,
        },
    };
}
