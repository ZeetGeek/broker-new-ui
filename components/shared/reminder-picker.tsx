"use client";

import { useId, useState } from "react";

import { MAX_REMINDER_MINUTES } from "@/lib/reminders";
import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { Bell, Check, Plus, X } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import styles from "./reminder-picker.module.css";

const UNITS = [
    { value: "1", label: "Minutes before" },
    { value: "60", label: "Hours before" },
    { value: "1440", label: "Days before" },
];

export function ReminderPicker({
    reminders,
    getReminderAt,
    getReminderLabel,
    presets,
    subjectLabel,
    scheduleLabel,
    hint,
    now,
    onChange,
    disabled = false,
}: {
    reminders: number[];
    getReminderAt: (minutes: number) => string | null;
    getReminderLabel: (minutes: number) => string;
    presets: { value: number; label: string }[];
    subjectLabel: string;
    scheduleLabel: string;
    hint: string;
    now: number;
    onChange: (reminders: number[]) => void;
    disabled?: boolean;
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("30");
    const [unit, setUnit] = useState("1");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const sorted = [...reminders].sort((a, b) => b - a);
    const add = (minutes: number) => {
        if (disabled) return;
        setNotice("");
        if (!Number.isInteger(minutes) || minutes < 0 || minutes > MAX_REMINDER_MINUTES) {
            setError(`Use a whole number from 0 up to 365 days before the ${subjectLabel}.`);
            return;
        }
        if (reminders.includes(minutes)) {
            setError("That reminder is already added. Choose another time.");
            return;
        }
        const at = getReminderAt(minutes);
        if (!at || Date.parse(at) <= now) {
            setError(
                `That reminder time has already passed. Choose a shorter lead time or a later ${scheduleLabel}.`,
            );
            return;
        }
        onChange([...reminders, minutes].sort((a, b) => b - a));
        setError("");
        setNotice(`Added: ${getReminderLabel(minutes)}.`);
    };
    const addCustom = () => {
        if (amount.trim() === "" || !/^\d+$/.test(amount)) {
            setError("Enter a whole number of minutes, hours or days.");
            return;
        }
        add(Number(amount) * Number(unit));
    };
    return (
        <div className={styles.picker}>
            <div className={styles.heading}>
                <span className={styles.label}>Reminders</span>
                {reminders.length > 0 ? (
                    <span className={styles.count}>{reminders.length}</span>
                ) : null}
            </div>
            {sorted.length ? (
                <ul className={styles.selected} aria-label="Selected reminders">
                    {sorted.map((minutes) => {
                        const at = getReminderAt(minutes);
                        const label = getReminderLabel(minutes);
                        return (
                            <li key={minutes} className={styles.reminder}>
                                <Bell aria-hidden="true" className={styles.bell} />
                                <div className={styles.reminderText}>
                                    <span>{label}</span>
                                    {at ? (
                                        <span className={styles.when}>
                                            {formatVisitDate(at)} · {formatVisitTime(at)} IST
                                        </span>
                                    ) : null}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-md"
                                    type="button"
                                    disabled={disabled}
                                    aria-label={`Remove ${label.toLowerCase()} reminder`}
                                    onClick={() =>
                                        onChange(reminders.filter((value) => value !== minutes))
                                    }
                                >
                                    <X aria-hidden="true" />
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className={styles.empty}>
                    No reminders set. Add one or more when you need a nudge.
                </p>
            )}
            <Popover
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    setError("");
                    setNotice("");
                }}
            >
                <PopoverTrigger
                    render={
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            disabled={disabled}
                            className={styles.addTrigger}
                        />
                    }
                >
                    <Plus aria-hidden="true" /> Add reminder
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={8} className={styles.popover}>
                    <div className={styles.popoverHeader}>
                        <PopoverTitle>Add a reminder</PopoverTitle>
                        <PopoverDescription>
                            Choose more than one, or set your own.
                        </PopoverDescription>
                    </div>
                    <div className={styles.presets} aria-label="Quick reminder times">
                        {presets.map((reminder) => {
                            const selected = reminders.includes(reminder.value);
                            return (
                                <button
                                    type="button"
                                    key={reminder.value}
                                    className={styles.preset}
                                    disabled={selected || disabled}
                                    aria-pressed={selected}
                                    onClick={() => add(reminder.value)}
                                >
                                    <Bell aria-hidden="true" />
                                    <span>{reminder.label}</span>
                                    {selected ? (
                                        <Check aria-hidden="true" className={styles.check} />
                                    ) : (
                                        <Plus aria-hidden="true" className={styles.presetPlus} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className={styles.custom}>
                        <label htmlFor={`${id}-amount`} className={styles.label}>
                            Custom reminder
                        </label>
                        <div className={styles.customRow}>
                            <Input
                                id={`${id}-amount`}
                                type="number"
                                disabled={disabled}
                                inputMode="numeric"
                                min={0}
                                max={Math.floor(MAX_REMINDER_MINUTES / Number(unit))}
                                step={1}
                                size="md"
                                value={amount}
                                aria-label="Custom reminder amount"
                                onValueChange={(value) => {
                                    setAmount(value);
                                    setError("");
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        addCustom();
                                    }
                                }}
                            />
                            <Select
                                items={UNITS}
                                value={unit}
                                disabled={disabled}
                                onValueChange={(value) => {
                                    if (value) {
                                        setUnit(value);
                                        setError("");
                                    }
                                }}
                            >
                                <SelectTrigger size="md" aria-label="Custom reminder unit">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {UNITS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="button"
                            variant="accent"
                            size="md"
                            disabled={disabled}
                            onClick={addCustom}
                        >
                            <Plus aria-hidden="true" /> Add custom reminder
                        </Button>
                    </div>
                    {error ? (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    ) : null}
                    <p className={styles.notice} role="status">
                        {notice}
                    </p>
                    <div className={styles.footer}>
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            onClick={() => setOpen(false)}
                            className="inline-full"
                        >
                            Done
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            <p className={styles.hint}>{hint}</p>
        </div>
    );
}
