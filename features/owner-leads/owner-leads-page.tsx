"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import {
    Building2,
    Check,
    ChevronDown,
    Filter,
    HandCoins,
    Search,
    UserRound,
    X,
} from "lucide-react";

import { ApiError } from "@/lib/api/client";
import {
    ownerLeadsApi,
    type OfferStatus,
    type PropertyLead,
} from "@/lib/api/owner-leads";
import { formatInr } from "@/lib/format/inr";
import { formatRelativePast, parseApiInstant } from "@/lib/format/date";
import { ownerPropertyDetailHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

function formatOffer(value?: string | null): string {
    if (!value?.trim()) return "—";
    const amount = Number(value);
    return Number.isFinite(amount) ? formatInr(amount) : value;
}

function leadPropertyLabel(lead: PropertyLead): string {
    return lead.property?.title?.trim() || lead.property?.city || "Property";
}

function leadBrokerLabel(lead: PropertyLead): string {
    return lead.broker?.fullName?.trim() || lead.broker?.email || "Broker";
}

function leadClientLabel(lead: PropertyLead): string {
    return lead.client?.name?.trim() || "Client";
}

function stageLabel(stage?: string | null): string {
    if (!stage) return "—";
    return stage.replace(/_/g, " ");
}

function offerBadgeVariant(
    status?: string | null,
): "brand" | "neutral" | "outline" | "danger" | "urgent" {
    if (status === "accepted") return "brand";
    if (status === "pending") return "urgent";
    if (status === "rejected" || status === "withdrawn") return "danger";
    return "outline";
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

function LeadCardSkeleton() {
    return (
        <div
            className="flex flex-col rounded-card border border-border-warm bg-surface p-4 min-block-[260px]"
            aria-hidden
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-[12px] bg-surface-muted block-10 inline-10" />
                    <div className="flex flex-col gap-2">
                        <div className="rounded-sm bg-surface-muted block-3 inline-24" />
                        <div className="rounded-sm bg-surface-muted block-2.5 inline-20" />
                    </div>
                </div>
                <div className="rounded-md bg-surface-muted block-6 inline-16" />
            </div>
            <div className="mbs-4 flex gap-1.5">
                <div className="rounded-md bg-surface-muted block-6 inline-16" />
                <div className="rounded-md bg-surface-muted block-6 inline-14" />
            </div>
            <div className="mbs-3 rounded-sm bg-surface-muted block-3 inline-32" />
            <div className="mbs-auto flex items-center justify-between border-bs border-border-warm pbs-3">
                <div className="rounded-sm bg-surface-muted block-3 inline-24" />
                <div className="rounded-sm bg-surface-muted block-5 inline-16" />
            </div>
        </div>
    );
}

function LeadsSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div
            className="grid grid-cols-1 gap-3 motion-safe:animate-pulse sm:grid-cols-2 xl:grid-cols-3"
            aria-busy="true"
            aria-label="Loading your leads"
        >
            {Array.from({ length: count }).map((_, index) => (
                <LeadCardSkeleton key={index} />
            ))}
        </div>
    );
}

function OwnerLeadCard({
    lead,
    busy,
    onAccept,
    onReject,
}: {
    lead: PropertyLead;
    busy: boolean;
    onAccept: () => void;
    onReject: () => void;
}) {
    const pendingOffer = lead.offerStatus === "pending";
    const brokerName = leadBrokerLabel(lead);
    const clientName = leadClientLabel(lead);
    const propertyLabel = leadPropertyLabel(lead);
    const updatedAt = lead.updatedAt || lead.createdAt;
    const when = updatedAt ? parseApiInstant(updatedAt) : null;

    return (
        <article
            className="
              contact-card flex flex-col rounded-card border border-border-warm bg-surface p-4
              min-block-[260px]
            "
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-inline-0">
                    <UserAvatar
                        name={brokerName}
                        size="md"
                        fallback="character"
                        className="shrink-0 rounded-[12px]"
                    />
                    <div className="min-inline-0">
                        <h2 className="body-sm truncate font-bold text-ink">{brokerName}</h2>
                        <p className="body-xs flex items-center gap-1 text-ink-muted">
                            <UserRound
                                aria-hidden
                                className="shrink-0 block-3 inline-3"
                                strokeWidth={1.75}
                            />
                            <span className="truncate">{clientName}</span>
                        </p>
                    </div>
                </div>
                {lead.offerStatus ? (
                    <Badge variant={offerBadgeVariant(lead.offerStatus)} className="shrink-0">
                        {lead.offerStatus}
                    </Badge>
                ) : null}
            </div>

            <div className="mbs-4 flex flex-wrap gap-1.5">
                {lead.stage ? (
                    <Badge variant="neutral">{stageLabel(lead.stage)}</Badge>
                ) : null}
                <Badge variant="outline" className="bg-surface">
                    {formatOffer(lead.offerAmount)}
                </Badge>
            </div>

            <Link
                href={ownerPropertyDetailHref(lead.propertyId)}
                className="
                  body-sm flex items-start gap-1.5 font-medium text-brand underline-offset-4
                  min-inline-0
                  hover:underline
                "
            >
                <Building2
                    aria-hidden
                    className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                    strokeWidth={1.75}
                />
                <span className="truncate">{propertyLabel}</span>
            </Link>

            {lead.notes?.trim() ? (
                <p className="body-sm mbs-2 line-clamp-2 text-ink-muted">{lead.notes.trim()}</p>
            ) : null}

            <div className="mbs-auto flex flex-col gap-3 border-bs border-border-warm pbs-3 pts-3">
                <div className="flex items-center justify-between gap-2">
                    <p className="body-xs text-ink-muted">
                        {when ? `Updated ${formatRelativePast(when, new Date())}` : "—"}
                    </p>
                    {lead.listPrice ? (
                        <p className="body-xs font-medium text-ink-muted">
                            List {formatOffer(lead.listPrice)}
                        </p>
                    ) : null}
                </div>

                {pendingOffer ? (
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            loading={busy}
                            onClick={onAccept}
                            className="flex-1 rounded-control bg-brand text-surface hover:bg-brand-text"
                        >
                            <Check aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                            Accept
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            loading={busy}
                            onClick={onReject}
                            className="flex-1 rounded-control border-border-warm"
                        >
                            <X aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                            Reject
                        </Button>
                    </div>
                ) : null}
            </div>
        </article>
    );
}

export function OwnerLeadsPage() {
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
                    <LeadsSkeleton />
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
                ) : (
                    <div
                        className={cn(
                            "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
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
