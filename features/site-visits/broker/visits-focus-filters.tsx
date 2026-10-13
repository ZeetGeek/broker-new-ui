"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { AppModalFooter } from "@/components/shared/app-modal-footer";
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";

import type { BrokerVisitSummary, SummaryFilter } from "@/features/site-visits/broker/model";
import {
    formatChipCount,
    ownerListingsChipClassName,
    ownerListingsChipCountClassName,
} from "@/features/properties/owner-listings/owner-listings-chip-styles";

const FOCUS_OPTIONS: {
    key: SummaryFilter;
    label: string;
    field: keyof BrokerVisitSummary;
    description: string;
}[] = [
    { key: "today", label: "Today", field: "today", description: "Visits scheduled for today" },
    {
        key: "tomorrow",
        label: "Tomorrow",
        field: "tomorrow",
        description: "Visits scheduled for tomorrow",
    },
    {
        key: "awaiting",
        label: "Waiting for owner",
        field: "awaitingOwner",
        description: "Bookings waiting for owner confirmation",
    },
    {
        key: "feedback",
        label: "Needs outcome",
        field: "needsOutcome",
        description: "Finished visits that still need an outcome",
    },
    {
        key: "week",
        label: "This week",
        field: "weekTotal",
        description: "All upcoming visits this week",
    },
    {
        key: "cancelled",
        label: "Cancelled",
        field: "cancelledThisWeek",
        description: "Visits cancelled this week",
    },
];

export function VisitsFocusFiltersDialog({
    open,
    onOpenChange,
    summary,
    active,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    summary: BrokerVisitSummary;
    active?: SummaryFilter;
    onApply: (next?: SummaryFilter) => void;
}) {
    const [draft, setDraft] = useState<SummaryFilter | undefined>(active);

    useEffect(() => {
        if (open) setDraft(active);
    }, [active, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="gap-0 overflow-hidden p-0 max-inline-lg sm:max-inline-lg">
                <DialogHeader className="border-be border-border-warm px-5 py-4 text-start">
                    <DialogTitle>Filter my visits</DialogTitle>
                    <DialogDescription>Narrow the schedule by day or status.</DialogDescription>
                    <DialogClose />
                </DialogHeader>
                <div className="flex flex-wrap gap-2 p-5">
                    {FOCUS_OPTIONS.map((option) => {
                        const selected = draft === option.key;
                        const count = summary[option.field];
                        return (
                            <button
                                key={option.key}
                                type="button"
                                aria-pressed={selected}
                                title={option.description}
                                onClick={() => setDraft(selected ? undefined : option.key)}
                                className={cn(ownerListingsChipClassName(selected), "gap-1.5")}
                            >
                                {option.label}
                                <span className={ownerListingsChipCountClassName(selected)}>
                                    {formatChipCount(count)}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <footer className="border-bs border-border-warm bg-surface px-5 py-4">
                    <AppModalFooter
                        secondaryLabel="Clear"
                        onSecondary={() => setDraft(undefined)}
                        primaryLabel="Apply filters"
                        onPrimary={() => {
                            onApply(draft);
                            onOpenChange(false);
                        }}
                    />
                </footer>
            </DialogPopup>
        </Dialog>
    );
}
