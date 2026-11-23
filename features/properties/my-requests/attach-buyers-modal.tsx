"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useQueryClient } from "@tanstack/react-query";

import { clientsApi } from "@/lib/api/clients";
import { notifyWorkflowSaved } from "@/lib/workflows/refresh";

import type { PeoplePickerPerson } from "@/components/shared/people-picker";
import { PeoplePicker } from "@/components/shared/people-picker";

import type { ClientItem } from "@/features/clients/types";
import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import type { RequestItem } from "@/features/properties/my-requests/types";

type BuyerProperty = Pick<RequestItem, "propertyId" | "title" | "isRent" | "amountInr" | "bhk">;

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
    const queryClient = useQueryClient();
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [attachedIds, setAttachedIds] = useState<string[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [pickerKey, setPickerKey] = useState(0);

    useEffect(() => {
        if (!open) return undefined;

        let cancelled = false;

        const timer = window.setTimeout(() => {
            if (cancelled) return;

            setIsLoading(true);

            void clientsApi
                .listForProperty(request.propertyId)
                .then((result) => {
                    if (cancelled) return;
                    setClients(result.clients);
                    setAttachedIds(result.attachedIds);
                    setSelectedIds(result.attachedIds);
                    setPickerKey((key) => key + 1);
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

    const people = useMemo<PeoplePickerPerson[]>(
        () =>
            clients.map((client) => ({
                id: client.id,
                name: client.name,
                role: "client" as const,
                phoneDigits: client.phoneDigits,
                lookingFor: client.lookingFor,
                warning: mismatchReason(client, request),
            })),
        [clients, request],
    );

    const handleSave = useCallback(
        (ids: string[]) => {
            const toAttach = ids.filter((id) => !attachedIds.includes(id));
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
                        error instanceof Error
                            ? error.message
                            : "Could not link clients. Try again.",
                    );
                })
                .finally(() => setIsSaving(false));
        },
        [attachedIds, onOpenChange, onSaved, request.propertyId],
    );

    return (
        <>
            <PeoplePicker
                key={pickerKey}
                open={open}
                onOpenChange={onOpenChange}
                kinds="client"
                multiple
                people={people}
                value={selectedIds}
                onConfirm={handleSave}
                title="Add clients"
                description={`Pick who you will show ${request.title} to. You can select one or many.`}
                confirmLabel={isSaving ? "Saving…" : "Save clients"}
                confirmDisabled={isLoading || isSaving}
                closeOnConfirm={false}
                loading={isLoading}
                onCreate={() => setCreateOpen(true)}
                createLabel="Create client"
                emptyHeading="You have no clients yet"
                emptyDescription="Create a client above, then link them to this property."
                filteredEmptyHeading="No clients match your search"
                filteredEmptyDescription="Try a different name or phone number."
                size="lg"
            />
            <AddBuyerModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={(_name, id) => {
                    toast.success("Client added");
                    for (const queryKey of [["contacts"], ["property-form", "contacts"]]) {
                        void queryClient.invalidateQueries({ queryKey });
                    }
                    notifyWorkflowSaved("contact");
                    if (id) setSelectedIds((current) => [...new Set([...current, id])]);
                    setIsLoading(true);
                    void clientsApi
                        .listForProperty(request.propertyId)
                        .then((result) => {
                            setClients(result.clients);
                            setAttachedIds(result.attachedIds);
                            if (id) {
                                setSelectedIds((current) => [
                                    ...new Set([...result.attachedIds, ...current, id]),
                                ]);
                            }
                            setPickerKey((key) => key + 1);
                        })
                        .catch(() =>
                            toast.error(
                                "Client created, but the list could not refresh. Reopen this dialog to try again.",
                            ),
                        )
                        .finally(() => setIsLoading(false));
                    setCreateOpen(false);
                }}
            />
        </>
    );
}
