import { daysSince } from "@/lib/api/pipeline";
import { formatPrice, formatRent } from "@/lib/format/price";

import type { DealItem, DealStage } from "@/features/pipeline/types";
import { isLiveStage, SLOW_AFTER_DAYS, STALLED_AFTER_DAYS } from "@/features/pipeline/types";

export type AttentionTone = "healthy" | "slow" | "quiet";

export type OtherBuyer = {
    dealId: string;
    name: string;
    stage: DealStage;
};

export function daysWithoutMovement(deal: DealItem): number {
    return daysSince(deal.lastContactedAt ?? deal.stageEnteredAt) ?? 0;
}

export function daysInStage(deal: DealItem): number {
    return daysSince(deal.stageEnteredAt) ?? 0;
}

export function dealAttention(deal: DealItem): AttentionTone {
    if (!isLiveStage(deal.status)) return "healthy";
    const days = daysWithoutMovement(deal);
    if (days >= STALLED_AFTER_DAYS) return "quiet";
    if (days >= SLOW_AFTER_DAYS) return "slow";
    return "healthy";
}

export type ColumnValue = {
    sale: string | null;
    rent: string | null;
};

export function columnValue(deals: DealItem[]): ColumnValue {
    const sale = deals
        .filter((deal) => !deal.property.isRent)
        .reduce((sum, deal) => sum + deal.property.amountInr, 0);
    const rent = deals
        .filter((deal) => deal.property.isRent)
        .reduce((sum, deal) => sum + deal.property.amountInr, 0);

    return {
        sale: sale > 0 ? formatPrice(sale) : null,
        rent: rent > 0 ? formatRent(rent) : null,
    };
}

export function otherBuyersOnProperty(deal: DealItem, all: DealItem[]): OtherBuyer[] {
    return all.flatMap((item) => {
        if (item.id === deal.id || item.property.id !== deal.property.id) return [];
        if (!isLiveStage(item.status)) return [];
        return [{ dealId: item.id, name: item.buyer.name, stage: item.status }];
    });
}

export function uniqueLocalities(deals: DealItem[]): string[] {
    return [...new Set(deals.map((deal) => deal.property.locality).filter(Boolean))].sort();
}

export function uniqueOwners(deals: DealItem[]): string[] {
    return [...new Set(deals.map((deal) => deal.owner.name).filter(Boolean))].sort();
}
