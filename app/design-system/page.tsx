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
            { href: "/design-system/logo", label: "Logo" },
        ],
    },
    {
        title: "Components",
        links: [
            { href: "/design-system/components/button", label: "Button" },
            { href: "/design-system/components/input", label: "Input" },
            { href: "/design-system/components/select", label: "Select" },
            { href: "/design-system/components/switch", label: "Switch" },
            { href: "/design-system/components/radio", label: "Radio" },
            { href: "/design-system/components/tooltip", label: "Tooltip" },
            { href: "/design-system/components/tabs", label: "Tabs" },
            { href: "/design-system/components/dialog", label: "Dialog" },
            { href: "/design-system/components/avatar", label: "Avatar" },
        ],
    },
];

export default function Page() {
    return (
        <div className="bg-canvas min-block-screen">
            <div className="mx-auto px-4 py-8 max-inline-[1280px] md:px-8 md:py-12">
                <p className="eyebrow">Internal</p>
                <h1 className="h1 mbs-2">
                    <span className="text-ink">Design system.</span>{" "}
                    <span className="text-ink-muted">Tokens, one source of truth.</span>
                </h1>

                <div className="mbs-8 space-y-8">
                    {SECTIONS.map((section) => (
                        <section key={section.title}>
                            <h2 className="h4 text-ink">{section.title}</h2>
                            <div className="mbs-3 flex flex-wrap gap-3">
                                {section.links.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="
                                          body rounded-card border border-border-warm bg-surface
                                          px-5 py-4 font-medium text-ink
                                          hover:bg-surface-muted
                                        "
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
