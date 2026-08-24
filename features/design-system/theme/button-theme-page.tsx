"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { swapText } from "@/lib/motion/swap-text";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    BUTTON_ICON_SIZES,
    BUTTON_SIZES,
    BUTTON_VARIANTS,
} from "@/features/design-system/theme/button-tokens";

function Swatch({
    label,
    dark = false,
    children,
}: {
    label: string;
    dark?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-start gap-3 rounded-card border p-5",
                dark ? "border-transparent bg-brand-deep" : "border-border-warm bg-surface",
            )}
        >
            <p className={cn("eyebrow", dark && "text-highlight")}>{label}</p>
            {children}
        </div>
    );
}

export function ButtonThemePage() {
    const [demoLoading, setDemoLoading] = useState(false);
    const demoLabel = demoLoading ? "Saving" : "Save changes";
    const demoLabelRef = useRef<HTMLSpanElement>(null);
    const previousDemoLabel = useRef(demoLabel);

    function handleDemoClick() {
        setDemoLoading(true);
        window.setTimeout(() => setDemoLoading(false), 1800);
    }

    useLayoutEffect(() => {
        const element = demoLabelRef.current;
        if (!element) {
            return;
        }
        if (!element.textContent) {
            element.textContent = demoLabel;
            previousDemoLabel.current = demoLabel;
            return;
        }
        if (previousDemoLabel.current !== demoLabel) {
            swapText(element, demoLabel);
            previousDemoLabel.current = demoLabel;
        }
    }, [demoLabel]);

    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Button."
            description="One shadcn primitive, wrapped once in components/ui/button.tsx. Nine variants, five sizes, five icon sizes, loading state built in via the loading prop. See docs/DESIGN.md §4.3."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Variants</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Primary once per screen. Everything else is secondary, tertiary, or
                        destructive — never decorative.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {BUTTON_VARIANTS.map((v) => {
                            const dark = v.name === "highlight" || v.name === "highlight-outline";
                            return (
                                <Swatch key={v.name} label={v.label} dark={dark}>
                                    <Button variant={v.name}>{v.label}</Button>
                                    <p
                                        className={cn(
                                            "body-xs",
                                            dark ? "text-[#B8CFC4]" : "text-ink-subtle",
                                        )}
                                    >
                                        {v.note}
                                    </p>
                                </Swatch>
                            );
                        })}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        `md` is 44px (`control-lg`), the desktop tap-target. `lg` is 48px
                        (`control-xl`), the same height as input `lg`. xs/sm are dense contexts only
                        — tables, toolbars — never a primary mobile action.
                    </p>
                    <div
                        className="
                          mbs-4 flex flex-wrap items-end gap-4 rounded-card border
                          border-border-warm bg-surface p-5
                        "
                    >
                        {BUTTON_SIZES.map((s) => (
                            <div key={s.name} className="flex flex-col items-center gap-2">
                                <Button size={s.name}>{s.label}</Button>
                                <span className="body-xs text-ink-subtle">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Icon-only</h2>
                    <div
                        className="
                          mbs-4 flex flex-wrap items-end gap-4 rounded-card border
                          border-border-warm bg-surface p-5
                        "
                    >
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
                                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                    </svg>
                                </Button>
                                <span className="body-xs text-ink-subtle">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">States</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Rest, disabled, and loading, across the two variants that carry real weight
                        in the product.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(["default", "outline"] as const).map((variant) => (
                            <div
                                key={variant}
                                className="rounded-card border border-border-warm bg-surface p-5"
                            >
                                <p className="eyebrow">{variant}</p>
                                <div className="mbs-3 flex flex-wrap items-center gap-3">
                                    <div className="flex flex-col items-center gap-2">
                                        <Button variant={variant}>Rest</Button>
                                        <span className="body-xs text-ink-subtle">rest</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <Button variant={variant} disabled>
                                            Disabled
                                        </Button>
                                        <span className="body-xs text-ink-subtle">disabled</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <Button variant={variant} loading>
                                            Loading
                                        </Button>
                                        <span className="body-xs text-ink-subtle">loading</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Loading — live demo</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        <code className="body-xs">loading</code> disables the button, sets{" "}
                        <code className="body-xs">aria-busy</code>, and swaps in a spinner ahead of
                        the label. Label stays on screen — never replaced by the spinner alone, so
                        the action keeps its name through the flow per docs/DESIGN.md §7.
                    </p>
                    <div className="mbs-4 rounded-card border border-border-warm bg-surface p-5">
                        <Button onClick={handleDemoClick} loading={demoLoading}>
                            <span ref={demoLabelRef} className="t-text-swap" />
                        </Button>
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>One primary (`default`) button per screen. Never two.</li>
                        <li>
                            Label is sentence case, verb first, one to three words, no terminal
                            punctuation.
                        </li>
                        <li>
                            Pill-shaped via `rounded-control`. Never `rounded-md` or `rounded-lg`.
                        </li>
                        <li>
                            `lg` is 48px (`control-xl`), matching input `lg`. Use it on primary
                            mobile actions. Never a height override.
                        </li>
                        <li>
                            `loading` keeps the label, adds a spinner, and disables the control — it
                            never removes the label.
                        </li>
                        <li>
                            `highlight` / `highlight-outline` only sit on dark cards
                            (`brand-deep`/`brand-ink`), one per screen max — never on `canvas` or
                            `surface`.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
