"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { ChevronDown, Filter, HandCoins, LayoutGrid, List, Search } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { type OfferStatus, ownerLeadsApi, type PropertyLead } from "@/lib/api/owner-leads";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { OwnerLeadCard } from "@/features/owner-leads/owner-lead-card";
import { OwnerLeadsBoard } from "@/features/owner-leads/owner-leads-board";
import { LeadsSkeleton } from "@/features/owner-leads/owner-leads-skeleton";
import { useOwnerLeadsLayout } from "@/features/owner-leads/use-owner-leads-layout";

type OfferFilter = "all" | "pending" | "accepted" | "rejected";

const STAGE_OPTIONS: { value: string; label: string }[] = [
    { value: "", label: "All stages" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "site_visit", label: "Site visit" },
    { value: "negotiation", label: "Negotiation" },
    { value: "offer", label: "Offer" },
    { value: "closed_won", label: "Closed won" },
    { value: "closed_lost", label: "Closed lost" },
];

const OFFER_TABS: { value: OfferFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
];

function apiMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

function buildHeadline(
    total: number,
    pending: number,
    filter: OfferFilter,
): { fact: string; meaning: string } {
    if (total === 0) {
        return {
            fact: "No leads yet.",
            meaning: "Offers and buyer interest from your brokers will show here.",
        };
    }

    if (filter === "pending") {
        if (pending === 0) {
            return {
                fact: "No pending offers.",
                meaning: "You're caught up — nothing waiting on a reply.",
            };
        }
        return {
            fact: `${pending} ${pending === 1 ? "offer" : "offers"} waiting.`,
            meaning: "Accept or reject so your broker can move ahead.",
        };
    }

    return {
        fact: `${total} ${total === 1 ? "lead" : "leads"}.`,
        meaning:
            pending > 0
                ? `${pending} ${pending === 1 ? "offer needs" : "offers need"} your reply.`
                : "Buyer interest across your properties.",
    };
}

/** Debounced so typing does not refetch on every keystroke. */
function LeadsQueryInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
    const [draft, setDraft] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        setDraft(value);
    }

    useEffect(() => {
        if (draft === value) return;
        const timer = window.setTimeout(() => onChange(draft), 300);
        return () => window.clearTimeout(timer);
    }, [draft, onChange, value]);

    return (
        <Input
            size="sm"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search broker, property or client"
            aria-label="Search your leads"
            startIcon={Search}
            clearable
            wrapperClassName="
              min-inline-44 inline-44 shadow-sm
              sm:min-inline-52 sm:inline-52
              lg:min-inline-64 lg:inline-64
            "
            className="
              rounded-control border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

export function OwnerLeadsPage() {
    const { layout, setLayout } = useOwnerLeadsLayout();
    const [search, setSearch] = useState("");
    const [offerFilter, setOfferFilter] = useState<OfferFilter>("all");
    const [stageFilter, setStageFilter] = useState("");
    const [items, setItems] = useState<PropertyLead[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const offerStatus: OfferStatus | undefined =
            offerFilter === "all" ? undefined : offerFilter;

        void ownerLeadsApi
            .list({
                search: search.trim() || undefined,
                stage: stageFilter || undefined,
                offerStatus,
                limit: 50,
            })
            .then((page) => {
                if (cancelled) return;
                setItems(page.items);
                setTotal(page.total);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(apiMessage(err, "Could not load leads"));
                setItems([]);
                setTotal(0);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [search, offerFilter, stageFilter, revision]);

    const pendingCount = useMemo(
        () => items.filter((lead) => lead.offerStatus === "pending").length,
        [items],
    );

    const headline = buildHeadline(
        offerFilter === "all" ? total : items.length,
        offerFilter === "pending" ? items.length : pendingCount,
        offerFilter,
    );

    const stageLabelActive =
        STAGE_OPTIONS.find((option) => option.value === stageFilter)?.label ?? "All stages";

    const hasActiveFilters = Boolean(search.trim() || stageFilter || offerFilter !== "all");

    const respond = useCallback(async (leadId: string, decision: "accept" | "reject") => {
        setBusyId(leadId);
        try {
            await ownerLeadsApi.respond(leadId, { decision });
            toast.success(decision === "accept" ? "Offer accepted" : "Offer rejected");
            setRevision((value) => value + 1);
        } catch (err) {
            toast.error(apiMessage(err, "Could not respond to offer"));
        } finally {
            setBusyId(null);
        }
    }, []);

    const clearFilters = useCallback(() => {
        setSearch("");
        setOfferFilter("all");
        setStageFilter("");
    }, []);

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                <h1 className="h4">
                    <span className="text-ink">{headline.fact}</span>{" "}
                    <span className="text-ink-muted">{headline.meaning}</span>
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div
                            role="group"
                            aria-label="Which offers to show"
                            className="flex items-center gap-1 rounded-control bg-surface-muted p-1"
                        >
                            {OFFER_TABS.map((tab) => {
                                const isActive = offerFilter === tab.value;
                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => setOfferFilter(tab.value)}
                                        className={cn(
                                            `
                                              body-sm flex items-center gap-2 rounded-control px-3.5
                                              transition-colors duration-160 block-control-sm
                                            `,
                                            isActive
                                                ? "bg-surface font-semibold text-ink shadow-xs"
                                                : "font-normal text-ink-muted hover:text-ink",
                                        )}
                                    >
                                        {tab.label}
                                        {tab.value === "pending" && pendingCount > 0 ? (
                                            <span className="tabular">{pendingCount}</span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                        <LeadsQueryInput value={search} onChange={setSearch} />

                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <DropdownMenuTrigger
                                            render={
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        `
                                                          body-sm flex shrink-0 items-center gap-2
                                                          rounded-control border border-border-warm
                                                          bg-surface px-4 font-medium text-ink
                                                          transition-colors duration-160
                                                          block-control-lg
                                                          hover:border-ink/25
                                                        `,
                                                        !stageFilter && "text-ink-muted",
                                                    )}
                                                />
                                            }
                                        >
                                            <Filter
                                                aria-hidden
                                                className="text-brand block-4 inline-4"
                                                strokeWidth={1.75}
                                            />
                                            <span className="hidden sm:inline">
                                                {stageLabelActive}
                                            </span>
                                            <span className="sm:hidden">Stage</span>
                                            <ChevronDown
                                                aria-hidden
                                                className="block-4 inline-4"
                                                strokeWidth={1.75}
                                            />
                                        </DropdownMenuTrigger>
                                    }
                                />
                                <TooltipContent side="bottom">
                                    Filter by pipeline stage.
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end">
                                {STAGE_OPTIONS.map((option) => (
                                    <DropdownMenuItem
                                        key={option.value || "all"}
                                        onClick={() => setStageFilter(option.value)}
                                        className={cn(
                                            stageFilter === option.value && "font-semibold",
                                        )}
                                    >
                                        {option.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div
                            role="group"
                            aria-label="Board or list"
                            className="flex items-center gap-1 rounded-control bg-surface-muted p-1"
                        >
                            {(
                                [
                                    { value: "board", label: "Board", icon: LayoutGrid },
                                    { value: "list", label: "List", icon: List },
                                ] as const
                            ).map((option) => {
                                const Icon = option.icon;
                                const isActive = layout === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={isActive}
                                        aria-label={option.label}
                                        onClick={() => setLayout(option.value)}
                                        className={cn(
                                            `
                                              body-sm flex items-center gap-1.5 rounded-control px-3
                                              transition-colors duration-160 block-control-sm
                                            `,
                                            isActive
                                                ? "bg-surface font-semibold text-ink shadow-xs"
                                                : "font-normal text-ink-muted hover:text-ink",
                                        )}
                                    >
                                        <Icon
                                            aria-hidden
                                            className="block-4 inline-4"
                                            strokeWidth={1.75}
                                        />
                                        <span className="hidden sm:inline">{option.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {hasActiveFilters ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-ink-muted"
                                onClick={clearFilters}
                            >
                                Clear
                            </Button>
                        ) : null}
                    </div>
                </div>

                {loading && items.length === 0 ? (
                    <LeadsSkeleton layout={layout} />
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
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={HandCoins}
                        heading={hasActiveFilters ? "No matching leads" : "No leads yet"}
                        description={
                            hasActiveFilters
                                ? "Try another search, stage, or offer status."
                                : "When a broker brings a buyer or sends an offer on your listing, it shows up here."
                        }
                    >
                        {hasActiveFilters ? (
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        ) : null}
                    </EmptyState>
                ) : layout === "board" ? (
                    <div className={cn("transition-opacity duration-160", loading && "opacity-60")}>
                        <OwnerLeadsBoard
                            leads={items}
                            busyId={busyId}
                            onAccept={(leadId) => void respond(leadId, "accept")}
                            onReject={(leadId) => void respond(leadId, "reject")}
                        />
                    </div>
                ) : (
                    <div
                        className={cn(
                            `
                              flex flex-col gap-4 transition-opacity duration-160
                              lg:grid lg:grid-cols-2
                            `,
                            loading && "opacity-60",
                        )}
                    >
                        {items.map((lead) => (
                            <OwnerLeadCard
                                key={lead.id}
                                lead={lead}
                                busy={busyId === lead.id}
                                onAccept={() => void respond(lead.id, "accept")}
                                onReject={() => void respond(lead.id, "reject")}
                            />
                        ))}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
