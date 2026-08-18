"use client";

import { useState } from "react";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    BUTTON_ICON_SIZES,
    BUTTON_SIZES,
    BUTTON_VARIANTS,
} from "@/features/design-system/theme/button-tokens";
import { Button } from "@/components/ui/button";

function Swatch({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card border border-border-warm bg-surface p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                {label}
            </p>
            {children}
        </div>
    );
}

export function ButtonThemePage() {
    const [demoLoading, setDemoLoading] = useState(false);

    function handleDemoClick() {
        setDemoLoading(true);
        window.setTimeout(() => setDemoLoading(false), 1800);
    }

    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Button."
            description="One shadcn primitive, wrapped once in components/ui/button.tsx. Six variants, four sizes, four icon sizes, loading state built in via the loading prop. See docs/DESIGN.md §4.3."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                        Variants
                    </h2>
                    <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                        Primary once per screen. Everything else is secondary, tertiary, or
                        destructive — never decorative.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {BUTTON_VARIANTS.map((v) => (
                            <Swatch key={v.name} label={v.label}>
                                <Button variant={v.name}>{v.label}</Button>
                                <p className="text-[12px] leading-[1.4] text-ink-subtle">
                                    {v.note}
                                </p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                        Sizes
                    </h2>
                    <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                        Default and lg meet the 44px/48px minimum tap target. xs/sm are dense
                        contexts only — tables, toolbars — never a primary mobile action.
                    </p>
                    <div className="mt-4 flex flex-wrap items-end gap-4 rounded-card border border-border-warm bg-surface p-5">
                        {BUTTON_SIZES.map((s) => (
                            <div key={s.name} className="flex flex-col items-center gap-2">
                                <Button size={s.name}>{s.label}</Button>
                                <span className="text-[11px] text-ink-subtle">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                        Icon-only
                    </h2>
                    <div className="mt-4 flex flex-wrap items-end gap-4 rounded-card border border-border-warm bg-surface p-5">
                        {BUTTON_ICON_SIZES.map((s) => (
                            <div key={s.name} className="flex flex-col items-center gap-2">
                                <Button size={s.name} aria-label={s.label}>
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M12 5v14M5 12h14"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </Button>
                                <span className="text-[11px] text-ink-subtle">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                        States
                    </h2>
                    <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                        Rest, disabled, and loading, across the two variants that carry real
                        weight in the product.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(["default", "outline"] as const).map((variant) => (
                            <div
                                key={variant}
                                className="rounded-card border border-border-warm bg-surface p-5"
                            >
                                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                                    {variant}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <div className="flex flex-col items-center gap-2">
                                        <Button variant={variant}>Rest</Button>
                                        <span className="text-[11px] text-ink-subtle">rest</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <Button variant={variant} disabled>
                                            Disabled
                                        </Button>
                                        <span className="text-[11px] text-ink-subtle">
                                            disabled
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <Button variant={variant} loading>
                                            Loading
                                        </Button>
                                        <span className="text-[11px] text-ink-subtle">
                                            loading
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                        Loading — live demo
                    </h2>
                    <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                        <code className="text-[12px]">loading</code> disables the button, sets{" "}
                        <code className="text-[12px]">aria-busy</code>, and swaps in a spinner
                        ahead of the label. Label stays on screen — never replaced by the
                        spinner alone, so the action keeps its name through the flow per
                        docs/DESIGN.md §7.
                    </p>
                    <div className="mt-4 rounded-card border border-border-warm bg-surface p-5">
                        <Button onClick={handleDemoClick} loading={demoLoading}>
                            {demoLoading ? "Saving" : "Save changes"}
                        </Button>
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-highlight">
                        Rules
                    </p>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-[13px] leading-[1.45] text-[#B8CFC4]">
                        <li>One primary (`default`) button per screen. Never two.</li>
                        <li>Label is sentence case, verb first, one to three words, no terminal punctuation.</li>
                        <li>Pill-shaped via `rounded-control`. Never `rounded-md` or `rounded-lg`.</li>
                        <li>Minimum tap target 44px desktop, 48px mobile — use `size=&quot;lg&quot;` on primary mobile actions.</li>
                        <li>`loading` keeps the label, adds a spinner, and disables the control — it never removes the label.</li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
