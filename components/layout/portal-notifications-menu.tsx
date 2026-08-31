"use client";

import Link from "next/link";

import { Bell } from "lucide-react";

import { formatDateIso, formatRelativePast } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useNotifications } from "@/providers/notification-provider";

export type PortalNotificationsMenuProps = {
    viewAllHref: string;
    triggerClassName?: string;
};

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

function NotificationsEmpty() {
    return (
        <div className="flex flex-col items-center gap-1 px-6 py-8 text-center">
            <Bell aria-hidden className="text-ink-subtle block-5 inline-5" strokeWidth={1.75} />
            <p className="body-sm font-medium text-ink">You&apos;re up to date</p>
            <p className="body-xs text-ink-muted">
                When something needs your attention, it shows up here.
            </p>
        </div>
    );
}

export function PortalNotificationsMenu({
    viewAllHref,
    triggerClassName,
}: PortalNotificationsMenuProps) {
    const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
    const now = new Date();
    const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-md"
                        aria-label={label}
                        className={triggerClassName}
                    />
                }
            >
                <Bell aria-hidden="true" />
                <UnreadBadge count={unreadCount} />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className={cn(
                    `
                      flex flex-col overflow-hidden rounded-inner border border-border-warm
                      bg-surface p-0 text-ink shadow-lg ring-0 inline-80
                      before:backdrop-blur-none
                      dark:bg-surface dark:text-ink
                    `,
                )}
            >
                <DropdownMenuGroup className="shrink-0">
                    <DropdownMenuLabel className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="h6 text-ink">Notifications</span>
                        <span className="flex items-center gap-3">
                            {unreadCount > 0 ? (
                                <button
                                    type="button"
                                    className="body-xs font-semibold text-brand"
                                    onClick={() => void markAllRead()}
                                >
                                    Mark all read
                                </button>
                            ) : null}
                            {unreadCount > 0 ? (
                                <span className="body-xs font-medium text-ink-muted">
                                    {unreadCount} unread
                                </span>
                            ) : null}
                        </span>
                    </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="shrink-0 bg-border-warm" />

                {loading && items.length === 0 ? (
                    <p className="body-sm shrink-0 px-6 py-8 text-center text-ink-muted">
                        Loading…
                    </p>
                ) : items.length === 0 ? (
                    <NotificationsEmpty />
                ) : (
                    <div
                        className="
                          overflow-x-hidden overflow-y-auto overscroll-contain max-block-80
                          min-block-0
                        "
                    >
                        <DropdownMenuGroup className="p-1.5">
                            {items.map((item) => {
                                const occurredAt = item.createdAt ? new Date(item.createdAt) : null;
                                const href = item.href || viewAllHref;

                                return (
                                    <DropdownMenuItem
                                        key={item.id}
                                        className={cn(
                                            `
                                              cursor-pointer items-start gap-3 rounded-inner p-3
                                              font-normal
                                              focus:bg-surface-muted focus:text-ink
                                            `,
                                            !item.isRead && "bg-surface-muted/70",
                                        )}
                                        render={<Link href={href} />}
                                        onClick={() => {
                                            if (!item.isRead) void markRead(item.id);
                                        }}
                                    >
                                        <span
                                            className="
                                              flex shrink-0 items-center justify-center rounded-full
                                              bg-surface-muted text-brand block-9 inline-9
                                            "
                                        >
                                            <Bell
                                                aria-hidden
                                                className="block-4 inline-4"
                                                strokeWidth={1.75}
                                            />
                                        </span>
                                        <span className="flex flex-col gap-0.5 min-inline-0">
                                            <span className="flex items-start gap-2">
                                                <span className="body-sm font-medium text-ink">
                                                    {item.title}
                                                </span>
                                                {!item.isRead ? (
                                                    <Badge
                                                        variant="brand"
                                                        className="ms-auto shrink-0 px-2 py-0.5"
                                                    >
                                                        New
                                                    </Badge>
                                                ) : null}
                                            </span>
                                            {item.body ? (
                                                <span
                                                    className="body-xs line-clamp-2 text-ink-muted"
                                                >
                                                    {item.body}
                                                </span>
                                            ) : null}
                                            {occurredAt ? (
                                                <time
                                                    dateTime={formatDateIso(occurredAt)}
                                                    className="tabular body-xs text-ink-subtle"
                                                >
                                                    {formatRelativePast(occurredAt, now)}
                                                </time>
                                            ) : null}
                                        </span>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuGroup>
                    </div>
                )}

                <DropdownMenuSeparator className="shrink-0 bg-border-warm" />
                <DropdownMenuGroup className="shrink-0 p-1.5">
                    <DropdownMenuItem
                        className="
                          body-sm cursor-pointer justify-center rounded-inner px-3 py-2
                          font-semibold text-brand
                          focus:bg-surface-muted focus:text-brand
                        "
                        render={<Link href={viewAllHref} />}
                    >
                        View all
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
