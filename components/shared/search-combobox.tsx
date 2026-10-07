"use client";

import { type ReactNode, type Ref, useId, useMemo, useState } from "react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from "@/components/ui/combobox";

export type SearchOption = {
    value: string;
    /** Second line under the value, e.g. the state of a city. */
    detail?: string | null;
};

type CommonProps = {
    id?: string;
    /** Results for the current search. The server filters; nothing is filtered here. */
    options: readonly SearchOption[];
    /** Raw input text on every keystroke. Debounce it before searching. */
    onSearchChange: (text: string) => void;
    onOpenChange?: (open: boolean) => void;
    onBlur?: () => void;
    /** A search is in flight. The input stays usable so typing never stalls. */
    searching?: boolean;
    /** Offer what was typed as an option when no result matches it exactly. */
    allowCustom?: boolean;
    placeholder?: string;
    disabled?: boolean;
    errorText?: string;
    helperText?: ReactNode;
    /** Shown when the list is empty and nothing has been typed. */
    emptyText?: string;
    startIcon?: LucideIcon;
    size?: "default" | "lg";
    inputRef?: Ref<HTMLInputElement>;
};

type SingleProps = CommonProps & {
    multiple?: false;
    value: string;
    onValueChange: (value: string) => void;
};

type MultipleProps = CommonProps & {
    multiple: true;
    value: string[];
    onValueChange: (value: string[]) => void;
};

export type SearchComboboxProps = SingleProps | MultipleProps;

function sameText(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Combobox whose options come from a server search: single value or multiple
 * chips, the typed text reported up for the caller to query with, and an
 * optional "Use …" row so a place the server does not know can still be
 * entered.
 */
export function SearchCombobox(props: SearchComboboxProps) {
    const {
        id,
        options,
        onSearchChange,
        onOpenChange,
        onBlur,
        searching = false,
        allowCustom = false,
        placeholder,
        disabled = false,
        errorText,
        helperText,
        emptyText = "Type to search",
        startIcon,
        size = "default",
        inputRef,
    } = props;

    const generatedId = useId();
    const inputId = id ?? generatedId;
    const anchor = useComboboxAnchor();
    const [text, setText] = useState("");

    const selectedValue = props.value;
    const selected = useMemo(
        () => (Array.isArray(selectedValue) ? selectedValue : selectedValue ? [selectedValue] : []),
        [selectedValue],
    );
    const typed = text.trim();

    const details = useMemo(
        () => new Map(options.map((option) => [option.value, option.detail ?? null])),
        [options],
    );

    const { items, customValue } = useMemo(() => {
        const seen = new Set<string>();
        const list: string[] = [];
        for (const option of options) {
            const key = option.value.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            list.push(option.value);
        }

        const offerCustom =
            allowCustom &&
            typed.length > 0 &&
            !seen.has(typed.toLowerCase()) &&
            !selected.some((value) => sameText(value, typed));
        if (offerCustom) list.push(typed);

        return { items: list, customValue: offerCustom ? typed : null };
    }, [options, allowCustom, typed, selected]);

    function handleInputChange(next: string) {
        setText(next);
        // A single combobox fills its input with the chosen value; searching
        // for exactly that would hide every other option when it reopens.
        const isSelectedLabel = !props.multiple && props.value && sameText(next, props.value);
        onSearchChange(isSelectedLabel ? "" : next);
    }

    function handleOpenChange(open: boolean) {
        onOpenChange?.(open);
        if (!open) onBlur?.();
    }

    function renderItem(item: string) {
        const detail = details.get(item);
        return (
            <ComboboxItem key={item} value={item}>
                {item === customValue ? (
                    <span className="text-ink-muted">
                        Use <span className="font-semibold text-ink">“{item}”</span>
                    </span>
                ) : (
                    <span className="flex flex-col min-inline-0">
                        <span className="truncate">{item}</span>
                        {detail ? (
                            <span className="truncate text-xs font-normal text-ink-subtle">
                                {detail}
                            </span>
                        ) : null}
                    </span>
                )}
            </ComboboxItem>
        );
    }

    const content = (
        <ComboboxContent anchor={props.multiple ? anchor : undefined}>
            {searching ? (
                <p className="px-2.5 py-1.5 text-xs text-ink-subtle" aria-live="polite">
                    Searching…
                </p>
            ) : null}
            <ComboboxEmpty>{searching ? null : typed ? "No matches" : emptyText}</ComboboxEmpty>
            <ComboboxList>{renderItem}</ComboboxList>
        </ComboboxContent>
    );

    if (props.multiple) {
        const messageId = `${inputId}-message`;
        const message = errorText ?? helperText;
        return (
            <div className="inline-full">
                <Combobox
                    multiple
                    items={items}
                    filter={null}
                    value={props.value}
                    onValueChange={(next: string[]) => props.onValueChange(next)}
                    onInputValueChange={handleInputChange}
                    onOpenChange={handleOpenChange}
                    itemToStringLabel={(item: string) => item}
                    disabled={disabled}
                >
                    <ComboboxChips
                        ref={anchor}
                        className={cn(
                            disabled && "pointer-events-none bg-surface-muted opacity-50",
                        )}
                    >
                        <ComboboxValue>
                            {(values: string[]) => (
                                <>
                                    {values.map((value) => (
                                        <ComboboxChip key={value}>{value}</ComboboxChip>
                                    ))}
                                    <ComboboxChipsInput
                                        id={inputId}
                                        ref={inputRef}
                                        placeholder={values.length > 0 ? undefined : placeholder}
                                        disabled={disabled}
                                        aria-invalid={Boolean(errorText) || undefined}
                                        aria-describedby={message ? messageId : undefined}
                                        className="text-[15px] block-7 placeholder:text-ink-subtle"
                                    />
                                </>
                            )}
                        </ComboboxValue>
                    </ComboboxChips>
                    {content}
                </Combobox>
                {message ? (
                    <p
                        id={messageId}
                        role={errorText ? "alert" : undefined}
                        className={cn(
                            "body-sm mbs-1.5",
                            errorText ? "text-danger" : "text-ink-subtle",
                        )}
                    >
                        {message}
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <Combobox
            items={items}
            filter={null}
            value={props.value || null}
            onValueChange={(next: string | null) => props.onValueChange(next ?? "")}
            onInputValueChange={handleInputChange}
            onOpenChange={handleOpenChange}
            itemToStringLabel={(item: string) => item}
        >
            <ComboboxInput
                id={inputId}
                ref={inputRef}
                size={size}
                startIcon={startIcon}
                placeholder={placeholder}
                errorText={errorText}
                helperText={helperText}
                disabled={disabled}
            />
            {content}
        </Combobox>
    );
}
