"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { tinykeys } from "tinykeys";

import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, UserRound, UserRoundPlus, Users } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { clientsApi, type NewBuyerInput } from "@/lib/api/clients";
import { contactsApi, sortBuyerRows } from "@/lib/api/contacts";
import { PREF_KEYS } from "@/lib/prefs/keys";
import { getShortcut } from "@/lib/shortcuts";
import { useInfiniteItems } from "@/hooks/use-infinite-items";
import { usePersistedJson } from "@/hooks/use-persisted-json";

import { AddFab } from "@/components/shared/add-fab";
import { EmptyState } from "@/components/shared/empty-state";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import { AddOwnerModal } from "@/features/contacts/add-owner-modal";
import {
    AttachBuyerPropertiesModal,
    type AttachBuyerTarget,
} from "@/features/contacts/attach-buyer-properties-modal";
import { AttachOwnerToListingModal } from "@/features/contacts/attach-owner-to-listing-modal";
import { BuyerCard } from "@/features/contacts/buyer-card";
import type { ContactPropertyCardItem } from "@/features/contacts/contact-card-model";
import { ContactDetailPanel } from "@/features/contacts/contact-detail-panel";
import { DeleteBuyerDialog } from "@/features/contacts/delete-buyer-dialog";
import {
    emptyOwnerForm,
    type BuyerContactForm,
    type OwnerContactForm,
} from "@/features/contacts/contact-form-model";
import { ContactsHeader } from "@/features/contacts/contacts-header";
import { ContactsIntro } from "@/features/contacts/contacts-intro";
import { ContactsSkeleton } from "@/features/contacts/contacts-skeleton";
import { OwnerCard } from "@/features/contacts/owner-card";
import {
    type BuyerRow,
    type ContactsFilters,
    DEFAULT_CONTACTS_FILTERS,
    type OwnerRow,
} from "@/features/contacts/types";

/** Match Your listings grid: 1 → 2 → 3 → 4 → 5 columns. */
const CONTACT_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
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

function isEditable(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable ||
        el.getAttribute("role") === "textbox" ||
        el.closest("[contenteditable='true']") !== null
    );
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
    const [attachingBuyer, setAttachingBuyer] = useState<AttachBuyerTarget | null>(null);
    const [attachingOwner, setAttachingOwner] = useState<OwnerRow | null>(null);
    const [deletingBuyer, setDeletingBuyer] = useState<BuyerRow | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
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
        setAttachingOwner(null);
    }, []);

    const detachBuyerProperty = useCallback(
        async (buyer: BuyerRow, property: ContactPropertyCardItem) => {
            if (!property.leadId) {
                throw new Error("This property cannot be removed.");
            }
            try {
                await clientsApi.removeLead(property.leadId);
                setSelectedContact((current) => {
                    if (current?.type !== "buyer" || current.row.id !== buyer.id) return current;
                    const attachedProperties = current.row.attachedProperties.filter(
                        (item) => item.leadId !== property.leadId,
                    );
                    return {
                        type: "buyer",
                        row: {
                            ...current.row,
                            attachedProperties,
                            liveDealCount: attachedProperties.length,
                            activePropertyTitles: attachedProperties.map((item) => item.title),
                            leads: current.row.leads.filter(
                                (lead) => lead.leadId !== property.leadId,
                            ),
                        },
                    };
                });
                setRevision((prev) => prev + 1);
                toast.success("Property removed from this buyer");
            } catch (error) {
                const message =
                    error instanceof ApiError
                        ? error.message
                        : error instanceof Error
                          ? error.message
                          : "Could not remove property";
                toast.error(message);
                throw error;
            }
        },
        [],
    );

    const handleDeleteBuyer = useCallback(async () => {
        if (!deletingBuyer) return;
        setDeleteBusy(true);
        try {
            await clientsApi.remove(deletingBuyer.id);
            toast.success(`${deletingBuyer.name} removed from your buyers`);
            setDeletingBuyer(null);
            setSelectedContact((current) =>
                current?.type === "buyer" && current.row.id === deletingBuyer.id ? null : current,
            );
            setRevision((prev) => prev + 1);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not delete this buyer. Try again.",
            );
        } finally {
            setDeleteBusy(false);
        }
    }, [deletingBuyer]);

    const handleOwnerSaved = useCallback((name: string, mode: "created" | "updated") => {
        setRevision((prev) => prev + 1);
        setEditingOwner(null);
        toast.success(mode === "created" ? `${name} added to your owners` : `${name} updated`);
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
    const openAdd = useCallback(() => {
        if (isBuyers) setIsAddOpen(true);
        else setIsOwnerAddOpen(true);
    }, [isBuyers]);

    useEffect(() => {
        const shortcut = getShortcut("add_contact");
        if (!shortcut) return undefined;

        const unsubscribe = tinykeys(window, {
            [shortcut.keys]: (event) => {
                if (isEditable(event.target)) return;
                if (event.repeat) return;
                if (isAddOpen || isOwnerAddOpen) return;
                if (editingBuyer != null || editingOwner != null) return;
                if (attachingBuyer != null || attachingOwner != null) return;
                if (selectedContact != null) return;
                openAdd();
            },
        });

        return () => unsubscribe();
    }, [
        isAddOpen,
        isOwnerAddOpen,
        editingBuyer,
        editingOwner,
        attachingBuyer,
        attachingOwner,
        selectedContact,
        openAdd,
    ]);

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
            const notes = patch.notes ?? buyer.notes ?? null;
            const input: NewBuyerInput = {
                name: buyer.name,
                phoneDigits: buyer.phoneDigits,
                email: buyer.email,
                lookingFor: buyer.lookingFor,
                propertyKind: buyer.propertyKind,
                preferredLocalities: buyer.preferredLocalities,
                budgetMinInr: buyer.budgetMinInr,
                budgetMaxInr: buyer.budgetMaxInr,
                bhk: buyer.bhk,
                source: buyer.source ?? "walk_in",
                notes,
            };
            await contactsApi.saveBuyer(input, buyer.id);
            setSelectedContact({
                type: "buyer",
                row: {
                    ...buyer,
                    notes,
                    lastContactedAt: patch.lastSpokeAt || buyer.lastContactedAt,
                    details: buyer.details ? { ...buyer.details, ...patch } : buyer.details,
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
                <ContactsIntro summary={summary} tab={filters.tab} />

                <ContactsHeader
                    filters={filters}
                    onFiltersChange={setFilters}
                    summary={summary}
                    isLoading={summaryQuery.isPending}
                    onAdd={openAdd}
                />

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
                                gap={24}
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
                                        onDelete={setDeletingBuyer}
                                    />
                                )}
                            />
                        ) : (
                            <WindowVirtualGrid
                                items={ownersQuery.items}
                                getKey={(owner) => owner.id}
                                estimateRowHeight={320}
                                gap={24}
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
                                        onAttachProperty={setAttachingOwner}
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

                <AddFab
                    onClick={openAdd}
                    label={isBuyers ? "Add buyer" : "Add owner"}
                    hint={
                        isBuyers
                            ? "Add someone you’re helping find a property"
                            : "Add an owner for a private listing"
                    }
                    className="md:hidden"
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
                    onAttach={
                        editingBuyer
                            ? () => {
                                  const target = editingBuyer;
                                  setEditingBuyer(null);
                                  setAttachingBuyer(target);
                              }
                            : undefined
                    }
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

                <DeleteBuyerDialog
                    open={deletingBuyer != null}
                    onOpenChange={(next) => {
                        if (!next && !deleteBusy) setDeletingBuyer(null);
                    }}
                    name={deletingBuyer?.name ?? ""}
                    busy={deleteBusy}
                    onConfirm={() => void handleDeleteBuyer()}
                />

                {attachingOwner ? (
                    <AttachOwnerToListingModal
                        open
                        onOpenChange={(next) => {
                            if (!next) setAttachingOwner(null);
                        }}
                        owner={attachingOwner}
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
                    onAttachOwner={(owner) => {
                        closeContact();
                        setAttachingOwner(owner);
                    }}
                    onDetachBuyerProperty={detachBuyerProperty}
                    onQuickUpdateBuyer={quickUpdateBuyer}
                    onQuickUpdateOwner={quickUpdateOwner}
                />
            </div>
        </TooltipProvider>
    );
}
