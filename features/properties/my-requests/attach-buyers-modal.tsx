"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Search, UserPlus, Users } from "lucide-react";

import { clientsApi } from "@/lib/api/clients";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import type { ClientItem } from "@/features/clients/types";
import type { RequestItem } from "@/features/properties/my-requests/types";

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
function mismatchReason(client: ClientItem, request: RequestItem): string | null {
    const wantsRent = client.lookingFor === "rent";
    if (wantsRent !== request.isRent) {
        return wantsRent ? "Wants to rent" : "Wants to buy";
    }

    if (client.budgetMaxInr !== null && request.amountInr > client.budgetMaxInr) {
        return "Over budget";
    }

    if (client.bhk !== null && request.bhk > 0 && client.bhk !== request.bhk) {
        return `Wants ${client.bhk} BHK`;
    }

    return null;
}

function budgetLabel(client: ClientItem): string | null {
    if (client.budgetMaxInr === null) return null;
    const amount =
        client.lookingFor === "rent"
            ? formatRentInr(client.budgetMaxInr)
            : formatPriceInr(client.budgetMaxInr);
    return `Up to ${amount}`;
}

function BuyerRow({
    client,
    request,
    isSelected,
    onToggle,
}: {
    client: ClientItem;
    request: RequestItem;
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
                        {mismatch ? (
                            <Badge variant="outline" className="bg-surface">
                                {mismatch}
                            </Badge>
                        ) : null}
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
    request: RequestItem;
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
                    toast.error("Could not load your buyers. Try again.");
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
                        ? "Buyer linked to this property."
                        : `${toAttach.length} buyers linked to this property.`,
                );
                onSaved();
                onOpenChange(false);
            })
            .catch((error) => {
                toast.error(
                    error instanceof Error ? error.message : "Could not link buyers. Try again.",
                );
            })
            .finally(() => setIsSaving(false));
    }, [attachedIds, onOpenChange, onSaved, request.propertyId, selectedIds]);

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="lg"
            title="Add buyers"
            description={`Pick who you will show ${request.title} to. You can select one or many.`}
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Input
                        size="sm"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search buyers"
                        aria-label="Search your buyers"
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
                    primaryLabel={isSaving ? "Saving…" : "Save buyers"}
                    primaryIcon={<UserPlus aria-hidden strokeWidth={1.75} />}
                    onPrimary={handleSave}
                    primaryDisabled={isLoading || isSaving}
                    secondaryLabel="Cancel"
                    onSecondary={() => onOpenChange(false)}
                    secondaryDisabled={isSaving}
                />
            }
        >
            {isLoading ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-card bg-surface-muted block-20"
                            aria-hidden
                        />
                    ))}
                </div>
            ) : visibleClients.length === 0 ? (
                <EmptyState
                    icon={Users}
                    heading={query ? "No buyers match your search" : "You have no buyers yet"}
                    description={
                        query
                            ? "Try a different name, phone number or area."
                            : "Add buyers to your list first, then you can link them to a property."
                    }
                />
            ) : (
                <VirtualListBox
                    items={visibleClients}
                    getKey={(client) => client.id}
                    estimateItemHeight={96}
                    ariaLabel="Buyers available to attach"
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
