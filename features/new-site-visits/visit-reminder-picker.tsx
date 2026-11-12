"use client";

import { useId, useState } from "react";

import { MAX_REMINDER_MINUTES } from "@/lib/reminders";
import { inputValueToUtc } from "@/lib/visits/time";

import { Button } from "@/components/ui/button";
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
    ComboboxValue,
    useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { MAX_VISIT_REMINDERS, VISIT_REMINDERS, visitReminderAt, visitReminderLabel } from "./model";

const UNITS = [
    { value: "1", label: "Minutes before" },
    { value: "60", label: "Hours before" },
    { value: "1440", label: "Days before" },
];

const reminderLabel = (minutes: number) =>
    visitReminderLabel(minutes).replace(/\bminutes?\b/g, "min");

export function VisitReminderPicker({
    reminders,
    date,
    startTime,
    now,
    disabled,
    onChange,
}: {
    reminders: number[];
    date: string;
    startTime: string;
    now: number;
    disabled: boolean;
    onChange: (values: number[]) => void;
}) {
    const id = useId();
    const anchor = useComboboxAnchor();
    const [amount, setAmount] = useState("30");
    const [unit, setUnit] = useState("1");
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const atLimit = reminders.length >= MAX_VISIT_REMINDERS;
    const items = [...new Set([...VISIT_REMINDERS.map((item) => item.value), ...reminders])];
    const timeAt = (minutes: number) => {
        try {
            return visitReminderAt(inputValueToUtc(`${date}T${startTime}`), minutes);
        } catch {
            return null;
        }
    };
    const expired = (minutes: number) => {
        const at = timeAt(minutes);
        return !at || Date.parse(at) <= now;
    };
    const update = (values: number[]) => {
        if (disabled) return;
        if (values.length > MAX_VISIT_REMINDERS) {
            setError(`You can add up to ${MAX_VISIT_REMINDERS} reminders per visit.`);
            return;
        }
        if (values.some((value) => !reminders.includes(value) && expired(value))) {
            setError("That reminder time has passed. Choose a shorter lead time.");
            return;
        }
        onChange([...values].sort((a, b) => b - a));
        setError("");
        setSearch("");
    };
    const addCustom = () => {
        const minutes = Number(amount) * Number(unit);
        if (!/^\d+$/.test(amount) || !Number.isInteger(minutes) || minutes > MAX_REMINDER_MINUTES) {
            setError("Use a whole number between 0 minutes and 365 days before the visit.");
        } else if (reminders.includes(minutes)) {
            setError("That reminder is already selected.");
        } else {
            update([...reminders, minutes]);
        }
    };
    return (
        <div className="flex flex-col gap-2 min-inline-0">
            <div className="flex items-center justify-between gap-3">
                <label htmlFor={id} className="text-sm font-semibold text-ink">
                    Reminders (optional)
                </label>
                <span className="text-xs text-ink-muted" aria-live="polite">
                    {reminders.length} / {MAX_VISIT_REMINDERS}
                </span>
            </div>
            <Combobox
                multiple
                items={items}
                value={reminders}
                disabled={disabled}
                inputValue={search}
                onInputValueChange={setSearch}
                itemToStringLabel={reminderLabel}
                onValueChange={update}
            >
                <ComboboxChips
                    ref={anchor}
                    className="gap-2 px-3 py-2 font-normal min-block-12 hover:border-ring/50 has-data-[slot=combobox-chip]:px-3 data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                    <ComboboxValue>
                        {(values: number[]) => (
                            <>
                                {values.map((minutes) => (
                                    <ComboboxChip
                                        key={minutes}
                                        className="rounded-md ps-3 text-sm block-auto min-block-8 **:data-[slot=combobox-chip-remove]:min-block-8 **:data-[slot=combobox-chip-remove]:min-inline-8"
                                    >
                                        {reminderLabel(minutes)}
                                    </ComboboxChip>
                                ))}
                                <ComboboxChipsInput
                                    id={id}
                                    disabled={disabled}
                                    placeholder={
                                        atLimit
                                            ? undefined
                                            : values.length
                                              ? "Add more…"
                                              : "Select reminders"
                                    }
                                    aria-describedby={error ? `${id}-error` : undefined}
                                    className="text-base font-normal block-8 min-inline-24 placeholder:text-ink-subtle"
                                />
                            </>
                        )}
                    </ComboboxValue>
                    <ComboboxTrigger
                        aria-label="Choose reminders"
                        disabled={disabled}
                        className="ms-auto"
                    />
                </ComboboxChips>
                <ComboboxContent
                    anchor={anchor}
                    align="center"
                    className="overflow-y-auto inline-[min(26rem,calc(100dvw-2rem))] data-[chips=true]:min-inline-0"
                >
                    <ComboboxEmpty>
                        No matching reminders. Set a custom reminder below.
                    </ComboboxEmpty>
                    <ComboboxList>
                        {(minutes: number) => {
                            const selected = reminders.includes(minutes);
                            return (
                                <ComboboxItem
                                    key={minutes}
                                    value={minutes}
                                    disabled={!selected && (atLimit || expired(minutes))}
                                    className="min-block-11"
                                >
                                    {reminderLabel(minutes)}
                                </ComboboxItem>
                            );
                        }}
                    </ComboboxList>
                    <div
                        className="flex flex-col gap-3 border-bs border-border-warm p-3"
                        onKeyDown={(event) => {
                            if (event.key !== "Escape" && event.key !== "Tab")
                                event.stopPropagation();
                            if (
                                event.key === "Enter" &&
                                (event.target as HTMLElement).id === `${id}-custom`
                            ) {
                                event.preventDefault();
                                addCustom();
                            }
                        }}
                    >
                        <label htmlFor={`${id}-custom`} className="text-sm font-semibold">
                            Custom reminder
                        </label>
                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-2">
                            <Input
                                id={`${id}-custom`}
                                type="number"
                                size="md"
                                inputMode="numeric"
                                min={0}
                                max={Math.floor(MAX_REMINDER_MINUTES / Number(unit))}
                                step={1}
                                value={amount}
                                onValueChange={(value) => {
                                    setAmount(value);
                                    setError("");
                                }}
                                disabled={disabled || atLimit}
                            />
                            <Select
                                items={UNITS}
                                value={unit}
                                onValueChange={(value) => {
                                    if (value) setUnit(value);
                                }}
                                disabled={disabled || atLimit}
                            >
                                <SelectTrigger size="md" aria-label="Custom reminder unit">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {UNITS.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="button"
                            variant="accent"
                            size="md"
                            disabled={disabled || atLimit}
                            onClick={addCustom}
                        >
                            Add custom reminder
                        </Button>
                        {atLimit && (
                            <p role="status" className="text-xs text-ink-muted">
                                Six reminders selected. Remove one to add another.
                            </p>
                        )}
                        {error && (
                            <p role="alert" className="text-sm text-danger">
                                {error}
                            </p>
                        )}
                    </div>
                </ComboboxContent>
            </Combobox>
            {error && (
                <p id={`${id}-error`} role="alert" className="text-sm text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
