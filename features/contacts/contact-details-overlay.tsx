"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { clientsApi } from "@/lib/api/clients";
import { contactsApi } from "@/lib/api/contacts";
import { updateBuyerContact, updateOwnerContact } from "@/lib/contacts/contact-actions";
import { AmbiguousContactNameError, findContactByName } from "@/lib/contacts/find-contact-by-name";
import type { PersonDetailsTarget } from "@/lib/contacts/person-details-target";
import { notifyWorkflowSaved } from "@/lib/workflows/refresh";

import { usePersonDetailsWorking } from "@/components/shared/person-details-context";

import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import { AddOwnerModal } from "@/features/contacts/add-owner-modal";
import { AttachBuyerPropertiesModal } from "@/features/contacts/attach-buyer-properties-modal";
import { AttachOwnerToListingModal } from "@/features/contacts/attach-owner-to-listing-modal";
import { ContactDetailPanel } from "@/features/contacts/contact-detail-panel";
import { useAppSelector } from "@/store/hooks";

export function ContactDetailsOverlay({
    target,
    onClose,
}: {
    target: Extract<PersonDetailsTarget, { kind: "contact" }>;
    onClose: () => void;
}) {
    const client = useQueryClient();
    const accountId = useAppSelector((state) => state.auth.user?.id);
    const [action, setAction] = useState<"edit" | "attach" | null>(null);
    usePersonDetailsWorking(action !== null);
    const key = ["person-details", accountId, target.type, target.id, target.name];
    const query = useQuery({
        queryKey: key,
        queryFn: ({ signal }) =>
            target.id
                ? contactsApi.findContact(target.id, target.type, signal)
                : findContactByName(target.name, target.type, signal),
        retry: (count, error) => !(error instanceof AmbiguousContactNameError) && count < 2,
    });
    const contact = query.data ?? null;
    const changed = () => {
        void client.invalidateQueries({
            predicate: (item) =>
                /^(person-details|contact|pipeline|my-listings|dashboard-listings|property-attached-buyers|property-analytics|site-visits|broker-visits|inventory|task-link|people-filter|property-form|exclusive-owner-picker|workflow-property|workflow-deal)/.test(
                    String(item.queryKey[0]),
                ),
        });
        notifyWorkflowSaved("contact");
    };
    const saved = () => {
        setAction(null);
        changed();
    };
    const back = (open: boolean) => {
        if (!open) setAction(null);
    };
    return (
        <>
            <ContactDetailPanel
                contact={contact}
                contactType={target.type}
                open={!action}
                onOpenChange={(open) => {
                    if (!open && !action) onClose();
                }}
                loadError={
                    query.isError
                        ? query.error instanceof AmbiguousContactNameError
                            ? query.error.message
                            : "Could not load this contact. Check your connection and try again."
                        : query.isSuccess && !contact
                          ? "This name is not linked to a saved contact in your account."
                          : undefined
                }
                onRetryLoad={query.isError ? () => void query.refetch() : undefined}
                onEditBuyer={() => setAction("edit")}
                onEditOwner={() => setAction("edit")}
                onAttachBuyer={() => setAction("attach")}
                onAttachOwner={() => setAction("attach")}
                onDetachBuyerProperty={async (buyer, property) => {
                    if (!property.leadId) throw new Error("This property cannot be removed.");
                    try {
                        await clientsApi.removeLead(property.leadId);
                        const attachedProperties = buyer.attachedProperties.filter(
                            (item) => item.leadId !== property.leadId,
                        );
                        client.setQueryData(key, {
                            type: "buyer",
                            row: {
                                ...buyer,
                                attachedProperties,
                                liveDealCount: attachedProperties.length,
                                activePropertyTitles: attachedProperties.map((item) => item.title),
                                leads: buyer.leads.filter(
                                    (item) => item.leadId !== property.leadId,
                                ),
                            },
                        });
                        changed();
                        toast.success("Property removed from this client");
                    } catch (error) {
                        toast.error(
                            error instanceof Error ? error.message : "Could not remove property",
                        );
                        throw error;
                    }
                }}
                onQuickUpdateBuyer={async (buyer, patch) => {
                    const row = await updateBuyerContact(buyer, patch);
                    client.setQueryData(key, { type: "buyer", row });
                    changed();
                }}
                onQuickUpdateOwner={async (owner, patch) => {
                    const row = await updateOwnerContact(owner, patch);
                    client.setQueryData(key, { type: "owner", row });
                    changed();
                }}
            />
            {contact?.type === "buyer" && action === "edit" ? (
                <AddBuyerModal
                    open
                    buyer={contact.row}
                    onOpenChange={back}
                    onCreated={saved}
                    onUpdated={saved}
                    onAttach={() => setAction("attach")}
                />
            ) : null}
            {contact?.type === "owner" && action === "edit" ? (
                <AddOwnerModal open owner={contact.row} onOpenChange={back} onSaved={saved} />
            ) : null}
            {contact?.type === "buyer" && action === "attach" ? (
                <AttachBuyerPropertiesModal
                    open
                    buyer={contact.row}
                    onOpenChange={back}
                    onSaved={saved}
                />
            ) : null}
            {contact?.type === "owner" && action === "attach" ? (
                <AttachOwnerToListingModal
                    open
                    owner={contact.row}
                    onOpenChange={back}
                    onSaved={saved}
                />
            ) : null}
        </>
    );
}
