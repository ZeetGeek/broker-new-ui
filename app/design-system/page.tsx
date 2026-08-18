import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Design system",
    robots: { index: false, follow: false },
};

const SECTIONS = [
    {
        title: "Theme",
        links: [
            { href: "/design-system/colors", label: "Colors" },
            { href: "/design-system/typography", label: "Typography" },
            { href: "/design-system/shadows", label: "Shadows" },
        ],
    },
    {
        title: "Components",
        links: [{ href: "/design-system/components/button", label: "Button" }],
    },
];

export default function Page() {
    return (
        <div className="min-h-screen bg-canvas">
            <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-subtle">
                    Internal
                </p>
                <h1 className="mt-2 font-display text-[28px] font-bold leading-[1.08] tracking-tight text-ink md:text-[40px]">
                    <span className="text-ink">Design system.</span>{" "}
                    <span className="text-ink-muted">Tokens, one source of truth.</span>
                </h1>

                <div className="mt-8 space-y-8">
                    {SECTIONS.map((section) => (
                        <section key={section.title}>
                            <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">
                                {section.title}
                            </h2>
                            <div className="mt-3 flex flex-wrap gap-3">
                                {section.links.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="rounded-card border border-border-warm bg-surface px-5 py-4 text-[15px] font-medium text-ink hover:bg-surface-muted"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
