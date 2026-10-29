"use client";

import type { ReactNode } from "react";

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
    /** Caps rendered matches. Needed for long lists such as a state's cities. */
    limit?: number;
    size?: ComboboxInputProps["size"];
    /** Font treatment shared by the input and portalled options. */
    textClassName?: string;
}) {
    const labelFor = (item: string) =>
        options.find((option) => option.value === item)?.label ?? item;

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
            items={options.map((option) => option.value)}
            itemToStringLabel={labelFor}
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
