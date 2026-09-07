import { PROPERTY_TYPE_LABELS } from "@/lib/validation/property";

import type { OwnedPropertyCardListing } from "@/components/shared/property-card";

import type { MyListingItem } from "@/features/properties/your-listings/types";

export function toOwnedPropertyCardListing(item: MyListingItem): OwnedPropertyCardListing {
    const isRent =
        item.transactionType === "rent" ||
        (item.transactionType === "both" && item.saleAmountInr == null);
    const amountInr = isRent
        ? (item.rentAmountInr ?? item.saleAmountInr ?? 0)
        : (item.saleAmountInr ?? item.rentAmountInr ?? 0);

    return {
        id: item.id,
        title: `${item.locality} ${PROPERTY_TYPE_LABELS[item.propertyType] ?? item.propertyTypeLabel}`,
        configLabel: item.configLabel,
        /** Lowercase type key — matches browse cards / residential checks. */
        propertyTypeLabel: item.propertyType,
        areaSqft: item.areaSqft,
        amountInr,
        isRent,
        imageSrc: item.imageSrc,
        imageSrcs: item.imageSrcs,
        photoCount: item.photoCount,
        isNew: false,
        locality: item.locality,
        city: item.city,
        bhk: item.bhk,
        status: item.status,
        inboundRequestCount: item.inboundRequestCount,
        listedDaysAgo: item.listedDaysAgo,
        saleAmountInr: item.saleAmountInr,
        rentAmountInr: item.rentAmountInr,
    };
}
