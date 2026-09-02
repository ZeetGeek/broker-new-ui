import { MapPin, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { TextLinkButton } from "@/components/shared/text-link-button";

export type OwnerListingsBlockedReason = "no_service_areas" | "profile_incomplete";

export type OwnerListingsEmptyProps = {
    variant: "blocked" | "filtered" | "first_run";
    blockedReason?: OwnerListingsBlockedReason;
    searchQuery?: string;
    onClearFilters?: () => void;
};

export function OwnerListingsEmpty({
    variant,
    blockedReason,
    searchQuery,
    onClearFilters,
}: OwnerListingsEmptyProps) {
    if (variant === "blocked") {
        if (blockedReason === "no_service_areas") {
            return (
                <EmptyState
                    icon={MapPin}
                    heading="Tell us where you work"
                    description="We'll show you new properties in those areas."
                >
                    <TextLinkButton href="/broker/profile/edit">Add service areas</TextLinkButton>
                </EmptyState>
            );
        }

        return (
            <EmptyState
                icon={MapPin}
                heading="Add your RERA number to get verified"
                description="Owners approve verified brokers far more often."
            >
                <TextLinkButton href="/broker/profile/edit">Add RERA number</TextLinkButton>
            </EmptyState>
        );
    }

    if (variant === "filtered") {
        return (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">No properties match these filters</p>
                <p className="body-sm max-w-prose text-ink-muted">
                    {searchQuery?.trim()
                        ? `No results for "${searchQuery.trim()}". Try a wider budget or a different locality.`
                        : "Try a wider budget or a different locality."}
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
            icon={Search}
            heading="Nothing new in your areas"
            description="We'll show properties added in the areas you work in."
        />
    );
}
