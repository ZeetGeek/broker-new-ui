"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import { duration, ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import { resolveActiveNavHref } from "@/components/layout/resolve-active-nav";
import { ChevronDown } from "@/components/shared/icons";
import { ShortcutTooltip } from "@/components/shared/shortcut-tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { NavItem } from "@/config/nav";

export type PortalNavProps = {
    items: NavItem[];
};

export function PortalNav({ items }: PortalNavProps) {
    const pathname = usePathname();
    const activeHref = resolveActiveNavHref(pathname, items);
    const reduceMotion = useReducedMotion();
    const compactItems = items.slice(3);
    const compactActive = compactItems.find((item) => item.href === activeHref);

    return (
        <LayoutGroup id="portal-nav">
            <nav className="hidden items-center gap-6 md:flex lg:gap-8" aria-label="Portal">
                {items.map((item, index) => {
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
                                index >= 3 && "hidden xl:inline-flex",
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
                            label={item.label}
                        >
                            {link}
                        </ShortcutTooltip>
                    );
                })}
                {compactItems.length > 0 && (
                    <div className="xl:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className={cn(
                                    "body-sm inline-flex items-center gap-1 rounded-control px-1 font-semibold outline-none min-block-11 focus-visible:ring-2 focus-visible:ring-ring",
                                    compactActive ? "text-brand" : "text-ink-muted",
                                )}
                                aria-label="More pages"
                            >
                                {compactActive?.mobileLabel ?? compactActive?.label ?? "More"}
                                <ChevronDown aria-hidden className="block-4 inline-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-inline-52">
                                {compactItems.map((item) => (
                                    <DropdownMenuItem
                                        key={item.href}
                                        render={<Link href={item.href} />}
                                        aria-current={item.href === activeHref ? "page" : undefined}
                                        className={cn(
                                            item.href === activeHref &&
                                                "bg-brand-soft text-brand-text",
                                        )}
                                    >
                                        {item.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </nav>
        </LayoutGroup>
    );
}
