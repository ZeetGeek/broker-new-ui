import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { ShadowCard } from "@/features/design-system/theme/shadow-card";
import { SHADOW_TOKENS } from "@/features/design-system/theme/shadow-tokens";

export function ShadowThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Theme"
            title="Shadows."
            description="Five smooth elevation steps, ink-tinted and layered, low opacity by design. Secondary to surface contrast, never a replacement for it. See docs/DESIGN.md §3.3."
        >
            <div className="space-y-10">
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {SHADOW_TOKENS.map((token) => (
                        <ShadowCard key={token.variable} token={token} />
                    ))}
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">When to use which</p>
                    <div className="mbs-4 space-y-3">
                        {[
                            {
                                step: "xs / sm",
                                rule: "Default. Resting cards and inputs on canvas — the contrast is doing most of the work already.",
                            },
                            {
                                step: "md",
                                rule: "Hover or press feedback on something that was already at sm.",
                            },
                            {
                                step: "lg / xl",
                                rule: "Content that floats above the page — dropdowns, popovers, modals, sheets. Never a resting card.",
                            },
                        ].map((row) => (
                            <div
                                key={row.step}
                                className="flex flex-col gap-1 sm:flex-row sm:gap-4"
                            >
                                <span className="body-sm shrink-0 font-medium text-white inline-24">
                                    {row.step}
                                </span>
                                <span className="body-sm text-[#B8CFC4]">{row.rule}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-card border border-border-warm bg-surface p-5 md:p-6">
                    <p className="eyebrow">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-ink-muted">
                        <li>
                            Ink-tinted, never pure black — matches the rest of the neutral system.
                        </li>
                        <li>Two layers per step: a tight near shadow plus a soft diffuse one.</li>
                        <li>Never stack more than one shadow step on the same element.</li>
                        <li>
                            Dark attention cards (brand-deep, brand-ink) never carry a shadow — they
                            separate through fill contrast alone.
                        </li>
                        <li>
                            The focus ring is a separate, non-elevation box-shadow and is not part
                            of this scale.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
