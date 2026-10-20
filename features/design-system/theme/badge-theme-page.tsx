"use client";

import { BadgeCheck } from "@/components/shared/icons";

import { Badge } from "@/components/ui/badge";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { BADGE_COLOR_SWATCHES } from "@/features/design-system/theme/badge-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

export function BadgeThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Badges."
            description="One pill. Flat Tailwind fill (200), darker text (700), 6px dot (600). Set color, or pass customColor for a one-off."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Colors</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        <code className="body-xs">color</code> picks a Tailwind hue. Default is{" "}
                        <code className="body-xs">stone</code>. Fill 200, text 700, dot 600.
                    </p>
                    <div className="mbs-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {BADGE_COLOR_SWATCHES.map((swatch) => (
                            <Swatch key={swatch.name} label={swatch.label}>
                                <div
                                    className="
                                      flex items-center justify-center inline-full min-block-10
                                    "
                                >
                                    <Badge color={swatch.name}>{swatch.sample}</Badge>
                                </div>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Use</h2>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Swatch label="Pipeline row">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Badge color="sky">New</Badge>
                                <Badge color="orange">For rent</Badge>
                                <Badge color="violet">Contacted</Badge>
                                <Badge color="emerald">For sale</Badge>
                            </div>
                        </Swatch>
                        <Swatch label="With icon">
                            <Badge color="emerald" className="gap-1.5">
                                <BadgeCheck
                                    aria-hidden
                                    className="block-3 inline-3"
                                    strokeWidth={2.5}
                                />
                                Verified
                            </Badge>
                        </Swatch>
                        <Swatch label="Blur on a photo">
                            <div
                                className="
                                  relative flex flex-wrap items-center gap-1.5 overflow-hidden
                                  rounded-inner bg-linear-to-br from-brand-deep via-violet-700
                                  to-amber-300 p-4
                                "
                            >
                                <Badge color="orange" blur="dark">
                                    For rent
                                </Badge>
                                <Badge color="lime" blur="dark">
                                    New
                                </Badge>
                                <Badge color="emerald" blur="dark">
                                    For sale
                                </Badge>
                            </div>
                        </Swatch>
                        <Swatch label="Custom color">
                            <Badge
                                customColor={{
                                    bg: "#FCE7F3",
                                    text: "#BE185D",
                                    dot: "#DB2777",
                                }}
                            >
                                Custom
                            </Badge>
                            <p className="body-xs text-ink-subtle">
                                <code className="body-xs">customColor</code> takes bg, text, and
                                dot. Any CSS colour.
                            </p>
                        </Swatch>
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Use <code className="body-xs">Badge</code> from{" "}
                            <code className="body-xs">components/ui/badge.tsx</code>. One recipe. No
                            gradient, no border, no shadow.
                        </li>
                        <li>
                            Pill: <code className="body-xs">rounded-full</code>,{" "}
                            <code className="body-xs">px-2.5 py-1</code>, 12px semibold, 6px leading
                            dot.
                        </li>
                        <li>
                            Preset hues via <code className="body-xs">color</code>. One-off via{" "}
                            <code className="body-xs">customColor</code>.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
