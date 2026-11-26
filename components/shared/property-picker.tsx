"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useId, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { EmptyStateAction } from "@/components/empty-state";
import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { EmptyState } from "@/components/shared/empty-state";
import { Building2, Check, ChevronDown, Plus, Search } from "@/components/shared/icons";
import { ListAddButton } from "@/components/shared/list-toolbar";
import type { CommissionAudience } from "@/components/shared/price-with-commission";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { PropertyOptionRow } from "@/components/shared/property-option-row";
import {
    propertyInfoLine,
    propertyMatchesLookingFor,
    propertyMatchesQuery,
    propertyOffersRent,
    propertyOffersSale,
    type PropertyPickerLookingFor,
    type PropertyPickerProperty,
    propertyPlaceLine,
} from "@/components/shared/property-picker-meta";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type {
    PropertyPickerLookingFor,
    PropertyPickerProperty,
} from "@/components/shared/property-picker-meta";

type LookingFilter = "all" | PropertyPickerLookingFor;

type PropertyPickerBase = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    manageBrowserHistory?: boolean;
    properties: readonly PropertyPickerProperty[];
    /**
     * When `"both"` (default), All / Sale / Rent tabs appear.
     * Lock to sale or rent for visit/lead pools that are already scoped.
     */
    lookingFor?: PropertyPickerLookingFor | "both";
    /** Commission tip copy — broker "You get" / owner "Broker gets". */
    audience?: CommissionAudience;
    title?: string;
    description?: string;
    searchPlaceholder?: string;
    emptyHeading?: string;
    emptyDescription?: string;
    filteredEmptyHeading?: string;
    filteredEmptyDescription?: string;
    loading?: boolean;
    errorText?: string;
    onRetry?: () => void;
    onCreate?: () => void;
    createLabel?: string;
    headerExtra?: ReactNode;
    listFooter?: ReactNode;
    searchValue?: string;
    onSearchChange?: (query: string) => void;
    skipLocalFilter?: boolean;
    allowClear?: boolean;
    clearLabel?: string;
    confirmLabel?: string;
    confirmDisabled?: boolean;
    closeOnConfirm?: boolean;
    className?: string;
};

type PropertyPickerSingle = PropertyPickerBase & {
    multiple?: false;
    value: string | null;
    onConfirm: (id: string | null) => void;
    commitOnSelect?: boolean;
};

type PropertyPickerMultiple = PropertyPickerBase & {
    multiple: true;
    value: readonly string[];
    onConfirm: (ids: string[]) => void;
    commitOnSelect?: never;
};

export type PropertyPickerProps = PropertyPickerSingle | PropertyPickerMultiple;

function defaultTitle(multiple: boolean): string {
    return multiple ? "Select properties" : "Select a property";
}

/**
 * Shared modal for picking one or many listings.
 * Pass data in — this component does not fetch. Wire create / retry from the caller.
 */
export function PropertyPicker(props: PropertyPickerProps) {
    const {
        open,
        onOpenChange,
        manageBrowserHistory,
        properties,
        lookingFor = "both",
        audience = "broker",
        title,
        description,
        searchPlaceholder = "Search by title, locality or city",
        emptyHeading,
        emptyDescription,
        filteredEmptyHeading,
        filteredEmptyDescription,
        loading = false,
        errorText,
        onRetry,
        onCreate,
        createLabel = "Add property",
        headerExtra,
        listFooter,
        searchValue,
        onSearchChange,
        skipLocalFilter = false,
        allowClear = false,
        clearLabel = "Any property",
        confirmLabel,
        confirmDisabled = false,
        closeOnConfirm = true,
        className,
        multiple = false,
    } = props;

    const searchId = useId();
    const [localQuery, setLocalQuery] = useState("");
    const query = onSearchChange ? (searchValue ?? "") : localQuery;
    const setQuery = onSearchChange ?? setLocalQuery;
    const [lookingFilter, setLookingFilter] = useState<LookingFilter>("all");
    const [draftSingle, setDraftSingle] = useState<string | null>(null);
    const [draftMulti, setDraftMulti] = useState<string[]>([]);
    const [listScrolled, setListScrolled] = useState(false);

    const commitOnSelect = !multiple && (props.commitOnSelect ?? true);
    const showLookingTabs = lookingFor === "both";

    useEffect(() => {
        if (!open) return undefined;
        const frame = window.requestAnimationFrame(() => {
            setQuery("");
            setLookingFilter("all");
            setListScrolled(false);
            if (props.multiple) setDraftMulti([...props.value]);
            else setDraftSingle(props.value);
        });
        return () => window.cancelAnimationFrame(frame);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-only sync
    }, [open]);

    function onListScroll(event: { currentTarget: HTMLDivElement }) {
        setListScrolled(event.currentTarget.scrollTop > 2);
    }

    const scoped = useMemo(() => {
        if (lookingFor === "both") return properties;
        return properties.filter((property) => propertyMatchesLookingFor(property, lookingFor));
    }, [lookingFor, properties]);

    const saleCount = useMemo(
        () => scoped.filter((property) => propertyOffersSale(property)).length,
        [scoped],
    );
    const rentCount = useMemo(
        () => scoped.filter((property) => propertyOffersRent(property)).length,
        [scoped],
    );

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        return scoped.filter((property) => {
            if (
                showLookingTabs &&
                lookingFilter !== "all" &&
                !propertyMatchesLookingFor(property, lookingFilter)
            ) {
                return false;
            }
            if (skipLocalFilter) return true;
            return propertyMatchesQuery(property, term);
        });
    }, [scoped, showLookingTabs, lookingFilter, query, skipLocalFilter]);

    const selectedCount = multiple ? draftMulti.length : draftSingle ? 1 : 0;
    const resolvedTitle = title ?? defaultTitle(multiple);

    const countLabel = (() => {
        if (showLookingTabs && lookingFilter === "sale") return `Sale · ${saleCount}`;
        if (showLookingTabs && lookingFilter === "rent") return `Rent · ${rentCount}`;
        return `Properties · ${scoped.length}`;
    })();

    function isSelected(id: string): boolean {
        return multiple ? draftMulti.includes(id) : draftSingle === id;
    }

    function selectSingle(id: string | null) {
        if (loading || confirmDisabled || hasError) return;
        setDraftSingle(id);
        if (commitOnSelect && !props.multiple) {
            props.onConfirm(id);
            if (closeOnConfirm) onOpenChange(false);
        }
    }

    function toggleMulti(id: string) {
        if (loading || confirmDisabled || hasError) return;
        setDraftMulti((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    }

    function confirm() {
        if (primaryDisabled) return;
        if (props.multiple) props.onConfirm(draftMulti);
        else props.onConfirm(draftSingle);
        if (closeOnConfirm) onOpenChange(false);
    }

    function onRowKeyDown(event: KeyboardEvent<HTMLElement>, id: string) {
        // Price/commission controls inside a row handle their own keyboard events.
        if (event.target !== event.currentTarget) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (multiple) toggleMulti(id);
        else selectSingle(id);
    }

    const listBusy = loading;
    const hasError = Boolean(errorText) && scoped.length === 0;
    const showFooter = multiple || !commitOnSelect || allowClear;

    const primaryLabel =
        confirmLabel ??
        (multiple
            ? selectedCount > 0
                ? `Select ${selectedCount} ${selectedCount === 1 ? "property" : "properties"}`
                : "Select properties"
            : draftSingle
              ? "Confirm"
              : "Select a property");

    const primaryDisabled =
        listBusy ||
        hasError ||
        confirmDisabled ||
        (multiple ? false : !allowClear && !draftSingle) ||
        (multiple && draftMulti.length === 0 && !allowClear);

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            manageBrowserHistory={manageBrowserHistory}
            size="md"
            title={resolvedTitle}
            description={description}
            className={className}
            // Inline style beats DialogPopup `max-inline-md` + AppModal size tokens.
            style={{
                inlineSize: "min(640px, calc(100vw - 1.5rem))",
                maxInlineSize: "min(640px, calc(100vw - 1.5rem))",
            }}
            bodyClassName="pbs-0!"
            headerClassName={cn(
                "pbs-2 pbe-2.5",
                listScrolled
                    ? "border-be border-(--dialog-divider)"
                    : "border-be border-transparent",
            )}
            header={
                <div className="flex flex-col gap-2">
                    <Input
                        id={searchId}
                        size="default"
                        value={query}
                        onValueChange={setQuery}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        startIcon={Search}
                        clearable
                        wrapperClassName="min-inline-0 flex-1"
                    />
                    {showLookingTabs ? (
                        <SlidingTabs
                            label="Filter by sale or rent"
                            value={lookingFilter}
                            onValueChange={setLookingFilter}
                            className="mbs-1.5 self-start"
                            options={[
                                { value: "all", label: "All", count: scoped.length },
                                { value: "sale", label: "Sale", count: saleCount },
                                { value: "rent", label: "Rent", count: rentCount },
                            ]}
                        />
                    ) : null}
                    <div className="mbs-1.5 flex items-center justify-between gap-3">
                        <p className="body-sm font-medium text-ink-muted">{countLabel}</p>
                        {onCreate ? (
                            <ListAddButton
                                label={createLabel}
                                icon={Plus}
                                variant="outline"
                                onClick={onCreate}
                                className="shrink-0"
                            />
                        ) : null}
                    </div>
                    {headerExtra}
                </div>
            }
            footer={
                showFooter ? (
                    <AppModalFooter
                        primaryLabel={primaryLabel}
                        primaryIcon={<Check aria-hidden strokeWidth={1.75} />}
                        onPrimary={confirm}
                        primaryDisabled={primaryDisabled}
                        secondaryLabel="Cancel"
                        onSecondary={() => onOpenChange(false)}
                    >
                        {allowClear ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="default"
                                className="me-auto inline-auto"
                                disabled={listBusy || confirmDisabled}
                                onClick={() => {
                                    if (props.multiple) {
                                        setDraftMulti([]);
                                        props.onConfirm([]);
                                    } else {
                                        setDraftSingle(null);
                                        props.onConfirm(null);
                                    }
                                    if (closeOnConfirm) onOpenChange(false);
                                }}
                            >
                                {clearLabel}
                            </Button>
                        ) : null}
                    </AppModalFooter>
                ) : undefined
            }
        >
            {listBusy ? (
                <div
                    className="flex flex-col gap-2"
                    aria-busy="true"
                    aria-label="Loading properties"
                >
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse rounded-card bg-surface-muted block-18"
                            aria-hidden
                        />
                    ))}
                </div>
            ) : hasError ? (
                <div role="alert" className="flex flex-col items-start gap-3">
                    <p className="body-sm text-danger">{errorText}</p>
                    {onRetry ? (
                        <Button type="button" variant="outline" onClick={onRetry}>
                            Try again
                        </Button>
                    ) : null}
                </div>
            ) : scoped.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    heading={emptyHeading ?? "No properties yet"}
                    description={
                        emptyDescription ??
                        (onCreate
                            ? "Add a property to get started."
                            : "Add a listing first, then come back here.")
                    }
                >
                    {onCreate ? (
                        <EmptyStateAction label={createLabel} icon={Plus} onClick={onCreate} />
                    ) : null}
                </EmptyState>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Search}
                    heading={filteredEmptyHeading ?? "No properties match your search"}
                    description={
                        filteredEmptyDescription ?? "Try a different title, locality or city."
                    }
                />
            ) : (
                <>
                    {multiple ? (
                        <VirtualListBox
                            items={filtered}
                            getKey={(property) => property.id}
                            estimateItemHeight={108}
                            ariaLabel="Properties available to select"
                            onScroll={onListScroll}
                            renderItem={(property) => {
                                const selected = isSelected(property.id);
                                return (
                                    <div
                                        role="checkbox"
                                        aria-checked={selected}
                                        aria-label={`Select ${propertyInfoLine(property)}`}
                                        tabIndex={0}
                                        onClick={() => toggleMulti(property.id)}
                                        onKeyDown={(event) => onRowKeyDown(event, property.id)}
                                        aria-disabled={confirmDisabled || undefined}
                                        className="cursor-pointer rounded-card text-start outline-none inline-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                    >
                                        <PropertyPickerChrome selected={selected} multiple>
                                            <PropertyOptionRow
                                                property={property}
                                                audience={audience}
                                            />
                                        </PropertyPickerChrome>
                                    </div>
                                );
                            }}
                        />
                    ) : (
                        <RadioGroup
                            value={draftSingle ?? ""}
                            onValueChange={(next) => selectSingle(next || null)}
                        >
                            <VirtualListBox
                                items={filtered}
                                getKey={(property) => property.id}
                                estimateItemHeight={108}
                                ariaLabel="Properties available to select"
                                onScroll={onListScroll}
                                renderItem={(property) => {
                                    const selected = isSelected(property.id);
                                    return (
                                        <div
                                            role="radio"
                                            aria-checked={selected}
                                            aria-label={`Select ${propertyInfoLine(property)}`}
                                            tabIndex={0}
                                            onClick={() => selectSingle(property.id)}
                                            onKeyDown={(event) => onRowKeyDown(event, property.id)}
                                            aria-disabled={confirmDisabled || undefined}
                                            className="cursor-pointer rounded-card text-start outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                        >
                                            {/* Keep RadioGroup value in sync for a11y; tip buttons must not nest in a <label>/<button>. */}
                                            <RadioGroupItem
                                                value={property.id}
                                                className="sr-only"
                                                tabIndex={-1}
                                                aria-hidden
                                            />
                                            <PropertyPickerChrome
                                                selected={selected}
                                                multiple={false}
                                            >
                                                <PropertyOptionRow
                                                    property={property}
                                                    audience={audience}
                                                />
                                            </PropertyPickerChrome>
                                        </div>
                                    );
                                }}
                            />
                        </RadioGroup>
                    )}
                    {listFooter}
                </>
            )}
        </AppModal>
    );
}

function PropertyPickerChrome({
    selected,
    multiple,
    children,
}: {
    selected: boolean;
    multiple: boolean;
    children: ReactNode;
}) {
    return (
        <span
            className={cn(
                `
                  flex cursor-pointer items-center gap-3 rounded-card border p-3 text-start
                  transition-[background-color,border-color] duration-160 outline-none
                  inline-full
                `,
                selected
                    ? "border-brand bg-brand-soft/50"
                    : `
                      border-border-warm bg-surface
                      hover:border-ink/20 hover:bg-surface-muted/60
                    `,
            )}
        >
            {multiple ? (
                <Checkbox
                    checked={selected}
                    tabIndex={-1}
                    className="pointer-events-none shrink-0"
                    aria-hidden
                />
            ) : (
                <span
                    className={cn(
                        "grid shrink-0 place-items-center rounded-full border block-5 inline-5",
                        selected
                            ? "border-brand bg-brand text-surface"
                            : "border-border-warm bg-surface",
                    )}
                    aria-hidden
                >
                    {selected ? <Check className="block-3 inline-3" strokeWidth={2.5} /> : null}
                </span>
            )}
            <span className="flex-1 min-inline-0">{children}</span>
        </span>
    );
}

type PropertyPickerFieldChrome = {
    id?: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    errorText?: string;
    /** Loading errors belong to the picker; errorText is field validation. */
    pickerErrorText?: string;
    helperText?: string;
    triggerSize?: "default" | "md" | "lg";
};

export type PropertyPickerFieldProps =
    | (Omit<PropertyPickerSingle, "open" | "onOpenChange"> & PropertyPickerFieldChrome)
    | (Omit<PropertyPickerMultiple, "open" | "onOpenChange"> & PropertyPickerFieldChrome);

/** Form / filter trigger that opens {@link PropertyPicker}. */
export function PropertyPickerField(props: PropertyPickerFieldProps) {
    const {
        id,
        label,
        required,
        placeholder = "Select a property",
        disabled = false,
        errorText,
        helperText,
        triggerSize = "lg",
        properties,
    } = props;

    const [open, setOpen] = useState(false);
    const generatedId = useId();
    const fieldId = id ?? generatedId;

    const selectedProperties = useMemo(() => {
        if (props.multiple) {
            const ids = new Set(props.value);
            return properties.filter((property) => ids.has(property.id));
        }
        if (!props.value) return [];
        const match = properties.find((property) => property.id === props.value);
        return match ? [match] : [];
    }, [properties, props]);

    const face = selectedProperties[0];
    const place = face ? propertyPlaceLine(face) : undefined;

    return (
        <div className="flex flex-col gap-2 min-inline-0">
            {label ? (
                <label htmlFor={fieldId} className="body-sm font-medium text-ink">
                    {label}
                    {required ? (
                        <span className="text-danger" aria-hidden>
                            {" "}
                            *
                        </span>
                    ) : null}
                </label>
            ) : null}
            <button
                id={fieldId}
                type="button"
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                data-invalid={errorText ? "" : undefined}
                aria-describedby={
                    errorText ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined
                }
                onClick={() => setOpen(true)}
                className={cn(
                    `
                      flex items-center rounded-control border-2 border-border-warm
                      bg-surface text-start transition-[border-color,box-shadow] duration-160
                      outline-none inline-full
                      hover:border-ring/50
                      focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                      disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50
                      aria-expanded:border-ring
                      data-invalid:border-danger-mid
                      data-invalid:hover:border-danger-mid
                      data-invalid:focus-visible:ring-danger/20
                    `,
                    triggerSize === "lg"
                        ? "gap-2.5 px-4 block-control-xl"
                        : triggerSize === "md"
                          ? "gap-1.5 px-4 block-control-lg"
                          : "gap-2.5 px-3.5 block-control-md",
                )}
            >
                {face ? (
                    <PropertyCoverImage src={face.imageUrl} alt="" size={28} />
                ) : (
                    <Building2
                        className={cn(
                            "shrink-0 text-ink-subtle",
                            triggerSize === "md" ? "block-4 inline-4" : "block-4.5 inline-4.5",
                        )}
                        aria-hidden
                        strokeWidth={1.75}
                    />
                )}
                <span className="flex-1 min-inline-0">
                    {selectedProperties.length === 0 ? (
                        <span data-control-value className="truncate text-control text-ink-subtle">
                            {placeholder}
                        </span>
                    ) : selectedProperties.length === 1 ? (
                        <span className="flex flex-col min-inline-0">
                            <span
                                data-control-value
                                className="truncate text-control font-medium text-ink"
                            >
                                {propertyInfoLine(face!)}
                            </span>
                            {place ? (
                                <span className="body-xs truncate text-ink-muted capitalize">
                                    {place}
                                </span>
                            ) : null}
                        </span>
                    ) : (
                        <span
                            data-control-value
                            className="truncate text-control font-medium text-ink"
                        >
                            {selectedProperties.length} selected
                        </span>
                    )}
                </span>
                <ChevronDown
                    className={cn(
                        "shrink-0 text-ink-subtle",
                        triggerSize === "md" ? "block-4 inline-4" : "block-4.5 inline-4.5",
                    )}
                    aria-hidden
                />
            </button>
            {errorText ? (
                <p id={`${fieldId}-error`} role="alert" className="body-sm text-danger">
                    {errorText}
                </p>
            ) : null}
            {!errorText && helperText ? (
                <p id={`${fieldId}-helper`} className="body-sm text-ink-muted">
                    {helperText}
                </p>
            ) : null}

            {props.multiple ? (
                <PropertyPicker
                    {...props}
                    errorText={props.pickerErrorText}
                    confirmDisabled={disabled || props.confirmDisabled}
                    open={open}
                    onOpenChange={setOpen}
                    multiple
                    value={props.value}
                    onConfirm={props.onConfirm}
                />
            ) : (
                <PropertyPicker
                    {...props}
                    errorText={props.pickerErrorText}
                    confirmDisabled={disabled || props.confirmDisabled}
                    open={open}
                    onOpenChange={setOpen}
                    multiple={false}
                    value={props.value}
                    onConfirm={props.onConfirm}
                />
            )}
        </div>
    );
}
