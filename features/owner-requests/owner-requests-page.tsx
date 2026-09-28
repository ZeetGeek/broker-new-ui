"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import {
    representativeApi,
    type BrokerProfile,
    type RepresentationItem,
} from "@/lib/api/representative";
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

import { mapRepresentationToOwnerCard } from "@/features/owner-requests/map-owner-request";
import { OwnerBrokerCard } from "@/features/owner-requests/owner-broker-card";
import { OwnerRequestCard } from "@/features/owner-requests/owner-request-card";
import {
    OwnerRequestsEmpty,
    OwnerRequestsFilteredEmpty,
} from "@/features/owner-requests/owner-requests-empty";
import {
    OwnerRequestsHeader,
    type OwnerRequestsSort,
} from "@/features/owner-requests/owner-requests-header";
import { OwnerRequestsIntro } from "@/features/owner-requests/owner-requests-intro";
import type {
    OwnerRequestCardItem,
    OwnerRequestsSummary,
    OwnerRequestsTab,
} from "@/features/owner-requests/types";
import { useOwnerRequestsView } from "@/features/owner-requests/use-owner-requests-view";
import {
    REQUESTS_GRID_BREAKPOINTS,
    REQUESTS_LIST_BREAKPOINTS,
} from "@/features/properties/my-requests/requests-grid-class";
import { RequestsListSkeleton } from "@/features/properties/my-requests/requests-skeleton";

function isRequestsTab(value: string | null): value is OwnerRequestsTab {
    return (
        value === "browse" ||
        value === "requests" ||
        value === "invitations" ||
        value === "active"
    );
}

function apiMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

function brokerLabel(broker: BrokerProfile): string {
    return (
        broker.displayName?.trim() ||
        broker.fullName?.trim() ||
        broker.orgName?.trim() ||
        "Broker"
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

export function OwnerRequestsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const tab: OwnerRequestsTab = isRequestsTab(tabParam) ? tabParam : "requests";

    const { view, setView } = useOwnerRequestsView();
    const [revision, setRevision] = useState(0);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<OwnerRequestsSort>("recent");

    const [summary, setSummary] = useState<OwnerRequestsSummary | null>(null);
    const [summariesReady, setSummariesReady] = useState(false);

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

    const setTab = useCallback(
        (next: OwnerRequestsTab) => {
            const params = new URLSearchParams(searchParams.toString());
            if (next === "requests") params.delete("tab");
            else params.set("tab", next);
            const qs = params.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    useEffect(() => {
        let cancelled = false;

        void Promise.all([
            representativeApi.ownerRequestPage({ status: "pending", limit: 1 }),
            representativeApi.ownerInvitationPage({ status: "pending", limit: 1 }),
            representativeApi.ownerActivePage({ limit: 1 }),
        ])
            .then(([incoming, invites, active]) => {
                if (cancelled) return;
                setSummary({
                    incomingPending: incoming.total,
                    invitesPending: invites.total,
                    active: active.total,
                });
            })
            .catch(() => {
                /* Intro/chips fall back to empty counts. */
            })
            .finally(() => {
                if (!cancelled) setSummariesReady(true);
            });

        return () => {
            cancelled = true;
        };
    }, [revision]);

    useEffect(() => {
        if (tab !== "browse") return;
        let cancelled = false;
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
        return () => {
            cancelled = true;
        };
    }, [tab, brokerSearch, revision]);

    useEffect(() => {
        if (tab === "browse") return;
        let cancelled = false;
        setQueueLoading(true);
        setQueueError(null);

        const load = async () => {
            if (tab === "requests") {
                const page = await representativeApi.ownerRequestPage({
                    status: "pending",
                    limit: 100,
                });
                return page.items;
            }
            if (tab === "invitations") {
                const page = await representativeApi.ownerInvitationPage({
                    status: "pending",
                    limit: 100,
                });
                return page.items;
            }
            const page = await representativeApi.ownerActivePage({ limit: 100 });
            return page.items;
        };

        void load()
            .then((items) => {
                if (!cancelled) setQueueItems(mapItems(items));
            })
            .catch((err) => {
                if (!cancelled) {
                    setQueueError(apiMessage(err, "Could not load requests"));
                    setQueueItems([]);
                }
            })
            .finally(() => {
                if (!cancelled) setQueueLoading(false);
            });

        return () => {
            cancelled = true;
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
        return () => {
            cancelled = true;
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
            setRevision((v) => v + 1);
            setTab("invitations");
        } catch (err) {
            toast.error(apiMessage(err, "Could not send invitation"));
        } finally {
            setInviteSubmitting(false);
        }
    }, [inviteBroker, inviteMessage, invitePropertyId, setTab]);

    const runRepAction = useCallback(
        async (id: string, action: () => Promise<unknown>, success: string) => {
            setBusyId(id);
            try {
                await action();
                toast.success(success);
                setRevision((v) => v + 1);
            } catch (err) {
                toast.error(apiMessage(err, "Something went wrong"));
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    const visibleCards = useMemo(
        () => sortCards(filterCards(queueItems, search), sort),
        [queueItems, search, sort],
    );

    const cardActions =
        tab === "requests" ? "respond" : tab === "invitations" ? "withdraw" : "none";

    let body: ReactNode;

    if (tab === "browse") {
        if (brokersLoading && brokers.length === 0) {
            body = (
                <div className="flex justify-center py-16">
                    <LoadingSpinner label="Loading brokers" />
                </div>
            );
        } else if (brokers.length === 0) {
            body = <OwnerRequestsEmpty tab="browse" />;
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
    } else if (!summariesReady || (queueLoading && queueItems.length === 0)) {
        body = <RequestsListSkeleton view={view} />;
    } else if (queueError) {
        body = (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="h6 text-ink">Could not load your requests</p>
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
        body = <OwnerRequestsEmpty tab={tab} />;
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
                    ariaLabel="Broker representation requests"
                    renderItem={(item) => (
                        <OwnerRequestCard
                            item={item}
                            view={view}
                            actions={cardActions}
                            isBusy={busyId === item.id}
                            onAccept={() =>
                                void runRepAction(
                                    item.id,
                                    () =>
                                        representativeApi.ownerRespond(item.id, {
                                            status: "accepted",
                                        }),
                                    "Request accepted",
                                )
                            }
                            onReject={() =>
                                void runRepAction(
                                    item.id,
                                    () =>
                                        representativeApi.ownerRespond(item.id, {
                                            status: "rejected",
                                        }),
                                    "Request declined",
                                )
                            }
                            onWithdraw={() =>
                                void runRepAction(
                                    item.id,
                                    () => representativeApi.withdraw(item.id),
                                    "Invitation withdrawn",
                                )
                            }
                        />
                    )}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PortalSectionNav>
                <OwnerRequestsIntro
                    activeTab={tab}
                    summary={summary}
                    isLoading={!summariesReady}
                />
            </PortalSectionNav>

            <OwnerRequestsHeader
                activeTab={tab}
                summary={summary}
                search={tab === "browse" ? brokerSearch : search}
                onSearchChange={tab === "browse" ? setBrokerSearch : setSearch}
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                isLoading={!summariesReady}
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
                                  block-control-md text-[15px] text-ink inline-full
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
