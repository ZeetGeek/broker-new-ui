"use client";

import { useEffect, useState } from "react";

import { myListingsApi, type MyListingsSummary } from "@/lib/api/my-listings";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { AppPagination } from "@/components/shared/app-pagination";

import { PropertyFormDialog } from "@/features/properties/property-form/property-form-dialog";
import { MyListingsEmpty } from "@/features/properties/your-listings/my-listings-empty";
import { MyListingsGrid } from "@/features/properties/your-listings/my-listings-grid";
import { MyListingsHeader } from "@/features/properties/your-listings/my-listings-header";
import {
    MyListingsAddFab,
    MyListingsIntro,
} from "@/features/properties/your-listings/my-listings-intro";
import { MyListingsResultsSkeleton } from "@/features/properties/your-listings/my-listings-skeleton";
import type { MyListingsResult } from "@/features/properties/your-listings/types";
import { useMyListingsFilters } from "@/features/properties/your-listings/use-my-listings-filters";
import { useMyListingsView } from "@/features/properties/your-listings/use-my-listings-view";

export function MyListingsPanel() {
    const { filters, setFilters, clearFilters, hasActiveFilters } = useMyListingsFilters();
    const { view, setView } = useMyListingsView();
    const [result, setResult] = useState<MyListingsResult | null>(null);
    const [summary, setSummary] = useState<MyListingsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void myListingsApi.summary().then((next) => {
            if (!cancelled) setSummary(next);
        });
        return () => {
            cancelled = true;
        };
    }, [result?.total]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        void myListingsApi
            .list(filters)
            .then((next) => {
                if (cancelled) return;
                setResult(next);
            })
            .catch(() => {
                if (cancelled) return;
                setError("Couldn't load your listings. Try again.");
                setResult(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [filters]);

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <MyListingsIntro
                    summary={summary}
                    resultTotal={result?.total ?? 0}
                    hasActiveFilters={hasActiveFilters}
                    isLoading={loading}
                />
            </PortalSectionNav>

            <MyListingsHeader
                filters={filters}
                onFiltersChange={setFilters}
                view={view}
                onViewChange={setView}
                summary={summary}
                isLoading={loading}
            />

            {error ? (
                <p className="body-sm text-danger" role="alert">
                    {error}
                </p>
            ) : null}

            {loading && !result ? (
                <MyListingsResultsSkeleton view={view} />
            ) : result && result.items.length === 0 ? (
                <MyListingsEmpty
                    variant={hasActiveFilters ? "filtered" : "first_run"}
                    searchQuery={filters.q}
                    onClearFilters={hasActiveFilters ? clearFilters : undefined}
                    onAddProperty={() => setAddOpen(true)}
                />
            ) : result ? (
                <div className={loading ? "opacity-60 transition-opacity duration-160" : undefined}>
                    <MyListingsGrid items={result.items} view={view} />
                    {result.totalPages > 1 ? (
                        <div className="pt-6">
                            <AppPagination
                                page={result.page}
                                totalPages={result.totalPages}
                                onPageChange={(page) => setFilters({ ...filters, page })}
                                aria-label="Your listings pages"
                            />
                        </div>
                    ) : null}
                </div>
            ) : null}
            <MyListingsAddFab onClick={() => setAddOpen(true)} />
            <PropertyFormDialog open={addOpen} onOpenChange={setAddOpen} />
        </div>
    );
}
