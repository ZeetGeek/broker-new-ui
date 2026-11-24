import { formatRelativePast } from "@/lib/format/date";
import { formatPrice, formatRent } from "@/lib/format/price";

import { stageTitle } from "@/features/pipeline/stage-history";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { type DealStatus, isLiveStage } from "@/features/pipeline/types";
import type {
    FunnelStep,
    OfferInfo,
    Side,
} from "@/features/properties/property-analytics/analytics-math";

/** Offers and closed amounts — not a listing ask, so plain formatting. Rent reads per month. */
export function formatSideAmount(amountInr: number, side: Side): string {
    return side === "rent" ? formatRent(amountInr) : formatPrice(amountInr);
}

/** "₹7 L below asking (8%)", "At asking", "₹2 L above asking (2%)". Null without an ask. */
export function offerGapLabel(offer: OfferInfo): string | null {
    if (offer.gapInr == null || offer.ratio == null) return null;
    const percent = Math.round(Math.abs(offer.ratio - 1) * 100);
    if (percent === 0) return "At asking";
    const direction = offer.gapInr < 0 ? "below" : "above";
    return `${formatPrice(Math.abs(offer.gapInr))} ${direction} asking (${percent}%)`;
}

/**
 * Lower-case relative time for the middle of a sentence: "just now", "3h ago",
 * "yesterday", "4d ago", or "on 12 Nov" once it is a date.
 */
export function agoLabel(date: Date, now: Date): string {
    const relative = formatRelativePast(date, now);
    if (/^\d/.test(relative) && !relative.endsWith("ago")) return `on ${relative}`;
    return relative.charAt(0).toLowerCase() + relative.slice(1);
}

/** Board stage name, or the listing's own word for a closed deal. */
export function statusLabel(status: DealStatus, closedWord: string): string {
    if (isLiveStage(status)) return DEAL_STAGE_META[status].label;
    return status === "closed" ? closedWord : "Lost";
}

/** Dot / bar fill per status. Live stages use the pipeline tokens so colours match the board. */
export function statusDotClass(status: DealStatus): string {
    if (isLiveStage(status)) return DEAL_STAGE_META[status].dotClass;
    return status === "closed" ? "bg-brand" : "bg-ink-subtle/40";
}

/** Same words as the Visits page. */
const VISIT_STATUS_LABEL: Record<string, string> = {
    scheduled: "Scheduled",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "Not attended",
};

export function visitStatusLabel(status: string | null): string | null {
    if (!status) return null;
    return VISIT_STATUS_LABEL[status] ?? null;
}

export function funnelStepLabel(key: FunnelStep["key"], closedWord: string): string {
    switch (key) {
        case "added":
            return DEAL_STAGE_META.new.label;
        case "visited":
            return DEAL_STAGE_META.visit.label;
        case "offered":
            return stageTitle("offer_made");
        case "won":
            return closedWord;
    }
}
