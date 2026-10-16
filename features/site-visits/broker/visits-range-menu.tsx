"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

import { CalendarRange, ChevronDown, Search } from "lucide-react";

import { formatDateIso, formatDateShort } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";
import type { SlotDateRange } from "@/features/site-visits/broker/open-slots/slot-filters";

const RANGE_OPTIONS: { value: SlotDateRange; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "week", label: "Next week" },
    { value: "month", label: "Next month" },
    { value: "custom", label: "Custom" },
];

function parseKey(key: string): Date | undefined {
    if (!key) return undefined;
    const [y, m, d] = key.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
}

function rangeLabel(range: SlotDateRange, customFrom: string, customTo: string) {
    if (range !== "custom") {
        return RANGE_OPTIONS.find((option) => option.value === range)?.label ?? "Next week";
    }
    const from = parseKey(customFrom);
    const to = parseKey(customTo);
    if (from && to) {
        return formatDateIso(from) === formatDateIso(to)
            ? formatDateShort(from)
            : `${formatDateShort(from)} – ${formatDateShort(to)}`;
    }
    if (from) return `${formatDateShort(from)} – …`;
    return "Custom";
}

function VisitsSearchInput({
    id,
    value,
    onChange,
    placeholder,
    ariaLabel,
}: {
    id: string;
    value: string;
    onChange: (next: string) => void;
    placeholder: string;
    ariaLabel: string;
}) {
    const [draft, setDraft] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        setDraft(value);
    }

    useEffect(() => {
        if (draft === value) return;
        const timer = window.setTimeout(() => onChange(draft), 250);
        return () => window.clearTimeout(timer);
    }, [draft, onChange, value]);

    return (
        <Input
            id={id}
            size="sm"
            value={draft}
            onValueChange={setDraft}
            placeholder={placeholder}
            aria-label={ariaLabel}
            startIcon={Search}
            clearable
            wrapperClassName="
              min-inline-40 inline-40 shadow-sm
              sm:min-inline-52 sm:inline-52
              lg:min-inline-64 lg:inline-64
            "
            className="
              rounded-control border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

export function VisitsRangeMenu({
    query,
    onQueryChange,
    range,
    customFrom,
    customTo,
    onRangeChange,
    searchId = "slot-search",
    searchPlaceholder = "Search slots",
    searchAriaLabel = "Search open slots",
    customDescription = "Choose a start date and an end date for open slots.",
}: {
    query: string;
    onQueryChange: (next: string) => void;
    range: SlotDateRange;
    customFrom: string;
    customTo: string;
    onRangeChange: (next: { range: SlotDateRange; customFrom?: string; customTo?: string }) => void;
    searchId?: string;
    searchPlaceholder?: string;
    searchAriaLabel?: string;
    customDescription?: string;
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const isDefault = range === "week";
    const from = parseKey(customFrom);
    const to = parseKey(customTo);
    const [draft, setDraft] = useState<DateRange | undefined>(
        from || to ? { from, to: to ?? from } : undefined,
    );

    const openCustomPicker = () => {
        const nextFrom = parseKey(customFrom);
        const nextTo = parseKey(customTo);
        setDraft(nextFrom || nextTo ? { from: nextFrom, to: nextTo ?? nextFrom } : undefined);
        setPickerOpen(true);
    };

    return (
        <div className="flex shrink-0 items-center gap-2.5">
            <VisitsSearchInput
                id={searchId}
                value={query}
                onChange={onQueryChange}
                placeholder={searchPlaceholder}
                ariaLabel={searchAriaLabel}
            />

            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <button
                            type="button"
                            className={cn(
                                ownerListingsChipClassName(!isDefault),
                                "gap-2",
                                isDefault && "text-ink-muted",
                            )}
                        >
                            <CalendarRange
                                aria-hidden
                                className="text-brand block-4 inline-4"
                                strokeWidth={1.75}
                            />
                            <span className="hidden sm:inline">
                                {rangeLabel(range, customFrom, customTo)}
                            </span>
                            <span className="sm:hidden">Date</span>
                            <ChevronDown
                                aria-hidden
                                className="opacity-60 block-3.5 inline-3.5"
                                strokeWidth={1.75}
                            />
                        </button>
                    }
                />
                <DropdownMenuContent align="end" className="min-inline-44">
                    {RANGE_OPTIONS.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            className={cn(range === option.value && "font-semibold text-brand")}
                            onClick={() => {
                                if (option.value === "custom") {
                                    openCustomPicker();
                                    return;
                                }
                                onRangeChange({
                                    range: option.value,
                                    customFrom: "",
                                    customTo: "",
                                });
                            }}
                        >
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogPopup className="gap-0 overflow-hidden p-0 max-inline-md sm:max-inline-md">
                    <DialogHeader className="border-be border-border-warm px-5 py-4 text-start">
                        <DialogTitle>Custom date range</DialogTitle>
                        <DialogDescription>{customDescription}</DialogDescription>
                        <DialogClose />
                    </DialogHeader>
                    <div className="flex justify-center p-3">
                        <Calendar
                            mode="range"
                            autoFocus
                            selected={draft}
                            onSelect={setDraft}
                            defaultMonth={draft?.from ?? new Date()}
                            numberOfMonths={1}
                        />
                    </div>
                    <footer className="border-bs border-border-warm bg-surface px-5 py-4">
                        <AppModalFooter
                            secondaryLabel="Cancel"
                            onSecondary={() => setPickerOpen(false)}
                            primaryLabel="Apply range"
                            primaryDisabled={!draft?.from}
                            onPrimary={() => {
                                if (!draft?.from) return;
                                onRangeChange({
                                    range: "custom",
                                    customFrom: formatDateIso(draft.from),
                                    customTo: formatDateIso(draft.to ?? draft.from),
                                });
                                setPickerOpen(false);
                            }}
                        />
                    </footer>
                </DialogPopup>
            </Dialog>
        </div>
    );
}
