import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Building2, FileText, Search } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

export type MyListingsEmptyProps = {
    variant: "filtered" | "first_run" | "no_deleted" | "no_draft" | "no_published";
    searchQuery?: string;
    onClearFilters?: () => void;
    onAddProperty?: () => void;
};

/** Fills the results band so the teach block sits in the visual middle of the page. */
const FIRST_RUN_FRAME =
    "min-block-[min(34rem,calc(100dvh-14rem))] py-10 md:min-block-[min(38rem,calc(100dvh-12rem))]";

export function MyListingsEmpty({
    variant,
    searchQuery,
    onClearFilters,
    onAddProperty,
}: MyListingsEmptyProps) {
    if (variant === "filtered") {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <p className="h5 text-ink">No properties match these filters</p>
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

    if (variant === "no_deleted") {
        return (
            <EmptyState
                icon={Building2}
                heading="No properties in Deleted"
                description="Deleted properties appear here. Restore them when needed, or delete them permanently."
                className={FIRST_RUN_FRAME}
            />
        );
    }

    if (variant === "no_draft") {
        return (
            <EmptyState
                icon={FileText}
                heading="No drafts"
                description="Save a listing as a draft and it will show here until you publish."
                className={FIRST_RUN_FRAME}
            />
        );
    }

    if (variant === "no_published") {
        return (
            <EmptyState
                icon={Building2}
                heading="Nothing published yet"
                description="Publish a draft when it is ready — it will show up here."
                className={FIRST_RUN_FRAME}
            />
        );
    }

    return (
        <EmptyState
            icon={Building2}
            heading="No properties yet"
            description="Add your first property — it takes about 2 minutes."
            className={FIRST_RUN_FRAME}
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
            className={FIRST_RUN_FRAME}
        >
            <Button size="lg" variant="accent" render={<Link href="/broker/owner-listings" />}>
                Browse Marketplace
            </Button>
        </EmptyState>
    );
}
