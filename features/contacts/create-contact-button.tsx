"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { useQueryClient } from "@tanstack/react-query";

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
        ]) {
            void queryClient.invalidateQueries({ queryKey });
        }
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
                {kind === "owner" ? "Create owner" : "Create contact"}
            </Button>
            {kind === "owner" ? (
                <AddOwnerModal
                    open={open}
                    onOpenChange={setOpen}
                    onSaved={(name, _mode, id) => {
                        toast.success("Owner added");
                        created(name, id);
                    }}
                />
            ) : (
                <AddBuyerModal open={open} onOpenChange={setOpen} onCreated={created} />
            )}
        </>
    );
}
