"use client";

import { useState } from "react";

import { CallIcon, Mail01Icon, Search01Icon, UserIcon } from "@hugeicons/core-free-icons";

import { Input } from "@/components/ui/input";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { INPUT_SIZES } from "@/features/design-system/theme/input-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div
            className="
              flex flex-col items-start gap-3 rounded-card border border-border-warm bg-surface p-5
            "
        >
            <p className="text-[11px] font-medium tracking-[0.08em] text-ink-subtle uppercase">
                {label}
            </p>
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
            startIcon={Mail01Icon}
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
            startIcon={Search01Icon}
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
            startIcon={UserIcon}
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
            description="One base-ui primitive, wrapped once in components/ui/input.tsx. Three sizes, icon slots on either edge, a built-in password toggle, clearable, loading, and error/success states — all sharing the same aria-invalid and data-success wiring so a form only sets props, never inline styles."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                        Sizes
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        Default meets the 44px desktop minimum. Use{" "}
                        <code className="text-[12px]">size=&quot;lg&quot;</code> for the primary
                        mobile form — it clears the 48px tap-target floor.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {INPUT_SIZES.map((s) => (
                            <Swatch key={s.name} label={s.label}>
                                <Input size={s.name} placeholder="Property title" />
                                <p className="text-[12px] leading-[1.4] text-ink-subtle">
                                    {s.note}
                                </p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                        Icon slots
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        <code className="text-[12px]">startIcon</code> and{" "}
                        <code className="text-[12px]">endIcon</code> accept any Hugeicons free icon.
                        Only one end affordance shows at a time — loading, success, clear, and the
                        password toggle all claim that slot automatically and take priority over a
                        plain <code className="text-[12px]">endIcon</code>.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Swatch label="Start icon">
                            <Input startIcon={UserIcon} placeholder="Full name" />
                        </Swatch>
                        <Swatch label="Start + end icon">
                            <Input
                                startIcon={CallIcon}
                                endIcon={Search01Icon}
                                placeholder="+91 98765 43210"
                            />
                        </Swatch>
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                        States — live demo
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        Type in each field. Error and success read{" "}
                        <code className="text-[12px]">aria-invalid</code> /{" "}
                        <code className="text-[12px]">data-success</code> off real validation, not a
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
                    <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                        Static states
                    </h2>
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
                    <p
                        className="
                          text-[11px] font-medium tracking-[0.08em] text-highlight uppercase
                        "
                    >
                        Rules
                    </p>
                    <ul
                        className="
                          mbs-3 list-disc space-y-2 ps-5 text-[13px] leading-[1.45] text-[#B8CFC4]
                        "
                    >
                        <li>
                            Pass <code className="text-[12px]">errorText</code> rather than setting{" "}
                            <code className="text-[12px]">aria-invalid</code> by hand — it drives
                            the border, the ring, the inline alert icon, and the message region
                            together.
                        </li>
                        <li>
                            <code className="text-[12px]">success</code> is suppressed whenever the
                            field is also invalid — never show both signals on one field.
                        </li>
                        <li>
                            <code className="text-[12px]">loading</code> disables the field and
                            swaps the end slot for the same Tailspin spinner as the button, so the
                            two never disagree.
                        </li>
                        <li>
                            Helper and error text share one region and cross-fade via{" "}
                            <code className="text-[12px]">AnimatePresence</code> — never stack both
                            at once.
                        </li>
                        <li>
                            14px radius via `rounded-inner`, matching inset image containers per
                            docs/DESIGN.md §3.2.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
