import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    BODY_SCALE,
    HEADING_SCALE,
    SPECIAL_SCALE,
} from "@/features/design-system/theme/type-scale";
import { TypeScaleRow } from "@/features/design-system/theme/type-scale-row";

export function TypographyThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Theme"
            title="Typography."
            description="Bricolage Grotesque for headings, DM Sans for everything else. Tight tracking on display sizes, tabular figures on every number. See docs/DESIGN.md §2 for the full rules."
        >
            <div className="space-y-10">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-card border border-border-warm bg-surface p-5 md:p-6">
                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                            Display — headings
                        </p>
                        <p className="mt-3 font-display text-[36px] font-bold leading-[1.02] tracking-[-0.03em] text-ink">
                            Bricolage Grotesque
                        </p>
                        <code className="mt-2 block text-[13px] text-ink-muted">
                            --font-display · font-display
                        </code>
                        <p className="mt-2 text-[13px] leading-[1.45] text-ink-muted">
                            h1–h6 only. Loose tracking at 52px reads as a fallback font — tight
                            tracking is what makes it look intentional.
                        </p>
                    </div>
                    <div className="rounded-card border border-border-warm bg-surface p-5 md:p-6">
                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                            Body — everything else
                        </p>
                        <p className="mt-3 font-sans text-[28px] leading-[1.15] text-ink">
                            DM Sans
                        </p>
                        <code className="mt-2 block text-[13px] text-ink-muted">
                            --font-sans · font-sans
                        </code>
                        <p className="mt-2 text-[13px] leading-[1.45] text-ink-muted">
                            Paragraphs, labels, buttons, inputs. Prices, areas, and table columns
                            use tabular figures so they align in a column.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[22px]">
                        Headings
                    </h2>
                    <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                        h1–h6, Bricolage Grotesque. Mobile size first, desktop size after the md:
                        breakpoint. Weight and tracking taper as the level drops — h5 and h6 lean
                        on weight rather than size to stay distinct from body text.
                    </p>
                    <div className="mt-4 rounded-card border border-border-warm bg-surface px-5 md:px-6">
                        {HEADING_SCALE.map((step) => (
                            <TypeScaleRow key={step.token} step={step} />
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[22px]">
                        Body text
                    </h2>
                    <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                        text-lg through text-xs, DM Sans. text-base is the default paragraph
                        size — 15px on mobile so it stays readable on a cheap Android screen,
                        16px on desktop.
                    </p>
                    <div className="mt-4 rounded-card border border-border-warm bg-surface px-5 md:px-6">
                        {BODY_SCALE.map((step) => (
                            <TypeScaleRow key={step.token} step={step} />
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[22px]">
                        Special cases
                    </h2>
                    <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                        Display sits above h1 for hero numbers only. Eyebrow is the one place
                        uppercase is allowed — everything else in the interface is sentence case.
                    </p>
                    <div className="mt-4 rounded-card border border-border-warm bg-surface px-5 md:px-6">
                        {SPECIAL_SCALE.map((step) => (
                            <TypeScaleRow key={step.token} step={step} />
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[22px]">
                        The two-tone headline
                    </h2>
                    <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                        The signature element. First clause states the fact in ink, second
                        states what it means in ink-muted — same size, same weight. Used on every
                        top-level screen. Both clauses end with a full stop.
                    </p>
                    <div className="mt-4 rounded-card bg-brand-deep p-6 md:p-8">
                        <h3 className="font-display text-[28px] font-bold leading-[1.08] tracking-[-0.02em] text-white md:text-[40px]">
                            <span>34 listings.</span>{" "}
                            <span className="text-[#B8CFC4]">₹24.8 Cr on the market.</span>
                        </h3>
                    </div>
                </section>

                <section>
                    <h2 className="font-display text-[20px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[22px]">
                        Tabular figures
                    </h2>
                    <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                        Without <code className="text-ink">.tabular</code>, a column of rupee
                        figures jitters against itself. With it, digits share fixed width.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-card border border-border-warm bg-surface p-5">
                            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                                Without tabular
                            </p>
                            <ul className="mt-3 space-y-2 text-[16px] text-ink">
                                <li className="flex justify-between">
                                    <span>7 Marina Gate #1204</span>
                                    <span>₹689k</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>212 Fern Ave</span>
                                    <span>₹975k</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>4128 Alder Court</span>
                                    <span>₹1.24M</span>
                                </li>
                            </ul>
                        </div>
                        <div className="rounded-card border border-border-warm bg-surface p-5">
                            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                                With tabular
                            </p>
                            <ul className="tabular mt-3 space-y-2 text-[16px] text-ink">
                                <li className="flex justify-between">
                                    <span>7 Marina Gate #1204</span>
                                    <span className="text-brand">₹85 L</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>212 Fern Ave</span>
                                    <span className="text-brand">₹97.5 L</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>4128 Alder Court</span>
                                    <span className="text-brand">₹1.24 Cr</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </DesignSystemShell>
    );
}
