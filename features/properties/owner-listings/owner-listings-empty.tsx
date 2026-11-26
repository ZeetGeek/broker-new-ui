import { EmptyStateAction } from "@/components/empty-state";
import { EmptyState } from "@/components/shared/empty-state";
import { MapPin, Search, ShieldCheck } from "@/components/shared/icons";

import { FEATURE_RERA_VERIFICATION } from "@/config/index";

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
                    <EmptyStateAction
                        label="Add service areas"
                        icon={MapPin}
                        href="/broker/profile"
                    />
                </EmptyState>
            );
        }

        // RERA empty state temporarily hidden; keep its code for later.
        if (!FEATURE_RERA_VERIFICATION) return null;
        return (
            <EmptyState
                icon={MapPin}
                heading="Add your RERA number to get verified"
                description="Owners approve verified brokers far more often."
            >
                <EmptyStateAction
                    label="Add RERA number"
                    icon={ShieldCheck}
                    href="/broker/profile"
                />
            </EmptyState>
        );
    }

    if (variant === "filtered") {
        return (
            <EmptyState
                size="card"
                icon={Search}
                heading="No properties match these filters"
                variant="filtered"
                description={
                    searchQuery?.trim()
                        ? `No results for "${searchQuery.trim()}". Try a wider budget or a different locality.`
                        : "Try a wider budget or a different locality."
                }
            >
                {onClearFilters ? (
                    <EmptyStateAction
                        label="Clear filters"
                        icon={Search}
                        onClick={onClearFilters}
                    />
                ) : null}
            </EmptyState>
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
