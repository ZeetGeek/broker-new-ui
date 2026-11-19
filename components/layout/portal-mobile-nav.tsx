"use client";

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
    Plus,
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

export type PortalMobileCenterAction = {
    href: string;
    /** Accessible name for the raised center control. */
    label: string;
};

export type PortalMobileNavProps = {
    items: NavItem[];
    /**
     * Primary tab hrefs around the center FAB: first two on the left, third on
     * the right. Everything else lands under More. Defaults to the first three
     * nav items when omitted.
     */
    primaryHrefs?: readonly [string, string, string];
    /** Raised green + in the center of the bar — phone app chrome. */
    centerAction?: PortalMobileCenterAction;
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
    "/broker/earnings": Briefcase,
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

function TabLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
    const label = item.mobileLabel ?? item.label;

    return (
        <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
                `
                  flex flex-col items-center justify-center gap-0.5 rounded-inner px-0.5
                  py-1.5 text-center transition-colors duration-160 min-block-12 min-inline-0
                `,
                isActive ? "text-brand" : "text-ink-subtle",
            )}
        >
            <NavIcon href={item.href} />
            <span className="body-xs truncate font-medium inline-full">{label}</span>
        </Link>
    );
}

function CenterFab({ action }: { action: PortalMobileCenterAction }) {
    return (
        <Link
            href={action.href}
            aria-label={action.label}
            className="
              -mbs-5 grid shrink-0 place-items-center rounded-full bg-brand text-surface
              shadow-[0_2px_4px_-1px_rgb(11_31_23/0.12),0_10px_24px_-6px_rgb(27_122_90/0.45),0_18px_36px_-10px_rgb(11_31_23/0.22)] transition-[transform,box-shadow,filter]
              duration-160
              block-12 inline-12
              hover:shadow-[0_3px_6px_-1px_rgb(11_31_23/0.14),0_14px_32px_-6px_rgb(27_122_90/0.5),0_22px_44px_-10px_rgb(11_31_23/0.26)]
              hover:brightness-105
              focus-visible:ring-2 focus-visible:ring-brand
              focus-visible:ring-offset-2
              focus-visible:ring-offset-surface focus-visible:outline-none active:translate-y-px
              active:shadow-[0_1px_2px_rgb(11_31_23/0.1),0_6px_16px_-4px_rgb(27_122_90/0.35)] active:brightness-95
              sm:block-14 sm:inline-14
            "
        >
            <Plus
                aria-hidden
                className="block-6 inline-6 sm:block-7 sm:inline-7"
                strokeWidth={2.25}
            />
        </Link>
    );
}

function pickPrimaryItems(
    items: NavItem[],
    primaryHrefs: readonly [string, string, string] | undefined,
): { left: NavItem[]; right: NavItem[]; overflow: NavItem[] } {
    if (primaryHrefs) {
        const byHref = new Map(items.map((item) => [item.href, item]));
        const left = primaryHrefs
            .slice(0, 2)
            .map((href) => byHref.get(href))
            .filter((item): item is NavItem => Boolean(item));
        const right = primaryHrefs
            .slice(2)
            .map((href) => byHref.get(href))
            .filter((item): item is NavItem => Boolean(item));
        const primarySet = new Set(primaryHrefs);
        const overflow = items.filter((item) => !primarySet.has(item.href));
        return { left, right, overflow };
    }

    const left = items.slice(0, 2);
    const right = items.slice(2, 3);
    const overflow = items.slice(3);
    return { left, right, overflow };
}

export function PortalMobileNav({ items, primaryHrefs, centerAction }: PortalMobileNavProps) {
    const pathname = usePathname();
    const activeHref = resolveActiveNavHref(pathname, items);
    const { left, right, overflow } = pickPrimaryItems(items, primaryHrefs);
    const activeOverflow = overflow.find((item) => item.href === activeHref);
    const slots: Array<
        { type: "tab"; item: NavItem } | { type: "fab" } | { type: "more" } | { type: "spacer" }
    > = [];

    for (const item of left) slots.push({ type: "tab", item });
    if (centerAction) slots.push({ type: "fab" });
    for (const item of right) slots.push({ type: "tab", item });
    if (overflow.length > 0) slots.push({ type: "more" });
    while (centerAction && slots.length < 5) slots.push({ type: "spacer" });

    return (
        <nav
            className="
              fixed inset-x-0 inset-be-0 z-40 border-bs border-border-warm bg-surface pbs-1.5
              pbe-[max(0.5rem,env(safe-area-inset-bottom))]
              md:hidden
            "
            aria-label="Portal"
        >
            <ul
                className={cn(
                    "mx-auto grid items-end gap-0 px-1 inline-full max-inline-full",
                    centerAction ? "grid-cols-5" : "grid-cols-[repeat(auto-fit,minmax(0,1fr))]",
                )}
            >
                {slots.map((slot, index) => {
                    if (slot.type === "tab") {
                        return (
                            <li key={slot.item.href} className="min-inline-0">
                                <TabLink
                                    item={slot.item}
                                    isActive={slot.item.href === activeHref}
                                />
                            </li>
                        );
                    }

                    if (slot.type === "fab" && centerAction) {
                        return (
                            <li
                                key="center-fab"
                                className="flex items-start justify-center self-start min-inline-0"
                            >
                                <CenterFab action={centerAction} />
                            </li>
                        );
                    }

                    if (slot.type === "more") {
                        return (
                            <li key="more" className="min-inline-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        className={cn(
                                            `
                                              flex flex-col items-center justify-center gap-0.5
                                              rounded-inner px-0.5 py-1.5 text-center
                                              outline-none inline-full min-block-12 min-inline-0
                                              focus-visible:ring-2 focus-visible:ring-ring
                                            `,
                                            activeOverflow ? "text-brand" : "text-ink-subtle",
                                        )}
                                        aria-label="More pages"
                                    >
                                        <MoreHorizontal aria-hidden className="block-5 inline-5" />
                                        <span className="body-xs truncate font-medium inline-full">
                                            {activeOverflow?.mobileLabel ??
                                                activeOverflow?.label ??
                                                "More"}
                                        </span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        side="top"
                                        align="end"
                                        className="min-inline-52"
                                    >
                                        {overflow.map((item) => (
                                            <DropdownMenuItem
                                                key={item.href}
                                                render={<Link href={item.href} />}
                                                className={cn(
                                                    item.href === activeHref &&
                                                        "bg-brand-soft text-brand-text",
                                                )}
                                                aria-current={
                                                    item.href === activeHref ? "page" : undefined
                                                }
                                            >
                                                <NavIcon href={item.href} />
                                                {item.mobileLabel ?? item.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </li>
                        );
                    }

                    return <li key={`spacer-${index}`} aria-hidden className="min-inline-0" />;
                })}
            </ul>
        </nav>
    );
}
