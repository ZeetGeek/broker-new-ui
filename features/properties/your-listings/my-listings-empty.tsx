import { EmptyStateCard as ListingsEmptyCard } from "@/components/shared/empty-state-card";
import { Building2, CheckCircle2, FileText, Plus, Search, Trash2 } from "@/components/shared/icons";

import type { MyListingsStatusTab } from "@/features/properties/your-listings/types";

export type MyListingsEmptyProps = {
    variant: "filtered" | "first_run" | "no_deleted" | "no_sold" | "no_draft" | "no_published";
    status?: MyListingsStatusTab | "";
    searchQuery?: string;
    onClearFilters?: () => void;
    onAddProperty?: () => void;
};

export function MyListingsEmpty({
    variant,
    status,
    searchQuery,
    onClearFilters,
    onAddProperty,
}: MyListingsEmptyProps) {
    const addPropertyAction = onAddProperty
        ? { label: "Add property", icon: Plus, onClick: onAddProperty }
        : undefined;

    if (variant === "filtered") {
        const subject =
            status === "published"
                ? "published listings"
                : status === "draft"
                  ? "draft listings"
                  : status === "sold"
                    ? "sold properties"
                    : status === "deleted"
                      ? "deleted properties"
                      : "properties";
        return (
            <ListingsEmptyCard
                variant="filtered"
                icon={Search}
                heading={`No ${subject} match these filters`}
                description={
                    searchQuery?.trim()
                        ? `No results for "${searchQuery.trim()}" in this view. Try another search or clear your filters.`
                        : "Try changing your filters, or clear them to see all properties in this view."
                }
                action={
                    onClearFilters
                        ? { label: "Clear filters", icon: Search, onClick: onClearFilters }
                        : undefined
                }
            />
        );
    }

    if (variant === "no_deleted") {
        return (
            <ListingsEmptyCard
                icon={Trash2}
                heading="No deleted properties"
                description="Properties you delete appear here. You can restore them as drafts or delete them permanently."
            />
        );
    }

    if (variant === "no_sold") {
        return (
            <ListingsEmptyCard
                icon={CheckCircle2}
                heading="No sold properties yet"
                description="Properties marked as sold appear here, so you can keep track of your past listings."
            />
        );
    }

    if (variant === "no_draft") {
        return (
            <ListingsEmptyCard
                icon={FileText}
                heading="No draft listings"
                description="Save a property as a draft to finish its details and publish it later."
                action={addPropertyAction}
            />
        );
    }

    if (variant === "no_published") {
        return (
            <ListingsEmptyCard
                icon={Building2}
                heading="No published listings"
                description="Publish a draft or add a new property to see it here. You can then link clients and track deals."
                action={addPropertyAction}
            />
        );
    }

    return (
        <ListingsEmptyCard
            icon={Building2}
            heading="No properties yet"
            description="Add a property, then link a client to start tracking a deal."
            action={addPropertyAction}
        />
    );
}

export function MyListingsRequestsEmpty() {
    return (
        <ListingsEmptyCard
            icon={Search}
            heading="No requests sent yet"
            description="Find a property you'd like to sell and ask the owner."
            action={{
                label: "Browse Marketplace",
                icon: Search,
                href: "/broker/owner-listings",
            }}
        />
    );
}
