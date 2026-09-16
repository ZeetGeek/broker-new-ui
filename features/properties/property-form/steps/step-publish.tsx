"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import { Check, Search, UserRound, Users, X } from "lucide-react";

import { contactsApi } from "@/lib/api/contacts";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DEFAULT_CONTACTS_FILTERS } from "@/features/contacts/types";
import type { BuyerRow, OwnerRow } from "@/features/contacts/types";
import {
    FORM_SECTIONS_CLASS,
    WizardSection,
} from "@/features/properties/property-form/form-fields";
import { useInfiniteItems } from "@/hooks/use-infinite-items";

type AttachedBuyer = PropertyDraftValues["attachedBuyers"][number];

function formatPhone(digits?: string): string {
    if (!digits) return "Phone hidden";
    if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    return digits;
}

export function StepPublish() {
    const { watch, setValue, getValues } = useFormContext<PropertyDraftValues>();
    const values = watch();
    const attachedOwnerId = values.owner.contactId;
    const attachedBuyers = values.attachedBuyers ?? [];

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
                title={
                    <>
                        <UserRound
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Attach owner
                    </>
                }
                description="Optional. Pick the property owner from your contacts. One owner per listing."
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
                title={
                    <>
                        <Users
                            className="shrink-0 text-brand block-5 inline-5"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        Attach buyers
                    </>
                }
                description="Optional. Add one or more buyers from contacts who should see this property."
                tone="private"
            >
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
                            role="list"
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
                                      rounded-control border border-brand/25 bg-brand-soft px-3 py-2
                                      text-sm font-medium text-brand-text min-block-10
                                      focus-visible:ring-3 focus-visible:ring-ring/30
                                    "
                                >
                                    {buyer.name}
                                    <X className="ms-1.5 inline block-3.5 inline-3.5" aria-hidden />
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
                    selectedIds={attachedBuyers.map((buyer) => buyer.id)}
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
    selectedLabel,
    onSelectOwner,
    onSelectBuyer,
    onClear,
}: {
    mode: "owner" | "buyer";
    selectedId: string | null;
    selectedIds?: string[];
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

    return (
        <div className="space-y-4">
            {mode === "owner" && selectedLabel ? (
                <div
                    className="
                      flex items-center justify-between gap-3 rounded-control border
                      border-brand/25 bg-brand-soft px-4 py-3
                    "
                >
                    <div className="flex items-center gap-3 min-inline-0">
                        <span
                            className="
                              flex shrink-0 items-center justify-center rounded-full bg-brand
                              text-surface block-10 inline-10
                            "
                        >
                            <UserRound className="block-4 inline-4" aria-hidden />
                        </span>
                        <div className="min-inline-0">
                            <p className="truncate text-sm font-bold text-ink">
                                {selectedLabel.name}
                            </p>
                            <p className="text-xs text-ink-muted">
                                {formatPhone(selectedLabel.phone)}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="text-ink-muted hover:text-ink"
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
                    />

                    <div
                        className="
                          max-block-72 space-y-1 overflow-y-auto rounded-control border
                          border-border-warm bg-surface p-2
                        "
                        role="listbox"
                        aria-label={mode === "owner" ? "Owner contacts" : "Buyer contacts"}
                    >
                        {activeQuery.isLoading ? (
                            <p className="px-3 py-4 text-sm text-ink-muted">Loading contacts…</p>
                        ) : activeQuery.isError ? (
                            <p className="px-3 py-4 text-sm text-danger">
                                Couldn’t load contacts. Try again.
                            </p>
                        ) : activeQuery.items.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-ink-muted">
                                {deferredQuery
                                    ? "No matches in your contacts."
                                    : mode === "owner"
                                      ? "No owners in contacts yet."
                                      : "No buyers in contacts yet."}
                            </p>
                        ) : mode === "owner" ? (
                            (ownersQuery.items as OwnerRow[]).map((owner) => {
                                const active = owner.id === selectedId;
                                return (
                                    <button
                                        key={owner.id}
                                        type="button"
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => onSelectOwner?.(owner)}
                                        className={cn(
                                            `
                                              flex inline-full items-center gap-3 rounded-control
                                              px-3 py-2.5 text-start transition-colors
                                              focus-visible:ring-3 focus-visible:ring-ring/30
                                              min-block-12
                                            `,
                                            active
                                                ? "bg-brand-soft text-brand-text"
                                                : "hover:bg-surface-muted",
                                        )}
                                    >
                                        <UserRound
                                            className="shrink-0 text-ink-muted block-4 inline-4"
                                            aria-hidden
                                        />
                                        <span className="min-inline-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-ink">
                                                {owner.name}
                                            </span>
                                            <span className="block text-xs text-ink-muted">
                                                {formatPhone(owner.phoneDigits)}
                                                {owner.propertyCount
                                                    ? ` · ${owner.propertyCount} propert${owner.propertyCount === 1 ? "y" : "ies"}`
                                                    : ""}
                                            </span>
                                        </span>
                                        {active ? (
                                            <Check
                                                className="shrink-0 text-brand block-4 inline-4"
                                                aria-hidden
                                            />
                                        ) : null}
                                    </button>
                                );
                            })
                        ) : (
                            (buyersQuery.items as BuyerRow[]).map((buyer) => {
                                const active = selectedSet.has(buyer.id);
                                return (
                                    <button
                                        key={buyer.id}
                                        type="button"
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => onSelectBuyer?.(buyer)}
                                        className={cn(
                                            `
                                              flex inline-full items-center gap-3 rounded-control
                                              px-3 py-2.5 text-start transition-colors
                                              focus-visible:ring-3 focus-visible:ring-ring/30
                                              min-block-12
                                            `,
                                            active
                                                ? "bg-brand-soft text-brand-text"
                                                : "hover:bg-surface-muted",
                                        )}
                                    >
                                        <Users
                                            className="shrink-0 text-ink-muted block-4 inline-4"
                                            aria-hidden
                                        />
                                        <span className="min-inline-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-ink">
                                                {buyer.name}
                                            </span>
                                            <span className="block text-xs text-ink-muted">
                                                {formatPhone(buyer.phoneDigits)}
                                                {buyer.lookingFor
                                                    ? ` · Looking to ${buyer.lookingFor}`
                                                    : ""}
                                            </span>
                                        </span>
                                        {active ? (
                                            <Check
                                                className="shrink-0 text-brand block-4 inline-4"
                                                aria-hidden
                                            />
                                        ) : null}
                                    </button>
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
