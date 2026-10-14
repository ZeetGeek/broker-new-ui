"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { UserRoundSearch } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { type BrokerProfile, representativeApi } from "@/lib/api/representative";
import { cn } from "@/lib/utils";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { EmptyState } from "@/components/shared/empty-state";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";

import { BrokerProfileDialog } from "@/features/owner-brokers/broker-profile-dialog";
import { BrowseBrokerCard } from "@/features/owner-brokers/browse-broker-card";
import {
    type BrowseBrokersFilters,
    DEFAULT_BROWSE_BROKERS_FILTERS,
    hasActiveBrowseFilters,
} from "@/features/owner-brokers/browse-brokers-filters";
import {
    BrowseBrokersSkeleton,
    OWNER_BROKERS_GRID_BREAKPOINTS,
} from "@/features/owner-brokers/browse-brokers-skeleton";
import { BrowseBrokersToolbar } from "@/features/owner-brokers/browse-brokers-toolbar";
import { InviteBrokerDialog } from "@/features/owner-brokers/invite-broker-dialog";
import { OwnerBrokersEmpty } from "@/features/owner-brokers/owner-brokers-empty";

const BROWSE_PAGE_SIZE = 20;

type Specialty = { key: string; label: string };

const NO_SPECIALTIES: Specialty[] = [];

export function OwnerBrokersBrowse({
    search,
    onTotalChange,
}: {
    search: string;
    onTotalChange?: (total: number | null) => void;
}) {
    const [filters, setFilters] = useState<BrowseBrokersFilters>(DEFAULT_BROWSE_BROKERS_FILTERS);

    const [profileBroker, setProfileBroker] = useState<BrokerProfile | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [inviteBroker, setInviteBroker] = useState<BrokerProfile | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);

    const term = search.trim();
    const query = useInfiniteItems({
        queryKey: [
            "owner-brokers-browse",
            term,
            filters.verifiedOnly,
            filters.minExperience,
            filters.specialty,
            filters.sort,
        ],
        queryFn: async ({ cursor, signal }) => {
            const page = await representativeApi.ownerBrokers(
                {
                    search: term || undefined,
                    verifiedOnly: filters.verifiedOnly,
                    minExperience: filters.minExperience || undefined,
                    specialty: filters.specialty || undefined,
                    sort: filters.sort,
                    cursor: cursor ?? undefined,
                    limit: BROWSE_PAGE_SIZE,
                },
                signal,
            );
            return {
                items: page.items,
                total: page.total ?? page.items.length,
                nextCursor: page.nextCursor ?? null,
                specialties: page.specialties,
            };
        },
    });

    useEffect(() => {
        if (!onTotalChange) return;
        if (query.isPending && query.total === 0) {
            onTotalChange(null);
            return;
        }
        onTotalChange(query.total);
    }, [onTotalChange, query.isPending, query.total]);

    const firstPageSpecialties = query.data?.pages[0]?.specialties;
    const [specialtyFacet, setSpecialtyFacet] = useState(firstPageSpecialties);
    if (firstPageSpecialties && firstPageSpecialties !== specialtyFacet) {
        setSpecialtyFacet(firstPageSpecialties);
    }
    const specialties = useMemo<Specialty[]>(
        () =>
            specialtyFacet?.map(({ label }) => ({ key: label.toLowerCase(), label })) ??
            NO_SPECIALTIES,
        [specialtyFacet],
    );

    const brokers = query.items;
    const filtered = hasActiveBrowseFilters(filters);
    const error = query.isError && brokers.length === 0 ? query.error : null;

    const patchFilters = useCallback(
        (patch: Partial<BrowseBrokersFilters>) => setFilters((prev) => ({ ...prev, ...patch })),
        [],
    );
    const clearFilters = useCallback(
        () => setFilters((prev) => ({ ...DEFAULT_BROWSE_BROKERS_FILTERS, sort: prev.sort })),
        [],
    );

    const openProfile = useCallback((broker: BrokerProfile) => {
        setProfileBroker(broker);
        setProfileOpen(true);
    }, []);
    const openInvite = useCallback((broker: BrokerProfile) => {
        setInviteBroker(broker);
        setInviteOpen(true);
    }, []);

    let results;
    if (query.isPending) {
        results = <BrowseBrokersSkeleton />;
    } else if (error) {
        results = (
            <div role="alert" className="flex flex-col items-start gap-3 py-12">
                <p className="body-sm font-medium text-ink">
                    Brokers could not load. Check your connection and try again.
                </p>
                <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
                    Try again
                </Button>
            </div>
        );
    } else if (brokers.length === 0 && filtered) {
        results = (
            <EmptyState
                icon={UserRoundSearch}
                heading="Nothing matches"
                description="Loosen a filter to see more brokers."
                className="py-16"
            >
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                </Button>
            </EmptyState>
        );
    } else if (brokers.length === 0) {
        results = <OwnerBrokersEmpty tab="browse" hasSearch={Boolean(term)} />;
    } else {
        results = (
            <div
                className={cn(
                    "flex flex-col gap-2",
                    query.isFetching &&
                        !query.isFetchingNextPage &&
                        "opacity-60 transition-opacity duration-160",
                )}
            >
                <WindowVirtualGrid
                    items={brokers}
                    getKey={(broker) => broker.id}
                    estimateRowHeight={320}
                    gap={24}
                    breakpoints={OWNER_BROKERS_GRID_BREAKPOINTS}
                    ariaLabel="Brokers"
                    renderItem={(broker) => (
                        <BrowseBrokerCard
                            broker={broker}
                            onViewProfile={openProfile}
                            onInvite={openInvite}
                        />
                    )}
                />
                <InfiniteListStatus
                    hasNextPage={Boolean(query.hasNextPage)}
                    isFetchingNextPage={query.isFetchingNextPage}
                    error={query.isFetchNextPageError ? query.error : null}
                    onLoadMore={() => void query.fetchNextPage()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 md:gap-6">
            {!error && (brokers.length > 0 || filtered || query.isPending) ? (
                <BrowseBrokersToolbar
                    filters={filters}
                    onFiltersChange={patchFilters}
                    onClear={clearFilters}
                    specialties={specialties}
                />
            ) : null}

            {results}

            <BrokerProfileDialog
                broker={profileBroker}
                open={profileOpen}
                onOpenChange={setProfileOpen}
                onInvite={openInvite}
            />
            <InviteBrokerDialog
                broker={inviteBroker}
                open={inviteOpen}
                onOpenChange={setInviteOpen}
            />
        </div>
    );
}
