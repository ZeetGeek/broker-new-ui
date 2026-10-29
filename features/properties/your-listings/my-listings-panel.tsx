"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tinykeys } from "tinykeys";

import { myListingsApi, type MyListingsSummary } from "@/lib/api/my-listings";
import { attachedClientsByProperty } from "@/lib/api/clients";
import { collectPropertyPages } from "@/lib/properties/list-criteria";
import { useAppSelector } from "@/store/hooks";
import { propertiesApi } from "@/lib/api/properties";
import { representativeApi } from "@/lib/api/representative";
import { summarizePropertyBrokers } from "@/lib/format/property-brokers";
import { getShortcut } from "@/lib/shortcuts";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { Button } from "@/components/ui/button";

import { AttachBuyersModal } from "@/features/properties/my-requests/attach-buyers-modal";
import type { RequestItem } from "@/features/properties/my-requests/types";
import { PropertyDeleteDialog } from "@/features/properties/property-detail/property-delete-dialog";
import { PropertyFormDialog } from "@/features/properties/property-form/property-form-dialog";
import { SAVED_PROPERTIES_QUERY_KEY } from "@/features/properties/saved-properties/saved-properties-query";
import { AttachExclusiveOwnerModal } from "@/features/properties/your-listings/attach-exclusive-owner-modal";
import { hasActiveMyListingsFilters } from "@/features/properties/your-listings/filter-my-listings";
import { InvitePropertyBrokerModal } from "@/features/properties/your-listings/invite-property-broker-modal";
import { MarkSoldDialog } from "@/features/properties/your-listings/mark-sold-dialog";
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

function isEditable(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable ||
        el.getAttribute("role") === "textbox" ||
        el.closest("[contenteditable='true']") !== null
    );
}

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
        clientsAttached: item.attachedClients?.length ?? 0,
        attachedClients: item.attachedClients ?? [],
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
    const queryClient = useQueryClient();
    const userId = useAppSelector((state) => state.auth.user?.id);
    const { filters, setFilters, clearFilters, hasActiveFilters, scopeReady } =
        useMyListingsFilters();
    const [addOpen, setAddOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<MyListingItem | null>(null);
    const [deletingListing, setDeletingListing] = useState<MyListingItem | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [sellingListing, setSellingListing] = useState<MyListingItem | null>(null);
    /** Kept after close so the modal can animate out with its listing intact. */
    const [buyersListing, setBuyersListing] = useState<MyListingItem | null>(null);
    const [isBuyersOpen, setIsBuyersOpen] = useState(false);
    const [ownerListing, setOwnerListing] = useState<MyListingItem | null>(null);
    const [isOwnerAttachOpen, setIsOwnerAttachOpen] = useState(false);
    const [brokerListing, setBrokerListing] = useState<MyListingItem | null>(null);
    const [isBrokerInviteOpen, setIsBrokerInviteOpen] = useState(false);
    const [brokerInviteSession, setBrokerInviteSession] = useState(0);
    const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});

    const isOwnerPortal = portal === "owner";
    const savedLookup = useQuery({
        queryKey: [...SAVED_PROPERTIES_QUERY_KEY, "lookup"],
        queryFn: ({ signal }) => propertiesApi.listBookmarks({ page: 1, limit: 100 }, signal),
        enabled: !isOwnerPortal,
        staleTime: 30_000,
    });
    const savedIds = useMemo(
        () => new Set((savedLookup.data?.items ?? []).map((item) => item.id)),
        [savedLookup.data],
    );
    const isListingSaved = useCallback(
        (item: MyListingItem) =>
            savedOverrides[item.id] ?? (savedIds.has(item.id) || Boolean(item.isBookmarked)),
        [savedIds, savedOverrides],
    );
    const handleToggleSave = useCallback(
        async (item: MyListingItem) => {
            const nextSaved = !isListingSaved(item);
            setSavedOverrides((prev) => ({ ...prev, [item.id]: nextSaved }));
            try {
                if (nextSaved) {
                    await propertiesApi.bookmark(item.id);
                    toast.success("Property saved");
                } else {
                    await propertiesApi.unbookmark(item.id);
                    toast.success("Removed from saved");
                }
                void queryClient.invalidateQueries({ queryKey: SAVED_PROPERTIES_QUERY_KEY });
            } catch (error) {
                setSavedOverrides((prev) => ({ ...prev, [item.id]: !nextSaved }));
                toast.error(error instanceof Error ? error.message : "Could not update bookmark");
            }
        },
        [isListingSaved, queryClient],
    );
    const representations = useQuery({
        queryKey: ["owner-property-representations"],
        queryFn: () => representativeApi.ownerList(),
        enabled: isOwnerPortal,
        staleTime: 30_000,
        refetchInterval: isOwnerPortal ? 60_000 : false,
    });
    const brokersByProperty = useMemo(
        () => summarizePropertyBrokers(representations.data ?? [], representations.dataUpdatedAt),
        [representations.data, representations.dataUpdatedAt],
    );
    const brokerSummaryState = representations.isError
        ? "error"
        : representations.isPending
          ? "loading"
          : "ready";

    const infiniteFilters = useMemo(() => ({ ...filters, page: 1 }), [filters]);
    const query = useInfiniteItems({
        queryKey: ["my-listings", portal, infiniteFilters],
        enabled: scopeReady,
        queryFn: async ({ cursor, signal }) => {
            const result = await myListingsApi.list(
                { ...infiniteFilters, page: cursor ? Number(cursor) : 1 },
                signal,
                {
                    withAttachedClients: !isOwnerPortal,
                    attachedClients: () =>
                        queryClient.fetchQuery({
                            queryKey: ["inventory-lead-summary", userId],
                            queryFn: ({ signal }) => attachedClientsByProperty(signal),
                            staleTime: 30_000,
                        }),
                    propertyCollection: (propertyQuery) =>
                        queryClient.fetchQuery({
                            queryKey: [
                                "inventory-filter-collection",
                                userId,
                                portal,
                                propertyQuery,
                            ],
                            queryFn: ({ signal }) =>
                                collectPropertyPages((page) =>
                                    propertiesApi.list({ ...propertyQuery, page }, signal),
                                ),
                            staleTime: 30_000,
                        }),
                },
            );
            return {
                ...result,
                nextCursor: result.page < result.totalPages ? String(result.page + 1) : null,
            };
        },
    });

    const summaryQuery = useQuery<MyListingsSummary>({
        queryKey: ["my-listings-summary", portal],
        queryFn: () => myListingsApi.summary(),
    });
    const summary = summaryQuery.data ?? null;
    const refreshListings = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: ["inventory-lead-summary"] });
        void queryClient.invalidateQueries({ queryKey: ["inventory-filter-collection"] });
        void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
        void queryClient.invalidateQueries({ queryKey: ["my-listings-summary"] });
    }, [queryClient]);

    useEffect(() => {
        const shortcut = getShortcut("add_property");
        if (!shortcut) return undefined;

        const unsubscribe = tinykeys(window, {
            [shortcut.keys]: (event) => {
                if (isEditable(event.target)) return;
                if (event.repeat) return;
                if (addOpen || editingListing != null || deletingListing != null) return;
                if (isBuyersOpen || isOwnerAttachOpen || isBrokerInviteOpen) return;
                setAddOpen(true);
            },
        });

        return () => unsubscribe();
    }, [
        addOpen,
        editingListing,
        deletingListing,
        isBuyersOpen,
        isOwnerAttachOpen,
        isBrokerInviteOpen,
    ]);

    const confirmDelete = useCallback(async () => {
        if (!deletingListing) return;
        setDeleteBusy(true);
        try {
            await myListingsApi.remove(deletingListing.id);
            setDeletingListing(null);
            toast.success("Property removed");
            refreshListings();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't remove property");
        } finally {
            setDeleteBusy(false);
        }
    }, [deletingListing, refreshListings]);

    const loading = !scopeReady || query.isPending;

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <MyListingsIntro
                    summary={summary}
                    resultTotal={query.total}
                    status={filters.status}
                    hasActiveFilters={hasActiveMyListingsFilters({ ...filters, sort: "newest" })}
                    isLoading={loading || summaryQuery.isPending}
                    hasError={query.isError}
                />
            </PortalSectionNav>

            <MyListingsHeader
                filters={filters}
                onFiltersChange={setFilters}
                summary={summary}
                isLoading={summaryQuery.isPending}
                isInitialLoading={loading}
                onAddProperty={() => setAddOpen(true)}
            />

            <section aria-label="Your listings results" aria-busy={loading || query.isFetching}>
                {loading ? (
                    <MyListingsResultsSkeleton portal={portal} />
                ) : query.isError && query.items.length === 0 ? (
                    <div
                        role="alert"
                        className="flex flex-col items-center gap-4 py-12 text-center"
                    >
                        <p className="body-sm text-danger">
                            Couldn&apos;t load your listings. Check your connection and try again.
                        </p>
                        <Button variant="outline" onClick={() => void query.refetch()}>
                            Try again
                        </Button>
                    </div>
                ) : query.items.length === 0 ? (
                    <MyListingsEmpty
                        variant={hasActiveFilters ? "filtered" : "first_run"}
                        searchQuery={filters.q}
                        onClearFilters={hasActiveFilters ? clearFilters : undefined}
                        onAddProperty={() => setAddOpen(true)}
                    />
                ) : (
                    <div>
                        {query.isRefetchError && !query.isFetchNextPageError ? (
                            <div
                                role="alert"
                                className="
                                  body-sm flex flex-wrap items-center gap-3 py-3 text-ink-muted
                                "
                            >
                                Could not refresh listings. Showing the last loaded results.
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void query.refetch()}
                                >
                                    Try again
                                </Button>
                            </div>
                        ) : null}
                        <MyListingsGrid
                            items={query.items}
                            portal={portal}
                            brokersByProperty={isOwnerPortal ? brokersByProperty : undefined}
                            brokerSummaryState={isOwnerPortal ? brokerSummaryState : undefined}
                            onInviteBroker={
                                isOwnerPortal
                                    ? (listing) => {
                                          setBrokerListing(listing);
                                          setBrokerInviteSession((session) => session + 1);
                                          setIsBrokerInviteOpen(true);
                                          void representations.refetch();
                                      }
                                    : undefined
                            }
                            onEditListing={setEditingListing}
                            onDeleteListing={setDeletingListing}
                            onMarkSold={setSellingListing}
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
                            onToggleSave={
                                isOwnerPortal
                                    ? undefined
                                    : (listing) => void handleToggleSave(listing)
                            }
                            isSaved={isOwnerPortal ? undefined : isListingSaved}
                        />
                        {query.isFetchingNextPage ? (
                            <div className="pbs-6">
                                <MyListingsResultsSkeleton
                                    portal={portal}
                                    label="Loading more listings"
                                />
                            </div>
                        ) : null}
                        <InfiniteListStatus
                            hasNextPage={Boolean(query.hasNextPage)}
                            isFetchingNextPage={query.isFetchingNextPage}
                            error={query.isFetchNextPageError ? query.error : null}
                            onLoadMore={() => void query.fetchNextPage()}
                        />
                    </div>
                )}
            </section>
            <MyListingsAddFab onClick={() => setAddOpen(true)} />
            {isOwnerPortal && brokerListing ? (
                <InvitePropertyBrokerModal
                    key={brokerInviteSession}
                    listing={brokerListing}
                    open={isBrokerInviteOpen}
                    onOpenChange={setIsBrokerInviteOpen}
                    summary={brokersByProperty.get(brokerListing.id)}
                    summaryState={brokerSummaryState}
                    onRetrySummary={() => void representations.refetch()}
                    onInvited={() => {
                        void queryClient.invalidateQueries({
                            queryKey: ["owner-property-representations"],
                        });
                        void queryClient.invalidateQueries({ queryKey: ["owner-rep-queue"] });
                    }}
                />
            ) : null}
            <PropertyFormDialog
                open={addOpen}
                portal={portal}
                onOpenChange={setAddOpen}
                onSaved={() => {
                    setAddOpen(false);
                    refreshListings();
                }}
            />
            <PropertyFormDialog
                open={editingListing != null}
                portal={portal}
                listing={editingListing}
                onOpenChange={(next) => {
                    if (!next) setEditingListing(null);
                }}
                onSaved={() => {
                    setEditingListing(null);
                    refreshListings();
                }}
            />
            {sellingListing ? (
                <MarkSoldDialog
                    open
                    onOpenChange={(next) => {
                        if (!next) setSellingListing(null);
                    }}
                    propertyId={sellingListing.id}
                    propertyTitle={sellingListing.title || "This property"}
                    portal={portal}
                    onSold={() => {
                        setSellingListing(null);
                        refreshListings();
                        void queryClient.invalidateQueries({
                            queryKey: ["owner-property-representations"],
                        });
                        void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
                    }}
                />
            ) : null}
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
                    onSaved={refreshListings}
                />
            ) : null}
            <AttachExclusiveOwnerModal
                open={isOwnerAttachOpen}
                onOpenChange={setIsOwnerAttachOpen}
                listing={ownerListing}
                onAttached={refreshListings}
            />
        </div>
    );
}
