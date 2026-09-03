import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

export type QuickChipKey = "yourAreas" | "newToday" | "slotsOpen" | "commissionSet" | "readyToMove";

export type QuickChipCounts = Record<QuickChipKey, number>;

export function buildQuickChipCounts(
    items: OwnerListingItem[],
    serviceAreas: string[],
): QuickChipCounts {
    const areaSet = new Set(serviceAreas);

    return {
        yourAreas:
            serviceAreas.length === 0
                ? 0
                : items.filter((item) => areaSet.has(item.locality) || areaSet.has(item.city))
                      .length,
        newToday: items.filter((item) => item.isNew).length,
        slotsOpen: items.filter((item) => item.brokerSlotsOpen > 0).length,
        commissionSet: items.filter((item) => item.commissionPercent > 0).length,
        readyToMove: items.filter((item) => item.readyToMove).length,
    };
}
