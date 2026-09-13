"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useQuery } from "@tanstack/react-query";
import {
    ArrowDownUp,
    ChevronDown,
    Plus,
    Search,
    UserPlus,
    UserRound,
    UserRoundPlus,
    Users,
} from "lucide-react";

import { contactsApi, sortBuyerRows } from "@/lib/api/contacts";
import { PREF_KEYS } from "@/lib/prefs/keys";
import { cn } from "@/lib/utils";
import { useInfiniteItems } from "@/hooks/use-infinite-items";
import { usePersistedJson } from "@/hooks/use-persisted-json";

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
import { AddOwnerModal } from "@/features/contacts/add-owner-modal";
import { AttachBuyerPropertiesModal } from "@/features/contacts/attach-buyer-properties-modal";
import { BuyerCard } from "@/features/contacts/buyer-card";
import { ContactDetailPanel } from "@/features/contacts/contact-detail-panel";
import {
    emptyBuyerForm,
    emptyOwnerForm,
    type BuyerContactForm,
    type OwnerContactForm,
} from "@/features/contacts/contact-form-model";
import { ContactsSkeleton } from "@/features/contacts/contacts-skeleton";
import { ContactsSpeedDial } from "@/features/contacts/contacts-speed-dial";
import { OwnerCard } from "@/features/contacts/owner-card";
import {
    type BuyerRow,
    type ContactsFilters,
    type ContactsSort,
    type ContactsSummary,
    type ContactsTab,
    DEFAULT_CONTACTS_FILTERS,
    type OwnerRow,
} from "@/features/contacts/types";

const SORT_OPTIONS: { value: ContactsSort; label: string }[] = [
    { value: "recent", label: "Recent first" },
    { value: "name", label: "By name" },
    { value: "most_active", label: "Most active" },
];

const CONTACT_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 1280, columns: 3 },
];

function isContactsFilters(value: unknown): value is ContactsFilters {
    if (typeof value !== "object" || value === null) return false;
    const v = value as Partial<ContactsFilters>;
    return (
        typeof v.q === "string" &&
        (v.tab === "buyers" || v.tab === "owners") &&
        (v.sort === "recent" || v.sort === "name" || v.sort === "most_active") &&
        (v.ownerOrigin === "all" || v.ownerOrigin === "platform" || v.ownerOrigin === "custom")
    );
}

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
    const [filters, setFilters] = usePersistedJson<ContactsFilters>(
        PREF_KEYS.broker.contacts.prefs,
        DEFAULT_CONTACTS_FILTERS,
        { isValid: isContactsFilters },
    );
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isOwnerAddOpen, setIsOwnerAddOpen] = useState(false);
    const [editingBuyer, setEditingBuyer] = useState<BuyerRow | null>(null);
    const [editingOwner, setEditingOwner] = useState<OwnerRow | null>(null);
    const [attachingBuyer, setAttachingBuyer] = useState<BuyerRow | null>(null);
    const [selectedContact, setSelectedContact] = useState<
        { type: "buyer"; row: BuyerRow } | { type: "owner"; row: OwnerRow } | null
    >(null);
    const [detailSection, setDetailSection] = useState<"properties" | undefined>();
    const [hasContactQuery, setHasContactQuery] = useState(false);
    const openerIdRef = useRef<string | null>(null);
    /** Bumped after a create/update/attach so the list and counts both refetch. */
    const [revision, setRevision] = useState(0);

    const buyersQuery = useInfiniteItems({
        queryKey: ["contacts", "buyers", filters.q, filters.sort, revision],
        queryFn: ({ cursor, signal }) => contactsApi.listBuyersPage(filters, cursor, signal),
        enabled: filters.tab === "buyers",
    });
    const ownersQuery = useInfiniteItems({
        queryKey: ["contacts", "owners", filters.q, filters.sort, filters.ownerOrigin, revision],
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

    const handleOwnerSaved = useCallback((name: string, mode: "created" | "updated") => {
        setRevision((prev) => prev + 1);
        setEditingOwner(null);
        toast.success(mode === "created" ? `${name} added to your owners` : `${name} updated`);
    }, []);

    const setTab = useCallback(
        (tab: ContactsTab) => {
            setFilters((prev) => ({ ...prev, tab }));
        },
        [setFilters],
    );

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

    const restoreCardFocus = useCallback(() => {
        const id = openerIdRef.current;
        if (!id) return;
        window.requestAnimationFrame(() => {
            document.querySelector<HTMLElement>(`[data-contact-id="${CSS.escape(id)}"]`)?.focus();
        });
    }, []);

    const openContact = useCallback(
        (type: "buyer" | "owner", row: BuyerRow | OwnerRow, section?: "properties") => {
            openerIdRef.current = row.id;
            setHasContactQuery(true);
            setDetailSection(section);
            setSelectedContact(
                type === "buyer" ? { type, row: row as BuyerRow } : { type, row: row as OwnerRow },
            );
            const url = new URL(window.location.href);
            url.searchParams.set("contact", row.id);
            window.history.pushState({ ...window.history.state, contactPanel: true }, "", url);
        },
        [],
    );

    const closeContact = useCallback(() => {
        const url = new URL(window.location.href);
        setSelectedContact(null);
        setHasContactQuery(false);
        setDetailSection(undefined);
        if (url.searchParams.has("contact")) {
            if (window.history.state?.contactPanel) window.history.back();
            else {
                url.searchParams.delete("contact");
                window.history.replaceState(window.history.state, "", url);
            }
        }
        restoreCardFocus();
    }, [restoreCardFocus]);

    useEffect(() => {
        const syncFromUrl = () => {
            const id = new URL(window.location.href).searchParams.get("contact");
            setHasContactQuery(Boolean(id));
            if (!id) {
                setSelectedContact(null);
                restoreCardFocus();
                return;
            }
            const buyer = buyers.find((item) => item.id === id);
            const owner = ownersQuery.items.find((item) => item.id === id);
            if (buyer) setSelectedContact({ type: "buyer", row: buyer });
            else if (owner) setSelectedContact({ type: "owner", row: owner });
            else if (
                (id.startsWith("owner_") || id.startsWith("custom_owner_")) &&
                filters.tab !== "owners"
            ) {
                setFilters((previous) => ({ ...previous, tab: "owners" }));
            } else if (filters.tab !== "buyers") {
                setFilters((previous) => ({ ...previous, tab: "buyers" }));
            }
        };
        syncFromUrl();
        window.addEventListener("popstate", syncFromUrl);
        return () => window.removeEventListener("popstate", syncFromUrl);
    }, [buyers, filters.tab, ownersQuery.items, restoreCardFocus, setFilters]);

    const quickUpdateBuyer = useCallback(
        async (buyer: BuyerRow, patch: Partial<BuyerContactForm>) => {
            const values: BuyerContactForm = {
                ...emptyBuyerForm(),
                name: buyer.name,
                phone: buyer.phoneDigits,
                intent: buyer.lookingFor,
                propertyTypes: buyer.propertyKind === "any" ? [] : [buyer.propertyKind],
                configurations: buyer.bhk ? [`${buyer.bhk} BHK`] : [],
                localities: buyer.preferredLocalities,
                notes: buyer.notes ?? "",
                lastSpokeAt: buyer.lastContactedAt?.slice(0, 10) ?? "",
                ...buyer.details,
                ...patch,
            };
            await contactsApi.saveBuyer(values, buyer.id);
            setSelectedContact({
                type: "buyer",
                row: {
                    ...buyer,
                    details: values,
                    notes: values.notes,
                    lastContactedAt: values.lastSpokeAt || buyer.lastContactedAt,
                },
            });
            setRevision((value) => value + 1);
        },
        [],
    );

    const quickUpdateOwner = useCallback(
        async (owner: OwnerRow, patch: Partial<OwnerContactForm>) => {
            const values: OwnerContactForm = {
                ...emptyOwnerForm(),
                name: owner.name,
                phone: owner.phoneDigits ?? "",
                status: owner.status ?? "active",
                lastSpokeAt: owner.lastSpokeAt?.slice(0, 10) ?? "",
                tags: owner.tags ?? [],
                notes: owner.notes ?? "",
                ...owner.details,
                ...patch,
            };
            const saved = await contactsApi.saveOwner(values, owner.id, owner.origin);
            setSelectedContact({ type: "owner", row: saved });
            setRevision((value) => value + 1);
        },
        [],
    );

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
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-brand"
                            onClick={() =>
                                isBuyers ? setIsAddOpen(true) : setIsOwnerAddOpen(true)
                            }
                        >
                            <Plus aria-hidden />
                            {isBuyers ? "Add buyer" : "Add owner"}
                        </Button>
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

                {!isBuyers ? (
                    <div role="group" aria-label="Owner origin" className="flex flex-wrap gap-2">
                        {(
                            [
                                ["all", "All", summary?.ownerCount],
                                ["platform", "Platform", summary?.platformOwnerCount],
                                ["custom", "Added by you", summary?.customOwnerCount],
                            ] as const
                        ).map(([value, label, count]) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={filters.ownerOrigin === value}
                                onClick={() =>
                                    setFilters((prev) => ({ ...prev, ownerOrigin: value }))
                                }
                                className={cn(
                                    `
                                      body-sm rounded-control border px-3 py-2 font-medium
                                      transition-colors duration-160
                                    `,
                                    filters.ownerOrigin === value
                                        ? "border-brand bg-brand-soft text-brand-text"
                                        : `
                                          border-border-warm bg-surface text-ink-muted
                                          hover:text-ink
                                        `,
                                )}
                            >
                                {label} <span className="tabular">{count ?? "—"}</span>
                            </button>
                        ))}
                    </div>
                ) : null}

                {activeQuery.isError && rows.length === 0 ? (
                    <div role="alert" className="flex flex-col items-start gap-3 py-12">
                        <p className="body-sm font-medium text-ink">
                            Contacts could not load. Check your connection and try again.
                        </p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => void activeQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </div>
                ) : null}

                {activeQuery.isError && rows.length === 0 ? null : activeQuery.isPending ? (
                    <ContactsSkeleton variant={isBuyers ? "buyer" : "owner"} />
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
                            description="Platform owners appear after accepting your request. You can also add an owner for a private listing."
                            className="py-16"
                        >
                            <Button size="lg" onClick={() => setIsOwnerAddOpen(true)}>
                                <UserRoundPlus aria-hidden strokeWidth={1.75} />
                                Add your first owner
                            </Button>
                        </EmptyState>
                    )
                ) : (
                    <div className="flex flex-col gap-2">
                        {isBuyers ? (
                            <WindowVirtualGrid
                                items={buyers}
                                getKey={(buyer) => buyer.id}
                                estimateRowHeight={320}
                                gap={12}
                                breakpoints={CONTACT_GRID_BREAKPOINTS}
                                ariaLabel="Buyers"
                                renderItem={(buyer) => (
                                    <BuyerCard
                                        buyer={buyer}
                                        onOpen={(row) => openContact("buyer", row)}
                                        onOpenProperties={(row) =>
                                            openContact("buyer", row, "properties")
                                        }
                                        onEdit={setEditingBuyer}
                                        onAttachProperties={setAttachingBuyer}
                                    />
                                )}
                            />
                        ) : (
                            <WindowVirtualGrid
                                items={ownersQuery.items}
                                getKey={(owner) => owner.id}
                                estimateRowHeight={384}
                                gap={12}
                                breakpoints={CONTACT_GRID_BREAKPOINTS}
                                ariaLabel="Owners"
                                renderItem={(owner) => (
                                    <OwnerCard
                                        owner={owner}
                                        onOpen={(row) => openContact("owner", row)}
                                        onOpenProperties={(row) =>
                                            openContact("owner", row, "properties")
                                        }
                                        onEdit={setEditingOwner}
                                        onAttachProperty={setEditingOwner}
                                    />
                                )}
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

                <ContactsSpeedDial
                    onAddBuyer={() => setIsAddOpen(true)}
                    onAddOwner={() => setIsOwnerAddOpen(true)}
                />

                <AddBuyerModal
                    open={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    onCreated={handleCreated}
                />

                <AddOwnerModal
                    open={isOwnerAddOpen}
                    onOpenChange={setIsOwnerAddOpen}
                    onSaved={handleOwnerSaved}
                />

                <AddOwnerModal
                    open={editingOwner != null}
                    onOpenChange={(next) => {
                        if (!next) setEditingOwner(null);
                    }}
                    owner={editingOwner}
                    onSaved={handleOwnerSaved}
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

                <ContactDetailPanel
                    contact={selectedContact}
                    open={selectedContact != null || (hasContactQuery && activeQuery.isPending)}
                    initialSection={detailSection}
                    onOpenChange={(next) => {
                        if (!next) closeContact();
                    }}
                    onEditBuyer={(buyer) => {
                        closeContact();
                        setEditingBuyer(buyer);
                    }}
                    onEditOwner={(owner) => {
                        closeContact();
                        setEditingOwner(owner);
                    }}
                    onAttachBuyer={(buyer) => {
                        closeContact();
                        setAttachingBuyer(buyer);
                    }}
                    onQuickUpdateBuyer={quickUpdateBuyer}
                    onQuickUpdateOwner={quickUpdateOwner}
                />
            </div>
        </TooltipProvider>
    );
}
