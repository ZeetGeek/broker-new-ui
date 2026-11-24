import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Building2, FileText, Search } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

export type MyListingsEmptyProps = {
    variant: "filtered" | "first_run" | "no_deleted" | "no_sold" | "no_draft" | "no_published";
    searchQuery?: string;
    onClearFilters?: () => void;
    onAddProperty?: () => void;
};

export function MyListingsEmpty({
    variant,
    searchQuery,
    onClearFilters,
    onAddProperty,
}: MyListingsEmptyProps) {
    if (variant === "filtered") {
        return (
            <EmptyState
                size="page"
                variant="filtered"
                icon={Search}
                heading="No properties match these filters"
                description={
                    searchQuery?.trim()
                        ? `No results for "${searchQuery.trim()}". Try clearing a filter or searching another locality.`
                        : "Try clearing a filter or searching another locality."
                }
            >
                {onClearFilters ? (
                    <Button variant="accent" onClick={onClearFilters}>
                        Clear filters
                    </Button>
                ) : null}
            </EmptyState>
        );
    }

    if (variant === "no_deleted") {
        return (
            <EmptyState
                icon={Building2}
                heading="No properties in Deleted"
                description="Deleted properties appear here. Restore them when needed, or delete them permanently."
                size="page"
            />
        );
    }

    if (variant === "no_sold") {
        return (
            <EmptyState
                icon={Building2}
                heading="No sold properties yet"
                description="Properties you mark as sold will appear here."
                size="page"
            />
        );
    }

    if (variant === "no_draft") {
        return (
            <EmptyState
                icon={FileText}
                heading="No drafts"
                description="Save a listing as a draft and it will show here until you publish."
                size="page"
            />
        );
    }

    if (variant === "no_published") {
        return (
            <EmptyState
                icon={Building2}
                heading="Nothing published yet"
                description="Publish a draft when it is ready — it will show up here."
                size="page"
            />
        );
    }

    return (
        <EmptyState
            icon={Building2}
            heading="No properties yet"
            description="Add a property, then link a client to start tracking a deal."
            size="page"
        >
            <Button size="md" variant="accent" onClick={onAddProperty}>
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
            size="page"
        >
            <Button size="lg" variant="accent" render={<Link href="/broker/owner-listings" />}>
                Browse Marketplace
            </Button>
        </EmptyState>
    );
}
