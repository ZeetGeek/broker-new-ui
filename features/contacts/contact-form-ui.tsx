"use client";

import { type ComponentProps, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { Check, ChevronDown, MapPin, X } from "lucide-react";
import { tinykeys } from "tinykeys";

import { formatInrInput, parseInr } from "@/lib/format/inr";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxLabel,
    ComboboxList,
    ComboboxSeparator,
} from "@/components/ui/combobox";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import { SURAT_LOCALITIES } from "@/features/contacts/contact-form-model";

/** Same control height as Add property (`size="lg"` → 48px). */
export const nativeControlClass = `
  rounded-control border-2 border-border-warm bg-surface px-4 text-base text-ink outline-none
  block-control-xl inline-full
  hover:border-ink-subtle focus:border-ring focus:ring-3 focus:ring-ring/30
  disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60
`;

function IndianRupeeIcon(props: ComponentProps<"svg">) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
            <path d="M6 4h12M6 8h12M7 4c5 0 7 2 7 5s-2 5-7 5h-1l8 7" />
        </svg>
    );
}

export function FormField({
    label,
    htmlFor,
    labelId,
    required,
    error,
    hint,
    children,
    className,
}: {
    label: string;
    htmlFor?: string;
    labelId?: string;
    required?: boolean;
    error?: string;
    hint?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col gap-2 min-inline-0", className)}>
            <label
                id={labelId ?? (htmlFor ? `${htmlFor}-label` : undefined)}
                htmlFor={htmlFor}
                className="text-sm font-semibold text-ink"
            >
                {label}
                {required ? <span className="text-danger"> *</span> : null}
            </label>
            {children}
            {error ? (
                <p role="alert" className="text-sm text-danger">
                    {error}
                </p>
            ) : hint ? (
                <p className="text-xs/5 text-ink-muted">{hint}</p>
            ) : null}
        </div>
    );
}

export function TextField({
    label,
    required,
    error,
    hint,
    size = "lg",
    ...props
}: InputProps & { label: string; required?: boolean; error?: string; hint?: ReactNode }) {
    const id = props.id ?? `field-${label}`;
    const hintText = typeof hint === "string" ? hint : undefined;
    return (
        <FormField label={label} htmlFor={id} required={required}>
            <Input
                {...props}
                id={id}
                size={size}
                errorText={error}
                helperText={!error ? hintText : undefined}
            />
            {!error && hint && !hintText ? (
                <div className="text-xs/5 text-ink-muted">{hint}</div>
            ) : null}
        </FormField>
    );
}

export function SelectField({
    label,
    value,
    onChange,
    options,
    required,
    error,
    placeholder = "Choose an option",
    disabled,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    required?: boolean;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
}) {
    const id = `select-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
    return (
        <FormField label={label} htmlFor={id} required={required} error={error}>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={disabled}
                    aria-invalid={Boolean(error)}
                    className={cn(nativeControlClass, "appearance-none pe-10")}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    aria-hidden
                    className="
                      pointer-events-none absolute inset-e-3 inset-bs-1/2 -translate-y-1/2
                      text-ink-muted block-4 inline-4
                    "
                />
            </div>
        </FormField>
    );
}

export type ComboboxOption = { value: string; label: string };

export type ComboboxOptionGroup = {
    label: string;
    options: ComboboxOption[];
};

export function ComboboxField({
    label,
    value,
    onChange,
    options,
    groups,
    required,
    error,
    placeholder = "Search…",
    emptyText = "No matches",
    disabled,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options?: ComboboxOption[];
    groups?: ComboboxOptionGroup[];
    required?: boolean;
    error?: string;
    placeholder?: string;
    emptyText?: string;
    disabled?: boolean;
}) {
    const id = `combobox-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
    const flat = groups?.flatMap((group) => group.options) ?? options ?? [];
    const itemValues = flat.map((option) => option.value);
    const labelFor = (item: string) => flat.find((option) => option.value === item)?.label ?? item;

    return (
        <FormField label={label} htmlFor={id} required={required}>
            <Combobox
                value={value || null}
                onValueChange={(next) => onChange(next ?? "")}
                items={itemValues}
                itemToStringLabel={labelFor}
                disabled={disabled}
            >
                <ComboboxInput
                    id={id}
                    size="lg"
                    placeholder={placeholder}
                    disabled={disabled}
                    errorText={error}
                    showClear={Boolean(value) && !required}
                />
                <ComboboxContent>
                    <ComboboxEmpty>{emptyText}</ComboboxEmpty>
                    {groups ? (
                        <ComboboxList>
                            {groups.flatMap((group, index) => [
                                index > 0 ? <ComboboxSeparator key={`${group.label}-sep`} /> : null,
                                <ComboboxGroup key={group.label}>
                                    <ComboboxLabel>{group.label}</ComboboxLabel>
                                    {group.options.map((option) => (
                                        <ComboboxItem key={option.value} value={option.value}>
                                            {option.label}
                                        </ComboboxItem>
                                    ))}
                                </ComboboxGroup>,
                            ])}
                        </ComboboxList>
                    ) : (
                        <ComboboxList>
                            {(item: string) => (
                                <ComboboxItem key={item} value={item}>
                                    {labelFor(item)}
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    )}
                </ComboboxContent>
            </Combobox>
        </FormField>
    );
}

export function Segmented<T extends string>({
    label,
    value,
    onChange,
    options,
    error,
    tone = "neutral",
}: {
    label: string;
    value: T;
    onChange: (value: T) => void;
    options: Array<{ value: T; label: string }>;
    error?: string;
    tone?: "neutral" | "brand";
}) {
    return (
        <FormField label={label} error={error}>
            <div
                role="group"
                aria-label={label}
                className="grid grid-flow-col rounded-control bg-surface-muted p-1"
            >
                {options.map((option) => {
                    const active = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                `
                                  rounded-control px-3 text-sm font-medium
                                  transition-[background-color,color,box-shadow] duration-160
                                  block-control-xl
                                `,
                                active
                                    ? tone === "brand"
                                        ? "bg-brand text-surface shadow-xs"
                                        : "bg-surface text-ink shadow-xs"
                                    : "text-ink-muted hover:text-ink",
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </FormField>
    );
}

/** Card radios — same pattern as Add property “Listing for”. */
export function ChoiceRadioField<T extends string>({
    label,
    value,
    onChange,
    options,
    required,
    error,
    columns = 2,
    name = "choice",
}: {
    label: string;
    value: T;
    onChange: (value: T) => void;
    options: Array<{ value: T; label: string; description?: string }>;
    required?: boolean;
    error?: string;
    columns?: 2 | 3;
    name?: string;
}) {
    const groupId = `${name}-label`;
    const errorId = `${name}-error`;

    return (
        <FormField label={label} labelId={groupId} required={required}>
            <RadioGroup
                value={value}
                onValueChange={(next) => onChange(next as T)}
                aria-labelledby={groupId}
                aria-describedby={error ? errorId : undefined}
                aria-invalid={Boolean(error) || undefined}
                className={cn(
                    "grid gap-4",
                    columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
                )}
            >
                {options.map((option) => {
                    const active = value === option.value;
                    const itemId = `${name}-${option.value}`;
                    const hasDescription = Boolean(option.description);
                    return (
                        <Label
                            key={option.value}
                            htmlFor={itemId}
                            className={cn(
                                `
                                  flex cursor-pointer gap-3 rounded-control border-2 px-4 py-3.5
                                  text-start leading-normal font-normal transition-[background-color,border-color,color,box-shadow]
                                  duration-160 min-block-12
                                  has-focus-visible:ring-3 has-focus-visible:ring-ring/30
                                `,
                                hasDescription ? "items-start" : "items-center",
                                active
                                    ? "border-brand bg-brand-soft text-brand-text shadow-xs"
                                    : `
                                      border-border-warm bg-surface-muted text-ink
                                      hover:border-brand/40 hover:bg-surface
                                    `,
                            )}
                        >
                            <RadioGroupItem
                                id={itemId}
                                value={option.value}
                                className={cn(
                                    `
                                      shrink-0 border-ink-subtle bg-surface
                                      data-checked:border-brand data-checked:bg-brand
                                    `,
                                    hasDescription && "mts-0.5",
                                )}
                            />
                            <span className="flex-1 min-inline-0">
                                <span className="block text-sm/5 font-semibold">
                                    {option.label}
                                </span>
                                {option.description ? (
                                    <span
                                        className={cn(
                                            "mbs-0.5 block text-xs/4",
                                            active ? "text-brand-text/70" : "text-ink-muted",
                                        )}
                                    >
                                        {option.description}
                                    </span>
                                ) : null}
                            </span>
                        </Label>
                    );
                })}
            </RadioGroup>
            {error ? (
                <p id={errorId} role="alert" className="text-sm text-danger">
                    {error}
                </p>
            ) : null}
        </FormField>
    );
}

const chipButtonClass = (selected: boolean) =>
    cn(
        `
          rounded-control border px-3 py-2 text-sm font-medium
          transition-[background-color,border-color,color] duration-160 min-block-11
          focus-visible:ring-3 focus-visible:ring-ring/30
          sm:min-block-10
        `,
        selected
            ? "border-brand bg-brand-soft text-brand-text shadow-xs"
            : `
              border-border-warm bg-surface-muted text-ink-muted
              hover:border-brand/40 hover:bg-surface hover:text-ink
            `,
    );

export function ChipPicker({
    label,
    values,
    options,
    onChange,
    required,
    error,
}: {
    label: string;
    values: string[];
    options: readonly string[];
    onChange: (values: string[]) => void;
    required?: boolean;
    error?: string;
}) {
    return (
        <FormField label={label} required={required} error={error}>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const selected = values.includes(option);
                    return (
                        <Button
                            key={option}
                            type="button"
                            variant="outline"
                            size="md"
                            aria-pressed={selected}
                            onClick={() =>
                                onChange(
                                    selected
                                        ? values.filter((item) => item !== option)
                                        : [...values, option],
                                )
                            }
                            className={chipButtonClass(selected)}
                        >
                            {selected ? (
                                <Check aria-hidden className="block-3.5 inline-3.5" />
                            ) : null}
                            {option}
                        </Button>
                    );
                })}
            </div>
        </FormField>
    );
}

export function ToggleRow({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
}) {
    return (
        <label
            className="
              flex cursor-pointer items-start gap-3 rounded-inner border border-border-warm
              bg-surface px-3.5 py-3
            "
        >
            <Checkbox
                checked={checked}
                onCheckedChange={(next) => onChange(next === true)}
                className="mbs-0.5"
            />
            <span className="min-inline-0">
                <span className="body-sm block font-medium text-ink">{label}</span>
                {description ? (
                    <span className="body-xs block text-ink-muted">{description}</span>
                ) : null}
            </span>
        </label>
    );
}

/** Same ₹ money control as Add property Expected price / Society maintenance. */
function ContactCurrencyInput({
    id,
    valueDigits,
    onChangeDigits,
    error,
    placeholder = "Optional",
}: {
    id: string;
    valueDigits: string;
    onChangeDigits: (digits: string) => void;
    error?: string;
    placeholder?: string;
}) {
    const numericValue =
        valueDigits && Number.isFinite(Number(valueDigits)) && Number(valueDigits) > 0
            ? Number(valueDigits)
            : null;
    const [display, setDisplay] = useState(() => formatInrInput(numericValue));
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        if (!focused) setDisplay(formatInrInput(numericValue));
    }, [focused, numericValue]);

    return (
        <Input
            id={id}
            inputMode="text"
            size="lg"
            value={focused ? display : formatInrInput(numericValue)}
            placeholder={placeholder}
            startIcon={IndianRupeeIcon}
            errorText={error}
            onFocus={() => {
                setDisplay(formatInrInput(numericValue));
                setFocused(true);
            }}
            onValueChange={(next) => {
                setDisplay(next);
                const parsed = parseInr(next);
                onChangeDigits(parsed != null && parsed > 0 ? String(parsed) : "");
            }}
            onBlur={() => {
                setFocused(false);
                setDisplay(formatInrInput(numericValue));
            }}
        />
    );
}

export function BudgetRangeField({
    lookingFor,
    minInr,
    maxInr,
    onMinChange,
    onMaxChange,
    minError,
    maxError,
}: {
    lookingFor: "buy" | "rent" | "both";
    minInr: string;
    maxInr: string;
    onMinChange: (digits: string) => void;
    onMaxChange: (digits: string) => void;
    minError?: string;
    maxError?: string;
}) {
    const isRent = lookingFor === "rent";
    const previewInr = Number(maxInr || minInr || 0);
    const preview =
        previewInr > 0
            ? isRent
                ? `Up to ${formatRentInr(previewInr)}`
                : `Up to ${formatPriceInr(previewInr)}`
            : null;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Budget min">
                    <ContactCurrencyInput
                        id="buyer-budget-min"
                        valueDigits={minInr}
                        onChangeDigits={onMinChange}
                        error={minError}
                    />
                </FormField>
                <FormField label="Budget max">
                    <ContactCurrencyInput
                        id="buyer-budget-max"
                        valueDigits={maxInr}
                        onChangeDigits={onMaxChange}
                        error={maxError}
                    />
                </FormField>
            </div>

            {preview ? <p className="text-sm font-semibold tabular text-brand">{preview}</p> : null}
        </div>
    );
}

function TokenInput({
    label,
    values,
    onChange,
    suggestions,
    placeholder,
    error,
    required,
    popularFirst = false,
}: {
    label: string;
    values: string[];
    onChange: (values: string[]) => void;
    suggestions?: readonly string[];
    placeholder: string;
    error?: string;
    required?: boolean;
    popularFirst?: boolean;
}) {
    const [draft, setDraft] = useState("");

    const add = (raw = draft) => {
        const next = raw.trim();
        if (!next || values.some((item) => item.toLowerCase() === next.toLowerCase())) {
            setDraft("");
            return;
        }
        onChange([...values, next]);
        setDraft("");
    };

    const toggle = (item: string) => {
        if (values.some((value) => value.toLowerCase() === item.toLowerCase())) {
            onChange(values.filter((value) => value.toLowerCase() !== item.toLowerCase()));
            return;
        }
        onChange([...values, item]);
    };

    const popular = useMemo(() => {
        if (!suggestions?.length || !popularFirst) return [];
        return suggestions.slice(0, 8);
    }, [popularFirst, suggestions]);

    const filtered = useMemo(() => {
        if (!suggestions?.length || !draft.trim()) return [];
        const query = draft.trim().toLowerCase();
        return suggestions
            .filter(
                (item) =>
                    !values.some((value) => value.toLowerCase() === item.toLowerCase()) &&
                    item.toLowerCase().includes(query),
            )
            .slice(0, 6);
    }, [draft, suggestions, values]);

    return (
        <FormField
            label={label}
            required={required}
            hint={popularFirst ? "Tap an area, or type another city name" : undefined}
        >
            {values.length ? (
                <div className="flex flex-wrap gap-1.5">
                    {values.map((value) => (
                        <span
                            key={value}
                            className="
                              body-xs inline-flex items-center gap-1 rounded-control border
                              border-brand/30 bg-brand-soft px-2.5 py-1.5 font-medium text-brand-text
                            "
                        >
                            {value}
                            <button
                                type="button"
                                onClick={() => onChange(values.filter((item) => item !== value))}
                                aria-label={`Remove ${value}`}
                                className="text-brand-text/70 hover:text-brand-text"
                            >
                                <X aria-hidden className="block-3 inline-3" />
                            </button>
                        </span>
                    ))}
                </div>
            ) : null}

            {popular.length ? (
                <div className="flex flex-wrap gap-2">
                    {popular.map((item) => {
                        const selected = values.some(
                            (value) => value.toLowerCase() === item.toLowerCase(),
                        );
                        return (
                            <Button
                                key={item}
                                type="button"
                                variant="outline"
                                size="md"
                                aria-pressed={selected}
                                onClick={() => toggle(item)}
                                className={chipButtonClass(selected)}
                            >
                                {selected ? (
                                    <Check aria-hidden className="block-3.5 inline-3.5" />
                                ) : null}
                                {item}
                            </Button>
                        );
                    })}
                </div>
            ) : null}

            <Input
                size="lg"
                value={draft}
                onValueChange={setDraft}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        if (filtered[0]) add(filtered[0]);
                        else add();
                    }
                }}
                placeholder={placeholder}
                startIcon={suggestions ? MapPin : undefined}
                errorText={error}
            />

            {filtered.length ? (
                <div className="flex flex-wrap gap-2">
                    {filtered.map((item) => (
                        <Button
                            key={item}
                            type="button"
                            variant="outline"
                            size="md"
                            onClick={() => add(item)}
                            className={chipButtonClass(false)}
                        >
                            {item}
                        </Button>
                    ))}
                </div>
            ) : null}
        </FormField>
    );
}

export function LocalityPicker(
    props: Omit<React.ComponentProps<typeof TokenInput>, "suggestions" | "popularFirst">,
) {
    return <TokenInput {...props} suggestions={SURAT_LOCALITIES} />;
}

export function TagPicker(props: Omit<React.ComponentProps<typeof TokenInput>, "suggestions">) {
    return <TokenInput {...props} />;
}

export function NotesField({
    value,
    onChange,
    error,
}: {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    const messageId = "contact-notes-message";
    return (
        <FormField label="Notes" htmlFor="contact-notes" hint={`${value.length} of 300`}>
            <Textarea
                id="contact-notes"
                value={value}
                onChange={(event) => onChange(event.target.value.slice(0, 300))}
                maxLength={300}
                rows={4}
                placeholder="Add useful context for the next conversation."
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? messageId : undefined}
                className={cn(
                    `
                      field-sizing-fixed resize-y rounded-control border-2 border-border-warm
                      bg-surface px-4 py-3 text-base text-ink shadow-none
                      hover:border-ink-subtle focus-visible:border-ring focus-visible:ring-3
                      focus-visible:ring-ring/30
                      aria-invalid:border-danger-mid
                    `,
                )}
            />
            {error ? (
                <p id={messageId} role="alert" className="text-sm text-danger">
                    {error}
                </p>
            ) : null}
        </FormField>
    );
}

export function DraftRestoreBar({
    onRestore,
    onDiscard,
}: {
    onRestore: () => void;
    onDiscard: () => void;
}) {
    return (
        <div
            className="
              flex flex-wrap items-center justify-between gap-2 rounded-inner border
              border-highlight bg-highlight/15 px-3.5 py-3
            "
        >
            <p className="body-sm font-medium text-ink">Restore unsaved draft?</p>
            <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={onDiscard}>
                    Discard
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onRestore}>
                    Restore
                </Button>
            </div>
        </div>
    );
}

export function MoreDetails({
    open,
    onOpenChange,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
}) {
    return (
        <div className="rounded-inner border border-border-warm">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className="
                  body-sm flex items-center justify-between gap-2 px-3.5 py-3 font-medium
                  text-ink inline-full hover:bg-surface-muted/60
                "
            >
                More details
                <ChevronDown
                    aria-hidden
                    className={cn(
                        "block-4 inline-4 text-ink-muted transition-transform duration-160",
                        open && "rotate-180",
                    )}
                />
            </button>
            {open ? (
                <div className="space-y-4 border-t border-border-warm px-3.5 py-4">{children}</div>
            ) : null}
        </div>
    );
}

export function ContactFormDrawer({
    open,
    onOpenChange,
    title,
    description,
    isDirty,
    busy,
    primaryLabel,
    onPrimary,
    onSaveAnother,
    saveAnotherLabel = "Save & add another",
    footerError,
    children,
    header,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    isDirty: boolean;
    busy: boolean;
    primaryLabel: string;
    onPrimary: () => void;
    onSaveAnother?: () => void;
    saveAnotherLabel?: string;
    /** Sticky above the action buttons so save failures stay visible. */
    footerError?: string;
    children: ReactNode;
    header?: ReactNode;
}) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const onPrimaryRef = useRef(onPrimary);
    const onSaveAnotherRef = useRef(onSaveAnother);
    onPrimaryRef.current = onPrimary;
    onSaveAnotherRef.current = onSaveAnother;
    const [discardOpen, setDiscardOpen] = useState(false);

    const requestClose = (next: boolean) => {
        if (!next && isDirty && !busy) {
            setDiscardOpen(true);
            return;
        }
        onOpenChange(next);
    };

    const confirmDiscard = () => {
        setDiscardOpen(false);
        onOpenChange(false);
    };

    useEffect(() => {
        if (!open) setDiscardOpen(false);
    }, [open]);

    useEffect(() => {
        if (!open || busy) return;
        const unsubscribe = tinykeys(window, {
            "$mod+Enter": (event) => {
                event.preventDefault();
                onPrimaryRef.current();
            },
            ...(onSaveAnotherRef.current
                ? {
                      "$mod+Shift+Enter": (event) => {
                          event.preventDefault();
                          onSaveAnotherRef.current?.();
                      },
                  }
                : {}),
        });
        return () => unsubscribe();
    }, [busy, open]);

    useEffect(() => {
        if (!footerError || !open) return;
        const scrollRoot =
            bodyRef.current?.closest(".simplebar-content-wrapper") ??
            bodyRef.current?.closest("[data-simplebar]") ??
            bodyRef.current?.parentElement;
        if (scrollRoot instanceof HTMLElement) {
            scrollRoot.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            bodyRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        }
    }, [footerError, open]);

    return (
        <>
            <AppModal
                open={open}
                onOpenChange={requestClose}
                title={title}
                description={description}
                size="lg"
                padding="md"
                className="
                  contacts-form-drawer inset-s-auto! inset-e-0! inset-bs-0! translate-0! rounded-none!
                  block-dvh! inline-dvw! max-block-dvh! max-inline-dvw!
                  sm:inline-[min(46rem,100vw)]! sm:max-inline-184!
                "
                headerClassName="
                  !space-y-0 !pbs-(--dialog-pad) !pbe-(--dialog-pad) border-b border-border-warm
                "
                footerClassName="
                  !pbs-(--dialog-pad) !pbe-(--dialog-pad) border-t border-border-warm
                "
                header={header}
                footer={
                    <div className="flex flex-col gap-3 inline-full">
                        {footerError ? (
                            <p
                                role="alert"
                                className="body-sm rounded-inner bg-danger-soft px-3 py-2 font-semibold text-danger"
                            >
                                {footerError}
                            </p>
                        ) : null}
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {onSaveAnother ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onSaveAnother}
                                    disabled={busy}
                                >
                                    {saveAnotherLabel}
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                variant="accent"
                                onClick={onPrimary}
                                disabled={busy}
                                loading={busy}
                            >
                                {primaryLabel}
                            </Button>
                        </div>
                    </div>
                }
            >
                <div ref={bodyRef} className="mx-auto inline-full max-inline-2xl">
                    {children}
                </div>
            </AppModal>

            <AppModal
                open={discardOpen}
                onOpenChange={setDiscardOpen}
                size="sm"
                title="Discard unsaved changes?"
                description="What you typed will be lost if you leave now."
                footer={
                    <div className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full">
                        <Button type="button" variant="ghost" onClick={() => setDiscardOpen(false)}>
                            Keep editing
                        </Button>
                        <Button type="button" variant="destructive" onClick={confirmDiscard}>
                            Discard changes
                        </Button>
                    </div>
                }
            >
                <p className="body text-ink-muted">
                    You can stay on this form and keep editing, or discard and close it.
                </p>
            </AppModal>
        </>
    );
}

export function useContactDraft<T>(key: string, open: boolean, values: T, enabled: boolean) {
    const [draft, setDraft] = useState<T | null>(null);
    const opened = useRef(false);
    useEffect(() => {
        if (!open || opened.current) return;
        opened.current = true;
        let nextDraft: T | null = null;
        try {
            const raw = localStorage.getItem(key);
            if (raw) nextDraft = JSON.parse(raw) as T;
        } catch {
            localStorage.removeItem(key);
        }
        const timer = window.setTimeout(() => setDraft(nextDraft), 0);
        return () => window.clearTimeout(timer);
    }, [key, open]);
    useEffect(() => {
        if (!open) opened.current = false;
    }, [open]);
    useEffect(() => {
        if (!open || !enabled) return;
        const timer = window.setTimeout(
            () => localStorage.setItem(key, JSON.stringify(values)),
            350,
        );
        return () => window.clearTimeout(timer);
    }, [enabled, key, open, values]);
    return {
        draft,
        dismiss: () => setDraft(null),
        clear: () => {
            localStorage.removeItem(key);
            setDraft(null);
        },
    };
}
