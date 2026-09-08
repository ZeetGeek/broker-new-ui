"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LucideIcon } from "lucide-react";
import {
    Briefcase,
    Building2,
    Calendar,
    Gift,
    LayoutDashboard,
    Send,
    Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { resolveActiveNavHref } from "@/components/layout/resolve-active-nav";

import type { NavItem } from "@/config/nav";

export type PortalMobileNavProps = {
    items: NavItem[];
};

const NAV_ICONS: Record<string, LucideIcon> = {
    "/broker/dashboard": LayoutDashboard,
    "/broker/owner-listings": Building2,
    "/broker/my-requests": Send,
    "/broker/your-listings": Briefcase,
    "/broker/clients": Users,
    "/broker/visits": Calendar,
    "/broker/referrals": Gift,
    "/owner": LayoutDashboard,
    "/owner/properties": Building2,
    "/owner/requests": Gift,
    "/owner/calendar": Calendar,
};

function NavIcon({ href }: { href: string }) {
    const Icon = NAV_ICONS[href] ?? LayoutDashboard;

    return <Icon aria-hidden className="block-5 inline-5" strokeWidth={1.75} />;
}

export function PortalMobileNav({ items }: PortalMobileNavProps) {
    const pathname = usePathname();
    const activeHref = resolveActiveNavHref(pathname, items);

    return (
        <nav
            className="
              fixed inset-x-0 inset-be-0 z-40 border-bs border-border-warm bg-surface pbs-2
              pbe-[max(0.5rem,env(safe-area-inset-bottom))]
              md:hidden
            "
            aria-label="Portal"
            style={{ "--nav-count": items.length } as CSSProperties}
        >
            <ul
                className="grid gap-1 px-2"
                style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
            >
                {items.map((item) => {
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
                                <span className="body-xs truncate font-medium inline-full">{label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
