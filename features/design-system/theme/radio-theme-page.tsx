"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { RADIO_LAYOUTS } from "@/features/design-system/theme/radio-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

const LISTING_TYPES = [
    { value: "sale", label: "For sale", description: "Owner wants to sell" },
    { value: "rent", label: "For rent", description: "Owner wants tenants" },
] as const;

const FURNISHING = [
    { value: "unfurnished", label: "Unfurnished" },
    { value: "semi", label: "Semi" },
    { value: "furnished", label: "Furnished" },
] as const;

const RADIO_OPTION_ITEM_CLASS =
    "shrink-0 border-ink-subtle bg-surface data-checked:border-brand data-checked:bg-brand";

function optionCardClassName(
    active: boolean,
    hasDescription: boolean,
    disabled?: boolean,
) {
    return cn(
        `
          flex cursor-pointer gap-3 rounded-control border px-4 py-3 text-start font-normal
          leading-normal
          transition-[background-color,border-color,color] duration-160 min-block-12
          has-focus-visible:ring-3 has-focus-visible:ring-ring/30
        `,
        hasDescription ? "items-start" : "items-center",
        active
            ? "border-brand bg-brand-soft text-brand-text"
            : `
              border-border-warm bg-surface text-ink
              hover:border-brand/40
            `,
        disabled && "pointer-events-none opacity-50",
    );
}

function OptionCardGroup({
    name,
    options,
    columns = 2,
    disabled,
    invalid,
    defaultValue,
}: {
    name: string;
    options: ReadonlyArray<{ value: string; label: string; description?: string }>;
    columns?: 2 | 3;
    disabled?: boolean;
    invalid?: boolean;
    defaultValue?: string;
}) {
    const [value, setValue] = useState(defaultValue ?? "");

    return (
        <RadioGroup
            value={value}
            onValueChange={setValue}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            className={cn(
                "grid gap-3 inline-full",
                columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
            )}
        >
            {options.map((option) => {
                const active = value === option.value;
                const id = `${name}-${option.value}`;
                const hasDescription = Boolean(option.description);
                return (
                    <Label
                        key={option.value}
                        htmlFor={id}
                        className={optionCardClassName(active, hasDescription, disabled)}
                    >
                        <RadioGroupItem
                            id={id}
                            value={option.value}
                            disabled={disabled}
                            className={cn(
                                RADIO_OPTION_ITEM_CLASS,
                                hasDescription && "mts-0.5",
                            )}
                        />
                        <span className="min-inline-0">
                            <span className="block text-sm leading-5 font-semibold">
                                {option.label}
                            </span>
                            {option.description ? (
                                <span className="mbs-1 block text-xs leading-4 text-ink-muted">
                                    {option.description}
                                </span>
                            ) : null}
                        </span>
                    </Label>
                );
            })}
        </RadioGroup>
    );
}

function StackDemo() {
    const [value, setValue] = useState("owner");

    return (
        <RadioGroup value={value} onValueChange={setValue} className="gap-3">
            {[
                { value: "owner", label: "Property owner" },
                { value: "builder", label: "Builder / developer" },
                { value: "broker", label: "Broker / agency" },
            ].map((option) => (
                <label
                    key={option.value}
                    htmlFor={`stack-${option.value}`}
                    className="flex items-center gap-3 min-block-10"
                >
                    <RadioGroupItem
                        id={`stack-${option.value}`}
                        value={option.value}
                        className="border-ink-subtle data-checked:bg-brand"
                    />
                    <span className="body-sm font-medium text-ink">{option.label}</span>
                </label>
            ))}
        </RadioGroup>
    );
}

function LiveListingDemo() {
    const [value, setValue] = useState("");
    const touched = value.length > 0;

    return (
        <div className="space-y-2 inline-full">
            <RadioGroup
                value={value}
                onValueChange={setValue}
                aria-invalid={!touched || undefined}
                className="grid grid-cols-2 gap-3"
            >
                {LISTING_TYPES.map((option) => {
                    const active = value === option.value;
                    const id = `live-${option.value}`;
                    return (
                        <Label
                            key={option.value}
                            htmlFor={id}
                            className={optionCardClassName(active, true)}
                        >
                            <RadioGroupItem
                                id={id}
                                value={option.value}
                                className={cn(RADIO_OPTION_ITEM_CLASS, "mts-0.5")}
                            />
                            <span className="min-inline-0">
                                <span className="block text-sm leading-5 font-semibold">
                                    {option.label}
                                </span>
                                <span className="mbs-1 block text-xs leading-4 text-ink-muted">
                                    {option.description}
                                </span>
                            </span>
                        </Label>
                    );
                })}
            </RadioGroup>
            <p
                role={!touched ? "alert" : undefined}
                className={cn("body-xs", !touched ? "text-danger" : "text-success")}
            >
                {!touched ? "Choose sale or rent to continue" : "Listing type locked in"}
            </p>
        </div>
    );
}

export function RadioThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Radio."
            description="base-ui Radio + RadioGroup, wrapped once in components/ui/radio-group.tsx. One exclusive choice from a short set. Compound API only — RadioGroup owns the value, RadioGroupItem is the control. Prefer option cards on mobile forms; a plain stack is fine for account-type and similar lists."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Layouts</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        The primitive is a fixed 16px circle. Layout belongs on the group or the
                        wrapping label — stack, grid, or option cards. Cards are the property-form
                        default because the whole tile is the tap target.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {RADIO_LAYOUTS.map((layout) => (
                            <Swatch key={layout.name} label={layout.label}>
                                {layout.name === "stack" ? (
                                    <StackDemo />
                                ) : layout.name === "grid" ? (
                                    <OptionCardGroup
                                        name="furnishing"
                                        options={FURNISHING}
                                        columns={3}
                                        defaultValue="semi"
                                    />
                                ) : (
                                    <OptionCardGroup
                                        name="listing"
                                        options={LISTING_TYPES}
                                        defaultValue="sale"
                                    />
                                )}
                                <p className="body-xs text-ink-subtle">{layout.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">States — live demo</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Pick a listing type. The message region follows real selection — the same
                        wiring a form uses with <code className="body-xs">aria-invalid</code> on
                        the group.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Listing type — validates on pick">
                            <LiveListingDemo />
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Static states</h2>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Swatch label="Disabled">
                            <OptionCardGroup
                                name="disabled-listing"
                                options={LISTING_TYPES}
                                defaultValue="rent"
                                disabled
                            />
                        </Swatch>
                        <Swatch label="Invalid · none selected">
                            <OptionCardGroup
                                name="invalid-listing"
                                options={LISTING_TYPES}
                                invalid
                            />
                        </Swatch>
                        <Swatch label="Preselected">
                            <OptionCardGroup
                                name="preselected-furnishing"
                                options={FURNISHING}
                                columns={3}
                                defaultValue="furnished"
                            />
                        </Swatch>
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Use Radio for one choice from a short exclusive set. Binary on/off is{" "}
                            <code className="body-xs">Switch</code>. Multi-select is Checkbox.
                        </li>
                        <li>
                            Keep the compound API —{" "}
                            <code className="body-xs">RadioGroup</code> +{" "}
                            <code className="body-xs">RadioGroupItem</code>. Do not invent a
                            standalone radio without a group.
                        </li>
                        <li>
                            Wrap each item in a <code className="body-xs">Label</code> (or native{" "}
                            <code className="body-xs">&lt;label&gt;</code>) so the whole row or
                            card is tappable — especially on phones.
                        </li>
                        <li>
                            Checked indicator fill is <code className="body-xs">brand</code>.
                            Selected option cards use{" "}
                            <code className="body-xs">border-brand</code> +{" "}
                            <code className="body-xs">bg-brand-soft</code>. Hover only changes
                            the border.
                        </li>
                        <li>
                            Put <code className="body-xs">aria-invalid</code> on the group when
                            the choice is required and empty — not on every item.
                        </li>
                        <li>
                            Circle geometry stays <code className="body-xs">rounded-full</code>.
                            Never restyle a radio into a square checkbox look.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
