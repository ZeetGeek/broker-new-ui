"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { myListingsApi, type MyListingsSummary } from "@/lib/api/my-listings";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";

import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import type { RequestItem } from "@/features/properties/my-requests/types";
import { PropertyDeleteDialog } from "@/features/properties/property-detail/property-delete-dialog";
import { PropertyFormDialog } from "@/features/properties/property-form/property-form-dialog";
import { AttachExclusiveOwnerModal } from "@/features/properties/your-listings/attach-exclusive-owner-modal";
import { MyListingsEmpty } from "@/features/properties/your-listings/my-listings-empty";
import { MyListingsGrid } from "@/features/properties/your-listings/my-listings-grid";
import { MyListingsHeader } from "@/features/properties/your-listings/my-listings-header";
import {
    MyListingsAddFab,
    MyListingsIntro,
} from "@/features/properties/your-listings/my-listings-intro";
import { MyListingsResultsSkeleton } from "@/features/properties/your-listings/my-listings-skeleton";
import type { MyListingItem } from "@/features/properties/your-listings/types";
import { useMyListingsFilters } from "@/features/properties/your-listings/use-my-listings-filters";
import { useMyListingsView } from "@/features/properties/your-listings/use-my-listings-view";

/**
 * The buyers modal is written against a request. A listing the broker owns
 * carries the same fields it reads, so adapt rather than duplicate the picker.
 */
function asRequestShape(item: MyListingItem): RequestItem {
    const isRent = item.transactionType === "rent";

    return {
        id: item.id,
        propertyId: item.id,
        stage: "approved",
        title: item.title,
        configLabel: item.configLabel,
        propertyTypeLabel: item.propertyTypeLabel,
        locality: item.locality,
        city: item.city,
        areaSqft: item.areaSqft,
        bhk: item.bhk,
        amountInr: (isRent ? item.rentAmountInr : item.saleAmountInr) ?? 0,
        isRent,
        commissionPercent: 0,
        ownerName: "You",
        ownerSeen: true,
        requestedAt: item.createdAt,
        resolvedAt: null,
        daysWaiting: 0,
        clientsAttached: 0,
        attachedClients: [],
        brokerSlotsOpen: 0,
        brokerSlotsTotal: 0,
        attemptNumber: 1,
        reminderCount: 0,
        reminderUsed: false,
        nudgedAt: null,
        imageSrc: item.imageSrc,
        timeline: [],
    };
}

export function MyListingsPanel({ portal = "broker" }: { portal?: "broker" | "owner" }) {
    const { filters, setFilters, clearFilters, hasActiveFilters } = useMyListingsFilters();
    const { view, setView } = useMyListingsView();
    const [summary, setSummary] = useState<MyListingsSummary | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<MyListingItem | null>(null);
    const [deletingListing, setDeletingListing] = useState<MyListingItem | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    /** Kept after close so the modal can animate out with its listing intact. */
    const [buyersListing, setBuyersListing] = useState<MyListingItem | null>(null);
    const [isBuyersOpen, setIsBuyersOpen] = useState(false);
    const [ownerListing, setOwnerListing] = useState<MyListingItem | null>(null);
    const [isOwnerAttachOpen, setIsOwnerAttachOpen] = useState(false);
    /** Bumped after a save so the list refetches without changing filters. */
    const [refreshToken, setRefreshToken] = useState(0);

    const isOwnerPortal = portal === "owner";

    const infiniteFilters = useMemo(() => ({ ...filters, page: 1 }), [filters]);
    const query = useInfiniteItems({
        queryKey: ["my-listings", infiniteFilters, refreshToken],
        queryFn: async ({ cursor, signal }) => {
            const result = await myListingsApi.list(
                { ...infiniteFilters, page: cursor ? Number(cursor) : 1 },
                signal,
            );
            return {
                ...result,
                nextCursor: result.page < result.totalPages ? String(result.page + 1) : null,
            };
        },
    });

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
    }, [query.total, refreshToken]);

    const confirmDelete = useCallback(async () => {
        if (!deletingListing) return;
        setDeleteBusy(true);
        try {
            await myListingsApi.remove(deletingListing.id);
            setDeletingListing(null);
            toast.success("Property removed");
            setRefreshToken((token) => token + 1);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't remove property");
        } finally {
            setDeleteBusy(false);
        }
    }, [deletingListing]);

    const loading = query.isFetching && !query.isFetchingNextPage;

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <MyListingsIntro
                    summary={summary}
                    resultTotal={query.total}
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

            {query.isError && query.items.length === 0 ? (
                <p className="body-sm text-danger" role="alert">
                    Couldn&apos;t load your listings. Try again.
                </p>
            ) : null}

            {query.isError && query.items.length === 0 ? null : query.isPending ? (
                <MyListingsResultsSkeleton view={view} />
            ) : query.items.length === 0 ? (
                <MyListingsEmpty
                    variant={hasActiveFilters ? "filtered" : "first_run"}
                    searchQuery={filters.q}
                    onClearFilters={hasActiveFilters ? clearFilters : undefined}
                    onAddProperty={() => setAddOpen(true)}
                />
            ) : (
                <div className={loading ? "opacity-60 transition-opacity duration-160" : undefined}>
                    <MyListingsGrid
                        items={query.items}
                        view={view}
                        portal={portal}
                        onEditListing={setEditingListing}
                        onDeleteListing={setDeletingListing}
                        onAddBuyer={
                            isOwnerPortal
                                ? undefined
                                : (listing) => {
                                      setBuyersListing(listing);
                                      setIsBuyersOpen(true);
                                  }
                        }
                        onAttachOwner={
                            isOwnerPortal
                                ? undefined
                                : (listing) => {
                                      setOwnerListing(listing);
                                      setIsOwnerAttachOpen(true);
                                  }
                        }
                    />
                    <InfiniteListStatus
                        hasNextPage={Boolean(query.hasNextPage)}
                        isFetchingNextPage={query.isFetchingNextPage}
                        error={query.isFetchNextPageError ? query.error : null}
                        onLoadMore={() => void query.fetchNextPage()}
                    />
                </div>
            )}
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
            <PropertyDeleteDialog
                open={deletingListing != null}
                onOpenChange={(next) => {
                    if (!next && !deleteBusy) setDeletingListing(null);
                }}
                title={deletingListing?.title ?? "Property"}
                busy={deleteBusy}
                onConfirm={() => void confirmDelete()}
            />
            {buyersListing ? (
                <AttachBuyersModal
                    open={isBuyersOpen}
                    onOpenChange={setIsBuyersOpen}
                    request={asRequestShape(buyersListing)}
                    onSaved={() => setRefreshToken((token) => token + 1)}
                />
            ) : null}
            <AttachExclusiveOwnerModal
                open={isOwnerAttachOpen}
                onOpenChange={setIsOwnerAttachOpen}
                listing={ownerListing}
                onAttached={() => setRefreshToken((token) => token + 1)}
            />
        </div>
    );
}
