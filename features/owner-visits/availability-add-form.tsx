"use client";

/**
 * PARKED — bulk / multi-date “Open visiting times” form.
 * Availability now uses per-property cards + AddTimeDialog (8AM–8PM / 30min).
 * Keep this file for a later bulk-add restore; do not import from the page.
 */

/*
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { AvailabilityDatesPicker } from "@/features/owner-visits/availability-dates-picker";

export type AddSlotsPayload = {
    dates: string[];
    from: string;
    to: string;
    slotLength: 30 | 60;
};

export function AvailabilityAddForm({
    propertyId,
    properties,
    propertiesLoading,
    onPropertyChange,
    todayIso,
    submitting,
    onSubmit,
}: {
    propertyId: string;
    properties: { id: string; label: string }[];
    propertiesLoading?: boolean;
    onPropertyChange: (next: string) => void;
    todayIso: string;
    submitting: boolean;
    onSubmit: (payload: AddSlotsPayload) => Promise<void> | void;
}) {
    const [dates, setDates] = useState<string[]>([todayIso]);
    const [from, setFrom] = useState("10:00");
    const [to, setTo] = useState("13:00");
    const [slotLength, setSlotLength] = useState<30 | 60>(30);
    const [formError, setFormError] = useState<string | null>(null);

    async function handleSubmit() {
        setFormError(null);
        if (!propertyId) {
            setFormError("Choose a property first.");
            return;
        }
        if (dates.length === 0) {
            setFormError("Pick at least one date.");
            return;
        }
        if (from >= to) {
            setFormError("End time must be after start time.");
            return;
        }
        await onSubmit({ dates, from, to, slotLength });
    }

    return (
        <section className="flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4 shadow-sm">
            ...
        </section>
    );
}
*/

export {};
