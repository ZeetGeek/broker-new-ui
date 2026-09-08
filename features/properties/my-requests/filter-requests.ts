import {
    EXPIRING_SOON_DAYS,
    type RequestItem,
    type RequestsCounts,
    type RequestsFilters,
    type RequestsSummary,
} from "@/features/properties/my-requests/types";

/** Approved but no client attached — the broker still has work to do. */
export function needsFollowUp(item: RequestItem): boolean {
    return item.stage === "approved" && item.clientsAttached === 0;
}

/** Pending and close enough to expiry that the broker should nudge. */
export function isExpiringSoon(item: RequestItem): boolean {
    return (
        item.stage === "pending" &&
        item.daysToExpiry !== null &&
        item.daysToExpiry <= EXPIRING_SOON_DAYS
    );
}

/** Pending and the owner has not opened it yet. */
export function isUnseen(item: RequestItem): boolean {
    return item.stage === "pending" && !item.ownerSeen;
}

function matchesQuery(item: RequestItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return [item.title, item.locality, item.city, item.ownerName, item.propertyTypeLabel].some(
        (field) => field.toLowerCase().includes(needle),
    );
}

function matchesView(item: RequestItem, view: RequestsFilters["view"]): boolean {
    switch (view) {
        case "all":
            return true;
        case "needs_buyer":
            return needsFollowUp(item);
        case "closing_soon":
            return isExpiringSoon(item);
        case "not_opened":
            return isUnseen(item);
        default:
            return item.stage === view;
    }
}

export function filterRequests(items: RequestItem[], filters: RequestsFilters): RequestItem[] {
    return items.filter((item) => matchesView(item, filters.view) && matchesQuery(item, filters.q));
}

function toTime(iso: string | null): number {
    return iso ? new Date(iso).getTime() : 0;
}

export function sortRequests(items: RequestItem[], sort: RequestsFilters["sort"]): RequestItem[] {
    const sorted = [...items];

    switch (sort) {
        case "oldest":
            return sorted.sort((a, b) => toTime(a.requestedAt) - toTime(b.requestedAt));
        case "waiting_longest":
            return sorted.sort((a, b) => b.daysWaiting - a.daysWaiting);
        case "price_desc":
            return sorted.sort((a, b) => b.amountInr - a.amountInr);
        case "price_asc":
            return sorted.sort((a, b) => a.amountInr - b.amountInr);
        default:
            return sorted.sort((a, b) => toTime(b.requestedAt) - toTime(a.requestedAt));
    }
}

export function countRequestsByStage(items: RequestItem[]): RequestsCounts {
    const counts: RequestsCounts = {
        all: items.length,
        pending: 0,
        approved: 0,
        declined: 0,
        expired: 0,
        withdrawn: 0,
    };

    for (const item of items) {
        counts[item.stage] += 1;
    }

    return counts;
}

/** Days between the request being sent and the owner deciding. */
function responseDays(item: RequestItem): number {
    if (!item.resolvedAt) return 0;
    const ms = toTime(item.resolvedAt) - toTime(item.requestedAt);
    return Math.max(0, Math.round(ms / 86_400_000));
}

export function summarizeRequests(
    items: RequestItem[],
    quota: RequestsSummary["quota"],
): RequestsSummary {
    const counts = countRequestsByStage(items);

    // Expired requests are the owner never answering, not a decision — they
    // would drag the approval rate down for something the owner never did.
    const decided = items.filter((item) => item.stage === "approved" || item.stage === "declined");
    const approvalRate =
        decided.length === 0 ? 0 : Math.round((counts.approved / decided.length) * 100);

    const avgResponseDays =
        decided.length === 0
            ? 0
            : Math.round(
                  (decided.reduce((total, item) => total + responseDays(item), 0) /
                      decided.length) *
                      10,
              ) / 10;

    return {
        counts,
        approvalRate,
        avgResponseDays,
        needsFollowUpCount: items.filter(needsFollowUp).length,
        unseenCount: items.filter(isUnseen).length,
        expiringSoonCount: items.filter(isExpiringSoon).length,
        quota,
    };
}
