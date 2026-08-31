"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import { duration, ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import type { NavItem } from "@/config/nav";
import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";

export type PortalNavProps = {
    items: NavItem[];
};

function resolveActiveHref(pathname: string, items: NavItem[]): string | null {
    let match: string | null = null;
    for (const item of items) {
        if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
            if (!match || item.href.length > match.length) {
                match = item.href;
            }
        }
    }
    return match;
}

export function PortalNav({ items }: PortalNavProps) {
    const pathname = usePathname();
    const activeHref = resolveActiveHref(pathname, items);
    const reduceMotion = useReducedMotion();

    return (
        <LayoutGroup id="portal-nav">
            <nav className="hidden items-center gap-8 md:flex" aria-label="Portal">
                {items.map((item) => {
                    const isActive = item.href === activeHref;
                    const link = (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                `
                                  body-sm relative px-0.5 py-1 font-semibold transition-colors
                                  duration-160
                                `,
                                isActive ? "text-ink" : "text-ink-muted hover:text-ink",
                            )}
                        >
                            {item.label}
                            {isActive ? (
                                <motion.span
                                    layoutId="portal-nav-underline"
                                    aria-hidden
                                    className="
                                      absolute inset-x-0 -inset-be-0.5 mx-auto rounded-full bg-ink
                                      block-0.5 inline-5
                                    "
                                    transition={
                                        reduceMotion
                                            ? { duration: 0 }
                                            : {
                                                  duration: duration.tabs,
                                                  ease: ease.smoothOut,
                                              }
                                    }
                                />
                            ) : null}
                        </Link>
                    );

                    if (!item.shortcutId) {
                        return link;
                    }

                    return (
                        <ShortcutTooltip
                            key={item.href}
                            shortcutId={item.shortcutId}
                            label="Press to navigate"
                        >
                            {link}
                        </ShortcutTooltip>
                    );
                })}
            </nav>
        </LayoutGroup>
    );
}
