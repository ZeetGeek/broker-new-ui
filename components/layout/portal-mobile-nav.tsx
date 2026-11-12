"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { resolveActiveNavHref } from "@/components/layout/resolve-active-nav";
import type { AppIcon } from "@/components/shared/icons";
import {
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Contact,
    Gift,
    LayoutDashboard,
    MoreHorizontal,
    Send,
    UserRoundSearch,
    Users,
} from "@/components/shared/icons";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { NavItem } from "@/config/nav";

export type PortalMobileNavProps = {
    items: NavItem[];
};

const NAV_ICONS: Record<string, AppIcon> = {
    "/broker/dashboard": LayoutDashboard,
    "/broker/owner-listings": Building2,
    "/broker/my-deals": Send,
    "/broker/your-listings": Briefcase,
    "/broker/pipeline": Users,
    "/broker/contacts": Contact,
    "/broker/visits": Calendar,
    "/broker/tasks": CheckCircle2,
    "/broker/referrals": Gift,
    "/owner": LayoutDashboard,
    "/owner/properties": Building2,
    "/owner/brokers": UserRoundSearch,
    "/owner/requests": Send,
    "/owner/visits": Calendar,
    "/owner/leads": Briefcase,
};

function NavIcon({ href }: { href: string }) {
    const Icon = NAV_ICONS[href] ?? LayoutDashboard;

    return <Icon aria-hidden className="block-5 inline-5" strokeWidth={1.75} />;
}

export function PortalMobileNav({ items }: PortalMobileNavProps) {
    const pathname = usePathname();
    const activeHref = resolveActiveNavHref(pathname, items);
    const primaryItems = items.length > 5 ? items.slice(0, 4) : items;
    const overflowItems = items.length > 5 ? items.slice(4) : [];
    const activeOverflow = overflowItems.find((item) => item.href === activeHref);
    const slotCount = primaryItems.length + (overflowItems.length ? 1 : 0);

    return (
        <nav
            className="
              fixed inset-x-0 inset-be-0 z-40 border-bs border-border-warm bg-surface pbs-2
              pbe-[max(0.5rem,env(safe-area-inset-bottom))]
              md:hidden
            "
            aria-label="Portal"
            style={{ "--nav-count": slotCount } as CSSProperties}
        >
            <ul
                className="grid gap-1 px-2"
                style={{ gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))` }}
            >
                {primaryItems.map((item) => {
                    const isActive = item.href === activeHref;
                    const label = item.mobileLabel ?? item.label;

                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    `
                                      flex flex-col items-center justify-center gap-1 rounded-inner
                                      px-1 py-1.5 text-center transition-colors duration-160
                                      min-block-12
                                    `,
                                    isActive ? "text-brand" : "text-ink-muted",
                                )}
                            >
                                <NavIcon href={item.href} />
                                <span className="body-xs truncate font-medium inline-full">
                                    {label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
                {overflowItems.length > 0 && (
                    <li>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 rounded-inner px-1 py-1.5 text-center outline-none inline-full min-block-12 focus-visible:ring-2 focus-visible:ring-ring",
                                    activeOverflow ? "text-brand" : "text-ink-muted",
                                )}
                                aria-label="More pages"
                            >
                                <MoreHorizontal aria-hidden className="block-5 inline-5" />
                                <span className="body-xs truncate font-medium inline-full">
                                    {activeOverflow?.mobileLabel ?? activeOverflow?.label ?? "More"}
                                </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="end" className="min-inline-52">
                                {overflowItems.map((item) => (
                                    <DropdownMenuItem
                                        key={item.href}
                                        render={<Link href={item.href} />}
                                        className={cn(
                                            item.href === activeHref &&
                                                "bg-brand-soft text-brand-text",
                                        )}
                                        aria-current={item.href === activeHref ? "page" : undefined}
                                    >
                                        <NavIcon href={item.href} />
                                        {item.mobileLabel ?? item.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </li>
                )}
            </ul>
        </nav>
    );
}
