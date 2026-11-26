"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { notifyWorkflowSaved } from "@/lib/workflows/refresh";

import toast from "@/components/shared/app-toast";
import { UserPlus } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import { AddOwnerModal } from "@/features/contacts/add-owner-modal";

/** Create a person without leaving the property or picker being worked on. */
export function CreateContactButton({
    kind,
    onCreated,
    disabled,
}: {
    kind: "owner" | "contact";
    onCreated?: (name: string, id?: string) => void;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const created = (name: string, id?: string) => {
        for (const queryKey of [
            ["contacts"],
            ["property-form", "contacts"],
            ["exclusive-owner-picker"],
            ["people-filter-options"],
            ["task-link-options"],
            ["broker-visits"],
        ]) {
            void queryClient.invalidateQueries({ queryKey });
        }
        notifyWorkflowSaved("contact");
        onCreated?.(name, id);
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="md"
                disabled={disabled}
                onClick={() => setOpen(true)}
            >
                <UserPlus aria-hidden />
                {kind === "owner" ? "Create owner" : "Create client"}
            </Button>
            {kind === "owner" ? (
                <AddOwnerModal
                    open={open}
                    onOpenChange={setOpen}
                    onSaved={(name, _mode, id) => {
                        toast.message("owner-added");
                        created(name, id);
                    }}
                />
            ) : (
                <AddBuyerModal open={open} onOpenChange={setOpen} onCreated={created} />
            )}
        </>
    );
}
