"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { clientsApi } from "@/lib/api/clients";
import { contactsApi, sortBuyerRows } from "@/lib/api/contacts";
import { updateBuyerContact, updateOwnerContact } from "@/lib/contacts/contact-actions";
import { AmbiguousContactNameError, findContactByName } from "@/lib/contacts/find-contact-by-name";
import { PREF_KEYS } from "@/lib/prefs/keys";
import { useInfiniteItems } from "@/hooks/use-infinite-items";
import { usePersistedJson } from "@/hooks/use-persisted-json";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { AddFab } from "@/components/shared/add-fab";
import toast from "@/components/shared/app-toast";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertCircle, ClientsTabIcon, OwnersTabIcon, Search } from "@/components/shared/icons";
import { InfiniteListStatus } from "@/components/shared/infinite-list-status";
import { WindowVirtualGrid } from "@/components/shared/window-virtual-grid";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";
import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import { AddContactModal } from "@/features/contacts/add-contact-modal";
import { AddOwnerModal } from "@/features/contacts/add-owner-modal";
import {
    AttachBuyerPropertiesModal,
    type AttachBuyerTarget,
} from "@/features/contacts/attach-buyer-properties-modal";
import { AttachOwnerToListingModal } from "@/features/contacts/attach-owner-to-listing-modal";
import { BuyerCard } from "@/features/contacts/buyer-card";
import type { ContactPropertyCardItem } from "@/features/contacts/contact-card-model";
import { ContactDetailPanel } from "@/features/contacts/contact-detail-panel";
import {
    type BuyerContactForm,
    type OwnerContactForm,
} from "@/features/contacts/contact-form-model";
import { ContactsHeader } from "@/features/contacts/contacts-header";
import { ContactsIntro } from "@/features/contacts/contacts-intro";
import {
    ContactsHeaderSkeleton,
    ContactsIntroSkeleton,
    ContactsSkeleton,
} from "@/features/contacts/contacts-skeleton";
import { DeleteBuyerDialog } from "@/features/contacts/delete-buyer-dialog";
import { DeleteOwnerDialog } from "@/features/contacts/delete-owner-dialog";
import { OwnerCard } from "@/features/contacts/owner-card";
import {
    type BuyerRow,
    type ContactsFilters,
    DEFAULT_CONTACTS_FILTERS,
    type OwnerRow,
} from "@/features/contacts/types";
import { useShortcut } from "@/features/shortcuts/use-shortcut";
import { useAppSelector } from "@/store/hooks";

/** Contacts grid: 1 → 2 → 3 → 4 columns, capped at four on desktop. */
const CONTACT_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 1024, columns: 3 },
    { minWidth: 1280, columns: 4 },
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

export function ContactsPage({
    initialAddBuyer = false,
    initialAddOwner = false,
    addDealFlow = false,
}: {
    initialAddBuyer?: boolean;
    initialAddOwner?: boolean;
    addDealFlow?: boolean;
}) {
    const queryClient = useQueryClient();
    const userId = useAppSelector((state) => state.auth.user?.id);
    const [filters, setFilters] = usePersistedJson<ContactsFilters>(
        PREF_KEYS.broker.contacts.prefs,
        DEFAULT_CONTACTS_FILTERS,
        { isValid: isContactsFilters },
    );
    const [isAddOpen, setIsAddOpen] = useState(initialAddBuyer);
    useEffect(() => {
        if (!initialAddBuyer && !initialAddOwner && !addDealFlow) return;
        const timer = window.setTimeout(
            () =>
                setFilters((previous) => ({
                    ...previous,
                    tab: initialAddOwner ? "owners" : "buyers",
                    q: "",
                })),
            0,
        );
        return () => window.clearTimeout(timer);
    }, [initialAddBuyer, initialAddOwner, addDealFlow, setFilters]);
    const [isOwnerAddOpen, setIsOwnerAddOpen] = useState(initialAddOwner);
    const [editingBuyer, setEditingBuyer] = useState<BuyerRow | null>(null);
    const [editingOwner, setEditingOwner] = useState<OwnerRow | null>(null);
    const [attachingBuyer, setAttachingBuyer] = useState<AttachBuyerTarget | null>(null);
    const [attachingOwner, setAttachingOwner] = useState<OwnerRow | null>(null);
    const [deletingBuyer, setDeletingBuyer] = useState<BuyerRow | null>(null);
    const [deletingOwner, setDeletingOwner] = useState<OwnerRow | null>(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [selectedContact, setSelectedContact] = useState<
        { type: "buyer"; row: BuyerRow } | { type: "owner"; row: OwnerRow } | null
    >(null);
    const [detailSection, setDetailSection] = useState<"properties" | undefined>();
    const [hasContactQuery, setHasContactQuery] = useState(false);
    const [requestedContact, setRequestedContact] = useState<{
        id?: string;
        name?: string;
        type?: "buyer" | "owner";
    } | null>(null);
    const contactLookup = useQuery({
        queryKey: [
            "contact-deep-link",
            requestedContact?.id,
            requestedContact?.name,
            requestedContact?.type,
        ],
        queryFn: ({ signal }) =>
            requestedContact?.id
                ? contactsApi.findContact(requestedContact.id, requestedContact.type, signal)
                : findContactByName(
                      requestedContact!.name!,
                      requestedContact!.type ?? "buyer",
                      signal,
                  ),
        retry: (count, error) => !(error instanceof AmbiguousContactNameError) && count < 2,
        enabled: requestedContact != null,
    });
    useEffect(() => {
        const contact = contactLookup.data;
        if (!requestedContact || !contact) return;
        const timer = window.setTimeout(() => {
            const query = new URL(window.location.href).searchParams;
            if (
                requestedContact.id
                    ? query.get("contact") !== requestedContact.id
                    : query.get("contactName") !== requestedContact.name
            )
                return;
            setSelectedContact(contact);
            setFilters((previous) => ({
                ...previous,
                tab: contact.type === "buyer" ? "buyers" : "owners",
            }));
        }, 0);
        return () => window.clearTimeout(timer);
    }, [contactLookup.data, requestedContact, setFilters]);
    const openerIdRef = useRef<string | null>(null);
    /** Bumped after a create/update/attach so the list and counts both refetch. */
    const [revision, setRevision] = useState(0);

    const buyersQuery = useInfiniteItems({
        queryKey: ["contacts", "buyers", filters.q, filters.sort, revision],
        queryFn: ({ cursor, signal }) =>
            contactsApi.listBuyersPage(filters, cursor, signal, () =>
                queryClient.fetchQuery({
                    queryKey: ["contacts", "search-source", "buyers", userId, revision],
                    queryFn: ({ signal }) => contactsApi.buyerSearchSource(signal),
                    staleTime: 30_000,
                }),
            ),
        enabled: filters.tab === "buyers",
    });
    const ownersQuery = useInfiniteItems({
        queryKey: ["contacts", "owners", filters.q, filters.sort, filters.ownerOrigin, revision],
        queryFn: ({ cursor, signal }) =>
            contactsApi.listOwnersPage(filters, cursor, signal, () =>
                queryClient.fetchQuery({
                    queryKey: [
                        "contacts",
                        "search-source",
                        "owners",
                        userId,
                        filters.ownerOrigin,
                        filters.sort,
                        revision,
                    ],
                    queryFn: ({ signal }) => contactsApi.ownerSearchSource(filters, signal),
                    staleTime: 30_000,
                }),
            ),
        enabled: filters.tab === "owners",
    });
    const summaryQuery = useQuery({
        queryKey: ["contacts", "summary", revision],
        queryFn: ({ signal }) => contactsApi.summary(signal),
    });

    const handleCreated = useCallback((name: string) => {
        setRevision((prev) => prev + 1);
        toast.success(`${name} added`);
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
                toast.success("Property removed from this client");
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
            toast.success(`${deletingBuyer.name} removed from your clients`);
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
                      : "Could not delete this client. Try again.",
            );
        } finally {
            setDeleteBusy(false);
        }
    }, [deletingBuyer]);

    const handleDeleteOwner = useCallback(async () => {
        if (!deletingOwner) return;
        setDeleteBusy(true);
        try {
            await contactsApi.removeOwner(deletingOwner.id);
            toast.success(`${deletingOwner.name} removed from your owners`);
            setDeletingOwner(null);
            setSelectedContact((current) =>
                current?.type === "owner" && current.row.id === deletingOwner.id ? null : current,
            );
            setRevision((prev) => prev + 1);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Could not delete this owner. Try again.",
            );
        } finally {
            setDeleteBusy(false);
        }
    }, [deletingOwner]);

    const handleOwnerSaved = useCallback((name: string, mode: "created" | "updated") => {
        setRevision((prev) => prev + 1);
        setEditingOwner(null);
        toast.success(mode === "created" ? `${name} added to your owners` : `${name} updated`);
    }, []);

    const hasSearch = filters.q.trim().length > 0;
    const summary = summaryQuery.data ?? null;
    const isBuyers = filters.tab === "buyers";
    const hasActiveFilters = hasSearch || (!isBuyers && filters.ownerOrigin !== "all");
    const buyers = useMemo(
        () => sortBuyerRows(buyersQuery.items, filters.sort),
        [buyersQuery.items, filters.sort],
    );
    const rows = isBuyers ? buyers : ownersQuery.items;
    const activeQuery = isBuyers ? buyersQuery : ownersQuery;
    const resultsLoading =
        activeQuery.isPending || (activeQuery.isFetching && !activeQuery.isFetchingNextPage);
    const isFirstRunEmpty =
        !activeQuery.isPending && !activeQuery.isError && rows.length === 0 && !hasActiveFilters;
    const openAdd = useCallback(() => {
        if (isBuyers) setIsAddOpen(true);
        else setIsOwnerAddOpen(true);
    }, [isBuyers]);

    useShortcut("add_contact", () => setIsAddOpen(true));
    useShortcut("add_owner", () => setIsOwnerAddOpen(true));

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
            url.searchParams.delete("contactName");
            url.searchParams.set("tab", type === "buyer" ? "buyers" : "owners");
            window.history.pushState({ ...window.history.state, contactPanel: true }, "", url);
        },
        [],
    );

    const closeContact = useCallback(() => {
        const url = new URL(window.location.href);
        setSelectedContact(null);
        setHasContactQuery(false);
        setRequestedContact(null);
        setDetailSection(undefined);
        if (url.searchParams.has("contact") || url.searchParams.has("contactName")) {
            if (window.history.state?.contactPanel) window.history.back();
            else {
                url.searchParams.delete("contact");
                url.searchParams.delete("contactName");
                window.history.replaceState(window.history.state, "", url);
            }
        }
        restoreCardFocus();
    }, [restoreCardFocus]);

    useEffect(() => {
        const syncFromUrl = () => {
            const query = new URL(window.location.href).searchParams;
            const id = query.get("contact");
            const name = id ? null : query.get("contactName");
            const tab = query.get("tab");
            if (tab === "buyers" || tab === "owners") {
                setFilters((previous) =>
                    previous.tab === tab && (!name || previous.q === name)
                        ? previous
                        : { ...previous, tab, ...(name ? { q: name } : {}) },
                );
            }
            setHasContactQuery(Boolean(id || name));
            if (!id && !name) {
                setRequestedContact(null);
                setSelectedContact(null);
                restoreCardFocus();
                return;
            }
            const buyer = buyers.find((item) => item.id === id);
            const owner = ownersQuery.items.find((item) => item.id === id);
            if (buyer && tab !== "owners") setSelectedContact({ type: "buyer", row: buyer });
            else if (owner && tab !== "buyers") setSelectedContact({ type: "owner", row: owner });
            else if (
                contactLookup.data &&
                (tab !== "owners" || contactLookup.data.type === "owner") &&
                (tab !== "buyers" || contactLookup.data.type === "buyer") &&
                (id ? contactLookup.data.row.id === id : requestedContact?.name === name)
            )
                setSelectedContact(contactLookup.data);
            else {
                const type =
                    query.get("tab") === "owners"
                        ? "owner"
                        : query.get("tab") === "buyers"
                          ? "buyer"
                          : undefined;
                setSelectedContact(null);
                setRequestedContact((previous) =>
                    previous?.id === (id ?? undefined) &&
                    previous?.name === (name ?? undefined) &&
                    previous?.type === type
                        ? previous
                        : { id: id ?? undefined, name: name ?? undefined, type },
                );
            }
        };
        syncFromUrl();
        window.addEventListener("popstate", syncFromUrl);
        return () => window.removeEventListener("popstate", syncFromUrl);
    }, [
        buyers,
        ownersQuery.items,
        restoreCardFocus,
        contactLookup.data,
        requestedContact?.name,
        setFilters,
    ]);

    const quickUpdateBuyer = useCallback(
        async (buyer: BuyerRow, patch: Partial<BuyerContactForm>) => {
            const row = await updateBuyerContact(buyer, patch);
            setSelectedContact({ type: "buyer", row });
            setRevision((value) => value + 1);
        },
        [],
    );

    const quickUpdateOwner = useCallback(
        async (owner: OwnerRow, patch: Partial<OwnerContactForm>) => {
            const row = await updateOwnerContact(owner, patch);
            setSelectedContact({ type: "owner", row });
            setRevision((value) => value + 1);
        },
        [],
    );

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-4 min-inline-0 sm:gap-6">
                <PortalSectionNav>
                    {summaryQuery.isPending ? (
                        <ContactsIntroSkeleton />
                    ) : (
                        <ContactsIntro
                            summary={summary}
                            tab={filters.tab}
                            isLoading={summaryQuery.isPending}
                            hasError={summaryQuery.isError}
                        />
                    )}
                </PortalSectionNav>
                {addDealFlow ? (
                    <div
                        className="
                      flex flex-wrap items-center gap-3 rounded-inner border border-border-warm p-4
                    "
                    >
                        <p className="body-sm text-ink-muted">
                            Choose a client and use Attach properties to start a deal. Add a client
                            first if needed. New deals start in New.
                        </p>
                        <Button variant="outline" onClick={() => setIsAddOpen(true)}>
                            Add client
                        </Button>
                        <a href="/broker/my-listings" className="body-sm font-medium underline">
                            My Listings
                        </a>
                    </div>
                ) : null}

                {summaryQuery.isPending ? (
                    <ContactsHeaderSkeleton />
                ) : (
                    <ContactsHeader
                        filters={filters}
                        onFiltersChange={setFilters}
                        summary={summary}
                        isLoading={summaryQuery.isPending}
                        onAdd={isFirstRunEmpty ? undefined : openAdd}
                    />
                )}

                {activeQuery.isError && rows.length === 0 ? (
                    <EmptyState
                        size="page"
                        variant="error"
                        icon={AlertCircle}
                        heading={
                            isBuyers
                                ? "Your clients couldn’t be loaded"
                                : "Your owners couldn’t be loaded"
                        }
                        description="Check your connection and try again to see your contacts."
                    >
                        <Button
                            variant="accent"
                            size="sm"
                            onClick={() => void activeQuery.refetch()}
                        >
                            Try again
                        </Button>
                    </EmptyState>
                ) : null}

                {activeQuery.isError && rows.length === 0 ? null : resultsLoading ? (
                    <ContactsSkeleton variant={isBuyers ? "buyer" : "owner"} />
                ) : rows.length === 0 ? (
                    hasActiveFilters ? (
                        <EmptyState
                            size="page"
                            variant="filtered"
                            icon={Search}
                            heading={
                                isBuyers
                                    ? "No clients match your search"
                                    : "No owners match these filters"
                            }
                            description="Try a different name, number or area, or clear your search and filters."
                        >
                            <Button
                                variant="accent"
                                size="sm"
                                onClick={() =>
                                    setFilters((prev) => ({ ...prev, q: "", ownerOrigin: "all" }))
                                }
                            >
                                Clear search & filters
                            </Button>
                        </EmptyState>
                    ) : isBuyers ? (
                        <EmptyState
                            icon={ClientsTabIcon}
                            heading="No clients yet"
                            description="Add the people looking to buy or rent. You can link them to a property once they are on your list."
                            size="page"
                        >
                            <Button size="md" variant="accent" onClick={() => setIsAddOpen(true)}>
                                Add your first client
                            </Button>
                        </EmptyState>
                    ) : (
                        <EmptyState
                            icon={OwnersTabIcon}
                            heading="No owners yet"
                            description={
                                FEATURE_PLATFORM_OWNER
                                    ? "Platform owners appear after accepting your request. You can also add an owner for a private listing."
                                    : "Add an owner to start linking their properties to your listings."
                            }
                            size="page"
                        >
                            <Button
                                size="md"
                                variant="accent"
                                onClick={() => setIsOwnerAddOpen(true)}
                            >
                                Add your first owner
                            </Button>
                        </EmptyState>
                    )
                ) : (
                    <div className="flex flex-col">
                        {isBuyers ? (
                            <WindowVirtualGrid
                                items={buyers}
                                getKey={(buyer) => buyer.id}
                                estimateRowHeight={384}
                                gap="card-grid"
                                gridClassName="grid grid-cols-1 inline-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                breakpoints={CONTACT_GRID_BREAKPOINTS}
                                ariaLabel="Clients"
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
                                gap="card-grid"
                                gridClassName="grid grid-cols-1 inline-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
                                        onDelete={setDeletingOwner}
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

                {isFirstRunEmpty ? null : (
                    <AddFab
                        onClick={openAdd}
                        label={isBuyers ? "Add client" : "Add owner"}
                        hint={
                            isBuyers
                                ? "Add someone you’re helping find a property"
                                : "Add an owner for a private listing"
                        }
                        className="md:hidden"
                    />
                )}

                <AddContactModal
                    open={isAddOpen || isOwnerAddOpen}
                    initialType={isOwnerAddOpen ? "owner" : "client"}
                    onOpenChange={(next) => {
                        if (!next) {
                            setIsAddOpen(false);
                            setIsOwnerAddOpen(false);
                        }
                    }}
                    onClientCreated={(name) => {
                        setFilters((previous) => ({ ...previous, tab: "buyers" }));
                        handleCreated(name);
                    }}
                    onOwnerSaved={(name, mode) => {
                        setFilters((previous) => ({ ...previous, tab: "owners" }));
                        handleOwnerSaved(name, mode);
                    }}
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

                <DeleteOwnerDialog
                    open={deletingOwner != null}
                    onOpenChange={(next) => {
                        if (!next && !deleteBusy) setDeletingOwner(null);
                    }}
                    name={deletingOwner?.name ?? ""}
                    busy={deleteBusy}
                    onConfirm={() => void handleDeleteOwner()}
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
                    manageBrowserHistory={false}
                    contactType={
                        requestedContact?.type ?? (filters.tab === "owners" ? "owner" : "buyer")
                    }
                    contact={selectedContact}
                    open={selectedContact != null || hasContactQuery}
                    loadError={
                        contactLookup.isError
                            ? contactLookup.error instanceof AmbiguousContactNameError
                                ? contactLookup.error.message
                                : "Could not load this contact. Check your connection and try again."
                            : requestedContact && contactLookup.isSuccess && !contactLookup.data
                              ? "This name is not linked to a saved contact in your account."
                              : undefined
                    }
                    onRetryLoad={
                        contactLookup.isError ? () => void contactLookup.refetch() : undefined
                    }
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
