"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ShieldCheck, UserRoundSearch } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { type BrokerProfile, representativeApi } from "@/lib/api/representative";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

import { BrokerProfileDialog } from "@/features/owner-brokers/broker-profile-dialog";
import { BrowseBrokerCard } from "@/features/owner-brokers/browse-broker-card";
import {
    type BrowseBrokersFilters,
    collectSpecialties,
    DEFAULT_BROWSE_BROKERS_FILTERS,
    filterAndSortBrokers,
} from "@/features/owner-brokers/browse-brokers-filters";
import {
    browseBrokersGridClass,
    BrowseBrokersSkeleton,
} from "@/features/owner-brokers/browse-brokers-skeleton";
import { BrowseBrokersToolbar } from "@/features/owner-brokers/browse-brokers-toolbar";
import { InviteBrokerDialog } from "@/features/owner-brokers/invite-broker-dialog";
import { OwnerBrokersEmpty } from "@/features/owner-brokers/owner-brokers-empty";
import type { OwnerRequestsView } from "@/features/owner-requests/use-owner-requests-view";

/** First launch is one city with hand-onboarded brokers — one page covers the pool. */
const BROWSE_LIMIT = 60;

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

export function OwnerBrokersBrowse({
    search,
    view,
    onViewChange,
}: {
    search: string;
    view: OwnerRequestsView;
    onViewChange: (view: OwnerRequestsView) => void;
}) {
    const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const [filters, setFilters] = useState<BrowseBrokersFilters>(DEFAULT_BROWSE_BROKERS_FILTERS);

    const [profileBroker, setProfileBroker] = useState<BrokerProfile | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [inviteBroker, setInviteBroker] = useState<BrokerProfile | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setLoading(true);
            setError(null);
            void representativeApi
                .ownerBrokers({ search: search.trim() || undefined, limit: BROWSE_LIMIT })
                .then((page) => {
                    if (cancelled) return;
                    setBrokers(page.items);
                    setTotal(page.total ?? page.items.length);
                })
                .catch((err) => {
                    if (cancelled) return;
                    setError(
                        err instanceof ApiError
                            ? err.message
                            : "Check your connection and try again.",
                    );
                    setBrokers([]);
                    setTotal(0);
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [search, revision]);

    const specialties = useMemo(() => collectSpecialties(brokers), [brokers]);
    const visible = useMemo(() => filterAndSortBrokers(brokers, filters), [brokers, filters]);

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
    if (loading && brokers.length === 0) {
        results = <BrowseBrokersSkeleton view={view} />;
    } else if (error) {
        results = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load brokers</p>
                <p className="body-sm text-ink-muted">{error}</p>
                <Button variant="surface" onClick={() => setRevision((prev) => prev + 1)}>
                    Try again
                </Button>
            </div>
        );
    } else if (brokers.length === 0) {
        results = <OwnerBrokersEmpty tab="browse" />;
    } else if (visible.length === 0) {
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
    } else {
        results = (
            <ul
                className={cn(
                    browseBrokersGridClass(view),
                    loading && "opacity-60 transition-opacity duration-160",
                )}
            >
                {visible.map((broker) => (
                    <li key={broker.id} className="flex">
                        <div className="flex-1 min-inline-0">
                            <BrowseBrokerCard
                                broker={broker}
                                view={view}
                                onViewProfile={openProfile}
                                onInvite={openInvite}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <div className="flex flex-col gap-5 md:gap-6">
            <TrustNote />

            {brokers.length > 0 || (loading && !error) ? (
                <BrowseBrokersToolbar
                    filters={filters}
                    onFiltersChange={patchFilters}
                    onClear={clearFilters}
                    specialties={specialties}
                    resultCount={visible.length}
                    totalCount={brokers.length}
                    isLoading={loading}
                    view={view}
                    onViewChange={onViewChange}
                />
            ) : null}

            {results}

            {!loading && total > brokers.length ? (
                <p className="body-sm text-center text-ink-muted">
                    Showing the first {brokers.length} of {total}. Search by name or area to find
                    others.
                </p>
            ) : null}

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
