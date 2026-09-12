"use client";

import { type ComponentProps, type ReactNode, useId, useState } from "react";
import { Controller, type FieldPath, useFormContext } from "react-hook-form";

import { Check, Eye, LockKeyhole, Minus, Plus, X } from "lucide-react";

import { formatInrInput, inrWordHint, parseInr } from "@/lib/format/inr";
import type { PropertyDraftValues } from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { type FieldVisibility, visibilityForField } from "@/lib/visibility/property";

import { Input } from "@/components/ui/input";

import type { PropertyOption } from "@/constants/property";

type Path = FieldPath<PropertyDraftValues>;

function errorAt(errors: unknown, path: string): string | undefined {
    const value = path.split(".").reduce<unknown>((current, segment) => {
        if (!current || typeof current !== "object") return undefined;
        return (current as Record<string, unknown>)[segment];
    }, errors);
    if (!value || typeof value !== "object") return undefined;
    const message = (value as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
}

export function VisibilityMark({ visibility }: { visibility: FieldVisibility }) {
    const Icon = visibility === "private" ? LockKeyhole : Eye;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium",
                visibility === "private" ? "text-brand-text" : "text-ink-subtle",
            )}
        >
            <Icon className="block-3 inline-3" aria-hidden />
            {visibility === "private" ? "Broker only" : "Listing"}
        </span>
    );
}

function FieldShell({
    name,
    label,
    hint,
    visibility,
    children,
    className,
}: {
    name: string;
    label: string;
    hint?: ReactNode;
    visibility?: FieldVisibility;
    children: ReactNode;
    className?: string;
}) {
    const resolvedVisibility = visibility ?? visibilityForField(name);
    return (
        <div className={cn("flex flex-col gap-2 min-inline-0", className)}>
            <div className="flex items-center justify-between gap-3 min-block-5">
                <label
                    htmlFor={name.replace(/\./g, "-")}
                    className="text-sm font-semibold text-ink"
                >
                    {label}
                </label>
                <VisibilityMark visibility={resolvedVisibility} />
            </div>
            {children}
            {hint ? <div className="text-xs/5 text-ink-muted">{hint}</div> : null}
        </div>
    );
}

export function TextField({
    name,
    label,
    hint,
    visibility,
    className,
    onBlur: onInputBlur,
    ...props
}: {
    name: Path;
    label: string;
    hint?: ReactNode;
    visibility?: FieldVisibility;
    className?: string;
} & Omit<ComponentProps<typeof Input>, "name" | "errorText" | "size">) {
    const {
        register,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
    const error = errorAt(errors, name);
    const registration = register(name);
    return (
        <FieldShell
            name={name}
            label={label}
            hint={hint}
            visibility={visibility}
            className={className}
        >
            <Input
                id={name.replace(/\./g, "-")}
                size="lg"
                errorText={error}
                {...registration}
                {...props}
                onBlur={(event) => {
                    void registration.onBlur(event);
                    onInputBlur?.(event);
                }}
            />
        </FieldShell>
    );
}

export function TextAreaField({
    name,
    label,
    hint,
    visibility,
    rows = 4,
    placeholder,
    className,
    onBlur: onInputBlur,
}: {
    name: Path;
    label: string;
    hint?: ReactNode;
    visibility?: FieldVisibility;
    rows?: number;
    placeholder?: string;
    className?: string;
    onBlur?: () => void;
}) {
    const {
        register,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
    const error = errorAt(errors, name);
    const messageId = `${name.replace(/\./g, "-")}-message`;
    const registration = register(name);
    return (
        <FieldShell
            name={name}
            label={label}
            hint={hint}
            visibility={visibility}
            className={className}
        >
            <textarea
                id={name.replace(/\./g, "-")}
                rows={rows}
                placeholder={placeholder}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? messageId : undefined}
                className="
                  resize-y rounded-control border-2 border-border-warm bg-surface px-4 py-3
                  text-[15px]/6 text-ink outline-none min-block-28
                  placeholder:text-ink-subtle
                  hover:border-ink-subtle
                  focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                  aria-invalid:border-danger-mid
                "
                {...registration}
                onBlur={(event) => {
                    void registration.onBlur(event);
                    onInputBlur?.();
                }}
            />
            {error ? (
                <p id={messageId} role="alert" className="text-sm text-danger">
                    {error}
                </p>
            ) : null}
        </FieldShell>
    );
}

export function SelectField({
    name,
    label,
    options,
    placeholder = "Choose an option",
    hint,
    visibility,
    className,
    onBlur: onInputBlur,
}: {
    name: Path;
    label: string;
    options: readonly PropertyOption[];
    placeholder?: string;
    hint?: ReactNode;
    visibility?: FieldVisibility;
    className?: string;
    onBlur?: () => void;
}) {
    const {
        control,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
    const error = errorAt(errors, name);
    const messageId = `${name.replace(/\./g, "-")}-message`;
    return (
        <FieldShell
            name={name}
            label={label}
            hint={hint}
            visibility={visibility}
            className={className}
        >
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <select
                        id={name.replace(/\./g, "-")}
                        value={String(field.value ?? "")}
                        onChange={field.onChange}
                        onBlur={() => {
                            field.onBlur();
                            onInputBlur?.();
                        }}
                        ref={field.ref}
                        aria-invalid={Boolean(error) || undefined}
                        aria-describedby={error ? messageId : undefined}
                        className="
                          rounded-control border-2 border-border-warm bg-surface px-4 text-[15px]
                          text-ink outline-none block-control-xl inline-full
                          hover:border-ink-subtle
                          focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                          aria-invalid:border-danger-mid
                        "
                    >
                        <option value="">{placeholder}</option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                )}
            />
            {error ? (
                <p id={messageId} role="alert" className="text-sm text-danger">
                    {error}
                </p>
            ) : null}
        </FieldShell>
    );
}

export function NumberField({
    name,
    label,
    hint,
    visibility,
    min = 0,
    max,
    step,
    placeholder,
    className,
}: {
    name: Path;
    label: string;
    hint?: ReactNode;
    visibility?: FieldVisibility;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    className?: string;
}) {
    const {
        control,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
    const error = errorAt(errors, name);
    return (
        <FieldShell
            name={name}
            label={label}
            hint={hint}
            visibility={visibility}
            className={className}
        >
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <Input
                        id={name.replace(/\./g, "-")}
                        type="number"
                        inputMode="decimal"
                        min={min}
                        max={max}
                        step={step}
                        size="lg"
                        placeholder={placeholder}
                        value={field.value == null ? "" : String(field.value)}
                        onValueChange={(value) =>
                            field.onChange(value === "" ? null : Number(value))
                        }
                        onBlur={field.onBlur}
                        errorText={error}
                    />
                )}
            />
        </FieldShell>
    );
}

function CurrencyControl({
    value,
    onChange,
    onBlur,
    error,
    placeholder,
    id,
}: {
    value: unknown;
    onChange: (value: number | null) => void;
    onBlur: () => void;
    error?: string;
    placeholder?: string;
    id: string;
}) {
    const numericValue = typeof value === "number" ? value : null;
    const [display, setDisplay] = useState(() => formatInrInput(numericValue));
    const [focused, setFocused] = useState(false);

    return (
        <Input
            id={id}
            inputMode="text"
            size="lg"
            value={focused ? display : formatInrInput(numericValue)}
            placeholder={placeholder ?? "e.g. 85 lakh"}
            onFocus={() => {
                setDisplay(formatInrInput(numericValue));
                setFocused(true);
            }}
            onValueChange={(next) => {
                setDisplay(next);
                onChange(parseInr(next));
            }}
            onBlur={() => {
                setFocused(false);
                setDisplay(formatInrInput(numericValue));
                onBlur();
            }}
            startIcon={IndianRupeeIcon}
            errorText={error}
            helperText={
                numericValue
                    ? inrWordHint(numericValue)
                    : "Type 85 lakh, 1.2 cr, or the full amount"
            }
        />
    );
}

function IndianRupeeIcon(props: ComponentProps<"svg">) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
            <path d="M6 4h12M6 8h12M7 4c5 0 7 2 7 5s-2 5-7 5h-1l8 7" />
        </svg>
    );
}

export function CurrencyField({
    name,
    label,
    hint,
    visibility,
    className,
    placeholder,
    onValueChange,
}: {
    name: Path;
    label: string;
    hint?: ReactNode;
    visibility?: FieldVisibility;
    className?: string;
    placeholder?: string;
    onValueChange?: (value: number | null) => void;
}) {
    const {
        control,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
    const error = errorAt(errors, name);
    const id = name.replace(/\./g, "-");
    return (
        <FieldShell
            name={name}
            label={label}
            hint={hint}
            visibility={visibility}
            className={className}
        >
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <CurrencyControl
                        id={id}
                        value={field.value}
                        onChange={(value) => {
                            field.onChange(value);
                            onValueChange?.(value);
                        }}
                        onBlur={field.onBlur}
                        error={error}
                        placeholder={placeholder}
                    />
                )}
            />
        </FieldShell>
    );
}

export function ChoiceField({
    name,
    label,
    options,
    hint,
    visibility,
    columns = 3,
    className,
}: {
    name: Path;
    label: string;
    options: readonly PropertyOption[];
    hint?: ReactNode;
    visibility?: FieldVisibility;
    columns?: 2 | 3 | 4;
    className?: string;
}) {
    const {
        control,
        formState: { errors },
    } = useFormContext<PropertyDraftValues>();
    const error = errorAt(errors, name);
    return (
        <FieldShell
            name={name}
            label={label}
            hint={hint}
            visibility={visibility}
            className={className}
        >
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <div
                        role="radiogroup"
                        className={cn(
                            "grid gap-2",
                            columns === 2
                                ? "grid-cols-2"
                                : columns === 4
                                  ? `grid-cols-2 sm:grid-cols-4`
                                  : `grid-cols-2 sm:grid-cols-3`,
                        )}
                    >
                        {options.map((option) => {
                            const active = field.value === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => field.onChange(option.value)}
                                    className={cn(
                                        `
                                          flex items-center gap-2 rounded-control border px-3 py-2.5
                                          text-start
                                          transition-[background-color,border-color,color]
                                          duration-160 min-block-12
                                          focus-visible:ring-3 focus-visible:ring-ring/30
                                        `,
                                        active
                                            ? "border-brand bg-brand-soft text-brand-text"
                                            : `
                                              border-border-warm bg-surface text-ink
                                              hover:border-brand/40 hover:bg-brand-soft/40
                                            `,
                                    )}
                                >
                                    <span
                                        className={cn(
                                            `
                                              flex shrink-0 items-center justify-center rounded-full
                                              border block-4 inline-4
                                            `,
                                            active
                                                ? `border-brand bg-brand text-surface`
                                                : `border-ink-subtle`,
                                        )}
                                    >
                                        {active ? (
                                            <Check
                                                className="block-2.5 inline-2.5"
                                                strokeWidth={3}
                                            />
                                        ) : null}
                                    </span>
                                    <span className="min-inline-0">
                                        <span className="block text-sm font-semibold">
                                            {option.label}
                                        </span>
                                        {option.description ? (
                                            <span
                                                className="mbs-0.5 block text-xs text-ink-muted"
                                            >
                                                {option.description}
                                            </span>
                                        ) : null}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            />
            {error ? (
                <p role="alert" className="text-sm text-danger">
                    {error}
                </p>
            ) : null}
        </FieldShell>
    );
}

export function MultiChipField({
    name,
    label,
    options,
    hint,
    visibility,
    className,
}: {
    name: Path;
    label: string;
    options: readonly PropertyOption[];
    hint?: ReactNode;
    visibility?: FieldVisibility;
    className?: string;
}) {
    const { control } = useFormContext<PropertyDraftValues>();
    return (
        <FieldShell
            name={name}
            label={label}
            hint={hint}
            visibility={visibility}
            className={className}
        >
            <Controller
                name={name}
                control={control}
                render={({ field }) => {
                    const selected = Array.isArray(field.value) ? field.value.map(String) : [];
                    return (
                        <div className="flex flex-wrap gap-2">
                            {options.map((option) => {
                                const active = selected.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() =>
                                            field.onChange(
                                                active
                                                    ? selected.filter(
                                                          (value) => value !== option.value,
                                                      )
                                                    : [...selected, option.value],
                                            )
                                        }
                                        className={cn(
                                            `
                                              rounded-control border px-3 py-2 text-sm font-medium
                                              transition-[background-color,border-color,color]
                                              duration-160 min-block-11
                                              focus-visible:ring-3 focus-visible:ring-ring/30
                                              sm:min-block-10
                                            `,
                                            active
                                                ? "border-brand bg-brand-soft text-brand-text"
                                                : `
                                                  border-border-warm bg-surface text-ink-muted
                                                  hover:border-brand/40 hover:text-ink
                                                `,
                                        )}
                                    >
                                        {active ? (
                                            <Check
                                                className="me-1.5 inline block-3.5 inline-3.5"
                                                aria-hidden
                                            />
                                        ) : null}
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    );
                }}
            />
        </FieldShell>
    );
}

export function ToggleField({
    name,
    label,
    description,
    visibility,
    className,
}: {
    name: Path;
    label: string;
    description?: string;
    visibility?: FieldVisibility;
    className?: string;
}) {
    const { control } = useFormContext<PropertyDraftValues>();
    const id = useId();
    const resolvedVisibility = visibility ?? visibilityForField(name);
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const checked = Boolean(field.value);
                return (
                    <div
                        className={cn(
                            `
                              flex items-center justify-between gap-4 rounded-control border
                              border-border-warm bg-surface px-4 py-3 min-block-14
                            `,
                            className,
                        )}
                    >
                        <div className="min-inline-0">
                            <label htmlFor={id} className="block text-sm font-semibold text-ink">
                                {label}
                            </label>
                            {description ? (
                                <p className="mbs-0.5 text-xs/5 text-ink-muted">{description}</p>
                            ) : null}
                            <VisibilityMark visibility={resolvedVisibility} />
                        </div>
                        <button
                            id={id}
                            type="button"
                            role="switch"
                            aria-checked={checked}
                            onClick={() => field.onChange(!checked)}
                            className={cn(
                                `
                                  relative shrink-0 rounded-full transition-colors duration-160
                                  block-7 inline-12
                                  focus-visible:ring-3 focus-visible:ring-ring/30
                                `,
                                checked ? `bg-brand` : `bg-border-warm`,
                            )}
                        >
                            <span
                                className={cn(
                                    `
                                      absolute inset-bs-1 rounded-full bg-surface shadow-xs
                                      transition-transform duration-160 block-5 inline-5
                                    `,
                                    checked ? `translate-x-6` : `translate-x-1`,
                                )}
                            />
                            <span className="sr-only">{checked ? "On" : "Off"}</span>
                        </button>
                    </div>
                );
            }}
        />
    );
}

export function TagInputField({
    name,
    label,
    placeholder,
    hint,
    visibility,
    max = 20,
}: {
    name: Path;
    label: string;
    placeholder?: string;
    hint?: ReactNode;
    visibility?: FieldVisibility;
    max?: number;
}) {
    const { control } = useFormContext<PropertyDraftValues>();
    const [draft, setDraft] = useState("");
    return (
        <FieldShell name={name} label={label} hint={hint} visibility={visibility}>
            <Controller
                name={name}
                control={control}
                render={({ field }) => {
                    const values = Array.isArray(field.value) ? field.value.map(String) : [];
                    const add = () => {
                        const next = draft.trim();
                        if (!next || values.length >= max || values.includes(next)) return;
                        field.onChange([...values, next]);
                        setDraft("");
                    };
                    return (
                        <div className="space-y-3">
                            {values.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {values.map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() =>
                                                field.onChange(
                                                    values.filter((item) => item !== value),
                                                )
                                            }
                                            className="
                                              rounded-control border border-brand/25 bg-brand-soft
                                              px-3 py-1.5 text-sm font-medium text-brand-text
                                              min-block-10
                                              focus-visible:ring-3 focus-visible:ring-ring/30
                                            "
                                            aria-label={`Remove ${value}`}
                                        >
                                            {value}{" "}
                                            <X
                                                className="ms-1 inline block-3.5 inline-3.5"
                                                aria-hidden
                                            />
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                            <div className="flex gap-2">
                                <Input
                                    size="lg"
                                    value={draft}
                                    placeholder={placeholder}
                                    onValueChange={setDraft}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === ",") {
                                            event.preventDefault();
                                            add();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={add}
                                    disabled={!draft.trim() || values.length >= max}
                                    className="
                                      rounded-control border border-border-warm bg-surface px-4
                                      text-sm font-semibold text-ink
                                      hover:bg-surface-muted
                                      focus-visible:ring-3 focus-visible:ring-ring/30
                                      disabled:opacity-40
                                    "
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    );
                }}
            />
        </FieldShell>
    );
}

export function CounterField({
    name,
    label,
    min = 0,
    max = 10,
    visibility,
}: {
    name: Path;
    label: string;
    min?: number;
    max?: number;
    visibility?: FieldVisibility;
}) {
    const { control } = useFormContext<PropertyDraftValues>();
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const value = typeof field.value === "number" ? field.value : 0;
                return (
                    <div
                        className="
                          flex items-center justify-between gap-3 rounded-control border
                          border-border-warm bg-surface px-3 py-2 min-block-14
                        "
                    >
                        <div>
                            <p className="text-sm font-semibold text-ink">{label}</p>
                            <VisibilityMark visibility={visibility ?? visibilityForField(name)} />
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                aria-label={`Decrease ${label}`}
                                disabled={value <= min}
                                onClick={() => field.onChange(Math.max(min, value - 1))}
                                className="
                                  flex items-center justify-center rounded-control text-ink-muted
                                  block-10 inline-10
                                  hover:bg-surface-muted
                                  focus-visible:ring-3 focus-visible:ring-ring/30
                                  disabled:opacity-30
                                "
                            >
                                <Minus className="block-4 inline-4" />
                            </button>
                            <span
                                className="
                                  tabular text-center text-base font-bold text-ink min-inline-8
                                "
                            >
                                {value}
                            </span>
                            <button
                                type="button"
                                aria-label={`Increase ${label}`}
                                disabled={value >= max}
                                onClick={() => field.onChange(Math.min(max, value + 1))}
                                className="
                                  flex items-center justify-center rounded-control text-ink-muted
                                  block-10 inline-10
                                  hover:bg-surface-muted
                                  focus-visible:ring-3 focus-visible:ring-ring/30
                                  disabled:opacity-30
                                "
                            >
                                <Plus className="block-4 inline-4" />
                            </button>
                        </div>
                    </div>
                );
            }}
        />
    );
}

export function WizardSection({
    title,
    description,
    children,
    tone = "default",
}: {
    title: string;
    description?: string;
    children: ReactNode;
    tone?: "default" | "private";
}) {
    return (
        <section
            className={cn(
                "border-be border-border-warm pbe-8 last:border-be-0 last:pbe-0",
                tone === "private" &&
                    `rounded-card border border-brand/15 bg-brand-soft/35 p-5 last:border-be sm:p-6`,
            )}
        >
            <div className="mbe-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-[-0.02em] text-ink">{title}</h2>
                    {description ? (
                        <p className="mbs-1 text-sm/6 text-ink-muted max-inline-2xl">
                            {description}
                        </p>
                    ) : null}
                </div>
                {tone === "private" ? <VisibilityMark visibility="private" /> : null}
            </div>
            {children}
        </section>
    );
}

export const FORM_GRID_CLASS = "grid gap-5 md:grid-cols-2";
