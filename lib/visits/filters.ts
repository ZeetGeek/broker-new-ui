import { addDays } from "date-fns";

import { istDateKey } from "@/lib/visits/time";

import type { SlotListFilters } from "@/features/site-visits/broker/model";

export function slotListFiltersFromParams(params: Pick<URLSearchParams, "get" | "getAll">): SlotListFilters {
    const today = istDateKey(new Date());
    const range = params.get("range") ?? "week";
    const from = range === "tomorrow" ? istDateKey(addDays(new Date(), 1)) : range === "custom" ? params.get("from") ?? undefined : today;
    const to = range === "today" ? today : range === "tomorrow" ? from : range === "custom" ? params.get("to") ?? undefined : istDateKey(addDays(new Date(), 7));
    const minBudget = Number(params.get("minBudget"));
    const maxBudget = Number(params.get("maxBudget"));
    return {
        from,
        to,
        localities: params.getAll("locality"),
        purpose: params.get("purpose") === "sale" || params.get("purpose") === "rent" ? params.get("purpose") as "sale" | "rent" : undefined,
        propertyType: params.get("type") ?? undefined,
        bhk: params.get("bhk") ?? undefined,
        minBudget: Number.isFinite(minBudget) && minBudget > 0 ? minBudget : undefined,
        maxBudget: Number.isFinite(maxBudget) && maxBudget > 0 ? maxBudget : undefined,
        timeBuckets: params.getAll("time"),
        ownerId: params.get("owner") ?? undefined,
        buyerId: params.get("buyer") ?? undefined,
        q: params.get("q")?.trim() || undefined,
        cursor: params.get("cursor") ?? undefined,
    };
}
