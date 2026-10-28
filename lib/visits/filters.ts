import { addDays, addMonths } from "date-fns";

import { istDateKey } from "@/lib/visits/time";

import type { SlotListFilters } from "@/features/site-visits/broker/model";

export function slotListFiltersFromParams(
    params: Pick<URLSearchParams, "get" | "getAll">,
): SlotListFilters {
    const today = istDateKey(new Date());
    const range = params.get("range") ?? "week";
    const from =
        range === "tomorrow"
            ? istDateKey(addDays(new Date(), 1))
            : range === "custom"
              ? (params.get("from") ?? undefined)
              : today;
    const to =
        range === "today"
            ? today
            : range === "tomorrow"
              ? from
              : range === "custom"
                ? (params.get("to") ?? undefined)
                : range === "month"
                  ? istDateKey(addMonths(new Date(), 1))
                  : istDateKey(addDays(new Date(), 7));
    return {
        from,
        to,
        propertyId: params.get("propertyId") ?? undefined,
        ownerId: params.get("owner") ?? undefined,
        buyerId: params.get("buyer") ?? undefined,
        leadId: params.get("lead") ?? undefined,
        q: params.get("q")?.trim() || undefined,
        cursor: params.get("cursor") ?? undefined,
    };
}
