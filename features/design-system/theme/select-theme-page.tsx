"use client";

import { useState } from "react";

import { Building2, MapPin } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { SELECT_SIZES } from "@/features/design-system/theme/select-tokens";

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

function LocalitySelect({
    size,
    startIcon,
    placeholder = "Choose locality",
    defaultValue = null,
    disabled,
    loading,
    success,
    errorText,
    helperText,
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
}) {
    return (
        <Select defaultValue={defaultValue}>
            <SelectTrigger
                size={size}
                startIcon={startIcon}
                disabled={disabled}
                loading={loading}
                success={success}
                errorText={errorText}
                helperText={helperText}
            >
                <SelectValue placeholder={placeholder}>
                    {(value) =>
                        LOCALITIES.find((option) => option.value === value)?.label ?? placeholder
                    }
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {LOCALITIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function ListingTypeDemo() {
    const [value, setValue] = useState<string | null>(null);
    const touched = value != null;
    const isValid = Boolean(value);

    return (
        <Select value={value} onValueChange={setValue}>
            <SelectTrigger
                startIcon={Building2}
                success={touched && isValid}
                errorText={touched && !isValid ? "Choose a listing type" : undefined}
                helperText={!touched ? "Sale or rent — this drives the rest of the form" : undefined}
            >
                <SelectValue placeholder="Listing type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="sale">For sale</SelectItem>
                <SelectItem value="rent">For rent</SelectItem>
            </SelectContent>
        </Select>
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
        <Select value={value} onValueChange={handleChange}>
            <SelectTrigger
                startIcon={MapPin}
                loading={loading}
                helperText={loading ? "Checking availability" : "Checked against your service areas"}
            >
                <SelectValue placeholder="Service area" />
            </SelectTrigger>
            <SelectContent>
                {LOCALITIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function SelectThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Select."
            description="One base-ui primitive, wrapped once in components/ui/select.tsx. Trigger shares Input's compact rounded-control corners, five control-height steps, start icon, loading spinner, and error/success message region. The popup uses the same t-dropdown origin scale as menus, on surface with shadow-lg — never a dark glass overlay."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Same five steps as buttons and inputs, from{" "}
                        <code className="body-xs">block-control-xs</code> through{" "}
                        <code className="body-xs">block-control-xl</code>. Default is 36px.{" "}
                        <code className="body-xs">md</code> is 44px (desktop tap-target).{" "}
                        <code className="body-xs">lg</code> is 48px — use it on primary mobile
                        forms, next to an Input of the same size.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {SELECT_SIZES.map((s) => (
                            <Swatch key={s.name} label={s.label}>
                                <LocalitySelect size={s.name} placeholder="Property type" />
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
                        Input and Button. Never put a second end icon on a select.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Start icon">
                            <LocalitySelect startIcon={MapPin} placeholder="Locality" />
                        </Swatch>
                        <Swatch label="Start icon · preselected">
                            <LocalitySelect
                                startIcon={MapPin}
                                defaultValue="vesu"
                                placeholder="Locality"
                            />
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Groups</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Use <code className="body-xs">SelectGroup</code> and{" "}
                        <code className="body-xs">SelectLabel</code> when options naturally cluster
                        — property type, area unit — not as decoration on a short list.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Grouped options">
                            <Select defaultValue={null}>
                                <SelectTrigger startIcon={Building2}>
                                    <SelectValue placeholder="Property type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Residential</SelectLabel>
                                        <SelectItem value="apartment">Apartment</SelectItem>
                                        <SelectItem value="villa">Villa</SelectItem>
                                        <SelectItem value="plot">Plot</SelectItem>
                                    </SelectGroup>
                                    <SelectSeparator />
                                    <SelectGroup>
                                        <SelectLabel>Commercial</SelectLabel>
                                        <SelectItem value="office">Office</SelectItem>
                                        <SelectItem value="shop">Shop</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
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
                            <LocalitySelect disabled defaultValue="vesu" />
                        </Swatch>
                        <Swatch label="Error">
                            <LocalitySelect errorText="Choose a locality to continue" />
                        </Swatch>
                        <Swatch label="Success">
                            <LocalitySelect
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
                            Pass <code className="body-xs">errorText</code> on the trigger rather
                            than setting <code className="body-xs">aria-invalid</code> by hand — it
                            drives the border, the ring, the shake, and the message region together.
                        </li>
                        <li>
                            <code className="body-xs">success</code> is suppressed whenever the
                            field is also invalid — never show both signals on one field.
                        </li>
                        <li>
                            <code className="body-xs">loading</code> disables the trigger and swaps
                            the chevron for the same Tailspin as Input and Button.
                        </li>
                        <li>
                            Keep the compound API —{" "}
                            <code className="body-xs">Select / Trigger / Content / Item</code>. Do
                            not flatten a long option list into a native{" "}
                            <code className="body-xs">&lt;select&gt;</code>.
                        </li>
                        <li>
                            Popup is <code className="body-xs">bg-surface</code> +{" "}
                            <code className="body-xs">shadow-lg</code>, origin-aware via{" "}
                            <code className="body-xs">t-dropdown</code>. Never a dark translucent
                            overlay on this product.
                        </li>
                        <li>
                            Standard 12px corners via <code className="body-xs">rounded-control</code>{" "}
                            on the trigger, <code className="body-xs">rounded-card</code> on the
                            popup. Never override radius at the call site.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
