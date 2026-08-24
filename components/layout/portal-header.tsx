import type { ReactNode } from "react";
import Link from "next/link";

import { Notification03Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

import { Logo } from "@/components/shared/logo";

import type { NavItem } from "@/config/nav";

export type PortalHeaderProps = {
    navItems: NavItem[];
    activeHref: string;
    userName?: string;
    userAvatarUrl?: string;
    children?: ReactNode;
};

const iconButtonClass =
    "relative flex items-center justify-center rounded-full border border-border-warm bg-surface text-ink-muted transition-colors duration-160 hover:text-ink block-control-md inline-control-md";

export function PortalHeader({
    navItems,
    activeHref,
    userName = "User",
    userAvatarUrl,
    children,
}: PortalHeaderProps) {
    const homeHref = navItems[0]?.href ?? "/";

    return (
        <div className="bg-surface-muted min-block-screen">
            <div className="mx-auto overflow-hidden">
                <header className="border-be border-border-warm">
                    <div className="flex items-center justify-between gap-8 px-6 py-4">
                        <div className="flex flex-1 items-center gap-10 min-inline-0">
                            <Logo href={homeHref} />

                            <nav className="hidden items-center gap-8 md:flex">
                                {navItems.map((item) => {
                                    const isActive = item.href === activeHref;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                `
                                                  body-sm relative px-0.5 py-1 transition-colors
                                                  duration-160
                                                `,
                                                isActive
                                                    ? "font-semibold text-ink"
                                                    : "font-normal text-ink-muted hover:text-ink",
                                            )}
                                        >
                                            {item.label}
                                            {isActive ? (
                                                <span
                                                    aria-hidden
                                                    className="
                                                      absolute inset-x-0 -inset-be-0.5 mx-auto
                                                      rounded-full bg-ink block-0.5 inline-5
                                                    "
                                                />
                                            ) : null}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <button type="button" aria-label="Search" className={iconButtonClass}>
                                <HugeiconsIcon icon={Search01Icon} className="block-4 inline-4" />
                            </button>
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
                            {userAvatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={userAvatarUrl}
                                    alt={userName}
                                    className="
                                      rounded-full object-cover ring-1 ring-border-warm
                                      block-control-md inline-control-md
                                    "
                                />
                            ) : (
                                <div
                                    aria-label={userName}
                                    className="
                                      flex items-center justify-center rounded-full bg-surface
                                      font-sans text-sm font-medium text-ink ring-1 ring-border-warm
                                      block-control-md inline-control-md
                                    "
                                >
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {children ? <div className="p-6">{children}</div> : null}
            </div>
        </div>
    );
}
