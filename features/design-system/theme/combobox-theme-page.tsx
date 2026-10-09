"use client";

import { useState } from "react";

import { Building2, MapPin } from "lucide-react";

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

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { COMBOBOX_SIZES } from "@/features/design-system/theme/combobox-tokens";

const LOCALITIES = [
    { value: "vesu", label: "Vesu" },
    { value: "adajan", label: "Adajan" },
    { value: "pal", label: "Pal" },
    { value: "citylight", label: "Citylight" },
    { value: "athwa", label: "Athwa" },
] as const;

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

const LOCALITY_VALUES = LOCALITIES.map((option) => option.value);

function localityLabel(value: string) {
    return LOCALITIES.find((option) => option.value === value)?.label ?? value;
}

function LocalityCombobox({
    size,
    startIcon,
    placeholder = "Choose locality",
    defaultValue = null,
    disabled,
    loading,
    success,
    errorText,
    helperText,
    showClear,
}: {
    size?: "xs" | "sm" | "default" | "md" | "lg";
    startIcon?: typeof MapPin;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    success?: boolean;
    errorText?: string;
    helperText?: string;
    defaultValue?: string | null;
    showClear?: boolean;
}) {
    return (
        <Combobox
            defaultValue={defaultValue}
            items={[...LOCALITY_VALUES]}
            itemToStringLabel={localityLabel}
            disabled={disabled}
        >
            <ComboboxInput
                size={size}
                startIcon={startIcon}
                disabled={disabled}
                loading={loading}
                success={success}
                errorText={errorText}
                helperText={helperText}
                placeholder={placeholder}
                showClear={showClear}
            />
            <ComboboxContent>
                <ComboboxEmpty>No locality matches</ComboboxEmpty>
                <ComboboxList>
                    {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                            {localityLabel(item)}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}

function ListingTypeDemo() {
    const [value, setValue] = useState<string | null>(null);
    const touched = value != null;
    const isValid = Boolean(value);

    return (
        <Combobox value={value} onValueChange={setValue} items={["sale", "rent"]}>
            <ComboboxInput
                startIcon={Building2}
                placeholder="Listing type"
                success={touched && isValid}
                errorText={touched && !isValid ? "Choose a listing type" : undefined}
                helperText={!touched ? "Sale or rent — this drives the rest of the form" : undefined}
            />
            <ComboboxContent>
                <ComboboxList>
                    <ComboboxItem value="sale">For sale</ComboboxItem>
                    <ComboboxItem value="rent">For rent</ComboboxItem>
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}

function LoadingDemo() {
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState<string | null>(null);

    function handleChange(next: string | null) {
        setValue(next);
        setLoading(true);
        window.setTimeout(() => setLoading(false), 1200);
    }

    return (
        <Combobox
            value={value}
            onValueChange={handleChange}
            items={[...LOCALITY_VALUES]}
            itemToStringLabel={localityLabel}
        >
            <ComboboxInput
                startIcon={MapPin}
                loading={loading}
                placeholder="Service area"
                helperText={loading ? "Checking availability" : "Checked against your service areas"}
            />
            <ComboboxContent>
                <ComboboxEmpty>No locality matches</ComboboxEmpty>
                <ComboboxList>
                    {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                            {localityLabel(item)}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}

export function ComboboxThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Combobox."
            description="One base-ui primitive, wrapped once in components/ui/combobox.tsx. Filterable cousin of Select — same rounded-control trigger, five control-height steps, start icon, loading spinner, and error/success message region. Type to filter; chevron still owns the end slot. Popup matches Select: t-dropdown origin scale, surface + shadow-lg — never a dark glass overlay."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Same five steps as Select, Input, and Button, from{" "}
                        <code className="body-xs">block-control-xs</code> through{" "}
                        <code className="body-xs">block-control-xl</code>. Default is 36px.{" "}
                        <code className="body-xs">md</code> is 44px (desktop tap-target).{" "}
                        <code className="body-xs">lg</code> is 48px — use it on primary mobile
                        forms, next to an Input or Select of the same size.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {COMBOBOX_SIZES.map((s) => (
                            <Swatch key={s.name} label={s.label}>
                                <LocalityCombobox size={s.name} placeholder="Property type" />
                                <p className="body-xs text-ink-subtle">{s.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Icon slot</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        <code className="body-xs">startIcon</code> accepts any Lucide icon. The
                        chevron always owns the end slot — loading swaps it for the same Tailspin as
                        Select, Input, and Button. Optional{" "}
                        <code className="body-xs">showClear</code> sits before the chevron.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Start icon">
                            <LocalityCombobox startIcon={MapPin} placeholder="Locality" />
                        </Swatch>
                        <Swatch label="Start icon · preselected · clear">
                            <LocalityCombobox
                                startIcon={MapPin}
                                defaultValue="vesu"
                                placeholder="Locality"
                                showClear
                            />
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Groups</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Use <code className="body-xs">ComboboxGroup</code> and{" "}
                        <code className="body-xs">ComboboxLabel</code> when options naturally cluster
                        — same anatomy as Select groups. Type to filter across groups.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Grouped options">
                            <Combobox defaultValue={null}>
                                <ComboboxInput startIcon={Building2} placeholder="Property type" />
                                <ComboboxContent>
                                    <ComboboxEmpty>No type matches</ComboboxEmpty>
                                    <ComboboxList>
                                        <ComboboxGroup>
                                            <ComboboxLabel>Residential</ComboboxLabel>
                                            <ComboboxItem value="apartment">Apartment</ComboboxItem>
                                            <ComboboxItem value="villa">Villa</ComboboxItem>
                                            <ComboboxItem value="plot">Plot</ComboboxItem>
                                        </ComboboxGroup>
                                        <ComboboxSeparator />
                                        <ComboboxGroup>
                                            <ComboboxLabel>Commercial</ComboboxLabel>
                                            <ComboboxItem value="office">Office</ComboboxItem>
                                            <ComboboxItem value="shop">Shop</ComboboxItem>
                                        </ComboboxGroup>
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">States — live demo</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Pick a value. Error and success read{" "}
                        <code className="body-xs">aria-invalid</code> /{" "}
                        <code className="body-xs">data-success</code> off real selection, not a
                        hardcoded prop — the same wiring a form would use.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Swatch label="Listing type — validates on pick">
                            <ListingTypeDemo />
                        </Swatch>
                        <Swatch label="Loading — async check">
                            <LoadingDemo />
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Static states</h2>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Swatch label="Disabled">
                            <LocalityCombobox disabled defaultValue="vesu" />
                        </Swatch>
                        <Swatch label="Error">
                            <LocalityCombobox errorText="Choose a locality to continue" />
                        </Swatch>
                        <Swatch label="Success">
                            <LocalityCombobox
                                defaultValue="vesu"
                                success
                                helperText="In your service area"
                            />
                        </Swatch>
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Use Combobox when the list is long enough to benefit from typing.
                            Short exclusive sets stay on Select or Radio.
                        </li>
                        <li>
                            Pass <code className="body-xs">errorText</code> on the input rather
                            than setting <code className="body-xs">aria-invalid</code> by hand — it
                            drives the border, the ring, the shake, and the message region together.
                        </li>
                        <li>
                            <code className="body-xs">success</code> is suppressed whenever the
                            field is also invalid — never show both signals on one field.
                        </li>
                        <li>
                            <code className="body-xs">loading</code> disables the field and swaps
                            the chevron for the same Tailspin as Select, Input, and Button.
                        </li>
                        <li>
                            Keep the compound API —{" "}
                            <code className="body-xs">
                                Combobox / Input / Content / List / Item
                            </code>
                            . Items match Select option styling exactly.
                        </li>
                        <li>
                            Popup is <code className="body-xs">bg-surface</code> +{" "}
                            <code className="body-xs">shadow-lg</code>, origin-aware via{" "}
                            <code className="body-xs">t-dropdown</code>. Never a dark translucent
                            overlay on this product.
                        </li>
                        <li>
                            Standard 12px corners via <code className="body-xs">rounded-control</code>{" "}
                            on the input, <code className="body-xs">rounded-card</code> on the
                            popup. Never override radius at the call site.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
