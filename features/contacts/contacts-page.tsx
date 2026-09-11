"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, ChevronDown, Search, UserPlus, UserRound, Users } from "lucide-react";

import { contactsApi, sortBuyerRows } from "@/lib/api/contacts";
import { cn } from "@/lib/utils";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { AddFab } from "@/components/shared/add-fab";
import { EmptyState } from "@/components/shared/empty-state";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import { AttachBuyerPropertiesModal } from "@/features/contacts/attach-buyer-properties-modal";
import { BuyerCard } from "@/features/contacts/buyer-card";
import { ContactsSkeleton } from "@/features/contacts/contacts-skeleton";
import { OwnerCard } from "@/features/contacts/owner-card";
import {
    type BuyerRow,
    type ContactsFilters,
    type ContactsSort,
    type ContactsSummary,
    type ContactsTab,
    DEFAULT_CONTACTS_FILTERS,
} from "@/features/contacts/types";
import { ViewBuyerLeadsModal } from "@/features/contacts/view-buyer-leads-modal";

const SORT_OPTIONS: { value: ContactsSort; label: string }[] = [
    { value: "recent", label: "Recent first" },
    { value: "name", label: "By name" },
    { value: "most_active", label: "Most active" },
];

const CONTACT_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 1280, columns: 3 },
];

/** Debounced so typing does not refetch on every keystroke. */
function ContactsQueryInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
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
            placeholder="Search name, number or area"
            aria-label="Search your contacts"
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

/**
 * Two-tone headline per docs/DESIGN.md §2.3, describing the tab actually on
 * screen. Counting buyers above a list of owners would be a lie the broker
 * can see.
 */
function buildHeadline(
    summary: ContactsSummary | null,
    tab: ContactsTab,
): { fact: string; meaning: string } {
    if (!summary) {
        return { fact: "Contacts.", meaning: "Everyone on both sides of your deals." };
    }

    if (tab === "owners") {
        if (summary.ownerCount === 0) {
            return { fact: "No owners yet.", meaning: "They appear once one accepts you." };
        }
        return {
            fact: `${summary.ownerCount} ${summary.ownerCount === 1 ? "owner" : "owners"}.`,
            meaning:
                summary.lapsedOwnerCount > 0
                    ? `${summary.lapsedOwnerCount} no longer represented.`
                    : "All still represented by you.",
        };
    }

    if (summary.buyerCount === 0) {
        return { fact: "No buyers yet.", meaning: "Add the people looking to buy or rent." };
    }

    return {
        fact: `${summary.buyerCount} ${summary.buyerCount === 1 ? "buyer" : "buyers"}.`,
        meaning: "Everyone you’re helping find a property.",
    };
}

export function ContactsPage() {
    const [filters, setFilters] = useState<ContactsFilters>(DEFAULT_CONTACTS_FILTERS);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingBuyer, setEditingBuyer] = useState<BuyerRow | null>(null);
    const [attachingBuyer, setAttachingBuyer] = useState<BuyerRow | null>(null);
    const [viewingBuyer, setViewingBuyer] = useState<BuyerRow | null>(null);
    /** Bumped after a create/update/attach so the list and counts both refetch. */
    const [revision, setRevision] = useState(0);

    const buyersQuery = useInfiniteItems({
        queryKey: ["contacts", "buyers", filters.q, filters.sort, revision],
        queryFn: ({ cursor, signal }) => contactsApi.listBuyersPage(filters, cursor, signal),
        enabled: filters.tab === "buyers",
    });
    const ownersQuery = useInfiniteItems({
        queryKey: ["contacts", "owners", filters.q, filters.sort, revision],
        queryFn: ({ cursor, signal }) => contactsApi.listOwnersPage(filters, cursor, signal),
        enabled: filters.tab === "owners",
    });
    const summaryQuery = useQuery({
        queryKey: ["contacts", "summary", revision],
        queryFn: ({ signal }) => contactsApi.summary(signal),
    });

    const handleCreated = useCallback((name: string) => {
        setRevision((prev) => prev + 1);
        toast.success(`${name} added to your buyers`);
    }, []);

    const handleUpdated = useCallback((name: string) => {
        setRevision((prev) => prev + 1);
        setEditingBuyer(null);
        toast.success(`${name} updated`);
    }, []);

    const handleAttached = useCallback(() => {
        setRevision((prev) => prev + 1);
        setAttachingBuyer(null);
    }, []);

    const setTab = useCallback((tab: ContactsTab) => {
        setFilters((prev) => ({ ...prev, tab }));
    }, []);

    const hasSearch = filters.q.trim().length > 0;
    const summary = summaryQuery.data ?? null;
    const isBuyers = filters.tab === "buyers";
    const buyers = useMemo(
        () => sortBuyerRows(buyersQuery.items, filters.sort),
        [buyersQuery.items, filters.sort],
    );
    const rows = isBuyers ? buyers : ownersQuery.items;
    const activeQuery = isBuyers ? buyersQuery : ownersQuery;
    const headline = buildHeadline(summary, filters.tab);

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                <h1 className="h4">
                    <span className="text-ink">{headline.fact}</span>{" "}
                    <span className="text-ink-muted">{headline.meaning}</span>
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    <div
                        role="group"
                        aria-label="Which contacts to show"
                        className="flex items-center gap-1 rounded-control bg-surface-muted p-1"
                    >
                        {(
                            [
                                {
                                    value: "buyers",
                                    label: "Buyers",
                                    icon: Users,
                                    count: summary?.buyerCount,
                                },
                                {
                                    value: "owners",
                                    label: "Owners",
                                    icon: UserRound,
                                    count: summary?.ownerCount,
                                },
                            ] as const
                        ).map((option) => {
                            const Icon = option.icon;
                            const isActive = filters.tab === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => setTab(option.value)}
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
                                    <Icon
                                        aria-hidden
                                        className="block-4 inline-4"
                                        strokeWidth={1.75}
                                    />
                                    {option.label}
                                    {option.count != null ? (
                                        <span className="tabular">{option.count}</span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex shrink-0 items-center gap-2.5">
                        <ContactsQueryInput
                            value={filters.q}
                            onChange={(q) => setFilters((prev) => ({ ...prev, q }))}
                        />

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
                                                        filters.sort === "recent" &&
                                                            "text-ink-muted",
                                                    )}
                                                />
                                            }
                                        >
                                            <ArrowDownUp
                                                aria-hidden
                                                className="text-brand block-4 inline-4"
                                                strokeWidth={1.75}
                                            />
                                            <span className="hidden sm:inline">
                                                {SORT_OPTIONS.find(
                                                    (option) => option.value === filters.sort,
                                                )?.label ?? "Recent first"}
                                            </span>
                                            <span className="sm:hidden">Sort</span>
                                            <ChevronDown
                                                aria-hidden
                                                className="block-4 inline-4"
                                                strokeWidth={1.75}
                                            />
                                        </DropdownMenuTrigger>
                                    }
                                />
                                <TooltipContent side="bottom">
                                    Change the order of the list.
                                </TooltipContent>
                            </Tooltip>

                            <DropdownMenuContent align="end">
                                {SORT_OPTIONS.map((option) => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onClick={() =>
                                            setFilters((prev) => ({ ...prev, sort: option.value }))
                                        }
                                        className={cn(
                                            filters.sort === option.value && "font-semibold",
                                        )}
                                    >
                                        {option.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {activeQuery.isError && rows.length === 0 ? (
                    <p role="alert" className="body-sm text-urgent">
                        Could not load your contacts. Check your connection and try again.
                    </p>
                ) : null}

                {activeQuery.isError && rows.length === 0 ? null : activeQuery.isPending ? (
                    <ContactsSkeleton />
                ) : rows.length === 0 ? (
                    hasSearch ? (
                        <EmptyState
                            icon={Search}
                            heading="Nothing matches"
                            description="Try a different name, number or area."
                            className="py-16"
                        >
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}
                            >
                                Clear the search
                            </Button>
                        </EmptyState>
                    ) : isBuyers ? (
                        <EmptyState
                            icon={Users}
                            heading="No buyers yet"
                            description="Add the people looking to buy or rent. You can link them to a property once they are on your list."
                            className="py-16"
                        >
                            <Button size="lg" onClick={() => setIsAddOpen(true)}>
                                <UserPlus aria-hidden strokeWidth={1.75} />
                                Add your first buyer
                            </Button>
                        </EmptyState>
                    ) : (
                        <EmptyState
                            icon={UserRound}
                            heading="No owners yet"
                            description="Owners appear here once one accepts your request to sell their property."
                            className="py-16"
                        />
                    )
                ) : (
                    <div className="flex flex-col gap-2">
                        {isBuyers ? (
                            <WindowVirtualGrid
                                items={buyers}
                                getKey={(buyer) => buyer.id}
                                estimateRowHeight={430}
                                gap={12}
                                breakpoints={CONTACT_GRID_BREAKPOINTS}
                                ariaLabel="Buyers"
                                renderItem={(buyer) => (
                                    <BuyerCard
                                        buyer={buyer}
                                        onEdit={setEditingBuyer}
                                        onAttachProperties={setAttachingBuyer}
                                        onViewLeads={setViewingBuyer}
                                    />
                                )}
                            />
                        ) : (
                            <WindowVirtualGrid
                                items={ownersQuery.items}
                                getKey={(owner) => owner.id}
                                estimateRowHeight={260}
                                gap={12}
                                breakpoints={CONTACT_GRID_BREAKPOINTS}
                                ariaLabel="Owners"
                                renderItem={(owner) => <OwnerCard owner={owner} />}
                            />
                        )}
                        <InfiniteListStatus
                            hasNextPage={Boolean(activeQuery.hasNextPage)}
                            isFetchingNextPage={activeQuery.isFetchingNextPage}
                            error={activeQuery.isFetchNextPageError ? activeQuery.error : null}
                            onLoadMore={() => void activeQuery.fetchNextPage()}
                        />
                    </div>
                )}

                {/* Owners are never created here — they sign up themselves and
                    arrive with a property — so the action belongs to buyers. */}
                {isBuyers ? (
                    <AddFab
                        onClick={() => setIsAddOpen(true)}
                        label="Add buyer"
                        hint="Add someone looking to buy or rent"
                    />
                ) : null}

                <AddBuyerModal
                    open={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    onCreated={handleCreated}
                />

                <AddBuyerModal
                    open={editingBuyer != null}
                    onOpenChange={(next) => {
                        if (!next) setEditingBuyer(null);
                    }}
                    buyer={editingBuyer}
                    onCreated={handleCreated}
                    onUpdated={handleUpdated}
                />

                {attachingBuyer ? (
                    <AttachBuyerPropertiesModal
                        open
                        onOpenChange={(next) => {
                            if (!next) setAttachingBuyer(null);
                        }}
                        buyer={attachingBuyer}
                        onSaved={handleAttached}
                    />
                ) : null}

                {viewingBuyer ? (
                    <ViewBuyerLeadsModal
                        open
                        onOpenChange={(next) => {
                            if (!next) setViewingBuyer(null);
                        }}
                        buyer={viewingBuyer}
                    />
                ) : null}
            </div>
        </TooltipProvider>
    );
}
