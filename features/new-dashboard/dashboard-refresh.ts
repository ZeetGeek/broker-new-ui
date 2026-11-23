import type { QueryClient } from "@tanstack/react-query";

import { VISITS_KEY } from "@/features/new-site-visits/use-visits";

/**
 * Refetch every query the dashboard cards read after something is saved from
 * the dashboard (a client, a deal, a listing, a visit).
 */
export function refreshDashboardQueries(queryClient: QueryClient) {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["broker", "earnings"] }),
        queryClient.invalidateQueries({ queryKey: [...VISITS_KEY, "list"] }),
        queryClient.invalidateQueries({ queryKey: ["my-listings-summary", "broker"] }),
    ]);
}
