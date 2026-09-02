"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import { duration, ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import { resolveActiveNavHref } from "@/components/layout/resolve-active-nav";
import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";

import type { NavItem } from "@/config/nav";

export type PortalNavProps = {
    items: NavItem[];
};

export function PortalNav({ items }: PortalNavProps) {
    const pathname = usePathname();
    const activeHref = resolveActiveNavHref(pathname, items);
    const reduceMotion = useReducedMotion();

    return (
        <LayoutGroup id="portal-nav">
            <nav className="hidden items-center gap-6 md:flex lg:gap-8" aria-label="Portal">
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
                        <ShortcutTooltip key={item.href} shortcutId={item.shortcutId}>
                            {link}
                        </ShortcutTooltip>
                    );
                })}
            </nav>
        </LayoutGroup>
    );
}
