import { filterOwnerListings } from "@/features/properties/owner-listings/filter-owner-listings";
import { MOCK_OWNER_LISTINGS } from "@/features/properties/owner-listings/mock-owner-listings";
import type {
    OwnerListingsFilterContext,
    OwnerListingsFilters,
    OwnerListingsResult,
} from "@/features/properties/owner-listings/types";

/**
 * Broker owner-listings pool. Mock today — swap the body for apiFetch when the
 * backend endpoint is ready.
 */
export async function fetchOwnerListings(
    filters: OwnerListingsFilters,
    context: OwnerListingsFilterContext = {},
): Promise<OwnerListingsResult> {
    await new Promise((resolve) => setTimeout(resolve, 120));

    return filterOwnerListings(MOCK_OWNER_LISTINGS, filters, context);
}
