"use client";

import { type ReactNode, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-locations";

import type { AppIcon } from "@/components/shared/icons";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    type ComboboxInputProps,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";

export type ComboboxOption = { value: string; label: string; displayLabel?: ReactNode };

/**
 * Single-select dropdown over a list already in memory, filtered as the user
 * types. The form-agnostic sibling of the property form's `SelectField`.
 */
export function OptionCombobox({
    id,
    value,
    onValueChange,
    onBlur,
    options,
    placeholder = "Choose an option",
    startIcon,
    loading = false,
    disabled = false,
    emptyText = "No matches",
    errorText,
    helperText,
    limit,
    size,
    textClassName,
    searchDebounceMs,
}: {
    id?: string;
    value: string;
    onValueChange: (value: string) => void;
    onBlur?: () => void;
    options: readonly ComboboxOption[];
    placeholder?: string;
    startIcon?: AppIcon;
    /** Shows a spinner and blocks input while the options are being fetched. */
    loading?: boolean;
    disabled?: boolean;
    emptyText?: string;
    errorText?: string;
    helperText?: string;
    /** Caps rendered matches. Never set it on country / state / city lists — it hides real places past the cap. */
    limit?: number;
    size?: ComboboxInputProps["size"];
    /** Font treatment shared by the input and portalled options. */
    textClassName?: string;
    /**
     * Wait this long after the last keystroke before re-filtering. Use on long
     * lists (a state's cities) so typing stays smooth on low-end phones.
     */
    searchDebounceMs?: number;
}) {
    const labelFor = (item: string) =>
        options.find((option) => option.value === item)?.label ?? item;

    const debounced = searchDebounceMs != null;
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query, searchDebounceMs ?? 0);
    const allValues = useMemo(() => options.map((option) => option.value), [options]);
    const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

    const filteredValues = useMemo(() => {
        if (!debounced) return allValues;
        const term = debouncedQuery.trim().toLowerCase();
        // The input shows the chosen label after a pick — list everything then,
        // same as the built-in filter, so the user can switch cities.
        if (!term || term === selectedLabel.trim().toLowerCase()) return allValues;
        return options
            .filter((option) => option.label.toLowerCase().includes(term))
            .map((option) => option.value);
    }, [debounced, debouncedQuery, selectedLabel, options, allValues]);

    return (
        <Combobox
            value={value || null}
            disabled={disabled}
            onValueChange={(next: string | null) => {
                if (!disabled) onValueChange(next ?? "");
            }}
            onOpenChange={(open) => {
                if (!open) onBlur?.();
            }}
            items={filteredValues}
            itemToStringLabel={labelFor}
            {...(debounced
                ? { filter: null, onInputValueChange: (next: string) => setQuery(next) }
                : {})}
            {...(limit == null ? {} : { limit })}
        >
            <ComboboxInput
                id={id}
                size={size}
                className={textClassName}
                startIcon={startIcon}
                placeholder={placeholder}
                loading={loading}
                disabled={disabled}
                errorText={errorText}
                helperText={helperText}
            />
            <ComboboxContent>
                <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                <ComboboxList>
                    {(item: string) => (
                        <ComboboxItem key={item} value={item} className={textClassName}>
                            {options.find((option) => option.value === item)?.displayLabel ??
                                labelFor(item)}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}
