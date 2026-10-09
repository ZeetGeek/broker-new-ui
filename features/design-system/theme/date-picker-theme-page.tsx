"use client";

import { useState } from "react";

import { AppDatePicker } from "@/components/shared/app-date-picker";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { DATE_PICKER_SIZES } from "@/features/design-system/theme/date-picker-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function ControlledPicker({
    size,
    disabled,
    invalid,
    initial = null,
}: {
    size?: "xs" | "sm" | "default" | "md" | "lg";
    disabled?: boolean;
    invalid?: boolean;
    initial?: string | null;
}) {
    const [value, setValue] = useState<string | null>(initial);

    return (
        <AppDatePicker
            size={size}
            value={value}
            onChange={setValue}
            disabled={disabled}
            invalid={invalid}
            className="max-inline-70"
        />
    );
}

function AvailableFromDemo() {
    const [value, setValue] = useState<string | null>(null);
    const touched = value !== null;
    const missing = !value;

    return (
        <div className="space-y-2 inline-full max-inline-70">
            <label htmlFor="available-from-demo" className="body-sm block font-medium text-ink">
                Available from
            </label>
            <AppDatePicker
                id="available-from-demo"
                value={value}
                onChange={setValue}
                invalid={touched && missing}
            />
            <p
                role={touched && missing ? "alert" : undefined}
                className={`body-xs ${touched && missing ? "text-danger" : "text-ink-muted"}`}
            >
                {touched && missing
                    ? "Choose when the property is available"
                    : value
                      ? "Shown to brokers on the listing"
                      : "Possession or move-in date"}
            </p>
        </div>
    );
}

export function DatePickerThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Date picker."
            description="Compact light Popover with Button nav and Select month/year. Wrapped once as AppDatePicker. Value is yyyy-MM-dd; the trigger shows dd/mm/yyyy. Selected day uses a brand fill circle."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Same five steps as Input and Select. Default is{" "}
                        <code className="body-xs">lg</code> (48px) for primary mobile forms.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {DATE_PICKER_SIZES.map((step) => (
                            <Swatch key={step.name} label={step.label}>
                                <ControlledPicker
                                    size={step.name}
                                    initial={step.name === "lg" ? "2026-09-14" : null}
                                />
                                <p className="body-xs text-ink-subtle">{step.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">States — live demo</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Open the calendar. Month and year are bordered selects in the caption —
                        jump years without paging month by month.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Available from">
                            <AvailableFromDemo />
                        </Swatch>
                        <Swatch label="Filled · open for month/year selects">
                            <ControlledPicker initial="2026-08-18" />
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Static states</h2>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Swatch label="Empty">
                            <ControlledPicker />
                        </Swatch>
                        <Swatch label="Disabled · filled">
                            <ControlledPicker initial="2026-09-01" disabled />
                        </Swatch>
                        <Swatch label="Invalid">
                            <ControlledPicker invalid />
                        </Swatch>
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Use <code className="body-xs">AppDatePicker</code> — do not recompose
                            Popover + Button + Calendar at call sites.
                        </li>
                        <li>
                            Display is always <code className="body-xs">dd/mm/yyyy</code>. Value in
                            state / forms is <code className="body-xs">yyyy-MM-dd</code>. Empty
                            placeholder is &quot;Pick a date&quot;.
                        </li>
                        <li>
                            Trigger: date on the start, calendar icon on the end, thin{" "}
                            <code className="body-xs">border-warm</code>,{" "}
                            <code className="body-xs">surface</code> fill,{" "}
                            <code className="body-xs">rounded-control</code>.
                        </li>
                        <li>
                            Popup is light only — <code className="body-xs">bg-surface</code>,{" "}
                            <code className="body-xs">rounded-card</code>,{" "}
                            <code className="body-xs">shadow-lg</code>. Header uses{" "}
                            <code className="body-xs">Button</code> for prev/next (circular muted
                            hover) and compact <code className="body-xs">Select</code> for month +
                            year.
                        </li>
                        <li>
                            Day cells are compact circles. Selected day uses{" "}
                            <code className="body-xs">bg-brand</code> +{" "}
                            <code className="body-xs">text-surface</code> — no under-dot. Month
                            select shows short names (Jan–Dec), not numbers.
                        </li>
                        <li>
                            Pair with a visible label. Pass{" "}
                            <code className="body-xs">invalid</code> for validation — error copy
                            lives under the field, not inside the popover.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
