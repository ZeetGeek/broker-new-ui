"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { clientsApi } from "@/lib/api/clients";
import { formatPrice, formatRent } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, UserPlus, Users } from "@/components/shared/icons";
import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import type { ClientItem } from "@/features/clients/types";
import type { RequestItem } from "@/features/properties/my-requests/types";

type BuyerProperty = Pick<RequestItem, "propertyId" | "title" | "isRent" | "amountInr" | "bhk">;

function matchesQuery(client: ClientItem, q: string): boolean {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;

    return (
        client.name.toLowerCase().includes(needle) ||
        client.phoneDigits.includes(needle) ||
        client.preferredLocalities.some((area) => area.toLowerCase().includes(needle))
    );
}

/**
 * Why this buyer may not suit the property. Shown as a quiet warning rather
 * than a block — the broker knows their buyers better than we do.
 */
function mismatchReason(client: ClientItem, request: BuyerProperty): string | null {
    if (client.lookingFor === "rent" && !request.isRent) return "Wants to rent";
    if (client.lookingFor === "buy" && request.isRent) return "Wants to buy";

    const budgetMax = request.isRent ? (client.rentBudgetMaxInr ?? null) : client.budgetMaxInr;
    if (budgetMax !== null && request.amountInr > budgetMax) {
        return "Over budget";
    }

    if (client.bhk !== null && request.bhk > 0 && client.bhk !== request.bhk) {
        return `Wants ${client.bhk} BHK`;
    }

    return null;
}

function budgetLabel(client: ClientItem): string | null {
    const sale =
        client.budgetMaxInr != null ? `Sale up to ${formatPrice(client.budgetMaxInr)}` : null;
    const rent =
        client.rentBudgetMaxInr != null
            ? `Rent up to ${formatRent(client.rentBudgetMaxInr)}`
            : null;
    if (client.lookingFor === "rent") return rent;
    if (client.lookingFor === "both") return [sale, rent].filter(Boolean).join(" · ") || null;
    return sale;
}

function BuyerRow({
    client,
    request,
    isSelected,
    onToggle,
}: {
    client: ClientItem;
    request: BuyerProperty;
    isSelected: boolean;
    onToggle: () => void;
}) {
    const mismatch = mismatchReason(client, request);
    const budget = budgetLabel(client);

    return (
        <div>
            <label
                className={cn(
                    `
                      flex cursor-pointer items-start gap-3 rounded-card border p-3
                      transition-[background-color,border-color] duration-160
                    `,
                    isSelected
                        ? "border-brand bg-brand-soft/50"
                        : `
                          border-border-warm bg-surface
                          hover:border-ink/20 hover:bg-surface-muted/50
                        `,
                )}
            >
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggle}
                    aria-label={`Add ${client.name}`}
                    className="mbs-0.5 shrink-0"
                />

                <UserAvatar name={client.name} size="sm" />

                <div className="flex flex-1 flex-col gap-1 min-inline-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="body-sm font-semibold text-ink">{client.name}</span>
                        {mismatch ? <Badge color="amber">{mismatch}</Badge> : null}
                    </div>

                    <PhoneNumber
                        phoneDigits={client.phoneDigits}
                        className="body-xs text-ink-muted"
                    />

                    <p className="body-xs text-ink-muted">
                        {client.preferredLocalities.length > 0
                            ? client.preferredLocalities.join(", ")
                            : "No preferred areas"}
                        {budget ? ` · ${budget}` : ""}
                        {client.attachedPropertyCount > 0
                            ? ` · On ${client.attachedPropertyCount} other ${
                                  client.attachedPropertyCount === 1 ? "property" : "properties"
                              }`
                            : ""}
                    </p>
                </div>
            </label>
        </div>
    );
}

export function AttachBuyersModal({
    open,
    onOpenChange,
    request,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: BuyerProperty;
    onSaved: () => void;
}) {
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [attachedIds, setAttachedIds] = useState<string[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!open) return undefined;

        let cancelled = false;

        // Deferred so opening the modal does not set state during the effect
        // body, which would cascade an extra render.
        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setIsLoading(true);
            setQuery("");

            void clientsApi
                .listForProperty(request.propertyId)
                .then((result) => {
                    if (cancelled) return;
                    setClients(result.clients);
                    setAttachedIds(result.attachedIds);
                    setSelectedIds(result.attachedIds);
                })
                .catch(() => {
                    if (cancelled) return;
                    toast.error("Could not load your clients. Try again.");
                    setClients([]);
                    setAttachedIds([]);
                    setSelectedIds([]);
                })
                .finally(() => {
                    if (!cancelled) setIsLoading(false);
                });
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [open, request.propertyId]);

    const visibleClients = useMemo(
        () => clients.filter((client) => matchesQuery(client, query)),
        [clients, query],
    );

    const handleToggle = useCallback((clientId: string) => {
        setSelectedIds((previous) =>
            previous.includes(clientId)
                ? previous.filter((id) => id !== clientId)
                : [...previous, clientId],
        );
    }, []);

    const handleSave = useCallback(() => {
        // Only send newly selected buyers — already linked stay linked.
        const toAttach = selectedIds.filter((id) => !attachedIds.includes(id));
        if (toAttach.length === 0) {
            onOpenChange(false);
            return;
        }

        setIsSaving(true);
        void clientsApi
            .setPropertyClients(request.propertyId, toAttach)
            .then(() => {
                toast.success(
                    toAttach.length === 1
                        ? "Client linked to this property."
                        : `${toAttach.length} clients linked to this property.`,
                );
                onSaved();
                onOpenChange(false);
            })
            .catch((error) => {
                toast.error(
                    error instanceof Error ? error.message : "Could not link clients. Try again.",
                );
            })
            .finally(() => setIsSaving(false));
    }, [attachedIds, onOpenChange, onSaved, request.propertyId, selectedIds]);

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="lg"
            title="Add clients"
            description={`Pick who you will show ${request.title} to. You can select one or many.`}
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Input
                        size="sm"
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search clients"
                        aria-label="Search your clients"
                        startIcon={Search}
                        clearable
                        wrapperClassName="min-inline-56 flex-1"
                    />
                    <span className="body-sm shrink-0 font-medium text-ink-muted">
                        {selectedIds.length} selected
                    </span>
                </div>
            }
            footer={
                <AppModalFooter
                    primaryLabel={isSaving ? "Saving…" : "Save clients"}
                    primaryIcon={<UserPlus aria-hidden strokeWidth={1.75} />}
                    onPrimary={handleSave}
                    primaryDisabled={isLoading || isSaving}
                    secondaryLabel="Cancel"
                    onSecondary={() => onOpenChange(false)}
                    secondaryDisabled={isSaving}
                />
            }
        >
            {isLoading ? null : visibleClients.length === 0 ? (
                <EmptyState
                    icon={Users}
                    heading={query ? "No clients match your search" : "You have no clients yet"}
                    description={
                        query
                            ? "Try a different name, phone number or area."
                            : "Add clients to your list first, then you can link them to a property."
                    }
                />
            ) : (
                <VirtualListBox
                    items={visibleClients}
                    getKey={(client) => client.id}
                    estimateItemHeight={96}
                    ariaLabel="Clients available to attach"
                    renderItem={(client) => {
                        const isSelected = selectedIds.includes(client.id);
                        return (
                            <BuyerRow
                                key={client.id}
                                client={client}
                                request={request}
                                isSelected={isSelected}
                                onToggle={() => handleToggle(client.id)}
                            />
                        );
                    }}
                />
            )}
        </AppModal>
    );
}
