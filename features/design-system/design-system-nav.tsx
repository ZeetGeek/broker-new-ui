"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const THEME_LINKS = [
    { href: "/design-system/colors", label: "Colors" },
    { href: "/design-system/typography", label: "Typography" },
];

export function DesignSystemNav() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-wrap gap-2">
            {THEME_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "rounded-control border px-5 py-2 text-sm font-medium transition-colors",
                            isActive
                                ? "border-brand-ink bg-brand-ink text-white"
                                : "border-border-warm bg-surface text-ink-muted hover:text-ink",
                        )}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
