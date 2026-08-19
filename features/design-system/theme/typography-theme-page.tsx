import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    BODY_SCALE,
    DISPLAY_SCALE,
    HEADING_SCALE,
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
                        <p
                            className="
                              text-[11px] font-medium tracking-[0.08em] text-ink-subtle uppercase
                            "
                        >
                            Display — headings
                        </p>
                        <p
                            className="
                              mbs-3 font-display text-[36px] leading-[1.02] font-bold
                              tracking-[-0.03em] text-ink
                            "
                        >
                            Bricolage Grotesque
                        </p>
                        <code className="mbs-2 block text-[13px] text-ink-muted">
                            --font-display · font-display
                        </code>
                        <p className="mbs-2 text-[13px] leading-[1.45] text-ink-muted">
                            h1–h6 only. Loose tracking at 52px reads as a fallback font — tight
                            tracking is what makes it look intentional.
                        </p>
                    </div>
                    <div className="rounded-card border border-border-warm bg-surface p-5 md:p-6">
                        <p
                            className="
                              text-[11px] font-medium tracking-[0.08em] text-ink-subtle uppercase
                            "
                        >
                            Body — everything else
                        </p>
                        <p className="mbs-3 font-sans text-[28px] leading-[1.15] text-ink">
                            DM Sans
                        </p>
                        <code className="mbs-2 block text-[13px] text-ink-muted">
                            --font-sans · font-sans
                        </code>
                        <p className="mbs-2 text-[13px] leading-[1.45] text-ink-muted">
                            Paragraphs, labels, buttons, inputs. Prices, areas, and table columns
                            use tabular figures so they align in a column.
                        </p>
                    </div>
                </section>

                <section>
                    <h2
                        className="
                          font-display text-[20px] leading-[1.15] font-semibold tracking-tight
                          text-ink
                          md:text-[22px]
                        "
                    >
                        Display
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        display-1 through display-3, Bricolage Grotesque. Bigger than h1 — hero
                        numbers, marketing moments, anything that needs to read before the rest of
                        the page.
                    </p>
                    <div
                        className="
                          mbs-4 rounded-card border border-border-warm bg-surface px-5
                          md:px-6
                        "
                    >
                        {DISPLAY_SCALE.map((step) => (
                            <TypeScaleRow key={step.token} step={step} />
                        ))}
                    </div>
                </section>

                <section>
                    <h2
                        className="
                          font-display text-[20px] leading-[1.15] font-semibold tracking-tight
                          text-ink
                          md:text-[22px]
                        "
                    >
                        Headings
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        h1–h6, Bricolage Grotesque. Mobile size first, desktop size after the md:
                        breakpoint. Weight and tracking taper as the level drops — h5 and h6 lean on
                        weight rather than size to stay distinct from body text.
                    </p>
                    <div
                        className="
                          mbs-4 rounded-card border border-border-warm bg-surface px-5
                          md:px-6
                        "
                    >
                        {HEADING_SCALE.map((step) => (
                            <TypeScaleRow key={step.token} step={step} />
                        ))}
                    </div>
                </section>

                <section>
                    <h2
                        className="
                          font-display text-[20px] leading-[1.15] font-semibold tracking-tight
                          text-ink
                          md:text-[22px]
                        "
                    >
                        Body text
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        text-lg through text-xs, DM Sans. Body large tops out at 18px desktop;
                        text-base is the default paragraph size — 14px on mobile, 16px on desktop.
                        Body never grows past a heading&apos;s floor.
                    </p>
                    <div
                        className="
                          mbs-4 rounded-card border border-border-warm bg-surface px-5
                          md:px-6
                        "
                    >
                        {BODY_SCALE.map((step) => (
                            <TypeScaleRow key={step.token} step={step} />
                        ))}
                    </div>
                </section>

                <section>
                    <h2
                        className="
                          font-display text-[20px] leading-[1.15] font-semibold tracking-tight
                          text-ink
                          md:text-[22px]
                        "
                    >
                        The two-tone headline
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        The signature element. First clause states the fact in ink, second states
                        what it means in ink-muted — same size, same weight. Used on every top-level
                        screen. Both clauses end with a full stop.
                    </p>
                    <div className="mbs-4 rounded-card bg-brand-deep p-6 md:p-8">
                        <h3
                            className="
                              font-display text-[28px] leading-[1.08] font-bold tracking-[-0.02em]
                              text-white
                              md:text-[40px]
                            "
                        >
                            <span>34 listings.</span>{" "}
                            <span className="text-[#B8CFC4]">₹24.8 Cr on the market.</span>
                        </h3>
                    </div>
                </section>
            </div>
        </DesignSystemShell>
    );
}
