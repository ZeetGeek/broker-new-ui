"use client";

import { useCallback, useMemo, useState } from "react";

import { ShieldCheck, UserRoundSearch } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { type BrokerProfile, representativeApi } from "@/lib/api/representative";
import { cn } from "@/lib/utils";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { EmptyState } from "@/components/shared/empty-state";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { Button } from "@/components/ui/button";

import { BrokerProfileDialog } from "@/features/owner-brokers/broker-profile-dialog";
import { BrowseBrokerCard } from "@/features/owner-brokers/browse-broker-card";
import {
    type BrowseBrokersFilters,
    DEFAULT_BROWSE_BROKERS_FILTERS,
    hasActiveBrowseFilters,
} from "@/features/owner-brokers/browse-brokers-filters";
import {
    browseBrokersGridClass,
    BrowseBrokersSkeleton,
} from "@/features/owner-brokers/browse-brokers-skeleton";
import { BrowseBrokersToolbar } from "@/features/owner-brokers/browse-brokers-toolbar";
import { InviteBrokerDialog } from "@/features/owner-brokers/invite-broker-dialog";
import { OwnerBrokersEmpty } from "@/features/owner-brokers/owner-brokers-empty";

const BROWSE_PAGE_SIZE = 20;

type Specialty = { key: string; label: string };

const NO_SPECIALTIES: Specialty[] = [];

function TrustNote() {
    return (
        <aside
            className="
              flex items-center gap-3 rounded-card border border-border-warm bg-surface p-3
              shadow-sm
              md:px-4
            "
        >
            <span
                className="
                  flex shrink-0 items-center justify-center rounded-inner bg-brand-soft text-brand
                  block-10 inline-10
                "
            >
                <ShieldCheck aria-hidden className="block-5 inline-5" strokeWidth={1.75} />
            </span>
            <div className="flex flex-col gap-0.5 min-inline-0">
                <p className="body-sm font-semibold text-ink">You stay in control.</p>
                <p className="body-xs text-ink-muted">
                    A broker can only work on your property after you invite or approve them.
                </p>
            </div>
        </aside>
    );
}

export function OwnerBrokersBrowse({ search }: { search: string }) {
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

    // The API sends the whole pool's specialties with each first page; the last
    // ones seen are kept so the menu does not vanish while a new first page loads.
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
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load brokers</p>
                <p className="body-sm text-ink-muted">
                    {error instanceof ApiError
                        ? error.message
                        : "Check your connection and try again."}
                </p>
                <Button variant="surface" onClick={() => void query.refetch()}>
                    Try again
                </Button>
            </div>
        );
    } else if (brokers.length === 0 && filtered) {
        results = (
            <EmptyState
                icon={UserRoundSearch}
                heading="No brokers match these filters"
                description="Loosen a filter to see more brokers."
            >
                <Button variant="surface" onClick={clearFilters}>
                    Clear filters
                </Button>
            </EmptyState>
        );
    } else if (brokers.length === 0) {
        results = <OwnerBrokersEmpty tab="browse" />;
    } else {
        results = (
            <div className="flex flex-col gap-2">
                <ul
                    className={cn(
                        browseBrokersGridClass(),
                        query.isFetching &&
                            !query.isFetchingNextPage &&
                            "opacity-60 transition-opacity duration-160",
                    )}
                >
                    {brokers.map((broker) => (
                        <li key={broker.id} className="flex">
                            <div className="flex-1 min-inline-0">
                                <BrowseBrokerCard
                                    broker={broker}
                                    onViewProfile={openProfile}
                                    onInvite={openInvite}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
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
            <TrustNote />

            {/* Stays up while filters narrow to nothing, so they can be loosened again. */}
            {!error && (brokers.length > 0 || filtered || query.isPending) ? (
                <BrowseBrokersToolbar
                    filters={filters}
                    onFiltersChange={patchFilters}
                    onClear={clearFilters}
                    specialties={specialties}
                    resultCount={query.total}
                    totalCount={query.total}
                    isLoading={query.isPending}
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
