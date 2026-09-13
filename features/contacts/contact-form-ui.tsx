"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Check, ChevronDown, MapPin, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, type InputProps } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { SURAT_LOCALITIES } from "@/features/contacts/contact-form-model";

export const nativeControlClass = `
  rounded-control border-2 border-border-warm bg-surface px-3.5 text-[15px] text-ink outline-none
  block-control-md inline-full
  hover:border-ink-subtle focus:border-ring focus:ring-3 focus:ring-ring/30
  disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60
`;

export function FormField({
    label,
    htmlFor,
    required,
    error,
    hint,
    children,
    className,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    error?: string;
    hint?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <label htmlFor={htmlFor} className="body-sm font-medium text-ink">
                {label}
                {required ? <span className="text-danger"> *</span> : null}
            </label>
            {children}
            {error ? (
                <p role="alert" className="body-xs text-danger">
                    {error}
                </p>
            ) : hint ? (
                <p className="body-xs text-ink-subtle">{hint}</p>
            ) : null}
        </div>
    );
}

export function TextField({
    label,
    required,
    error,
    hint,
    ...props
}: InputProps & { label: string; required?: boolean; error?: string; hint?: ReactNode }) {
    const id = props.id ?? `field-${props.name}`;
    return (
        <FormField label={label} htmlFor={id} required={required} error={error} hint={hint}>
            <Input {...props} id={id} aria-invalid={Boolean(error)} />
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

export function Segmented<T extends string>({
    label,
    value,
    onChange,
    options,
    error,
}: {
    label: string;
    value: T;
    onChange: (value: T) => void;
    options: Array<{ value: T; label: string }>;
    error?: string;
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
                                  body-sm rounded-control px-3 font-medium
                                  transition-[background-color,color,box-shadow] duration-160
                                  block-10
                                `,
                                active
                                    ? "bg-surface text-ink shadow-xs"
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
                        <button
                            key={option}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                                onChange(
                                    selected
                                        ? values.filter((item) => item !== option)
                                        : [...values, option],
                                )
                            }
                            className={cn(
                                `
                                  body-sm inline-flex items-center gap-1.5 rounded-control border
                                  px-3 py-2 font-medium transition-colors duration-160
                                `,
                                selected
                                    ? "border-brand bg-brand-soft text-brand-text"
                                    : `
                                      border-border-warm bg-surface text-ink-muted
                                      hover:border-ink/25 hover:text-ink
                                    `,
                            )}
                        >
                            {selected ? (
                                <Check aria-hidden className="block-3.5 inline-3.5" />
                            ) : null}
                            {option}
                        </button>
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

function TokenInput({
    label,
    values,
    onChange,
    suggestions,
    placeholder,
    error,
    required,
}: {
    label: string;
    values: string[];
    onChange: (values: string[]) => void;
    suggestions?: readonly string[];
    placeholder: string;
    error?: string;
    required?: boolean;
}) {
    const [draft, setDraft] = useState("");
    const add = (raw = draft) => {
        const next = raw.trim();
        if (!next || values.some((item) => item.toLowerCase() === next.toLowerCase())) return;
        onChange([...values, next]);
        setDraft("");
    };
    const available = suggestions?.filter(
        (item) =>
            !values.includes(item) &&
            (!draft.trim() || item.toLowerCase().includes(draft.trim().toLowerCase())),
    );

    return (
        <FormField label={label} required={required} error={error}>
            {values.length ? (
                <div className="flex flex-wrap gap-1.5">
                    {values.map((value) => (
                        <span
                            key={value}
                            className="
                              body-xs inline-flex items-center gap-1 rounded-control border
                              border-border-warm bg-surface-muted px-2.5 py-1.5 text-ink
                            "
                        >
                            {value}
                            <button
                                type="button"
                                onClick={() => onChange(values.filter((item) => item !== value))}
                                aria-label={`Remove ${value}`}
                                className="text-ink-muted hover:text-ink"
                            >
                                <X aria-hidden className="block-3 inline-3" />
                            </button>
                        </span>
                    ))}
                </div>
            ) : null}
            <div className="flex gap-2">
                <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                            event.preventDefault();
                            add();
                        }
                    }}
                    placeholder={placeholder}
                    startIcon={suggestions ? MapPin : undefined}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => add()}
                    aria-label={`Add ${label.toLowerCase()}`}
                >
                    <Plus aria-hidden />
                </Button>
            </div>
            {available?.length && draft.trim() ? (
                <div className="flex flex-wrap gap-1.5">
                    {available.slice(0, 5).map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => add(item)}
                            className="
                              body-xs rounded-control bg-brand-soft px-2.5 py-1.5 text-brand-text
                              hover:bg-brand-soft-hover
                            "
                        >
                            {item}
                        </button>
                    ))}
                </div>
            ) : null}
        </FormField>
    );
}

export function LocalityPicker(
    props: Omit<React.ComponentProps<typeof TokenInput>, "suggestions">,
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
    return (
        <FormField
            label="Notes"
            htmlFor="contact-notes"
            error={error}
            hint={`${value.length} of 500`}
        >
            <Textarea
                id="contact-notes"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Add useful context for the next conversation."
                className="rounded-inner"
            />
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

export function ContactFormDrawer({
    open,
    onOpenChange,
    title,
    description,
    step,
    steps,
    isDirty,
    busy,
    onBack,
    onNext,
    onSaveAnother,
    children,
    header,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    step: number;
    steps: string[];
    isDirty: boolean;
    busy: boolean;
    onBack: () => void;
    onNext: () => void;
    onSaveAnother?: () => void;
    children: ReactNode;
    header?: ReactNode;
}) {
    const requestClose = (next: boolean) => {
        if (!next && isDirty && !busy && !window.confirm("Discard your unsaved changes?")) return;
        onOpenChange(next);
    };
    const last = step === steps.length - 1;
    return (
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
            header={
                <div className="space-y-3">
                    {header}
                    <ol
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
                        aria-label="Form progress"
                    >
                        {steps.map((label, index) => (
                            <li key={label} className="min-inline-0">
                                <div
                                    className={cn(
                                        "rounded-full block-1",
                                        index <= step ? "bg-brand" : "bg-surface-muted",
                                    )}
                                />
                                <span
                                    className={cn(
                                        "body-xs mbs-1 hidden truncate sm:block",
                                        index === step
                                            ? "font-semibold text-ink"
                                            : "text-ink-subtle",
                                    )}
                                >
                                    {label}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            }
            footer={
                <div className="flex flex-wrap items-center justify-between gap-2 inline-full">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        disabled={busy || step === 0}
                    >
                        Back
                    </Button>
                    <span className="body-xs tabular text-ink-muted">
                        Step {step + 1} of {steps.length}
                    </span>
                    <div className="flex gap-2">
                        {last && onSaveAnother ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onSaveAnother}
                                disabled={busy}
                            >
                                Save &amp; add another
                            </Button>
                        ) : null}
                        <Button type="button" onClick={onNext} disabled={busy} loading={busy}>
                            {last ? "Save contact" : "Next"}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="mx-auto inline-full max-inline-2xl">{children}</div>
        </AppModal>
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
