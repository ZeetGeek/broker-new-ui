import { BROKER_OWNER_LISTINGS_HREF, BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";

import { EmptyStateAction } from "@/components/empty-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Bookmark, Search } from "@/components/shared/icons";

import { FEATURE_PLATFORM_OWNER } from "@/config";

export function SavedPropertiesEmpty() {
    return (
        <EmptyState
            icon={Bookmark}
            heading="No saved properties yet"
            description={
                FEATURE_PLATFORM_OWNER
                    ? "Save a property from Marketplace or My Listings, and it will show up here."
                    : "Save a property from My Listings, and it will show up here."
            }
        >
            <EmptyStateAction
                label={FEATURE_PLATFORM_OWNER ? "Browse Marketplace" : "View My Listings"}
                icon={Search}
                href={
                    FEATURE_PLATFORM_OWNER ? BROKER_OWNER_LISTINGS_HREF : BROKER_YOUR_LISTINGS_HREF
                }
            />
        </EmptyState>
    );
}
