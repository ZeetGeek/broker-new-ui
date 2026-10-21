import Link from "next/link";

import { Bookmark } from "@/components/shared/icons";

import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export function SavedPropertiesEmpty() {
    return (
        <EmptyState
            icon={Bookmark}
            heading="No saved properties yet"
            description="Save a property from Owner listings or Your listings, and it will show up here."
        >
            <Button
                size="lg"
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
            >
                Browse owner listings
            </Button>
        </EmptyState>
    );
}
