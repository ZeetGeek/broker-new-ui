import type { OwnerListingItem } from "@/features/properties/owner-listings/types";

const HOURS_IN_WEEK = 7 * 24;

export function countNewListingsInServiceAreasThisWeek(
    items: OwnerListingItem[],
    serviceAreas: string[],
): number {
    if (serviceAreas.length === 0) {
        return 0;
    }

    const areaSet = new Set(serviceAreas);

    return items.filter(
        (item) => areaSet.has(item.locality) && item.listedHoursAgo < HOURS_IN_WEEK,
    ).length;
}

export function formatNewInAreasThisWeekLine(
    count: number,
    serviceAreas: string[],
): string | null {
    if (count === 0 || serviceAreas.length === 0) {
        return null;
    }

    const areasLabel =
        serviceAreas.length === 1
            ? serviceAreas[0]!
            : serviceAreas.length === 2
              ? serviceAreas.join(", ")
              : "your areas";

    return `${count} new in ${areasLabel} this week`;
}
