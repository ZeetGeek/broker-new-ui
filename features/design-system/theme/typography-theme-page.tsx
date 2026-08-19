import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    BODY_SCALE,
    DISPLAY_SCALE,
    HEADING_SCALE,
    SPECIAL_SCALE,
} from "@/features/design-system/theme/type-scale";
import { TypeScaleRow } from "@/features/design-system/theme/type-scale-row";

export function TypographyThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Theme"
            title="Typography."
            description="Bricolage Grotesque for headings, DM Sans for everything else. Tight tracking on display sizes, tabular figures on every number. Apply one class from app/common.scss — see docs/DESIGN.md §2."
        >
            <div className="space-y-10">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-card border border-border-warm bg-surface p-5 md:p-6">
                        <p className="eyebrow">Display — headings</p>
                        <p className="display-3 mbs-3 text-ink">Bricolage Grotesque</p>
                        <code className="body-sm mbs-2 block text-ink-muted">
                            --font-heading · font-display · .display-1–3 · .h1–.h6
                        </code>
                        <p className="body-sm mbs-2 text-ink-muted">
                            h1–h6 only. Loose tracking at 52px reads as a fallback font — tight
                            tracking is what makes it look intentional.
                        </p>
                    </div>
                    <div className="rounded-card border border-border-warm bg-surface p-5 md:p-6">
                        <p className="eyebrow">Body — everything else</p>
                        <p className="h2 mbs-3 font-sans text-ink">DM Sans</p>
                        <code className="body-sm mbs-2 block text-ink-muted">
                            --font-sans · font-sans · .body-lg · .body · .body-sm · .body-xs
                        </code>
                        <p className="body-sm mbs-2 text-ink-muted">
                            Paragraphs, labels, buttons, inputs. Prices, areas, and table columns
                            use tabular figures so they align in a column.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Display</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
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
                    <h2 className="h4 text-ink">Headings</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
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
                    <h2 className="h4 text-ink">Body text</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        body-lg through body-xs, DM Sans. Body large tops out at 18px desktop; body
                        is the default paragraph size — 14px on mobile, 16px on desktop. Body never
                        grows past a heading&apos;s floor.
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
                    <h2 className="h4 text-ink">Eyebrow</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        The only uppercase in the system. Sits directly above the value it
                        describes. Colour is built into the class — do not add text-ink.
                    </p>
                    <div
                        className="
                          mbs-4 rounded-card border border-border-warm bg-surface px-5
                          md:px-6
                        "
                    >
                        {SPECIAL_SCALE.map((step) => (
                            <TypeScaleRow key={step.token} step={step} />
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">The two-tone headline</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        The signature element. First clause states the fact in ink, second states
                        what it means in ink-muted — same size, same weight. Used on every top-level
                        screen. Both clauses end with a full stop.
                    </p>
                    <div className="mbs-4 rounded-card bg-brand-deep p-6 md:p-8">
                        <h3 className="h1 text-white">
                            <span>34 listings.</span>{" "}
                            <span className="text-[#B8CFC4]">₹24.8 Cr on the market.</span>
                        </h3>
                    </div>
                </section>
            </div>
        </DesignSystemShell>
    );
}
