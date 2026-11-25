"use client";

import { type ReactNode, type Ref, useId, useState } from "react";

import { cn } from "@/lib/utils";

import { type AppIcon, Check, ChevronDown, Search } from "@/components/shared/icons";
import { mobileActionClass, MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import styles from "./mobile-select-drawer.module.css";

export type MobileSelectOption = {
    value: string;
    label: string;
    detail?: string | null;
};

function fieldMessage({
    id,
    errorText,
    helperText,
}: {
    id: string;
    errorText?: string;
    helperText?: ReactNode;
}) {
    const message = errorText ?? helperText;
    if (!message) return null;

    return (
        <p
            id={id}
            role={errorText ? "alert" : undefined}
            className={
                errorText ? "mbs-1.5 text-xs text-danger" : "body-sm mbs-1.5 text-ink-subtle"
            }
        >
            {message}
        </p>
    );
}

/** A field-sized trigger and a searchable single-choice drawer. */
export function MobileSelectDrawer({
    id,
    triggerRef,
    label,
    value,
    options,
    onChange,
    onBlur,
    onOpenChange,
    placeholder = "Choose an option",
    startIcon: StartIcon,
    disabled,
    loading,
    errorText,
    helperText,
    emptyText = "No matches",
    onSearchChange,
    searching,
    searchError,
    onRetry,
    allowCustom = false,
}: {
    id?: string;
    triggerRef?: Ref<HTMLButtonElement>;
    label: string;
    value: string;
    options: readonly MobileSelectOption[];
    onChange: (value: string) => void;
    onBlur?: () => void;
    onOpenChange?: (open: boolean) => void;
    placeholder?: string;
    startIcon?: AppIcon;
    disabled?: boolean;
    loading?: boolean;
    errorText?: string;
    helperText?: ReactNode;
    emptyText?: string;
    /** Supplying this delegates option filtering to the caller (e.g. an API search). */
    onSearchChange?: (query: string) => void;
    searching?: boolean;
    searchError?: string;
    onRetry?: () => void;
    allowCustom?: boolean;
}) {
    const generatedId = useId();
    const messageId = `${id ?? generatedId}-message`;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const selected = options.find((option) => option.value === value);
    const needle = query.trim().toLowerCase();
    const filtered = onSearchChange
        ? options
        : options.filter((option) =>
              `${option.label} ${option.detail ?? ""}`.toLowerCase().includes(needle),
          );
    const custom =
        allowCustom &&
        needle &&
        !searching &&
        !searchError &&
        !options.some((option) => option.value.toLowerCase() === needle) &&
        value.toLowerCase() !== needle;

    function changeOpen(next: boolean) {
        setOpen(next);
        if (next) {
            setQuery("");
            onSearchChange?.("");
        } else onBlur?.();
        onOpenChange?.(next);
    }

    function choose(next: string) {
        if (disabled || loading) return;
        onChange(next);
        changeOpen(false);
    }

    return (
        <div className="min-inline-0">
            <MobileActionDrawer
                open={open}
                onOpenChange={changeOpen}
                title={label}
                trigger={
                    <button
                        ref={triggerRef}
                        id={id}
                        type="button"
                        disabled={disabled || loading}
                        aria-label={`${label}: ${selected?.label || value || placeholder}`}
                        data-invalid={Boolean(errorText) || undefined}
                        aria-describedby={errorText || helperText ? messageId : undefined}
                        aria-busy={loading || undefined}
                        className={cn(styles.trigger, !value && styles.placeholder)}
                    >
                        {StartIcon ? <StartIcon aria-hidden /> : null}
                        <span>
                            {loading ? "Loading…" : selected?.label || value || placeholder}
                        </span>
                        <ChevronDown aria-hidden />
                    </button>
                }
            >
                {options.length > 7 || onSearchChange ? (
                    <div className={styles.search}>
                        <Input
                            value={query}
                            onValueChange={(next) => {
                                setQuery(next);
                                onSearchChange?.(next);
                            }}
                            startIcon={Search}
                            placeholder={`Search ${label.toLowerCase()}`}
                            aria-label={`Search ${label.toLowerCase()}`}
                            clearable
                        />
                    </div>
                ) : null}
                {searching ? (
                    <p role="status" className={styles.message}>
                        Searching…
                    </p>
                ) : null}
                {searchError && !searching ? (
                    <div role="alert" className={styles.message}>
                        <p>{searchError}</p>
                        {onRetry ? (
                            <Button type="button" variant="outline" onClick={onRetry}>
                                Try again
                            </Button>
                        ) : null}
                    </div>
                ) : null}
                {!searching && !searchError ? (
                    <div role="group" aria-label={label}>
                        {filtered.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={mobileActionClass}
                                aria-pressed={value === option.value}
                                onClick={() => choose(option.value)}
                            >
                                <span className="flex flex-1 flex-col gap-0.5 text-start min-inline-0">
                                    <span>{option.label}</span>
                                    {option.detail ? (
                                        <span className="text-xs font-normal text-ink-muted">
                                            {option.detail}
                                        </span>
                                    ) : null}
                                </span>
                                {value === option.value ? <Check aria-hidden /> : null}
                            </button>
                        ))}
                        {custom ? (
                            <button
                                type="button"
                                className={mobileActionClass}
                                onClick={() => choose(query.trim())}
                            >
                                Use “{query.trim()}”
                            </button>
                        ) : null}
                        {!filtered.length && !custom ? (
                            <p role="status" className={styles.message}>
                                {needle ? "No matching options. Try another search." : emptyText}
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </MobileActionDrawer>
            {fieldMessage({ id: messageId, errorText, helperText })}
        </div>
    );
}

/** A field-sized trigger and a searchable multi-choice drawer. */
export function MobileMultiSelectDrawer({
    id,
    triggerRef,
    label,
    value,
    options,
    onChange,
    onBlur,
    onOpenChange,
    placeholder = "Choose options",
    startIcon: StartIcon,
    disabled,
    loading,
    errorText,
    helperText,
    emptyText = "No matches",
    onSearchChange,
    searching,
    searchError,
    onRetry,
    allowCustom = false,
}: {
    id?: string;
    triggerRef?: Ref<HTMLButtonElement>;
    label: string;
    value: string[];
    options: readonly MobileSelectOption[];
    onChange: (value: string[]) => void;
    onBlur?: () => void;
    onOpenChange?: (open: boolean) => void;
    placeholder?: string;
    startIcon?: AppIcon;
    disabled?: boolean;
    loading?: boolean;
    errorText?: string;
    helperText?: ReactNode;
    emptyText?: string;
    onSearchChange?: (query: string) => void;
    searching?: boolean;
    searchError?: string;
    onRetry?: () => void;
    allowCustom?: boolean;
}) {
    const generatedId = useId();
    const messageId = `${id ?? generatedId}-message`;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const needle = query.trim().toLowerCase();
    const filtered = onSearchChange
        ? options
        : options.filter((option) =>
              `${option.label} ${option.detail ?? ""}`.toLowerCase().includes(needle),
          );
    const selectedLabels = value.map(
        (selectedValue) =>
            options.find((option) => option.value === selectedValue)?.label ?? selectedValue,
    );
    const summary = selectedLabels.length
        ? selectedLabels.length > 2
            ? `${selectedLabels.slice(0, 2).join(", ")} +${selectedLabels.length - 2}`
            : selectedLabels.join(", ")
        : placeholder;
    const custom =
        allowCustom &&
        needle &&
        !searching &&
        !searchError &&
        !options.some((option) => option.value.toLowerCase() === needle) &&
        !value.some((selectedValue) => selectedValue.toLowerCase() === needle);

    function changeOpen(next: boolean) {
        setOpen(next);
        if (next) {
            setQuery("");
            onSearchChange?.("");
        } else onBlur?.();
        onOpenChange?.(next);
    }

    function toggle(next: string) {
        if (disabled || loading) return;
        onChange(
            value.includes(next)
                ? value.filter((selectedValue) => selectedValue !== next)
                : [...value, next],
        );
        setQuery("");
        onSearchChange?.("");
    }

    return (
        <div className="min-inline-0">
            <MobileActionDrawer
                open={open}
                onOpenChange={changeOpen}
                title={label}
                description={value.length ? `${value.length} selected` : undefined}
                trigger={
                    <button
                        ref={triggerRef}
                        id={id}
                        type="button"
                        disabled={disabled || loading}
                        aria-label={`${label}: ${summary}`}
                        data-invalid={Boolean(errorText) || undefined}
                        aria-describedby={errorText || helperText ? messageId : undefined}
                        aria-busy={loading || undefined}
                        className={cn(styles.trigger, !value.length && styles.placeholder)}
                    >
                        {StartIcon ? <StartIcon aria-hidden /> : null}
                        <span>{loading ? "Loading..." : summary}</span>
                        <ChevronDown aria-hidden />
                    </button>
                }
            >
                <div className={styles.search}>
                    <Input
                        value={query}
                        onValueChange={(next) => {
                            setQuery(next);
                            onSearchChange?.(next);
                        }}
                        startIcon={Search}
                        placeholder={`Search ${label.toLowerCase()}`}
                        aria-label={`Search ${label.toLowerCase()}`}
                        clearable
                    />
                </div>
                {searching ? (
                    <p role="status" className={styles.message}>
                        Searching...
                    </p>
                ) : null}
                {searchError && !searching ? (
                    <div role="alert" className={styles.message}>
                        <p>{searchError}</p>
                        {onRetry ? (
                            <Button type="button" variant="outline" onClick={onRetry}>
                                Try again
                            </Button>
                        ) : null}
                    </div>
                ) : null}
                {!searching && !searchError ? (
                    <div role="group" aria-label={label}>
                        {filtered.map((option) => {
                            const selected = value.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={mobileActionClass}
                                    aria-pressed={selected}
                                    onClick={() => toggle(option.value)}
                                >
                                    <span className="flex flex-1 flex-col gap-0.5 text-start min-inline-0">
                                        <span>{option.label}</span>
                                        {option.detail ? (
                                            <span className="text-xs font-normal text-ink-muted">
                                                {option.detail}
                                            </span>
                                        ) : null}
                                    </span>
                                    {selected ? <Check aria-hidden /> : null}
                                </button>
                            );
                        })}
                        {custom ? (
                            <button
                                type="button"
                                className={mobileActionClass}
                                onClick={() => toggle(query.trim())}
                            >
                                Use &ldquo;{query.trim()}&rdquo;
                            </button>
                        ) : null}
                        {!filtered.length && !custom ? (
                            <p role="status" className={styles.message}>
                                {needle ? "No matching options. Try another search." : emptyText}
                            </p>
                        ) : null}
                    </div>
                ) : null}
                <Button
                    type="button"
                    variant="accent"
                    className="mbs-2 inline-full"
                    onClick={() => changeOpen(false)}
                >
                    Done
                </Button>
            </MobileActionDrawer>
            {fieldMessage({ id: messageId, errorText, helperText })}
        </div>
    );
}

export const mobileSelectTriggerClass = styles.trigger;
export const mobileSelectPlaceholderClass = styles.placeholder;
export const mobileSelectSearchClass = styles.search;
export const mobileSelectMessageClass = styles.message;
