import type { ReactNode } from "react";
import Link from "next/link";

import { Notification03Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { PortalNav } from "@/components/layout/portal-nav";
import { Logo } from "@/components/shared/logo";
import { UserAvatar } from "@/components/shared/user-avatar";

import type { NavItem } from "@/config/nav";

export type PortalHeaderProps = {
    navItems: NavItem[];
    userName?: string;
    userAvatarUrl?: string;
    notificationsHref?: string;
    profileHref?: string;
    children?: ReactNode;
};

const iconButtonClass =
    "relative flex items-center justify-center rounded-full border border-border-warm  text-ink-muted transition-colors duration-160 hover:text-ink block-control-md inline-control-md";

export function PortalHeader({
    navItems,
    userName = "User",
    userAvatarUrl,
    notificationsHref,
    profileHref,
    children,
}: PortalHeaderProps) {
    const homeHref = navItems[0]?.href ?? "/";

    return (
        <div className="bg-surface-muted min-block-screen">
            <div className="overflow-hidden px-4 md:px-8">
                <header className="border-be border-border-warm">
                    <div className="flex items-center justify-between gap-8 py-5">
                        <div className="flex flex-1 items-center gap-10 min-inline-0">
                            <Logo href={homeHref} />
                            <PortalNav items={navItems} />
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            <button type="button" aria-label="Search" className={iconButtonClass}>
                                <HugeiconsIcon icon={Search01Icon} className="block-4 inline-4" />
                            </button>
                            {notificationsHref ? (
                                <Link
                                    href={notificationsHref}
                                    aria-label="Notifications"
                                    className={iconButtonClass}
                                >
                                    <HugeiconsIcon
                                        icon={Notification03Icon}
                                        className="block-4 inline-4"
                                    />
                                    <span
                                        aria-hidden
                                        className="
                                          absolute inset-e-2 inset-bs-2 rounded-full bg-brand ring-2
                                          ring-surface-muted block-1.5 inline-1.5
                                        "
                                    />
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    aria-label="Notifications"
                                    className={iconButtonClass}
                                >
                                    <HugeiconsIcon
                                        icon={Notification03Icon}
                                        className="block-4 inline-4"
                                    />
                                    <span
                                        aria-hidden
                                        className="
                                          absolute inset-e-2 inset-bs-2 rounded-full bg-brand ring-2
                                          ring-surface-muted block-1.5 inline-1.5
                                        "
                                    />
                                </button>
                            )}
                            <Link href={profileHref ?? "#"} aria-label={userName}>
                                <UserAvatar name={userName} imageUrl={userAvatarUrl} />
                            </Link>
                        </div>
                    </div>
                </header>

                {children ? <main className="py-6">{children}</main> : null}
            </div>
        </div>
    );
}
