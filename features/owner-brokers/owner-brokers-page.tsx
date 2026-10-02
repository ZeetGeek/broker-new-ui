"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import {
    type BrokerProfile,
    type RepresentationItem,
    representativeApi,
} from "@/lib/api/representative";
import { ownerRequestsHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { OwnerBrokersEmpty } from "@/features/owner-brokers/owner-brokers-empty";
import { OwnerBrokersHeader } from "@/features/owner-brokers/owner-brokers-header";
import type { OwnerBrokersTab } from "@/features/owner-brokers/types";
import { mapRepresentationToOwnerCard } from "@/features/owner-requests/map-owner-request";
import { OwnerBrokerCard } from "@/features/owner-requests/owner-broker-card";
import { OwnerRequestCard } from "@/features/owner-requests/owner-request-card";
import { OwnerRequestsFilteredEmpty } from "@/features/owner-requests/owner-requests-empty";
import type { OwnerRequestsSort } from "@/features/owner-requests/owner-requests-header";
import type { OwnerRequestCardItem } from "@/features/owner-requests/types";
import { useOwnerRequestsView } from "@/features/owner-requests/use-owner-requests-view";
import {
    REQUESTS_GRID_BREAKPOINTS,
    REQUESTS_LIST_BREAKPOINTS,
} from "@/features/properties/my-requests/requests-grid-class";
import { RequestsListSkeleton } from "@/features/properties/my-requests/requests-skeleton";

function isBrokersTab(value: string | null): value is OwnerBrokersTab {
    return value === "browse" || value === "active";
}

function apiMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

function brokerLabel(broker: BrokerProfile): string {
    return (
        broker.displayName?.trim() || broker.fullName?.trim() || broker.orgName?.trim() || "Broker"
    );
}

function sortCards(items: OwnerRequestCardItem[], sort: OwnerRequestsSort) {
    const next = [...items];
    next.sort((a, b) => {
        const aTime = Date.parse(a.createdAt) || 0;
        const bTime = Date.parse(b.createdAt) || 0;
        return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });
    return next;
}

function filterCards(items: OwnerRequestCardItem[], search: string) {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
        const haystack = [
            item.title,
            item.locality,
            item.city,
            item.brokerName,
            item.brokerOrgName ?? "",
            item.message ?? "",
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
}

function mapItems(rows: RepresentationItem[]): OwnerRequestCardItem[] {
    return rows
        .map((row) => mapRepresentationToOwnerCard(row))
        .filter((row): row is OwnerRequestCardItem => row != null);
}

export function OwnerBrokersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const tab: OwnerBrokersTab = isBrokersTab(tabParam) ? tabParam : "browse";

    const { view, setView } = useOwnerRequestsView();
    const [revision, setRevision] = useState(0);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<OwnerRequestsSort>("recent");

    const [activeCount, setActiveCount] = useState<number | null>(null);

    const [brokerSearch, setBrokerSearch] = useState("");
    const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
    const [brokersLoading, setBrokersLoading] = useState(false);

    const [queueItems, setQueueItems] = useState<OwnerRequestCardItem[]>([]);
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState<string | null>(null);

    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteBroker, setInviteBroker] = useState<BrokerProfile | null>(null);
    const [invitePropertyId, setInvitePropertyId] = useState("");
    const [inviteMessage, setInviteMessage] = useState("");
    const [properties, setProperties] = useState<{ id: string; label: string }[]>([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [inviteSubmitting, setInviteSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void representativeApi
            .ownerActivePage({ limit: 1 })
            .then((page) => {
                if (!cancelled) setActiveCount(page.total);
            })
            .catch(() => {
                /* Chip falls back to an empty count. */
            });
        return () => {
            cancelled = true;
        };
    }, [revision]);

    useEffect(() => {
        if (tab !== "browse") return;
        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setBrokersLoading(true);
            void representativeApi
                .ownerBrokers({ search: brokerSearch.trim() || undefined, limit: 24 })
                .then((page) => {
                    if (!cancelled) setBrokers(page.items);
                })
                .catch((err) => {
                    if (!cancelled) {
                        toast.error(apiMessage(err, "Could not load brokers"));
                        setBrokers([]);
                    }
                })
                .finally(() => {
                    if (!cancelled) setBrokersLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [tab, brokerSearch, revision]);

    useEffect(() => {
        if (tab !== "active") return;
        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setQueueLoading(true);
            setQueueError(null);
            void representativeApi
                .ownerActivePage({ limit: 100 })
                .then((page) => {
                    if (!cancelled) setQueueItems(mapItems(page.items));
                })
                .catch((err) => {
                    if (!cancelled) {
                        setQueueError(apiMessage(err, "Could not load active brokers"));
                        setQueueItems([]);
                    }
                })
                .finally(() => {
                    if (!cancelled) setQueueLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [tab, revision]);

    const openInvite = useCallback((broker: BrokerProfile) => {
        setInviteBroker(broker);
        setInvitePropertyId("");
        setInviteMessage("");
        setInviteOpen(true);
    }, []);

    useEffect(() => {
        if (!inviteOpen) return;
        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setPropertiesLoading(true);
            void propertiesApi
                .list({ limit: 100, publishStatus: "published" })
                .then((page) => {
                    if (cancelled) return;
                    setProperties(
                        page.items.map((item) => ({
                            id: item.id,
                            label: item.title?.trim() || item.city || "Untitled listing",
                        })),
                    );
                })
                .catch((err) => {
                    if (!cancelled) toast.error(apiMessage(err, "Could not load properties"));
                })
                .finally(() => {
                    if (!cancelled) setPropertiesLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [inviteOpen]);

    const submitInvite = useCallback(async () => {
        if (!inviteBroker?.id || !invitePropertyId) {
            toast.error("Pick a property to invite this broker.");
            return;
        }
        setInviteSubmitting(true);
        try {
            await representativeApi.ownerInvite({
                propertyId: invitePropertyId,
                brokerId: inviteBroker.id,
                message: inviteMessage.trim() || undefined,
            });
            toast.success("Invitation sent");
            setInviteOpen(false);
            router.push(ownerRequestsHref("invitations"));
        } catch (err) {
            toast.error(apiMessage(err, "Could not send invitation"));
        } finally {
            setInviteSubmitting(false);
        }
    }, [inviteBroker, inviteMessage, invitePropertyId, router]);

    const visibleCards = useMemo(
        () => sortCards(filterCards(queueItems, search), sort),
        [queueItems, search, sort],
    );

    let body: ReactNode;

    if (tab === "browse") {
        if (brokersLoading && brokers.length === 0) {
            body = (
                <div className="flex justify-center py-16">
                    <LoadingSpinner label="Loading brokers" />
                </div>
            );
        } else if (brokers.length === 0) {
            body = <OwnerBrokersEmpty tab="browse" />;
        } else {
            body = (
                <div className={cn(brokersLoading && "opacity-60 transition-opacity duration-160")}>
                    <ul className="flex flex-col gap-3">
                        {brokers.map((broker) => (
                            <li key={broker.id}>
                                <OwnerBrokerCard broker={broker} onInvite={openInvite} />
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
    } else if (queueLoading && queueItems.length === 0) {
        body = <RequestsListSkeleton view={view} />;
    } else if (queueError) {
        body = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load active brokers</p>
                <p className="body-sm text-ink-muted">{queueError}</p>
                <button
                    type="button"
                    onClick={() => setRevision((prev) => prev + 1)}
                    className="body-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    } else if (queueItems.length === 0) {
        body = <OwnerBrokersEmpty tab="active" />;
    } else if (visibleCards.length === 0) {
        body = (
            <OwnerRequestsFilteredEmpty
                searchQuery={search}
                onClearFilters={search.trim() ? () => setSearch("") : undefined}
            />
        );
    } else {
        body = (
            <div className={cn(queueLoading && "opacity-60 transition-opacity duration-160")}>
                <WindowVirtualGrid
                    items={visibleCards}
                    getKey={(item) => item.id}
                    estimateRowHeight={view === "list" ? 224 : 480}
                    gap={24}
                    breakpoints={
                        view === "list" ? REQUESTS_LIST_BREAKPOINTS : REQUESTS_GRID_BREAKPOINTS
                    }
                    ariaLabel="Active brokers"
                    renderItem={(item) => (
                        <OwnerRequestCard item={item} view={view} actions="none" />
                    )}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <h1 className="h3 text-start text-ink">
                    Browse brokers.{" "}
                    <span className="text-ink-muted">
                        {tab === "browse"
                            ? "Find brokers and invite them to represent your listings"
                            : "Brokers currently representing your properties"}
                    </span>
                </h1>
            </PortalSectionNav>

            <OwnerBrokersHeader
                activeTab={tab}
                activeCount={activeCount}
                search={tab === "browse" ? brokerSearch : search}
                onSearchChange={tab === "browse" ? setBrokerSearch : setSearch}
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                isLoading={activeCount == null}
            />

            {body}

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogPopup className="max-inline-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Invite {inviteBroker ? brokerLabel(inviteBroker) : "broker"}
                        </DialogTitle>
                        <DialogDescription>
                            Choose a published listing and add an optional note.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="body-sm font-semibold text-ink">Property</span>
                            <select
                                className="
                                  rounded-control border-2 border-border-warm bg-surface px-3.5
                                  text-[15px] text-ink block-control-md inline-full
                                "
                                value={invitePropertyId}
                                disabled={propertiesLoading}
                                onChange={(event) => setInvitePropertyId(event.target.value)}
                            >
                                <option value="">
                                    {propertiesLoading ? "Loading…" : "Select a property"}
                                </option>
                                {properties.map((property) => (
                                    <option key={property.id} value={property.id}>
                                        {property.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="body-sm font-semibold text-ink">
                                Message (optional)
                            </span>
                            <Textarea
                                value={inviteMessage}
                                onChange={(event) => setInviteMessage(event.target.value)}
                                placeholder="Why you'd like them to represent this listing"
                                rows={3}
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setInviteOpen(false)}>
                                Cancel
                            </Button>
                            <Button loading={inviteSubmitting} onClick={() => void submitInvite()}>
                                Send invite
                            </Button>
                        </div>
                    </div>
                </DialogPopup>
            </Dialog>
        </div>
    );
}
