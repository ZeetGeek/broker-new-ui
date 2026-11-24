"use client";

import { type ComponentProps, useEffect, useState } from "react";

import type { SearchHelp } from "@/lib/search/search-help";
import { getShortcut, type ShortcutId } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { filterChipClassName } from "@/components/shared/filter-chip";
import { IconButton } from "@/components/shared/icon-button";
import {
    type AppIcon,
    ArrowDownUp,
    ChevronDown,
    Info,
    Plus,
    Search,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input, type InputProps } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useShortcutDisplayKeys } from "@/features/shortcuts/use-shortcut-display-keys";

import searchStyles from "./list-search-field.module.css";
import toolbarStyles from "./list-toolbar.module.css";

export const LIST_SEARCH_WIDTH_CLASS =
    "min-inline-44 inline-44 sm:min-inline-52 sm:inline-52 lg:min-inline-64 lg:inline-64";

type ListSearchFieldProps = Omit<
    InputProps,
    "value" | "defaultValue" | "onChange" | "onValueChange" | "size" | "startIcon" | "clearable"
> & {
    value: string;
    onChange: (value: string) => void;
    /** Use 0 when the page already debounces requests or filters local records. */
    debounceMs?: number;
    /** Let a page's responsive layout size the search field. */
    fullWidth?: boolean;
    /** Fields supported by this page’s search, revealed by the info button. */
    searchHelp?: SearchHelp;
};

/** Shared list search face, including clear, focus and external filter resets. */
export function ListSearchField({
    value,
    onChange,
    debounceMs = 300,
    fullWidth = false,
    placeholder = "Search",
    searchHelp,
    className,
    wrapperClassName,
    "aria-label": ariaLabel,
    ...props
}: ListSearchFieldProps) {
    const [draft, setDraft] = useState(value);
    const [previousValue, setPreviousValue] = useState(value);

    if (value !== previousValue) {
        setPreviousValue(value);
        setDraft(value);
    }

    useEffect(() => {
        if (debounceMs === 0 || draft === value) return;
        const timer = window.setTimeout(() => onChange(draft), debounceMs);
        return () => window.clearTimeout(timer);
    }, [debounceMs, draft, onChange, value]);

    const field = (
        <Input
            {...props}
            size="sm"
            value={debounceMs === 0 ? value : draft}
            onValueChange={(next) => {
                if (debounceMs === 0) onChange(next);
                else setDraft(next);
            }}
            placeholder={placeholder}
            aria-label={ariaLabel ?? placeholder ?? "Search this list"}
            startIcon={Search}
            clearable
            wrapperClassName={cn(
                searchHelp
                    ? "inline-full min-inline-0"
                    : fullWidth
                      ? "inline-full min-inline-0"
                      : LIST_SEARCH_WIDTH_CLASS,
                "rounded-control shadow-sm",
                !searchHelp && wrapperClassName,
            )}
            className={cn(
                "list-control rounded-control border! border-border-warm bg-surface text-sm font-medium shadow-sm hover:border-ink/25! focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20",
                className,
            )}
        />
    );
    if (!searchHelp) return field;

    return (
        <div
            className={cn(
                "relative",
                searchStyles.withHelp,
                fullWidth ? "inline-full min-inline-0" : LIST_SEARCH_WIDTH_CLASS,
                wrapperClassName,
            )}
        >
            {field}
            <Popover>
                <PopoverTrigger
                    render={
                        <IconButton
                            appearance="ghost"
                            size="sm"
                            aria-label="What can I search?"
                            disabled={props.disabled || props.loading}
                            className={searchStyles.helpButton}
                        />
                    }
                >
                    <Info aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                </PopoverTrigger>
                <PopoverContent
                    align="end"
                    sideOffset={12}
                    className="gap-1.5 rounded-inner max-inline-[calc(100dvw-2rem)]"
                >
                    <PopoverTitle className="text-sm font-semibold">You can search by</PopoverTitle>
                    <PopoverDescription render={<div />} className="text-sm text-ink-muted">
                        <ul className="flex list-disc flex-col gap-1 ps-4">
                            {searchHelp.fields.map((field) => (
                                <li key={field}>{field}</li>
                            ))}
                        </ul>
                        <p className="mbs-3">
                            Combine terms, like ‘{searchHelp.example}’. {searchHelp.filterNote}
                        </p>
                    </PopoverDescription>
                </PopoverContent>
            </Popover>
        </div>
    );
}

type ListToolbarSelectProps<T extends string> = {
    label: string;
    value: T;
    options: readonly { value: T; label: string; disabled?: boolean }[];
    onChange: (value: T) => void;
    defaultValue?: T;
    /** Explicitly highlight filters such as the visit date range. */
    active?: boolean;
    mobileLabel?: string;
    tooltip?: string;
    disabled?: boolean;
    className?: string;
};

/** A list dropdown: sorting and date filtering retain their page-owned meanings. */
export function ListToolbarSelect<T extends string>({
    label,
    value,
    options,
    onChange,
    defaultValue,
    active = defaultValue !== undefined && value !== defaultValue,
    mobileLabel,
    tooltip,
    disabled = false,
    className,
}: ListToolbarSelectProps<T>) {
    const selectedLabel = options.find((option) => option.value === value)?.label ?? value;
    const trigger = (
        <DropdownMenuTrigger
            render={
                <button
                    type="button"
                    disabled={disabled}
                    aria-label={`${label}: ${selectedLabel}`}
                    className={cn(
                        filterChipClassName(active),
                        "gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
                        !active && "text-ink-muted",
                        mobileLabel && toolbarStyles.compactSelect,
                        className,
                    )}
                />
            }
        >
            <ArrowDownUp aria-hidden className="text-brand block-4 inline-4" strokeWidth={1.75} />
            <span className={cn("truncate", mobileLabel && "hidden sm:inline")}>
                {selectedLabel}
            </span>
            {mobileLabel ? <span className="sm:hidden">{mobileLabel}</span> : null}
            <ChevronDown
                aria-hidden
                className="opacity-60 block-3.5 inline-3.5"
                strokeWidth={1.75}
            />
        </DropdownMenuTrigger>
    );

    return (
        <DropdownMenu>
            {tooltip ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger render={trigger} />
                        <TooltipContent side="bottom">{tooltip}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                trigger
            )}
            <DropdownMenuContent align="end" className="min-inline-44">
                <DropdownMenuRadioGroup
                    value={value}
                    onValueChange={(next) => {
                        const option = options.find((item) => item.value === next);
                        if (option && !option.disabled) onChange(option.value);
                    }}
                >
                    {options.map((option) => (
                        <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                            closeOnClick
                            disabled={option.disabled}
                            className={cn(value === option.value && "font-semibold text-brand")}
                        >
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

type ListAddButtonProps = Omit<ComponentProps<typeof Button>, "children" | "size"> & {
    label: string;
    icon?: AppIcon;
    trailingIcon?: AppIcon;
    shortcutId?: ShortcutId;
};

/** Shared add action. Shortcut handling stays with the page or portal shell. */
export function ListAddButton({
    label,
    icon: Icon = Plus,
    trailingIcon: TrailingIcon,
    variant = "accent",
    shortcutId,
    className,
    ...props
}: ListAddButtonProps) {
    const shortcut = shortcutId ? getShortcut(shortcutId) : undefined;
    const displayKeys = useShortcutDisplayKeys(shortcut);
    return (
        <Button
            type="button"
            {...props}
            variant={variant}
            size="sm"
            className={cn("list-control gap-2 px-3.5", className)}
        >
            <Icon aria-hidden strokeWidth={1.75} />
            {label}
            {shortcut ? (
                <KbdGroup className="hidden gap-0.5 sm:inline-flex pointer-coarse:hidden">
                    {displayKeys.map((key) => (
                        <Kbd
                            key={key}
                            className="border-surface/25 bg-surface/15 px-1.5 text-[10px] text-surface [box-shadow:none] min-inline-4"
                        >
                            {key}
                        </Kbd>
                    ))}
                </KbdGroup>
            ) : null}
            {TrailingIcon ? <TrailingIcon aria-hidden strokeWidth={1.75} /> : null}
        </Button>
    );
}
