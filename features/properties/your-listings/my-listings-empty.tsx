import { Building2, Search } from "lucide-react";
import Link from "next/link";

import { BROKER_PROPERTIES_NEW_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export type MyListingsEmptyProps = {
    variant: "filtered" | "first_run";
    searchQuery?: string;
    onClearFilters?: () => void;
};

export function MyListingsEmpty({ variant, searchQuery, onClearFilters }: MyListingsEmptyProps) {
    if (variant === "filtered") {
        return (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">No properties match these filters</p>
                <p className="body-sm max-w-prose text-ink-muted">
                    {searchQuery?.trim()
                        ? `No results for "${searchQuery.trim()}". Try clearing a filter or searching another locality.`
                        : "Try clearing a filter or searching another locality."}
                </p>
                {onClearFilters ? (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="
                          body-sm font-semibold text-brand underline-offset-4
                          hover:underline
                        "
                    >
                        Clear filters
                    </button>
                ) : null}
            </div>
        );
    }

    return (
        <EmptyState
            icon={Building2}
            heading="No properties yet"
            description="Add your first property — it takes about 2 minutes."
        >
            <Button
                size="lg"
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                render={<Link href={BROKER_PROPERTIES_NEW_HREF} />}
            >
                Add property
            </Button>
        </EmptyState>
    );
}

export function MyListingsRequestsEmpty() {
    return (
        <EmptyState
            icon={Search}
            heading="No requests sent yet"
            description="Find a property you'd like to sell and ask the owner."
        >
            <Button
                size="lg"
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                render={<Link href="/broker/owner-listings" />}
            >
                Browse owner listings
            </Button>
        </EmptyState>
    );
}
