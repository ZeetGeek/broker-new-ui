import type {
    InviteItem,
    InvitesCounts,
    InvitesFilters,
    InvitesSummary,
} from "@/features/properties/my-requests/invite-types";

function matchesQuery(item: InviteItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return [item.title, item.locality, item.city, item.ownerName, item.propertyTypeLabel].some(
        (field) => field.toLowerCase().includes(needle),
    );
}

function matchesType(isRent: boolean, type: InvitesFilters["type"]): boolean {
    if (!type) return true;
    return type === "rent" ? isRent : !isRent;
}

export function filterInvites(items: InviteItem[], filters: InvitesFilters): InviteItem[] {
    return items.filter(
        (item) =>
            (filters.stage === "all" || item.stage === filters.stage) &&
            matchesQuery(item, filters.q) &&
            matchesType(item.isRent, filters.type),
    );
}

function toTime(iso: string | null): number {
    return iso ? new Date(iso).getTime() : 0;
}

export function sortInvites(items: InviteItem[], sort: InvitesFilters["sort"]): InviteItem[] {
    const sorted = [...items];

    switch (sort) {
        case "oldest":
            return sorted.sort((a, b) => toTime(a.invitedAt) - toTime(b.invitedAt));
        case "price_desc":
            return sorted.sort((a, b) => b.amountInr - a.amountInr);
        case "price_asc":
            return sorted.sort((a, b) => a.amountInr - b.amountInr);
        default:
            return sorted.sort((a, b) => toTime(b.invitedAt) - toTime(a.invitedAt));
    }
}

export function countInvitesByStage(items: InviteItem[]): InvitesCounts {
    const counts: InvitesCounts = {
        all: items.length,
        pending: 0,
        accepted: 0,
        declined: 0,
        expired: 0,
    };

    for (const item of items) {
        counts[item.stage] += 1;
    }

    return counts;
}

export function summarizeInvites(items: InviteItem[]): InvitesSummary {
    const counts = countInvitesByStage(items);
    return { counts, waitingOnYouCount: counts.pending };
}
