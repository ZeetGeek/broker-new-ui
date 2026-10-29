import { propertiesApi, type PropertyListing } from "@/lib/api/properties";
import { type RepresentationItem, representativeApi } from "@/lib/api/representative";
import { collectPropertyPages } from "@/lib/properties/list-criteria";

import { FEATURE_PLATFORM_OWNER } from "@/config";

export type AttachableProperty = {
    id: string;
    title: string;
    city: string;
    isRent: boolean;
    amountInr: number;
    commissionPercent: number | null;
    commissionAmount: number | null;
    isDraft?: boolean;
};

function toNumber(value: string | number | null | undefined): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function mapListing(item: PropertyListing): AttachableProperty {
    const rent = toNumber(item.monthlyRent);
    const sale = toNumber(item.salePrice);
    const isRent =
        item.transactionType === "rent" ||
        (item.transactionType !== "sale" && rent > 0 && sale <= 0);
    return {
        id: item.id,
        title:
            item.title?.trim() ||
            [item.address, item.city].filter(Boolean).join(", ") ||
            "Property",
        city: item.city?.trim() || "",
        isRent,
        amountInr: isRent ? rent : sale,
        commissionPercent: toNumber(item.commissionPercent) || null,
        commissionAmount: toNumber(item.commissionAmount) || null,
        isDraft: item.isDraft === true || item.publishStatus === "draft",
    };
}

function mapRepresentation(item: RepresentationItem): AttachableProperty {
    return mapListing({
        id: item.propertyId,
        title: item.propertyTitle,
        city: item.propertyCity,
        address: item.propertyAddress,
        transactionType: item.propertyTransactionType,
        salePrice: item.propertySalePrice,
        monthlyRent: item.propertyMonthlyRent,
        commissionPercent: item.propertyCommissionPercent,
        commissionAmount: item.propertyCommissionAmount,
    });
}

/** Private CRM linking does not require a public listing. Keep drafts, omit unavailable inventory. */
export async function listAttachableProperties(
    signal?: AbortSignal,
    ownerEnabled = FEATURE_PLATFORM_OWNER,
): Promise<AttachableProperty[]> {
    const [inventory, representations] = await Promise.all([
        collectPropertyPages((page) =>
            propertiesApi.list({ page, limit: 100, excludeSold: true }, signal),
        ),
        ownerEnabled ? representativeApi.brokerList("accepted") : Promise.resolve([]),
    ]);
    const own = inventory
        .filter((item) => item.id && item.status !== "sold" && item.status !== "unavailable")
        .map(mapListing);
    const represented = representations.filter((item) => item.propertyId).map(mapRepresentation);
    // Inventory wins if an API response happens to contain the same property twice.
    return [...new Map([...represented, ...own].map((item) => [item.id, item])).values()];
}
