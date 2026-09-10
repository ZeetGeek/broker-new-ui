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
import type { MyListingItem, MyListingsResult } from "@/features/properties/your-listings/types";
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
    const [editingListing, setEditingListing] = useState<MyListingItem | null>(null);
    /** Bumped after a save so the list refetches without changing filters. */
    const [refreshToken, setRefreshToken] = useState(0);

    useEffect(() => {
        let cancelled = false;
        void myListingsApi.summary().then((next) => {
            if (!cancelled) setSummary(next);
        });
        return () => {
            cancelled = true;
        };
        // refreshToken: an edit can flip a listing's status without changing the
        // total, and the summary counts published/draft separately.
    }, [result?.total, refreshToken]);

    useEffect(() => {
        let cancelled = false;

        // Defer loading flags so the effect body stays free of synchronous setState
        // (react-hooks/set-state-in-effect). Same pattern as owner-listings fetch.
        const timer = window.setTimeout(() => {
            if (cancelled) return;
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
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [filters, refreshToken]);

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

            {loading && !result ? null : result && result.items.length === 0 ? (
                <MyListingsEmpty
                    variant={hasActiveFilters ? "filtered" : "first_run"}
                    searchQuery={filters.q}
                    onClearFilters={hasActiveFilters ? clearFilters : undefined}
                    onAddProperty={() => setAddOpen(true)}
                />
            ) : result ? (
                <div className={loading ? "opacity-60 transition-opacity duration-160" : undefined}>
                    <MyListingsGrid
                        items={result.items}
                        view={view}
                        onEditListing={setEditingListing}
                    />
                    {result.totalPages > 1 ? (
                        <div className="pbs-6">
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
            <PropertyFormDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onSaved={() => {
                    setAddOpen(false);
                    setRefreshToken((token) => token + 1);
                }}
            />
            <PropertyFormDialog
                open={editingListing != null}
                listing={editingListing}
                onOpenChange={(next) => {
                    if (!next) setEditingListing(null);
                }}
                onSaved={() => {
                    setEditingListing(null);
                    setRefreshToken((token) => token + 1);
                }}
            />
        </div>
    );
}
