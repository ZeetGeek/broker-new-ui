"use client";

import { type Ref, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { Building2, Check, ChevronDown, Plus, Search } from "@/components/shared/icons";
import { mobileActionClass, MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import {
    mobileSelectMessageClass,
    mobileSelectPlaceholderClass,
    mobileSelectSearchClass,
    mobileSelectTriggerClass,
} from "@/components/shared/mobile-select-drawer";
import type { CommissionAudience } from "@/components/shared/price-with-commission";
import { PropertyOptionRow } from "@/components/shared/property-option-row";
import {
    propertyInfoLine,
    propertyMatchesLookingFor,
    propertyMatchesQuery,
    type PropertyPickerLookingFor,
    type PropertyPickerProperty,
} from "@/components/shared/property-picker-meta";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { Button } from "@/components/ui/button";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    type ComboboxInputProps,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";

export type PropertyInlineScope = "all" | PropertyPickerLookingFor;

const CLEAR_VALUE = "__property_inline_clear__";

/** Hide the default check; light hover + soft selected fill. */
const INLINE_ITEM_CLASS = `
  gap-3 px-3 py-2.5 pe-3
  data-highlighted:bg-canvas
  data-selected:bg-brand-soft/45
  data-selected:text-ink
  data-highlighted:data-selected:bg-brand-soft/55
  [&>span.absolute]:hidden
`;

/** Inline select results for an existing text input, such as task # mentions.
 * The caller keeps focus and owns Arrow/Enter/Escape handling on that input.
 */
export function PropertyInlineSuggestions({
    properties,
    scope,
    onScopeChange,
    listId,
    listRef,
    activeIndex,
    onActiveIndexChange,
    selectedId,
    onSelect,
    className,
}: {
    properties: readonly PropertyPickerProperty[];
    scope: PropertyInlineScope;
    onScopeChange: (scope: PropertyInlineScope) => void;
    listId: string;
    listRef?: Ref<HTMLDivElement>;
    activeIndex: number;
    onActiveIndexChange: (index: number) => void;
    selectedId: string | null;
    onSelect: (id: string) => void;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col overflow-hidden rounded-control border border-border-warm bg-surface shadow-md",
                className,
            )}
            onPointerDown={(event) => event.preventDefault()}
        >
            <div className="shrink-0 border-be border-border-warm px-3 py-2.5">
                <SlidingTabs
                    label="Filter properties by sale or rent"
                    value={scope}
                    onValueChange={onScopeChange}
                    className="self-start"
                    height={32}
                    options={[
                        { value: "all", label: "All" },
                        { value: "sale", label: "Sale" },
                        { value: "rent", label: "Rent" },
                    ]}
                />
            </div>
            <div
                id={listId}
                ref={listRef}
                role="listbox"
                aria-label="Properties"
                className="flex flex-col gap-1 overflow-y-auto overscroll-contain p-2 max-block-[min(20rem,45dvh)] min-block-0"
            >
                {properties.length ? (
                    properties.map((property, index) => (
                        <div
                            key={property.id}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={selectedId === property.id}
                            data-option-index={index}
                            data-highlighted={index === activeIndex ? "" : undefined}
                            data-selected={selectedId === property.id ? "" : undefined}
                            className={cn(
                                "flex cursor-pointer items-center rounded-control outline-none",
                                INLINE_ITEM_CLASS,
                            )}
                            onPointerEnter={() => onActiveIndexChange(index)}
                            onClick={() => onSelect(property.id)}
                        >
                            <PropertyOptionRow property={property} />
                        </div>
                    ))
                ) : (
                    <p role="status" className="body-sm px-3 py-4 text-ink-muted">
                        No matching properties
                    </p>
                )}
            </div>
        </div>
    );
}

export type PropertyInlineSelectProps = {
    id?: string;
    label?: string;
    ariaLabel?: string;
    properties: readonly PropertyPickerProperty[];
    value: string | null;
    onValueChange: (id: string | null) => void;
    /** Starting looking-for filter inside the popup. Defaults to All. */
    defaultScope?: PropertyInlineScope;
    /**
     * Lock the list to sale or rent and hide All / Sale / Rent.
     * Use on sheets already scoped to one looking-for.
     */
    lockedScope?: PropertyPickerLookingFor;
    audience?: CommissionAudience;
    placeholder?: string;
    allowClear?: boolean;
    clearLabel?: string;
    /** Called with the current search text when Create is pressed. */
    onCreate?: (query: string) => void;
    createLabel?: string;
    disabled?: boolean;
    loading?: boolean;
    errorText?: string;
    helperText?: string;
    size?: ComboboxInputProps["size"];
    className?: string;
};

/**
 * Compact combobox for filters and form fields that pick a listing.
 * Looking-for scope: All / Sale / Rent. Empty search offers Create when wired.
 * Rows match the Property picker modal — price, info, location, Sale/Rent.
 */
export function PropertyInlineSelect({
    id,
    label,
    ariaLabel,
    properties,
    value,
    onValueChange,
    defaultScope = "all",
    lockedScope,
    audience = "broker",
    placeholder = "Select a property",
    allowClear = false,
    clearLabel = "Any property",
    onCreate,
    createLabel = "Add property",
    disabled = false,
    loading = false,
    errorText,
    helperText,
    size = "default",
    className,
}: PropertyInlineSelectProps) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const mobile = useMobileMenu();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const afterClose = useRef<null | (() => void)>(null);
    const [scope, setScope] = useState<PropertyInlineScope>(lockedScope ?? defaultScope);
    const [query, setQuery] = useState("");
    const activeScope = lockedScope ?? scope;

    const byId = useMemo(() => {
        const map = new Map<string, PropertyPickerProperty>();
        for (const property of properties) map.set(property.id, property);
        return map;
    }, [properties]);

    const scoped = useMemo(() => {
        if (activeScope === "all") return properties;
        return properties.filter((property) => propertyMatchesLookingFor(property, activeScope));
    }, [properties, activeScope]);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        return scoped.filter((property) => propertyMatchesQuery(property, term));
    }, [scoped, query]);

    const items = useMemo(() => {
        const ids = filtered.map((property) => property.id);
        if (allowClear) return [CLEAR_VALUE, ...ids];
        return ids;
    }, [filtered, allowClear]);

    const selected = value ? (byId.get(value) ?? null) : null;
    const showCreate = Boolean(onCreate) && query.trim().length > 0 && filtered.length === 0;

    function labelFor(item: string): string {
        if (item === CLEAR_VALUE) return clearLabel;
        const property = byId.get(item);
        return property ? propertyInfoLine(property) : item;
    }

    function choose(next: string | null) {
        onValueChange(next);
        setQuery("");
        setDrawerOpen(false);
    }

    const fieldMessage = errorText ?? helperText;

    if (mobile) {
        return (
            <div className={cn("flex flex-col gap-2 min-inline-0", className)}>
                {label ? (
                    <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
                        {label}
                    </label>
                ) : null}
                <MobileActionDrawer
                    open={drawerOpen}
                    onOpenChange={(open) => {
                        setDrawerOpen(open);
                        if (open) {
                            setQuery("");
                            if (lockedScope) setScope(lockedScope);
                        }
                    }}
                    onOpenChangeComplete={(open) => {
                        if (open) return;
                        const action = afterClose.current;
                        afterClose.current = null;
                        action?.();
                    }}
                    title={label ?? "Select property"}
                    trigger={
                        <button
                            id={fieldId}
                            type="button"
                            disabled={disabled || loading}
                            aria-label={
                                ariaLabel ??
                                `${label ?? "Property"}: ${selected ? propertyInfoLine(selected) : placeholder}`
                            }
                            data-invalid={Boolean(errorText) || undefined}
                            className={cn(
                                mobileSelectTriggerClass,
                                !selected && mobileSelectPlaceholderClass,
                            )}
                        >
                            <Building2 aria-hidden />
                            <span>
                                {loading
                                    ? "Loading..."
                                    : selected
                                      ? propertyInfoLine(selected)
                                      : placeholder}
                            </span>
                            <ChevronDown aria-hidden />
                        </button>
                    }
                >
                    {!lockedScope ? (
                        <div className="border-be border-border-warm pbe-3">
                            <SlidingTabs
                                label="Filter properties by sale or rent"
                                value={activeScope}
                                onValueChange={(next) => {
                                    setScope(next);
                                    setQuery("");
                                }}
                                className="self-start"
                                height={36}
                                options={[
                                    { value: "all", label: "All" },
                                    { value: "sale", label: "Sale" },
                                    { value: "rent", label: "Rent" },
                                ]}
                            />
                        </div>
                    ) : null}
                    <div className={mobileSelectSearchClass}>
                        <Input
                            value={query}
                            onValueChange={setQuery}
                            startIcon={Search}
                            placeholder="Search properties"
                            aria-label="Search properties"
                            clearable
                        />
                    </div>
                    {allowClear ? (
                        <button
                            type="button"
                            className={mobileActionClass}
                            aria-pressed={!value}
                            onClick={() => choose(null)}
                        >
                            <span className="text-ink-muted">{clearLabel}</span>
                            {!value ? <Check aria-hidden className="ms-auto" /> : null}
                        </button>
                    ) : null}
                    {filtered.map((property) => (
                        <button
                            key={property.id}
                            type="button"
                            className={mobileActionClass}
                            aria-pressed={value === property.id}
                            onClick={() => choose(property.id)}
                        >
                            <PropertyOptionRow property={property} audience={audience} />
                            {value === property.id ? (
                                <Check aria-hidden className="ms-auto" />
                            ) : null}
                        </button>
                    ))}
                    {!filtered.length && !showCreate ? (
                        <p role="status" className={mobileSelectMessageClass}>
                            {query.trim()
                                ? "No matching properties"
                                : activeScope === "sale"
                                  ? "No sale listings yet"
                                  : activeScope === "rent"
                                    ? "No rent listings yet"
                                    : "No properties yet"}
                        </p>
                    ) : null}
                    {showCreate ? (
                        <button
                            type="button"
                            className={mobileActionClass}
                            onClick={() => {
                                const nextQuery = query.trim();
                                afterClose.current = () => onCreate?.(nextQuery);
                                setDrawerOpen(false);
                            }}
                        >
                            <Plus aria-hidden />
                            <span className="flex flex-col text-start min-inline-0">
                                <span>{createLabel}</span>
                                <span className="truncate text-xs font-normal text-ink-muted">
                                    “{query.trim()}”
                                </span>
                            </span>
                        </button>
                    ) : null}
                </MobileActionDrawer>
                {fieldMessage ? (
                    <p
                        role={errorText ? "alert" : undefined}
                        className={errorText ? "body-sm text-danger" : "body-sm text-ink-subtle"}
                    >
                        {fieldMessage}
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-2 min-inline-0", className)}>
            {label ? (
                <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
                    {label}
                </label>
            ) : null}
            <Combobox
                value={value || (allowClear ? CLEAR_VALUE : null)}
                disabled={disabled}
                items={items}
                itemToStringLabel={labelFor}
                inputValue={query.length > 0 ? query : selected ? propertyInfoLine(selected) : ""}
                onInputValueChange={setQuery}
                filter={null}
                onValueChange={(next) => {
                    if (!next || next === CLEAR_VALUE) {
                        onValueChange(null);
                        setQuery("");
                        return;
                    }
                    onValueChange(next);
                    setQuery("");
                }}
                onOpenChange={(open) => {
                    if (!open) setQuery("");
                    else if (lockedScope) setScope(lockedScope);
                }}
            >
                <ComboboxInput
                    id={fieldId}
                    size={size}
                    // Form size: same 14px text as the property and contact forms.
                    className={size === "md" ? "text-sm" : undefined}
                    startIcon={Building2}
                    placeholder={placeholder}
                    aria-label={ariaLabel ?? label ?? placeholder}
                    loading={loading}
                    disabled={disabled}
                    errorText={errorText}
                    helperText={helperText}
                    showClear={Boolean(value) && allowClear}
                />
                <ComboboxContent
                    align="start"
                    className="flex flex-col gap-0 overflow-hidden p-0 inline-[min(28rem,calc(100dvw-2rem))]"
                >
                    {!lockedScope ? (
                        <div className="shrink-0 border-be border-border-warm px-3 py-2.5">
                            <SlidingTabs
                                label="Filter properties by sale or rent"
                                value={activeScope}
                                onValueChange={setScope}
                                className="self-start"
                                height={32}
                                options={[
                                    { value: "all", label: "All" },
                                    { value: "sale", label: "Sale" },
                                    { value: "rent", label: "Rent" },
                                ]}
                            />
                        </div>
                    ) : null}
                    <ComboboxEmpty className="py-4">
                        {query.trim()
                            ? "No matching properties"
                            : activeScope === "sale"
                              ? "No sale listings yet"
                              : activeScope === "rent"
                                ? "No rent listings yet"
                                : "No properties yet"}
                    </ComboboxEmpty>
                    <ComboboxList className="gap-1 p-2 max-block-[min(20rem,var(--available-height))]">
                        {(item: string) => {
                            if (item === CLEAR_VALUE) {
                                return (
                                    <ComboboxItem
                                        key={CLEAR_VALUE}
                                        value={CLEAR_VALUE}
                                        className={INLINE_ITEM_CLASS}
                                    >
                                        <span
                                            data-control-value
                                            className="text-control text-ink-muted"
                                        >
                                            {clearLabel}
                                        </span>
                                    </ComboboxItem>
                                );
                            }
                            const property = byId.get(item);
                            if (!property) return null;
                            return (
                                <ComboboxItem key={item} value={item} className={INLINE_ITEM_CLASS}>
                                    <PropertyOptionRow property={property} audience={audience} />
                                </ComboboxItem>
                            );
                        }}
                    </ComboboxList>
                    {showCreate ? (
                        <div className="shrink-0 border-bs border-border-warm p-2.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 inline-full"
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                }}
                                onClick={() => onCreate?.(query.trim())}
                            >
                                <Plus aria-hidden strokeWidth={1.75} />
                                {createLabel}
                                <span className="truncate font-normal text-ink-muted max-inline-36">
                                    “{query.trim()}”
                                </span>
                            </Button>
                        </div>
                    ) : null}
                </ComboboxContent>
            </Combobox>
        </div>
    );
}
