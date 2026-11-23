"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import { useQueryClient } from "@tanstack/react-query";

import { clientsApi } from "@/lib/api/clients";
import { contactsApi } from "@/lib/api/contacts";
import { formatPhoneIn } from "@/lib/format/phone";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { notifyWorkflowSaved } from "@/lib/workflows/refresh";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { AppModal } from "@/components/shared/app-modal";
import toast from "@/components/shared/app-toast";
import { Check, ChevronDown, UserRound, Users, X } from "@/components/shared/icons";
import {
    mapClientItemToPicker,
    mapNamedPersonToPicker,
} from "@/components/shared/map-to-people-picker-person";
import type { PeoplePickerPerson } from "@/components/shared/people-picker";
import { PeoplePicker } from "@/components/shared/people-picker";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import { AddOwnerModal } from "@/features/contacts/add-owner-modal";
import type { BuyerRow, OwnerRow } from "@/features/contacts/types";
import { DEFAULT_CONTACTS_FILTERS } from "@/features/contacts/types";
import {
    FORM_SECTIONS_CLASS,
    WizardSection,
} from "@/features/properties/property-form/form-fields";

type AttachedBuyer = PropertyDraftValues["attachedBuyers"][number];

function formatPhone(digits?: string): string {
    if (!digits) return "Phone hidden";
    return formatPhoneIn(digits);
}

export function StepPublish({ propertyId }: { propertyId?: string }) {
    const queryClient = useQueryClient();
    const {
        watch,
        setValue,
        getValues,
        clearErrors,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const attachedOwnerId = values.owner.contactId;
    const attachedBuyers = values.attachedBuyers ?? [];
    const [existingBuyers, setExistingBuyers] = useState<{ id: string; name: string }[]>([]);
    const [buyerLoadError, setBuyerLoadError] = useState(false);
    const [buyerToDetach, setBuyerToDetach] = useState<{ id: string; name: string } | null>(null);
    const [detaching, setDetaching] = useState(false);
    const hasAttachedContacts =
        attachedBuyers.some((buyer) => buyer.id.trim()) || existingBuyers.length > 0;
    useEffect(() => {
        if (attachedOwnerId?.trim()) clearErrors("owner.contactId");
    }, [attachedOwnerId, clearErrors]);
    useEffect(() => {
        if (hasAttachedContacts) clearErrors("attachedBuyers");
    }, [hasAttachedContacts, clearErrors]);
    useEffect(() => {
        if (!propertyId) return;
        let cancelled = false;
        void clientsApi
            .listForProperty(propertyId)
            .then(({ clients, attachedIds }) => {
                if (!cancelled)
                    setExistingBuyers(
                        attachedIds.map((id) => ({
                            id,
                            name: clients.find((client) => client.id === id)?.name ?? "Client",
                        })),
                    );
            })
            .catch(() => {
                if (!cancelled) setBuyerLoadError(true);
            });
        return () => {
            cancelled = true;
        };
    }, [propertyId]);

    function attachOwner(owner: OwnerRow) {
        const phone = owner.phoneDigits?.replace(/\D/g, "").slice(-10) ?? "";
        setValue("owner.contactId", owner.id, { shouldDirty: true, shouldValidate: true });
        setValue("owner.name", owner.name, { shouldDirty: true, shouldValidate: true });
        setValue("owner.phone", phone, { shouldDirty: true, shouldValidate: true });
        setValue("owner.phoneVerified", Boolean(phone), { shouldDirty: true });
        setValue("owner.listerType", "owner", { shouldDirty: true });
    }

    function clearOwner() {
        setValue("owner.contactId", "", { shouldDirty: true, shouldValidate: true });
        setValue("owner.name", "", { shouldDirty: true, shouldValidate: true });
        setValue("owner.phone", "", { shouldDirty: true, shouldValidate: true });
        setValue("owner.phoneVerified", false, { shouldDirty: true });
    }

    function removeBuyer(id: string) {
        const current = getValues("attachedBuyers") ?? [];
        setValue(
            "attachedBuyers",
            current.filter((item) => item.id !== id),
            { shouldDirty: true, shouldValidate: true },
        );
    }

    async function detachBuyer() {
        if (!propertyId || !buyerToDetach || detaching) return;
        setDetaching(true);
        try {
            await clientsApi.detachClientFromProperty(propertyId, buyerToDetach.id);
            setExistingBuyers((current) =>
                current.filter((buyer) => buyer.id !== buyerToDetach.id),
            );
            removeBuyer(buyerToDetach.id);
            setBuyerToDetach(null);
            void queryClient.invalidateQueries();
            toast.success("Client detached from this property.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Couldn’t detach this client. Please try again.",
            );
        } finally {
            setDetaching(false);
        }
    }

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={
                    <>
                        Attach owner{" "}
                        <span className="text-danger" aria-hidden>
                            *
                        </span>
                    </>
                }
                description="Required to publish. Pick one exclusive owner from your owner list."
                tone="private"
            >
                <ContactSearchPanel
                    mode="owner"
                    error={errors.owner?.contactId?.message}
                    selectedId={attachedOwnerId || null}
                    selectedLabel={
                        attachedOwnerId
                            ? {
                                  name: values.owner.name,
                                  phone: values.owner.phone,
                              }
                            : null
                    }
                    onSelectOwner={attachOwner}
                    onClear={clearOwner}
                />
            </WizardSection>

            <WizardSection
                title={<>Attach clients</>}
                description="Optional. Attach clients from your list who may be interested."
                tone="private"
            >
                {existingBuyers.length ? (
                    <div className="mbe-4 space-y-2.5">
                        <p className="text-sm font-semibold text-ink">
                            Attached · {existingBuyers.length}
                        </p>
                        <div
                            className="flex flex-wrap gap-2"
                            role="group"
                            aria-label="Existing attached clients"
                        >
                            {existingBuyers.map((buyer) => (
                                <Button
                                    key={buyer.id}
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    disabled={detaching}
                                    aria-label={`Detach ${buyer.name}`}
                                    onClick={() => setBuyerToDetach(buyer)}
                                    className="
                                      inline-flex items-center gap-2 rounded-full border
                                      border-border-warm bg-surface px-3 py-2 text-sm text-ink
                                    "
                                >
                                    <span aria-hidden>
                                        <UserAvatar name={buyer.name} size="2xs" framed={false} />
                                    </span>
                                    <span className="truncate max-inline-48">{buyer.name}</span>
                                    <X
                                        className="text-ink-muted block-3.5 inline-3.5"
                                        aria-hidden
                                    />
                                </Button>
                            ))}
                        </div>
                        <p className="text-xs/5 text-ink-muted">
                            Select an attached client to detach them, or add more clients below.
                        </p>
                    </div>
                ) : null}
                {buyerLoadError ? (
                    <p role="alert" className="mbe-4 text-sm text-danger">
                        Existing clients could not be loaded. Saving new selections will keep
                        existing links.
                    </p>
                ) : null}
                {attachedBuyers.length ? (
                    <div className="mbe-4 space-y-2">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-semibold text-ink">
                                {existingBuyers.length ? "New selections" : "Selected"} ·{" "}
                                {attachedBuyers.length}
                            </p>
                            <Button
                                type="button"
                                variant="link"
                                size="xs"
                                onClick={() =>
                                    setValue("attachedBuyers", [], {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    })
                                }
                                className="shrink-0 px-0 text-ink-muted hover:text-ink"
                            >
                                Clear all
                            </Button>
                        </div>
                        <div
                            className="flex flex-wrap gap-2"
                            role="group"
                            aria-label="Attached clients"
                        >
                            {attachedBuyers.map((buyer) => (
                                <Button
                                    key={buyer.id}
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    aria-label={`Remove ${buyer.name}`}
                                    onClick={() => removeBuyer(buyer.id)}
                                    className="
                                      gap-2 rounded-full border border-border-warm bg-surface px-3
                                      py-2 text-sm font-medium text-ink min-block-10
                                      hover:bg-surface-muted/35 hover:text-ink
                                      focus-visible:ring-3 focus-visible:ring-ring/30
                                    "
                                >
                                    <span aria-hidden>
                                        <UserAvatar name={buyer.name} size="2xs" framed={false} />
                                    </span>
                                    <span className="truncate max-inline-48">{buyer.name}</span>
                                    <X
                                        className="ms-1.5 text-ink-muted block-3.5 inline-3.5"
                                        aria-hidden
                                    />
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : null}
                <ContactSearchPanel
                    mode="buyer"
                    error={errors.attachedBuyers?.message}
                    selectedId={null}
                    selectedIds={[
                        ...existingBuyers.map((buyer) => buyer.id),
                        ...attachedBuyers.map((buyer) => buyer.id),
                    ]}
                    lockedIds={existingBuyers.map((buyer) => buyer.id)}
                    draftBuyers={attachedBuyers}
                    busy={detaching}
                    selectedLabel={null}
                    onApplyNewBuyers={(buyers) =>
                        setValue("attachedBuyers", buyers, {
                            shouldDirty: true,
                            shouldValidate: true,
                        })
                    }
                    onClear={() => undefined}
                />
            </WizardSection>
            <AppModal
                open={buyerToDetach != null}
                onOpenChange={(open) => {
                    if (!open && !detaching) setBuyerToDetach(null);
                }}
                title="Detach client?"
                size="sm"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={detaching}
                            onClick={() => setBuyerToDetach(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            loading={detaching}
                            onClick={() => void detachBuyer()}
                        >
                            Detach client
                        </Button>
                    </div>
                }
            >
                <p className="text-sm/6 text-ink-muted">
                    Detach <span className="font-semibold text-ink">{buyerToDetach?.name}</span>{" "}
                    from this property? This removes their deal for this property immediately. Their
                    client record and other property links stay in your CRM.
                </p>
            </AppModal>
        </div>
    );
}

function ContactSearchPanel({
    mode,
    error,
    selectedId,
    selectedIds = [],
    lockedIds = [],
    draftBuyers = [],
    busy = false,
    selectedLabel,
    onSelectOwner,
    onApplyNewBuyers,
    onClear,
}: {
    mode: "owner" | "buyer";
    error?: string;
    selectedId: string | null;
    selectedIds?: string[];
    lockedIds?: string[];
    /** Already-chosen new clients — used when confirm spans pages not currently loaded. */
    draftBuyers?: AttachedBuyer[];
    busy?: boolean;
    selectedLabel: { name: string; phone: string } | null;
    onSelectOwner?: (owner: OwnerRow) => void;
    /** Replaces the draft “new” attached clients (locked existing stay separate). */
    onApplyNewBuyers?: (buyers: AttachedBuyer[]) => void;
    onClear: () => void;
}) {
    const queryClient = useQueryClient();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query.trim());
    const knownOwnersRef = useRef(new Map<string, OwnerRow>());
    const knownBuyersRef = useRef(new Map<string, BuyerRow>());

    const filters = useMemo(
        () => ({
            ...DEFAULT_CONTACTS_FILTERS,
            q: deferredQuery,
            tab: mode === "owner" ? ("owners" as const) : ("buyers" as const),
        }),
        [deferredQuery, mode],
    );

    const ownersQuery = useInfiniteItems({
        queryKey: ["property-form", "contacts", "owners", filters.q],
        queryFn: ({ cursor, signal }) => contactsApi.listOwnersPage(filters, cursor, signal),
        enabled: mode === "owner" && pickerOpen,
    });
    const buyersQuery = useInfiniteItems({
        queryKey: ["property-form", "contacts", "buyers", filters.q],
        queryFn: ({ cursor, signal }) => contactsApi.listBuyersPage(filters, cursor, signal),
        enabled: mode === "buyer" && pickerOpen,
    });

    const activeQuery = mode === "owner" ? ownersQuery : buyersQuery;

    useEffect(() => {
        for (const owner of ownersQuery.items as OwnerRow[]) {
            knownOwnersRef.current.set(owner.id, owner);
        }
    }, [ownersQuery.items]);

    useEffect(() => {
        for (const buyer of buyersQuery.items as BuyerRow[]) {
            knownBuyersRef.current.set(buyer.id, buyer);
        }
    }, [buyersQuery.items]);

    const people = useMemo<PeoplePickerPerson[]>(() => {
        if (mode === "owner") {
            return (ownersQuery.items as OwnerRow[]).map((owner) =>
                mapNamedPersonToPicker(
                    {
                        id: owner.id,
                        name: owner.name,
                        phoneDigits: owner.phoneDigits,
                        imageUrl: owner.avatarUrl,
                    },
                    "owner",
                ),
            );
        }
        return (buyersQuery.items as BuyerRow[]).map((buyer) =>
            mapClientItemToPicker({
                id: buyer.id,
                name: buyer.name,
                phoneDigits: buyer.phoneDigits,
                lookingFor: buyer.lookingFor,
                avatarUrl: buyer.avatarUrl,
            }),
        );
    }, [buyersQuery.items, mode, ownersQuery.items]);

    const selectedOwner = useMemo(() => {
        if (!selectedId) return undefined;
        return (ownersQuery.items as OwnerRow[]).find((owner) => owner.id === selectedId);
    }, [ownersQuery.items, selectedId]);
    const lockedSet = useMemo(() => new Set(lockedIds), [lockedIds]);

    function openPicker() {
        setQuery("");
        setPickerOpen(true);
    }

    function invalidateContactQueries() {
        for (const queryKey of [["contacts"], ["property-form", "contacts"]]) {
            void queryClient.invalidateQueries({ queryKey });
        }
        notifyWorkflowSaved("contact");
    }

    const listFooter =
        pickerOpen && !activeQuery.isLoading && people.length > 0 && activeQuery.hasNextPage ? (
            <div className="pbs-3">
                <Button
                    type="button"
                    variant="outline"
                    className="inline-full"
                    loading={activeQuery.isFetchingNextPage}
                    onClick={() => void activeQuery.fetchNextPage()}
                >
                    Load more
                </Button>
            </div>
        ) : null;

    return (
        <div className="space-y-4">
            {mode === "owner" && selectedLabel ? (
                <div
                    className="
                      flex flex-wrap items-center justify-between gap-3 rounded-control border
                      border-border-warm bg-surface p-4
                    "
                >
                    <div className="flex items-center gap-3 min-inline-0">
                        <span aria-hidden>
                            <UserAvatar
                                name={selectedLabel.name}
                                imageUrl={selectedOwner?.avatarUrl}
                                size="md"
                            />
                        </span>
                        <div className="min-inline-0">
                            <p className="truncate text-sm font-bold text-ink">
                                {selectedLabel.name}
                            </p>
                            <p className="text-xs text-ink-muted">
                                {formatPhone(selectedLabel.phone)}
                            </p>
                            <p
                                className="
                                  mbs-1 flex items-center gap-1 text-xs font-medium text-brand-text
                                "
                            >
                                <Check className="block-3 inline-3" aria-hidden /> Owner attached
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={() => {
                            onClear();
                            openPicker();
                        }}
                        className="shrink-0"
                    >
                        Change
                    </Button>
                </div>
            ) : null}

            {mode === "owner" && !selectedId ? (
                <div className="flex flex-col gap-2">
                    <button
                        id="owner-contactId"
                        type="button"
                        disabled={busy}
                        aria-haspopup="dialog"
                        aria-expanded={pickerOpen}
                        data-invalid={error ? "" : undefined}
                        onClick={openPicker}
                        className="
                          flex items-center gap-2.5 rounded-control border-2 border-border-warm
                          bg-surface px-4 text-start transition-[border-color,box-shadow]
                          duration-160 outline-none block-control-xl inline-full
                          hover:border-ring/50
                          focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                          disabled:cursor-not-allowed disabled:opacity-50
                          data-invalid:border-danger-mid
                        "
                    >
                        <UserRound
                            className="shrink-0 text-ink-subtle block-4.5 inline-4.5"
                            aria-hidden
                            strokeWidth={1.75}
                        />
                        <span className="body flex-1 truncate text-ink-subtle">
                            Select an owner
                        </span>
                        <ChevronDown
                            className="shrink-0 text-ink-subtle block-4.5 inline-4.5"
                            aria-hidden
                        />
                    </button>
                    {error ? (
                        <p role="alert" className="body-sm text-danger">
                            {error}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {mode === "buyer" ? (
                <div className="flex flex-col gap-2">
                    <button
                        id="attachedBuyers"
                        type="button"
                        disabled={busy}
                        aria-haspopup="dialog"
                        aria-expanded={pickerOpen}
                        data-invalid={error ? "" : undefined}
                        onClick={openPicker}
                        className="
                          flex items-center gap-2.5 rounded-control border-2 border-border-warm
                          bg-surface px-4 text-start transition-[border-color,box-shadow]
                          duration-160 outline-none block-control-xl inline-full
                          hover:border-ring/50
                          focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                          disabled:cursor-not-allowed disabled:opacity-50
                          data-invalid:border-danger-mid
                        "
                    >
                        <Users
                            className="shrink-0 text-ink-subtle block-4.5 inline-4.5"
                            aria-hidden
                            strokeWidth={1.75}
                        />
                        <span className="body flex-1 truncate text-ink-subtle">
                            {selectedIds.length > lockedIds.length
                                ? `${selectedIds.length - lockedIds.length} new client${selectedIds.length - lockedIds.length === 1 ? "" : "s"} selected`
                                : "Add clients"}
                        </span>
                        <ChevronDown
                            className="shrink-0 text-ink-subtle block-4.5 inline-4.5"
                            aria-hidden
                        />
                    </button>
                    {error ? (
                        <p role="alert" className="body-sm text-danger">
                            {error}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {mode === "owner" ? (
                <PeoplePicker
                    open={pickerOpen}
                    onOpenChange={setPickerOpen}
                    kinds="owner"
                    people={people}
                    value={selectedId}
                    onConfirm={(id) => {
                        if (!id) return;
                        const owner =
                            knownOwnersRef.current.get(id) ??
                            (ownersQuery.items as OwnerRow[]).find((item) => item.id === id);
                        if (owner) onSelectOwner?.(owner);
                    }}
                    searchValue={query}
                    onSearchChange={setQuery}
                    skipLocalFilter
                    loading={activeQuery.isLoading || query.trim() !== deferredQuery}
                    errorText={
                        activeQuery.isError && people.length === 0
                            ? "Couldn’t load owners."
                            : undefined
                    }
                    onRetry={() => void activeQuery.refetch()}
                    listFooter={listFooter}
                    onCreate={() => setCreateOpen(true)}
                    createLabel="Create owner"
                    size="lg"
                />
            ) : (
                <PeoplePicker
                    open={pickerOpen}
                    onOpenChange={setPickerOpen}
                    kinds="client"
                    multiple
                    people={people}
                    value={selectedIds}
                    onConfirm={(ids) => {
                        const nextNewIds = ids.filter((id) => !lockedSet.has(id));
                        const byPerson = new Map(people.map((person) => [person.id, person]));
                        const byDraft = new Map(draftBuyers.map((buyer) => [buyer.id, buyer]));
                        onApplyNewBuyers?.(
                            nextNewIds.map((id) => {
                                const known = knownBuyersRef.current.get(id);
                                const person = byPerson.get(id);
                                const draft = byDraft.get(id);
                                return {
                                    id,
                                    name: known?.name ?? person?.name ?? draft?.name ?? "Client",
                                    phoneDigits:
                                        known?.phoneDigits ??
                                        person?.phoneDigits ??
                                        draft?.phoneDigits ??
                                        "",
                                    avatarUrl:
                                        known?.avatarUrl ?? person?.imageUrl ?? draft?.avatarUrl,
                                };
                            }),
                        );
                    }}
                    searchValue={query}
                    onSearchChange={setQuery}
                    skipLocalFilter
                    loading={activeQuery.isLoading || query.trim() !== deferredQuery}
                    errorText={
                        activeQuery.isError && people.length === 0
                            ? "Couldn’t load clients."
                            : undefined
                    }
                    onRetry={() => void activeQuery.refetch()}
                    listFooter={listFooter}
                    onCreate={() => setCreateOpen(true)}
                    createLabel="Create client"
                    emptyHeading="No clients yet"
                    emptyDescription="Create a client above, then select them here."
                    size="lg"
                />
            )}

            {mode === "owner" ? (
                <AddOwnerModal
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onSaved={(name, _mode, id) => {
                        toast.success("Owner added");
                        invalidateContactQueries();
                        setQuery(name);
                        setCreateOpen(false);
                        if (id) void ownersQuery.refetch();
                    }}
                />
            ) : (
                <AddBuyerModal
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onCreated={(name, id) => {
                        toast.success("Client added");
                        invalidateContactQueries();
                        setQuery(name);
                        setCreateOpen(false);
                        if (id) void buyersQuery.refetch();
                    }}
                />
            )}
        </div>
    );
}
