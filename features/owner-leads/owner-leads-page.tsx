"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import { ownerLeadsApi, type PropertyLead } from "@/lib/api/owner-leads";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { HandCoins } from "@/components/shared/icons";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AcceptOfferModal } from "@/features/owner-leads/accept-offer-modal";
import { OwnerLeadBoardCard } from "@/features/owner-leads/owner-lead-board-card";
import {
    isFinishedLead,
    leadBrokerLabel,
    leadClientLabel,
    leadPropertyFacts,
} from "@/features/owner-leads/owner-lead-meta";
import { OwnerLeadsBoard } from "@/features/owner-leads/owner-leads-board";
import { LeadsSkeleton } from "@/features/owner-leads/owner-leads-skeleton";
import {
    type OwnerLeadsSummary,
    type OwnerLeadsSummaryChip,
    OwnerLeadsSummaryStrip,
} from "@/features/owner-leads/owner-leads-summary-strip";
import {
    type OwnerLeadsFilters,
    OwnerLeadsToolbar,
} from "@/features/owner-leads/owner-leads-toolbar";

const DEFAULT_FILTERS: OwnerLeadsFilters = {
    q: "",
    dealType: "",
    locality: "",
    brokerName: "",
    sort: "recent",
};

const DONE_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 1024, columns: 3 },
];

function apiMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

function leadTimestamp(lead: PropertyLead): number {
    const raw = lead.updatedAt || lead.createdAt;
    if (!raw) return 0;
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
}

function matchesClientFilters(lead: PropertyLead, filters: OwnerLeadsFilters): boolean {
    const facts = leadPropertyFacts(lead);
    if (filters.dealType === "rent" && !facts.isRent) return false;
    if (filters.dealType === "sale" && facts.isRent) return false;
    if (filters.locality && facts.locality !== filters.locality) return false;
    if (filters.brokerName && leadBrokerLabel(lead) !== filters.brokerName) return false;

    const q = filters.q.trim().toLowerCase();
    if (!q) return true;

    const haystack = [
        facts.locality,
        facts.city,
        lead.property?.title,
        leadBrokerLabel(lead),
        leadClientLabel(lead),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return haystack.includes(q);
}

export function OwnerLeadsPage() {
    const [filters, setFilters] = useState<OwnerLeadsFilters>(DEFAULT_FILTERS);
    const [summaryChip, setSummaryChip] = useState<OwnerLeadsSummaryChip>("running");
    const [items, setItems] = useState<PropertyLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [acceptingLead, setAcceptingLead] = useState<PropertyLead | null>(null);
    const [acceptError, setAcceptError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(() => {
            setLoading(true);
            setError(null);

            void ownerLeadsApi
                .list({
                    search: filters.q.trim() || undefined,
                    limit: 50,
                })
                .then((page) => {
                    if (cancelled) return;
                    setItems(page.items);
                })
                .catch((err) => {
                    if (cancelled) return;
                    setError(apiMessage(err, "Could not load leads"));
                    setItems([]);
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 0);
        return () => {
            window.clearTimeout(timer);
            cancelled = true;
        };
    }, [filters.q, revision]);

    const localities = useMemo(() => {
        return [
            ...new Set(
                items
                    .map((lead) => leadPropertyFacts(lead).locality)
                    .filter((value): value is string => Boolean(value)),
            ),
        ].sort();
    }, [items]);

    const brokers = useMemo(() => {
        return [...new Set(items.map((lead) => leadBrokerLabel(lead)).filter(Boolean))].sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        const matched = items.filter((lead) => matchesClientFilters(lead, filters));
        const sorted = [...matched].sort((a, b) => {
            const delta = leadTimestamp(b) - leadTimestamp(a);
            return filters.sort === "oldest" ? -delta : delta;
        });
        return sorted;
    }, [filters, items]);

    const liveItems = useMemo(
        () => filteredItems.filter((lead) => !isFinishedLead(lead)),
        [filteredItems],
    );
    const finishedItems = useMemo(
        () => filteredItems.filter((lead) => isFinishedLead(lead)),
        [filteredItems],
    );
    const pendingOfferItems = useMemo(
        () => liveItems.filter((lead) => lead.offerStatus === "pending"),
        [liveItems],
    );

    const summary = useMemo<OwnerLeadsSummary>(
        () => ({
            liveTotal: liveItems.length,
            pendingOfferCount: pendingOfferItems.length,
            finishedCount: finishedItems.length,
        }),
        [finishedItems.length, liveItems.length, pendingOfferItems.length],
    );

    const boardItems =
        summaryChip === "pending"
            ? pendingOfferItems
            : summaryChip === "finished"
              ? finishedItems
              : liveItems;

    const hasSearch =
        filters.q.trim().length > 0 ||
        filters.dealType !== "" ||
        filters.locality !== "" ||
        filters.brokerName !== "" ||
        summaryChip === "pending";

    const isFirstRun =
        !hasSearch && summaryChip === "running" && !loading && items.length === 0 && !error;

    const handlePatch = useCallback((patch: Partial<OwnerLeadsFilters>) => {
        setFilters((prev) => ({ ...prev, ...patch }));
    }, []);

    const handleClearSearch = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        setSummaryChip("running");
    }, []);

    const rejectOffer = useCallback(async (leadId: string) => {
        setBusyId(leadId);
        try {
            await ownerLeadsApi.respond(leadId, { decision: "reject" });
            toast.success("Offer rejected. Your broker will be told.");
            setRevision((value) => value + 1);
        } catch (err) {
            toast.error(apiMessage(err, "Could not respond to offer"));
        } finally {
            setBusyId(null);
        }
    }, []);

    const openAccept = useCallback((lead: PropertyLead) => {
        setAcceptError(null);
        setAcceptingLead(lead);
    }, []);

    const closeAccept = useCallback(() => {
        setAcceptingLead(null);
        setAcceptError(null);
    }, []);

    const confirmAccept = useCallback(async () => {
        if (!acceptingLead) return;
        setBusyId(acceptingLead.id);
        setAcceptError(null);
        try {
            await ownerLeadsApi.respond(acceptingLead.id, { decision: "accept" });
            toast.success("Offer accepted. Your property is marked as sold.");
            setAcceptingLead(null);
            setRevision((value) => value + 1);
        } catch (err) {
            setAcceptError(apiMessage(err, "Could not accept the offer. Try again."));
        } finally {
            setBusyId(null);
        }
    }, [acceptingLead]);

    function renderLeadCard(lead: PropertyLead) {
        return (
            <OwnerLeadBoardCard
                lead={lead}
                busy={busyId === lead.id}
                onAccept={() => openAccept(lead)}
                onReject={() => void rejectOffer(lead.id)}
            />
        );
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-5">
                {!isFirstRun ? (
                    <OwnerLeadsToolbar
                        filters={filters}
                        localities={localities}
                        brokers={brokers}
                        onPatch={handlePatch}
                        trailing={
                            <OwnerLeadsSummaryStrip
                                summary={summary}
                                active={summaryChip}
                                onChange={setSummaryChip}
                            />
                        }
                    />
                ) : null}

                {loading && items.length === 0 ? (
                    <LeadsSkeleton layout="board" />
                ) : error ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <p className="h5 text-ink">Could not load leads</p>
                        <p className="body-sm text-ink-muted">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRevision((value) => value + 1)}
                        >
                            Try again
                        </Button>
                    </div>
                ) : isFirstRun ? (
                    <EmptyState
                        icon={HandCoins}
                        heading="No leads yet"
                        description="When a broker brings a buyer or sends an offer on your listing, it shows up here."
                    />
                ) : summaryChip === "finished" ? (
                    finishedItems.length === 0 ? (
                        <EmptyState
                            icon={HandCoins}
                            heading={hasSearch ? "No matching leads" : "No finished leads"}
                            description={
                                hasSearch
                                    ? "Try another search, type, area, or broker."
                                    : "Sold and lost deals will land here."
                            }
                        >
                            {hasSearch ? (
                                <Button variant="outline" size="sm" onClick={handleClearSearch}>
                                    Clear filters
                                </Button>
                            ) : null}
                        </EmptyState>
                    ) : (
                        <div
                            className={cn(
                                "transition-opacity duration-160",
                                loading && "opacity-60",
                            )}
                        >
                            <WindowVirtualGrid
                                items={finishedItems}
                                getKey={(lead) => lead.id}
                                estimateRowHeight={470}
                                gap={12}
                                breakpoints={DONE_GRID_BREAKPOINTS}
                                ariaLabel="Finished leads"
                                renderItem={renderLeadCard}
                            />
                        </div>
                    )
                ) : boardItems.length === 0 ? (
                    <EmptyState
                        icon={HandCoins}
                        heading={hasSearch ? "No matching leads" : "No leads here yet"}
                        description={
                            hasSearch
                                ? "Try another search, type, area, or broker."
                                : "When a broker brings a buyer or sends an offer on your listing, it shows up here."
                        }
                    >
                        {hasSearch ? (
                            <Button variant="outline" size="sm" onClick={handleClearSearch}>
                                Clear filters
                            </Button>
                        ) : null}
                    </EmptyState>
                ) : (
                    <div className={cn("transition-opacity duration-160", loading && "opacity-60")}>
                        <OwnerLeadsBoard
                            leads={boardItems}
                            busyId={busyId}
                            onAccept={(leadId) => {
                                const lead = items.find((item) => item.id === leadId);
                                if (lead) openAccept(lead);
                            }}
                            onReject={(leadId) => void rejectOffer(leadId)}
                        />
                    </div>
                )}
            </div>

            <AcceptOfferModal
                lead={acceptingLead}
                isSaving={acceptingLead != null && busyId === acceptingLead.id}
                error={acceptError}
                onConfirm={() => void confirmAccept()}
                onCancel={closeAccept}
            />
        </TooltipProvider>
    );
}
