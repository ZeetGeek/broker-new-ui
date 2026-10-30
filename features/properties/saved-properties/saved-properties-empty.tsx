import Link from "next/link";

import { BROKER_OWNER_LISTINGS_HREF, BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { Bookmark } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

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
            <Button
                size="lg"
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                render={
                    <Link
                        href={
                            FEATURE_PLATFORM_OWNER
                                ? BROKER_OWNER_LISTINGS_HREF
                                : BROKER_YOUR_LISTINGS_HREF
                        }
                    />
                }
            >
                {FEATURE_PLATFORM_OWNER ? "Browse Marketplace" : "View My Listings"}
            </Button>
        </EmptyState>
    );
}
