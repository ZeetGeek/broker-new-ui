"use client";

import { HoldToConfirmMenuItem } from "@/components/shared/hold-to-confirm-menu-item";

export function HoldToDeleteListing({ onComplete }: { onComplete: () => void }) {
    return (
        <HoldToConfirmMenuItem
            label="Hold to delete listing"
            icon="trash"
            onComplete={onComplete}
        />
    );
}
