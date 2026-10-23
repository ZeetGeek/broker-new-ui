"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import { clientsApi } from "@/lib/api/clients";
import { contactsApi } from "@/lib/api/contacts";
import { formatPhoneIn } from "@/lib/format/phone";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

import { Check, Plus, Search, X } from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

function ContactOption({
    name,
    phone,
    imageUrl,
    detail,
    active,
    multiple,
    locked = false,
    onSelect,
}: {
    name: string;
    phone?: string;
    imageUrl?: string;
    detail?: string;
    active: boolean;
    multiple: boolean;
    locked?: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            disabled={locked}
            onClick={onSelect}
            className="
              flex items-center gap-3 rounded-control p-3 text-start inline-full min-block-18
              hover:bg-surface-muted/35
              focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand
              disabled:cursor-default
            "
        >
            <span aria-hidden>
                <UserAvatar name={name} imageUrl={imageUrl} size="md" />
            </span>
            <span className="flex-1 space-y-1 min-inline-0">
                <span className="block truncate text-sm font-semibold text-ink">{name}</span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                    <span className="tabular">{formatPhone(phone)}</span>
                    {detail ? (
                        <>
                            <span aria-hidden className="text-ink-subtle">
                                ·
                            </span>
                            <span>{detail}</span>
                        </>
                    ) : null}
                </span>
            </span>
            {locked ? (
                <span className="shrink-0 text-xs font-medium text-brand-text">Attached</span>
            ) : (
                <span
                    aria-hidden
                    className={cn(
                        "flex shrink-0 items-center justify-center border block-5 inline-5",
                        multiple ? "rounded-md" : "rounded-full",
                        active
                            ? "border-brand bg-brand text-white"
                            : "border-border-warm bg-surface text-ink-subtle",
                    )}
                >
                    {active ? (
                        <Check className="block-3.5 inline-3.5" />
                    ) : multiple ? (
                        <Plus className="block-3 inline-3" />
                    ) : null}
                </span>
            )}
        </button>
    );
}

export function StepPublish({ propertyId }: { propertyId?: string }) {
    const { watch, setValue, getValues } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const attachedOwnerId = values.owner.contactId;
    const attachedBuyers = values.attachedBuyers ?? [];
    const [existingBuyers, setExistingBuyers] = useState<{ id: string; name: string }[]>([]);
    const [buyerLoadError, setBuyerLoadError] = useState(false);
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
                            name: clients.find((client) => client.id === id)?.name ?? "Buyer",
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

    function toggleBuyer(buyer: BuyerRow) {
        if (existingBuyers.some((existing) => existing.id === buyer.id)) return;
        const current = getValues("attachedBuyers") ?? [];
        const exists = current.some((item) => item.id === buyer.id);
        const next: AttachedBuyer[] = exists
            ? current.filter((item) => item.id !== buyer.id)
            : [
                  ...current,
                  {
                      id: buyer.id,
                      name: buyer.name,
                      phoneDigits: buyer.phoneDigits,
                  },
              ];
        setValue("attachedBuyers", next, { shouldDirty: true, shouldValidate: true });
    }

    function removeBuyer(id: string) {
        const current = getValues("attachedBuyers") ?? [];
        setValue(
            "attachedBuyers",
            current.filter((item) => item.id !== id),
            { shouldDirty: true, shouldValidate: true },
        );
    }

    return (
        <div className={FORM_SECTIONS_CLASS}>
            <WizardSection
                title={<>Attach owner</>}
                description="Optional. Pick an exclusive owner from your contacts. One owner per listing."
                tone="private"
            >
                <ContactSearchPanel
                    mode="owner"
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
                title={<>Attach buyers</>}
                description="Optional. Link buyers from your contacts to this property in your CRM."
                tone="private"
            >
                {existingBuyers.length ? (
                    <p className="mbe-4 text-sm text-ink-muted">
                        Already attached: {existingBuyers.map((buyer) => buyer.name).join(", ")}.
                        Manage existing links from the property page.
                    </p>
                ) : null}
                {buyerLoadError ? (
                    <p role="alert" className="mbe-4 text-sm text-danger">
                        Existing buyers could not be loaded. Saving new selections will keep
                        existing links.
                    </p>
                ) : null}
                {attachedBuyers.length ? (
                    <div className="mbe-4 space-y-2">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-semibold text-ink">
                                Selected · {attachedBuyers.length}
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
                            aria-label="Attached buyers"
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
                                      gap-2 rounded-full border border-border-warm bg-surface
                                      px-3 py-2 text-sm font-medium text-ink min-block-10
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
                ) : (
                    <p className="mbe-4 text-sm text-ink-muted">
                        No buyers attached yet. Search contacts below to add one or more.
                    </p>
                )}
                <ContactSearchPanel
                    mode="buyer"
                    selectedId={null}
                    selectedIds={[
                        ...existingBuyers.map((buyer) => buyer.id),
                        ...attachedBuyers.map((buyer) => buyer.id),
                    ]}
                    lockedIds={existingBuyers.map((buyer) => buyer.id)}
                    selectedLabel={null}
                    onSelectBuyer={toggleBuyer}
                    onClear={() => undefined}
                />
            </WizardSection>
        </div>
    );
}

function ContactSearchPanel({
    mode,
    selectedId,
    selectedIds = [],
    lockedIds = [],
    selectedLabel,
    onSelectOwner,
    onSelectBuyer,
    onClear,
}: {
    mode: "owner" | "buyer";
    selectedId: string | null;
    selectedIds?: string[];
    lockedIds?: string[];
    selectedLabel: { name: string; phone: string } | null;
    onSelectOwner?: (owner: OwnerRow) => void;
    onSelectBuyer?: (buyer: BuyerRow) => void;
    onClear: () => void;
}) {
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query.trim());
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
        enabled: mode === "owner",
    });
    const buyersQuery = useInfiniteItems({
        queryKey: ["property-form", "contacts", "buyers", filters.q],
        queryFn: ({ cursor, signal }) => contactsApi.listBuyersPage(filters, cursor, signal),
        enabled: mode === "buyer",
    });

    const activeQuery = mode === "owner" ? ownersQuery : buyersQuery;
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const selectedOwner = ownersQuery.items.find((owner) => owner.id === selectedId);

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
                        onClick={onClear}
                        className="shrink-0 border text-ink hover:bg-surface-muted/35"
                    >
                        Change
                    </Button>
                </div>
            ) : null}

            {mode === "owner" && selectedId ? null : (
                <>
                    <Input
                        size="lg"
                        value={query}
                        onValueChange={setQuery}
                        startIcon={Search}
                        placeholder={
                            mode === "owner"
                                ? "Search owners by name or phone"
                                : "Search buyers by name or phone"
                        }
                        aria-label={mode === "owner" ? "Search owners" : "Search buyers"}
                        clearable
                    />

                    <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
                        <span>
                            {deferredQuery
                                ? "Search results"
                                : mode === "owner"
                                  ? "Owner contacts"
                                  : "Buyer contacts"}
                            {!activeQuery.isLoading && !activeQuery.isError
                                ? ` · ${activeQuery.total}`
                                : ""}
                        </span>
                        <span>{mode === "owner" ? "Choose one" : "Choose one or more"}</span>
                    </div>
                    <div
                        className="
                          space-y-1 overflow-y-auto overscroll-contain rounded-control border
                          border-border-warm bg-surface p-1.5 max-block-80
                        "
                        role="group"
                        aria-label={mode === "owner" ? "Owner contacts" : "Buyer contacts"}
                    >
                        {activeQuery.isLoading ? (
                            <div role="status" className="space-y-1">
                                <span className="sr-only">Loading contacts…</span>
                                {[0, 1, 2].map((item) => (
                                    <div key={item} className="flex items-center gap-3 p-3">
                                        <Skeleton
                                            className="
                                          shrink-0 rounded-full block-10 inline-10
                                        "
                                        />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="block-3 inline-28" />
                                            <Skeleton
                                                className="
                                              block-2.5 inline-40 max-inline-full
                                            "
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeQuery.isError ? (
                            <div role="alert" className="space-y-2 px-3 py-5 text-center">
                                <p className="text-sm text-danger">Couldn’t load contacts.</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void activeQuery.refetch()}
                                >
                                    Try again
                                </Button>
                            </div>
                        ) : activeQuery.items.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                                <Search
                                    className="mbe-1 text-ink-subtle block-6 inline-6"
                                    aria-hidden
                                />
                                <p className="text-sm font-semibold text-ink">
                                    {deferredQuery
                                        ? "No matches in your contacts."
                                        : mode === "owner"
                                          ? "No owners in contacts yet."
                                          : "No buyers in contacts yet."}
                                </p>
                                <p className="text-xs text-ink-muted">
                                    {deferredQuery
                                        ? "Try a different name or phone number."
                                        : "Add a contact from Contacts, then select them here."}
                                </p>
                            </div>
                        ) : mode === "owner" ? (
                            (ownersQuery.items as OwnerRow[]).map((owner) => {
                                const active = owner.id === selectedId;
                                return (
                                    <ContactOption
                                        key={owner.id}
                                        name={owner.name}
                                        phone={owner.phoneDigits}
                                        imageUrl={owner.avatarUrl}
                                        detail={
                                            owner.propertyCount
                                                ? `${owner.propertyCount} propert${owner.propertyCount === 1 ? "y" : "ies"}`
                                                : undefined
                                        }
                                        active={active}
                                        multiple={false}
                                        onSelect={() => onSelectOwner?.(owner)}
                                    />
                                );
                            })
                        ) : (
                            (buyersQuery.items as BuyerRow[]).map((buyer) => {
                                const active = selectedSet.has(buyer.id);
                                return (
                                    <ContactOption
                                        key={buyer.id}
                                        name={buyer.name}
                                        phone={buyer.phoneDigits}
                                        detail={
                                            buyer.lookingFor
                                                ? `Looking to ${buyer.lookingFor}`
                                                : undefined
                                        }
                                        active={active}
                                        multiple
                                        locked={lockedIds.includes(buyer.id)}
                                        onSelect={() => onSelectBuyer?.(buyer)}
                                    />
                                );
                            })
                        )}
                        {activeQuery.hasNextPage ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="inline-full"
                                loading={activeQuery.isFetchingNextPage}
                                onClick={() => void activeQuery.fetchNextPage()}
                            >
                                Load more
                            </Button>
                        ) : null}
                    </div>
                </>
            )}
        </div>
    );
}
