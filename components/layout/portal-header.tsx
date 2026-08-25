"use client";

import type { ReactElement, ReactNode } from "react";
import Link from "next/link";

import { Bell, ChevronDown, Search } from "lucide-react";
import { motion } from "motion/react";

import { loadContainer, loadItemFromTop } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";

import { PortalNav } from "@/components/layout/portal-nav";
import { Logo } from "@/components/shared/logo";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { NavItem } from "@/config/nav";

export type PortalHeaderProps = {
    navItems: NavItem[];
    userName?: string;
    userAvatarUrl?: string;
    notificationsHref?: string;
    profileHref?: string;
    unreadCount?: number;
    children?: ReactNode;
};

const headerControlClass = `
  border-2 border-border-warm bg-surface!
  hover:border-ink-subtle
`;

function HeaderTooltip({
    label,
    shortcut,
    children,
}: {
    label: string;
    shortcut?: ReactNode;
    children: ReactElement;
}) {
    return (
        <Tooltip>
            <TooltipTrigger render={children} />
            <TooltipContent side="bottom">
                {label}
                {shortcut}
            </TooltipContent>
        </Tooltip>
    );
}

function UnreadBadge({ count }: { count: number }) {
    if (count <= 0) {
        return null;
    }

    return (
        <span
            aria-hidden
            className="
              tabular body-xs absolute -inset-e-1 -inset-bs-1 flex items-center justify-center
              rounded-full bg-brand px-1 font-semibold text-canvas ring-2 ring-surface-muted block-5
              min-inline-5
            "
        >
            {count > 9 ? "9+" : count}
        </span>
    );
}

export function PortalHeader({
    navItems,
    userName = "User",
    userAvatarUrl,
    notificationsHref,
    profileHref,
    unreadCount = 0,
    children,
}: PortalHeaderProps) {
    const homeHref = navItems[0]?.href ?? "/";
    const notificationsLabel =
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

    const notificationIcon = (
        <>
            <Bell aria-hidden="true" />
            <UnreadBadge count={unreadCount} />
        </>
    );

    return (
        <div className="bg-surface-muted min-block-screen">
            <div className="overflow-x-hidden px-4 md:px-8">
                <header className="border-be border-border-warm">
                    <TooltipProvider>
                        <motion.div
                            className="flex items-center gap-10 py-5"
                            variants={loadContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={loadItemFromTop} className="shrink-0">
                                <Logo href={homeHref} />
                            </motion.div>
                            <motion.div
                                variants={loadItemFromTop}
                                className="hidden flex-1 min-inline-0 md:block"
                            >
                                <PortalNav items={navItems} />
                            </motion.div>

                            <motion.div
                                className="ms-auto flex shrink-0 items-center gap-4"
                                variants={loadItemFromTop}
                            >
                                <HeaderTooltip label="Find properties, clients, and visits">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-md"
                                        aria-label="Search"
                                        className={cn(
                                            headerControlClass,
                                            `
                                              group text-ink-muted
                                              group-hover:text-ink
                                              md:justify-start md:gap-2 md:px-4 md:inline-auto
                                            `,
                                        )}
                                    >
                                        <Search aria-hidden="true" />
                                        <span className="body-sm hidden font-medium md:inline">
                                            Search
                                        </span>
                                        <Kbd
                                            className="
                                              ms-2 -me-1 hidden border
                                              group-hover:text-ink
                                              md:inline-flex
                                            "
                                        >
                                            Ctrl + K
                                        </Kbd>
                                    </Button>
                                </HeaderTooltip>

                                <HeaderTooltip label="Notifications">
                                    <Button
                                        type={notificationsHref ? undefined : "button"}
                                        variant="outline"
                                        size="icon-md"
                                        nativeButton={notificationsHref ? false : undefined}
                                        render={
                                            notificationsHref ? (
                                                <Link href={notificationsHref} />
                                            ) : undefined
                                        }
                                        aria-label={notificationsLabel}
                                        className={cn(
                                            headerControlClass,
                                            "relative text-ink-muted hover:text-ink",
                                        )}
                                    >
                                        {notificationIcon}
                                    </Button>
                                </HeaderTooltip>

                                <HeaderTooltip label="Profile">
                                    <Button
                                        variant="ghost"
                                        size="md"
                                        nativeButton={false}
                                        render={<Link href={profileHref ?? "#"} />}
                                        aria-label={userName}
                                        className="
                                          scale-[0.96] gap-1 ps-0 pe-1 text-ink-muted
                                          hover:bg-transparent hover:text-ink
                                        "
                                    >
                                        <span
                                            className="
                                              overflow-hidden rounded-full block-control-lg
                                              inline-control-lg
                                            "
                                        >
                                            <UserAvatar
                                                name={userName}
                                                imageUrl={userAvatarUrl}
                                                size="fill"
                                            />
                                        </span>
                                        <ChevronDown aria-hidden="true" />
                                    </Button>
                                </HeaderTooltip>
                            </motion.div>
                        </motion.div>
                    </TooltipProvider>
                </header>

                {children ? <main className="py-6">{children}</main> : null}
            </div>
        </div>
    );
}
