"use client";

import { type ReactNode, type Ref, useId, useMemo, useState } from "react";

import { Tailspin } from "ldrs/react";

import { areaColorClassName } from "@/lib/styles/area-color";
import { cn } from "@/lib/utils";

import { type AppIcon, MapPin, Search } from "@/components/shared/icons";
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    type ComboboxInputProps,
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
    startIcon?: AppIcon;
    size?: NonNullable<ComboboxInputProps["size"]>;
    /** Styles the control face for both single and multiple selections. */
    className?: string;
    inputRef?: Ref<HTMLInputElement>;
    /** Display-only formatting for selected chips; stored values remain unchanged. */
    formatChipLabel?: (value: string) => string;
    /** Display-only formatting for results and the single selected value. */
    formatOptionLabel?: (value: string) => string;
    searchError?: string;
    onRetry?: () => void;
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
        className,
        inputRef,
        formatChipLabel,
        formatOptionLabel = (value: string) => value,
        searchError,
        onRetry,
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
            !searching &&
            !searchError &&
            typed.length > 0 &&
            !seen.has(typed.toLowerCase()) &&
            !selected.some((value) => sameText(value, typed));
        if (offerCustom) list.push(typed);

        return { items: list, customValue: offerCustom ? typed : null };
    }, [options, allowCustom, typed, selected, searching, searchError]);

    function handleInputChange(next: string) {
        setText(next);
        // A single combobox fills its input with the chosen value; searching
        // for exactly that would hide every other option when it reopens.
        const isSelectedLabel =
            !props.multiple && props.value && sameText(next, formatOptionLabel(props.value));
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
                        Use{" "}
                        <span className="font-semibold text-ink">“{formatOptionLabel(item)}”</span>
                    </span>
                ) : (
                    <span className="flex flex-col min-inline-0">
                        <span className="truncate">{formatOptionLabel(item)}</span>
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
                <div
                    role="status"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-ink-muted"
                >
                    <span
                        aria-hidden
                        className="flex shrink-0 items-center justify-center text-ink block-8 inline-8"
                    >
                        <Tailspin size="16" stroke="2" speed="0.9" color="currentColor" />
                    </span>
                    <span>Searching for areas…</span>
                </div>
            ) : null}
            {searchError && !searching ? (
                <div
                    role="alert"
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-ink-muted"
                >
                    <span>{searchError}</span>
                    {onRetry ? (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="shrink-0 rounded-sm px-2 font-semibold text-brand outline-none min-block-11 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Try again
                        </button>
                    ) : null}
                </div>
            ) : null}
            <ComboboxEmpty className="justify-start gap-3 text-start">
                {searching || searchError ? null : (
                    <>
                        <span
                            aria-hidden
                            className="flex shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted block-9 inline-9"
                        >
                            {typed ? (
                                <Search className="block-4 inline-4" />
                            ) : (
                                <MapPin className="block-4 inline-4" />
                            )}
                        </span>
                        <span className="flex flex-col gap-0.5">
                            <span className="font-medium text-ink">
                                {typed ? "No matching areas" : emptyText}
                            </span>
                            <span className="text-xs text-ink-muted">
                                {typed
                                    ? "Try another area name."
                                    : "Suggestions will appear as you type."}
                            </span>
                        </span>
                    </>
                )}
            </ComboboxEmpty>
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
                    itemToStringLabel={formatOptionLabel}
                    disabled={disabled}
                >
                    <ComboboxChips
                        ref={anchor}
                        className={cn(
                            "has-data-[slot=combobox-chip]:px-3 pointer-coarse:min-block-(--touch-target-min)",
                            {
                                xs: "px-2.5 py-0 min-block-control-xs",
                                sm: "px-3 py-0.5 min-block-control-sm",
                                default: "px-3.5 py-0.5 min-block-control-md",
                                md: "px-4 py-1.5 min-block-control-lg",
                                lg: "px-4 py-2 min-block-control-xl",
                            }[size],
                            disabled && "pointer-events-none bg-surface-muted opacity-50",
                            className,
                        )}
                    >
                        <ComboboxValue>
                            {(values: string[]) => (
                                <>
                                    {values.map((value) => (
                                        <ComboboxChip
                                            key={value}
                                            className={cn(
                                                "rounded-full px-2.5 block-7 max-inline-full has-data-[slot=combobox-chip-remove]:pe-1",
                                                size === "xs" && "block-5",
                                                size === "sm" && "block-6",
                                                areaColorClassName(value),
                                            )}
                                            removeLabel={`Remove ${formatChipLabel ? formatChipLabel(value) : formatOptionLabel(value)}`}
                                        >
                                            <span className="truncate min-inline-0">
                                                {formatChipLabel
                                                    ? formatChipLabel(value)
                                                    : formatOptionLabel(value)}
                                            </span>
                                        </ComboboxChip>
                                    ))}
                                    <ComboboxChipsInput
                                        id={inputId}
                                        ref={inputRef}
                                        placeholder={values.length > 0 ? undefined : placeholder}
                                        disabled={disabled}
                                        aria-invalid={Boolean(errorText) || undefined}
                                        aria-describedby={message ? messageId : undefined}
                                        className={cn(
                                            "text-sm block-7 min-inline-24 placeholder:text-ink-subtle",
                                            size === "xs" && "text-xs block-5",
                                            size === "sm" && "text-[13px] block-6",
                                        )}
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
            itemToStringLabel={formatOptionLabel}
            disabled={disabled}
        >
            <ComboboxInput
                id={inputId}
                ref={inputRef}
                size={size}
                className={className}
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
