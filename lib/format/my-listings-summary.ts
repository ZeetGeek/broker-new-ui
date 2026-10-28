import type { MyListingsSummary } from "@/lib/api/my-listings";

import type { MyListingsStatusTab } from "@/features/properties/your-listings/types";

function countLabel(count: number, singular: string, plural: string) {
    return `${count} ${count === 1 ? singular : plural}`;
}

export function buildMyListingsSummaryLines({
    summary,
    resultTotal,
    status,
    hasActiveFilters,
}: {
    summary: MyListingsSummary | null;
    resultTotal: number;
    status: MyListingsStatusTab | "";
    hasActiveFilters: boolean;
}): string[] {
    const isDraft = status === "draft";
    const isSold = status === "sold";
    if (hasActiveFilters) {
        const noun = isDraft ? "draft" : isSold ? "sold listing" : "listing";
        return resultTotal === 0
            ? [`No ${noun}s match your filters`, "Try changing or clearing a filter"]
            : [`${countLabel(resultTotal, `${noun} matches`, `${noun}s match`)} your filters`];
    }

    if (isDraft) {
        return resultTotal === 0
            ? ["No drafts waiting to publish", "Add a property to start a new listing"]
            : [
                  `${countLabel(resultTotal, "draft", "drafts")} waiting to publish`,
                  "Finish your property details, then publish when ready",
              ];
    }

    if (isSold) {
        return resultTotal === 0
            ? ["No sold listings yet", "Listings you mark as sold show up here"]
            : [`${countLabel(resultTotal, "listing", "listings")} sold`];
    }

    if (summary?.total === 0 && resultTotal === 0)
        return ["Add your first property to get started"];

    const lines = [
        resultTotal > 0
            ? `${countLabel(resultTotal, "listing is", "listings are")} ${status || "in your inventory"}`
            : `No ${status ? `${status} ` : ""}listings yet`,
    ];
    if (summary && summary.draft > 0)
        lines.push(`${countLabel(summary.draft, "draft", "drafts")} waiting to publish`);
    return lines;
}
