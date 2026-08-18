import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { COLOR_GROUPS } from "@/features/design-system/theme/color-tokens";
import { ColorSwatch } from "@/features/design-system/theme/color-swatch";

export function ColorThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Theme"
            title="Colours."
            description="One hue family at three depths, one warm neutral family, two reserved signal colours. Nothing else — no blue, no purple, no second brand colour, ever. See docs/DESIGN.md §1 for the full rules."
        >
            <div className="space-y-10">
                {COLOR_GROUPS.map((group) => (
                    <section key={group.title}>
                        <h2 className="font-display text-[20px] font-semibold leading-[1.15] tracking-tight text-ink md:text-[22px]">
                            {group.title}
                        </h2>
                        <p className="mt-1 max-w-[65ch] text-[13px] leading-[1.45] text-ink-muted">
                            {group.description}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 md:gap-4">
                            {group.tokens.map((token) => (
                                <ColorSwatch key={token.variable} token={token} />
                            ))}
                        </div>
                    </section>
                ))}

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-highlight">
                        Proportion
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[
                            { share: "60–70%", label: "Warm neutral" },
                            { share: "~20%", label: "Dark green / ink" },
                            { share: "~10%", label: "Mid green" },
                            { share: "<5%", label: "Highlight + urgent" },
                        ].map((row) => (
                            <div key={row.label}>
                                <p className="tabular font-display text-[22px] font-bold text-white">
                                    {row.share}
                                </p>
                                <p className="text-[13px] text-[#B8CFC4]">{row.label}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DesignSystemShell>
    );
}
