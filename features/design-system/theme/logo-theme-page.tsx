import { SITE_NAME } from "@/config/site";
import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { LogoAppIcon, LogoLockup, LogoMark } from "@/features/design-system/theme/logo-mark";
import {
    LOGO_APP_ICONS,
    LOGO_COLOR_VARIANTS,
    LOGO_MIN_SIZE_PX,
    LOGO_SIZES_PX,
    LOGO_SOURCE_FILES,
} from "@/features/design-system/theme/logo-tokens";
import { LogoVariantCard } from "@/features/design-system/theme/logo-variant-card";

export function LogoThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Theme"
            title="Logo."
            description="One mark, one fill, currentColor. Colour comes from the surface it sits on. Green family only: never urgent, never danger, never lime on cream. See docs/DESIGN.md §4.9."
        >
            <div className="space-y-10">
                <section className="rounded-card bg-surface p-8 md:p-12">
                    <p
                        className="
                          text-[11px] font-medium tracking-[0.08em] text-ink-subtle uppercase
                        "
                    >
                        Preferred
                    </p>
                    <div
                        className="
                          mbs-6 flex flex-col items-center gap-6
                          md:flex-row md:items-end md:gap-8
                        "
                    >
                        <LogoMark size={200} className="text-brand-ink" />
                        <div className="text-center md:text-start">
                            <p
                                className="
                                  font-display text-[28px] leading-[1.08] font-bold tracking-tight
                                  text-ink
                                  md:text-[40px]
                                "
                            >
                                {SITE_NAME}
                            </p>
                            <p
                                className="
                                  mbs-2 text-[13px] leading-[1.45] text-ink-muted max-inline-[40ch]
                                "
                            >
                                Brand-ink on canvas. Reads black, is green. This is the default for
                                headers, auth, and the wordmark.
                            </p>
                        </div>
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
                        Colour
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        Five fills, all from the existing palette. The plus is a cutout: the surface
                        shows through. That is the second colour. Do not paint it.
                    </p>
                    <div
                        className="
                          mbs-4 grid grid-cols-1 gap-3
                          sm:grid-cols-2
                          md:gap-4
                          lg:grid-cols-3
                        "
                    >
                        {LOGO_COLOR_VARIANTS.map((variant) => (
                            <LogoVariantCard key={variant.name} variant={variant} />
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
                        App icon
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        Square field, card radius. Highlight on brand-deep is the default. Lime on
                        cream fails contrast, so that pairing does not exist.
                    </p>
                    <div className="mbs-4 flex flex-wrap gap-4">
                        {LOGO_APP_ICONS.map((icon) => (
                            <div
                                key={icon.name}
                                className="
                                  flex flex-col items-center gap-3 rounded-card border
                                  border-border-warm bg-surface p-5
                                "
                            >
                                <LogoAppIcon
                                    size={96}
                                    className={icon.surfaceClass}
                                    fillClassName={icon.fillClass}
                                />
                                <div className="text-center">
                                    <p className="text-[15px] font-medium text-ink">{icon.name}</p>
                                    <p
                                        className="
                                          mbs-1 text-[12px] leading-[1.4] text-ink-muted
                                          max-inline-[18ch]
                                        "
                                    >
                                        {icon.usage}
                                    </p>
                                </div>
                            </div>
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
                        Size
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        Floor is {LOGO_MIN_SIZE_PX}px. Below that the plus collapses into the walls.
                        Nav and header use 32. Auth uses 64 or larger.
                    </p>
                    <div
                        className="
                          mbs-4 flex flex-wrap items-end gap-6 rounded-card border
                          border-border-warm bg-surface p-5
                          md:p-6
                        "
                    >
                        {LOGO_SIZES_PX.map((size) => (
                            <div key={size} className="flex flex-col items-center gap-2">
                                <LogoMark size={size} className="text-brand-ink" decorative />
                                <span className="tabular text-[11px] text-ink-subtle">{size}</span>
                            </div>
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
                        Wordmark
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        Mark plus Bricolage Grotesque, tight tracking, same optical size. The
                        product name is a placeholder: change it in{" "}
                        <code className="text-[12px]">config/site.ts</code> only.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div
                            className="
                              flex items-center rounded-card border border-border-warm bg-surface
                              px-5 py-6
                            "
                        >
                            <LogoLockup size={40} className="text-brand-ink" decorative />
                        </div>
                        <div className="flex items-center rounded-card bg-brand-deep px-5 py-6">
                            <LogoLockup size={40} className="text-canvas" decorative />
                        </div>
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
                        In place
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        How the mark sits in chrome. Header is 56px, same as the bottom nav.
                    </p>
                    <div className="mbs-4 space-y-3">
                        <div
                            className="
                              flex items-center gap-3 rounded-card border border-border-warm
                              bg-surface px-4 block-14
                            "
                        >
                            <LogoMark size={32} className="text-brand-ink" decorative />
                            <span
                                className="
                                  font-display text-[20px] font-semibold tracking-tight text-ink
                                "
                            >
                                {SITE_NAME}
                            </span>
                        </div>
                        <div
                            className="
                              flex items-center gap-3 rounded-card bg-brand-deep px-4 block-14
                            "
                        >
                            <LogoMark size={32} className="text-highlight" decorative />
                            <span
                                className="
                                  font-display text-[20px] font-semibold tracking-tight text-white
                                "
                            >
                                {SITE_NAME}
                            </span>
                        </div>
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
                        Source
                    </h2>
                    <p className="mbs-1 text-[13px] leading-[1.45] text-ink-muted max-inline-[65ch]">
                        Static SVGs for <code className="text-[12px]">&lt;img&gt;</code> and
                        favicons. Prefer <code className="text-[12px]">LogoMark</code> in the app so
                        the fill can follow the theme.
                    </p>
                    <ul
                        className="
                          mbs-4 divide-y divide-border-warm overflow-hidden rounded-card border
                          border-border-warm bg-surface
                        "
                    >
                        {LOGO_SOURCE_FILES.map((source) => (
                            <li key={source.file} className="px-5 py-4">
                                <code className="text-[13px] text-ink">{source.file}</code>
                                <p className="mbs-1 text-[13px] text-ink-muted">
                                    {source.fill}. {source.usage}
                                </p>
                            </li>
                        ))}
                    </ul>
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
                        <li>One fill. The plus is negative space, not a second colour.</li>
                        <li>
                            Brand-ink on canvas is the default. Highlight only on brand-deep or
                            brand-ink.
                        </li>
                        <li>Never urgent or danger. Those colours mean a deadline or a destroy.</li>
                        <li>Never rotate, outline, add a drop shadow, or sit it on a gradient.</li>
                        <li>
                            Minimum {LOGO_MIN_SIZE_PX}px. Wordmark name lives in config/site.ts,
                            nowhere else.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
