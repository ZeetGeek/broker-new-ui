"use client";
import { useQueryClient } from "@tanstack/react-query";

import { notifyWorkflowSaved } from "@/lib/workflows/refresh";
import type { WorkflowTarget } from "@/lib/workflows/target";

import { AddContactModal } from "@/features/contacts/add-contact-modal";

export function ContactCreateWorkflow({
    target,
    onClose,
}: {
    target: Extract<WorkflowTarget, { kind: "contact" }>;
    onClose: () => void;
}) {
    const client = useQueryClient();
    const saved = () => {
        void client.invalidateQueries({
            predicate: (query) =>
                /^(contact|person-details|people-filter|task-link|broker-visits|property-form|exclusive-owner-picker)/.test(
                    String(query.queryKey[0]),
                ),
        });
        notifyWorkflowSaved("contact");
    };
    return (
        <AddContactModal
            open
            initialType={target.mode === "create-owner" ? "owner" : "client"}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            onClientCreated={saved}
            onOwnerSaved={saved}
        />
    );
}
