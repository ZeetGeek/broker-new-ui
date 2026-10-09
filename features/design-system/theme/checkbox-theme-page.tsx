"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { CHECKBOX_LAYOUTS } from "@/features/design-system/theme/checkbox-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

const TIME_BUCKETS = [
    { id: "morning", label: "Morning", detail: "9–12" },
    { id: "afternoon", label: "Afternoon", detail: "12–5" },
    { id: "evening", label: "Evening", detail: "5–8" },
] as const;

const CONSENT_ITEMS = [
    {
        id: "terms",
        label: "I agree to share this listing with brokers",
        hint: "You can revoke access any time",
    },
    {
        id: "sms",
        label: "Send me SMS when a broker requests access",
    },
] as const;

function optionCardClassName(active: boolean, disabled?: boolean) {
    return cn(
        `
          flex cursor-pointer items-center gap-3 rounded-control border px-3 text-start
          font-normal leading-normal
          transition-[background-color,border-color,color] duration-160
          block-control-xl
          has-focus-visible:ring-3 has-focus-visible:ring-ring/30
        `,
        active
            ? "border-brand bg-brand-soft text-brand-text"
            : `
              border-border-warm bg-surface text-ink
              hover:border-brand/40
            `,
        disabled && "pointer-events-none opacity-50",
    );
}

function StackDemo() {
    const [values, setValues] = useState<Record<string, boolean>>({
        terms: true,
        sms: false,
    });

    return (
        <div className="space-y-3 inline-full">
            {CONSENT_ITEMS.map((item) => (
                <label
                    key={item.id}
                    htmlFor={`stack-${item.id}`}
                    className="flex items-start gap-3 min-block-10"
                >
                    <Checkbox
                        id={`stack-${item.id}`}
                        checked={values[item.id]}
                        onCheckedChange={(checked) =>
                            setValues((prev) => ({ ...prev, [item.id]: Boolean(checked) }))
                        }
                        className="mts-0.5"
                    />
                    <span className="min-inline-0">
                        <span className="block body-sm font-medium text-ink">{item.label}</span>
                        {"hint" in item && item.hint ? (
                            <span className="mbs-0.5 block text-xs leading-4 text-ink-muted">
                                {item.hint}
                            </span>
                        ) : null}
                    </span>
                </label>
            ))}
        </div>
    );
}

function CardsDemo({
    disabled,
    invalid,
}: {
    disabled?: boolean;
    invalid?: boolean;
} = {}) {
    const [selected, setSelected] = useState<string[]>(invalid ? [] : ["morning"]);

    function toggle(id: string) {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
        );
    }

    return (
        <div
            role="group"
            aria-label="Time of day"
            aria-invalid={invalid || undefined}
            className="grid gap-2 inline-full sm:grid-cols-1"
        >
            {TIME_BUCKETS.map((bucket) => {
                const checked = selected.includes(bucket.id);
                const id = `card-${disabled ? "disabled-" : ""}${invalid ? "invalid-" : ""}${bucket.id}`;
                return (
                    <Label key={bucket.id} htmlFor={id} className={optionCardClassName(checked, disabled)}>
                        <Checkbox
                            id={id}
                            checked={checked}
                            disabled={disabled}
                            aria-invalid={invalid && selected.length === 0 ? true : undefined}
                            onCheckedChange={() => toggle(bucket.id)}
                        />
                        <span className="body-sm font-semibold">
                            {bucket.label}{" "}
                            <span className="body-xs font-normal text-ink-muted">
                                {bucket.detail}
                            </span>
                        </span>
                    </Label>
                );
            })}
        </div>
    );
}

function IndeterminateDemo() {
    const [children, setChildren] = useState({ vesu: true, adajan: false, piplod: true });
    const values = Object.values(children);
    const all = values.every(Boolean);
    const none = values.every((value) => !value);
    const parentChecked = all;
    const parentIndeterminate = !all && !none;

    function setAll(next: boolean) {
        setChildren({ vesu: next, adajan: next, piplod: next });
    }

    return (
        <div className="space-y-3 inline-full">
            <label htmlFor="parent-localities" className="flex items-center gap-3 min-block-10">
                <Checkbox
                    id="parent-localities"
                    checked={parentChecked}
                    indeterminate={parentIndeterminate}
                    onCheckedChange={(checked) => setAll(Boolean(checked))}
                />
                <span className="body-sm font-semibold text-ink">All localities</span>
            </label>
            <div className="space-y-2 border-s border-border-warm ps-4 ms-2">
                {(
                    [
                        { id: "vesu", label: "Vesu" },
                        { id: "adajan", label: "Adajan" },
                        { id: "piplod", label: "Piplod" },
                    ] as const
                ).map((item) => (
                    <label
                        key={item.id}
                        htmlFor={`child-${item.id}`}
                        className="flex items-center gap-3 min-block-10"
                    >
                        <Checkbox
                            id={`child-${item.id}`}
                            checked={children[item.id]}
                            onCheckedChange={(checked) =>
                                setChildren((prev) => ({
                                    ...prev,
                                    [item.id]: Boolean(checked),
                                }))
                            }
                        />
                        <span className="body-sm font-medium text-ink">{item.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function LiveConsentDemo() {
    const [accepted, setAccepted] = useState(false);

    return (
        <div className="space-y-2 inline-full">
            <label htmlFor="live-consent" className="flex items-start gap-3 min-block-10">
                <Checkbox
                    id="live-consent"
                    checked={accepted}
                    aria-invalid={!accepted || undefined}
                    onCheckedChange={(checked) => setAccepted(Boolean(checked))}
                    className="mts-0.5"
                />
                <span className="body-sm font-medium text-ink">
                    I understand brokers can request to represent this property
                </span>
            </label>
            <p
                role={!accepted ? "alert" : undefined}
                className={cn("body-xs", !accepted ? "text-danger" : "text-success")}
            >
                {!accepted ? "Accept to continue" : "Consent recorded"}
            </p>
        </div>
    );
}

export function CheckboxThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Checkbox."
            description="base-ui Checkbox, wrapped once in components/ui/checkbox.tsx. Multi-select and consent — never one exclusive choice (that is Radio) and never a binary preference (that is Switch). Square geometry, rounded-sm (6px), brand fill when checked. Motion: transitions.dev checkbox check — box fills, then the mark stroke-draws; uncheck reverses quickly."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Layouts</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        The primitive is a fixed 20px square. Layout belongs on the wrapping label —
                        stack for consent lines, option cards for multi-select filters, parent +
                        children for indeterminate groups.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {CHECKBOX_LAYOUTS.map((layout) => (
                            <Swatch key={layout.name} label={layout.label}>
                                {layout.name === "stack" ? (
                                    <StackDemo />
                                ) : layout.name === "cards" ? (
                                    <CardsDemo />
                                ) : (
                                    <IndeterminateDemo />
                                )}
                                <p className="body-xs text-ink-subtle">{layout.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">States — live demo</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Tick the consent line. The message region follows real selection — the same
                        wiring a form uses with <code className="body-xs">aria-invalid</code> on
                        the control.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Consent — validates on tick">
                            <LiveConsentDemo />
                        </Swatch>
                        <Swatch label="Bare states">
                            <div className="flex flex-wrap items-center gap-4">
                                <Checkbox aria-label="Unchecked" />
                                <Checkbox defaultChecked aria-label="Checked" />
                                <Checkbox indeterminate aria-label="Indeterminate" />
                            </div>
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Static states</h2>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Swatch label="Disabled · cards">
                            <CardsDemo disabled />
                        </Swatch>
                        <Swatch label="Invalid · none selected">
                            <CardsDemo invalid />
                        </Swatch>
                        <Swatch label="Disabled · checked">
                            <label
                                htmlFor="checkbox-locked"
                                className="flex items-center gap-3 min-block-10"
                            >
                                <Checkbox id="checkbox-locked" defaultChecked disabled />
                                <span className="body-sm font-medium text-ink">
                                    Locked preference
                                </span>
                            </label>
                        </Swatch>
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Use Checkbox for multi-select and consent. One exclusive choice is{" "}
                            <code className="body-xs">Radio</code>. Binary on/off preference is{" "}
                            <code className="body-xs">Switch</code>.
                        </li>
                        <li>
                            Always pair with a visible label via{" "}
                            <code className="body-xs">htmlFor</code> /{" "}
                            <code className="body-xs">id</code>, or wrap both in a{" "}
                            <code className="body-xs">&lt;label&gt;</code>. Never a bare box.
                        </li>
                        <li>
                            Checked and indeterminate fill is <code className="body-xs">brand</code>
                            . Selected option cards use{" "}
                            <code className="body-xs">border-brand</code> +{" "}
                            <code className="body-xs">bg-brand-soft</code>. Hover only changes the
                            card border.
                        </li>
                        <li>
                            Geometry stays <code className="body-xs">rounded-sm</code> (6px). Never
                            a circle — that is Radio. Never <code className="body-xs">rounded-full</code>.
                        </li>
                        <li>
                            Motion is <code className="body-xs">.t-check</code>{" "}
                            (transitions.dev 25) — box fill first, then stroke-draw the
                            check. Uncheck reverses in{" "}
                            <code className="body-xs">--check-uncheck</code>. Reduced-motion
                            skips both.
                        </li>
                        <li>
                            Indeterminate is for a parent of a partial group only. Do not use it as
                            a third preference state.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
