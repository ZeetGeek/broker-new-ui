"use client";

import { useState } from "react";

import { Mail, Phone, Search, User } from "lucide-react";

import { Input } from "@/components/ui/input";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { INPUT_SIZES } from "@/features/design-system/theme/input-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function EmailDemo() {
    const [value, setValue] = useState("");
    const touched = value.length > 0;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    return (
        <Input
            startIcon={Mail}
            placeholder="you@example.com"
            value={value}
            onValueChange={setValue}
            success={touched && isValid}
            errorText={touched && !isValid ? "Enter a valid email address" : undefined}
            helperText={!touched ? "We'll send the approval link here" : undefined}
        />
    );
}

function PasswordDemo() {
    const [value, setValue] = useState("");
    return (
        <Input
            type="password"
            placeholder="Enter password"
            value={value}
            onValueChange={setValue}
            helperText="Minimum 8 characters"
        />
    );
}

function ClearableDemo() {
    const [value, setValue] = useState("Vesu, Surat");
    return (
        <Input
            startIcon={Search}
            clearable
            placeholder="Search locality"
            value={value}
            onValueChange={setValue}
        />
    );
}

function LoadingDemo() {
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState("");

    function handleChange(next: string) {
        setValue(next);
        setLoading(true);
        window.setTimeout(() => setLoading(false), 1200);
    }

    return (
        <Input
            startIcon={User}
            placeholder="Broker name"
            value={value}
            onValueChange={handleChange}
            loading={loading}
            helperText={loading ? "Checking availability" : "Checked against your team"}
        />
    );
}

export function InputThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Input."
            description="One base-ui primitive, wrapped once in components/ui/input.tsx. Pill-shaped like buttons via rounded-control. Three sizes, icon slots on either edge, a built-in password toggle, clearable, loading, and error/success states — all sharing the same aria-invalid and data-success wiring so a form only sets props, never inline styles."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Default is 36px, same as button default. Use{" "}
                        <code className="body-xs">size=&quot;lg&quot;</code> for the primary mobile
                        form — 48px, matching button <code className="body-xs">lg</code>.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {INPUT_SIZES.map((s) => (
                            <Swatch key={s.name} label={s.label}>
                                <Input size={s.name} placeholder="Property title" />
                                <p className="body-xs text-ink-subtle">{s.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Icon slots</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        <code className="body-xs">startIcon</code> and{" "}
                        <code className="body-xs">endIcon</code> accept any Lucide icon. Only one
                        end affordance shows at a time — loading, success, clear, and the password
                        toggle all claim that slot automatically and take priority over a plain{" "}
                        <code className="body-xs">endIcon</code>.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Start icon">
                            <Input startIcon={User} placeholder="Full name" />
                        </Swatch>
                        <Swatch label="Start + end icon">
                            <Input
                                startIcon={Phone}
                                endIcon={Search}
                                placeholder="+91 98765 43210"
                            />
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">States — live demo</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Type in each field. Error and success read{" "}
                        <code className="body-xs">aria-invalid</code> /{" "}
                        <code className="body-xs">data-success</code> off real validation, not a
                        hardcoded prop — the same wiring a form would use.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Swatch label="Email — validates as you type">
                            <EmailDemo />
                        </Swatch>
                        <Swatch label="Password — reveal toggle">
                            <PasswordDemo />
                        </Swatch>
                        <Swatch label="Clearable — search">
                            <ClearableDemo />
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
                            <Input
                                disabled
                                placeholder="Locked field"
                                defaultValue="Not editable"
                            />
                        </Swatch>
                        <Swatch label="Error">
                            <Input
                                defaultValue="395"
                                errorText="PIN code must be 6 digits"
                                aria-invalid
                            />
                        </Swatch>
                        <Swatch label="Success">
                            <Input defaultValue="395007" success helperText="Valid PIN code" />
                        </Swatch>
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Pass <code className="body-xs">errorText</code> rather than setting{" "}
                            <code className="body-xs">aria-invalid</code> by hand — it drives the
                            border, the ring, the inline alert icon, and the message region
                            together.
                        </li>
                        <li>
                            <code className="body-xs">success</code> is suppressed whenever the
                            field is also invalid — never show both signals on one field.
                        </li>
                        <li>
                            <code className="body-xs">loading</code> disables the field and swaps
                            the end slot for the same Tailspin spinner as the button, so the two
                            never disagree.
                        </li>
                        <li>
                            Helper and error text share one region and cross-fade via{" "}
                            <code className="body-xs">AnimatePresence</code> — never stack both at
                            once.
                        </li>
                        <li>
                            Pill-shaped via `rounded-control`, same as buttons and badges. Never
                            `rounded-md`, `rounded-lg`, or `rounded-inner` on a field.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
