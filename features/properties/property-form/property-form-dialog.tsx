"use client";

import { PropertyForm } from "@/features/properties/property-form";

export type PropertyFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function PropertyFormDialog({ open, onOpenChange }: PropertyFormDialogProps) {
    return (
        <PropertyForm
            key={open ? "open" : "closed"}
            mode="create"
            variant="dialog"
            open={open}
            onOpenChange={onOpenChange}
            onCancel={() => onOpenChange(false)}
        />
    );
}
