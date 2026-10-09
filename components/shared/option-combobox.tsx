"use client";

import type { LucideIcon } from "lucide-react";

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";

export type ComboboxOption = { value: string; label: string };

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
}: {
    id?: string;
    value: string;
    onValueChange: (value: string) => void;
    onBlur?: () => void;
    options: readonly ComboboxOption[];
    placeholder?: string;
    startIcon?: LucideIcon;
    /** Shows a spinner and blocks input while the options are being fetched. */
    loading?: boolean;
    disabled?: boolean;
    emptyText?: string;
    errorText?: string;
    helperText?: string;
    /** Caps rendered matches. Needed for long lists such as a state's cities. */
    limit?: number;
}) {
    const labelFor = (item: string) =>
        options.find((option) => option.value === item)?.label ?? item;

    return (
        <Combobox
            value={value || null}
            onValueChange={(next: string | null) => onValueChange(next ?? "")}
            onOpenChange={(open) => {
                if (!open) onBlur?.();
            }}
            items={options.map((option) => option.value)}
            itemToStringLabel={labelFor}
            {...(limit == null ? {} : { limit })}
        >
            <ComboboxInput
                id={id}
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
                        <ComboboxItem key={item} value={item}>
                            {labelFor(item)}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}
