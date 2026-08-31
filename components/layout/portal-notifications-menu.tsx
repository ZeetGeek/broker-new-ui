"use client";

import Link from "next/link";

import type { LucideIcon } from "lucide-react";
import {
    BadgeCheck,
    Bell,
    BellRing,
    Building2,
    CalendarClock,
    Gift,
    MessageCircle,
    Send,
    ShieldCheck,
    UserPlus,
    XCircle,
} from "lucide-react";

import type { NotificationItem } from "@/lib/api/notifications";
import { formatDateIso, formatRelativePast } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { TextLinkButton } from "@/components/shared/text-link-button";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useNotifications } from "@/providers/notification-provider";

export type PortalNotificationsMenuProps = {
    viewAllHref: string;
    triggerClassName?: string;
    tooltipLabel?: string;
};

const menuSurfaceClass = `
  t-dropdown t-profile-menu animate-none! flex flex-col overflow-hidden! rounded-inner border
  border-border-warm bg-surface p-0 text-ink ring-0
  before:backdrop-blur-none
  data-closed:animate-none!
  data-open:animate-none!
   min-inline-[22rem] max-inline-96
  **:data-[slot$=-item]:data-highlighted:bg-surface-muted!
  **:data-[slot$=-item]:data-highlighted:text-ink!
  **:data-[slot$=-item]:focus:bg-surface-muted!
  **:data-[slot$=-item]:focus:text-ink!
`;

// Reserve viewport end space so content does not sit under the scrollbar thumb.
const notificationsScrollClass = `
  block-full overflow-hidden
  [&_[data-slot=scroll-area-viewport]]:pe-2
`;

const itemClass = `
  cursor-pointer items-start gap-2.5 rounded-inner py-2.5 body-sm font-normal text-ink
`;

function NotificationsFooter({
    viewAllHref,
    showFade,
}: {
    viewAllHref: string;
    showFade: boolean;
}) {
    return (
        <div
            className="
              absolute inset-x-0 inset-be-0 z-10 flex flex-col justify-end px-3 block-18
            "
        >
            {showFade ? (
                <div
                    aria-hidden
                    className="
                      pointer-events-none absolute inset-0 bg-linear-to-t from-surface from-40%
                      via-surface/90 to-transparent
                    "
                />
            ) : null}
            <div className="relative flex justify-center pbe-2 pbs-1">
                <TextLinkButton href={viewAllHref}>View all notifications</TextLinkButton>
            </div>
        </div>
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

const iconBaseClass = "shrink-0 block-4 inline-4 mbs-0.5";

type NotificationVisual = {
    Icon: LucideIcon;
    colorClass: string;
};

function getNotificationVisual(
    type: string | null,
    title: string,
    body: string | null,
): NotificationVisual {
    const key = `${type ?? ""} ${title} ${body ?? ""}`.toLowerCase();

    if (key.includes("referral")) {
        return { Icon: Gift, colorClass: "!text-urgent-mid" };
    }

    if (key.includes("message") || key.includes("chat")) {
        return { Icon: MessageCircle, colorClass: "!text-brand-deep" };
    }

    if (key.includes("visit") || key.includes("showing") || key.includes("schedule")) {
        return {
            Icon: CalendarClock,
            colorClass:
                key.includes("approv") || key.includes("accept") ? "!text-brand" : "!text-urgent",
        };
    }

    if (key.includes("invite") || key.includes("property") || key.includes("listing")) {
        return { Icon: Building2, colorClass: "!text-brand" };
    }

    if (key.includes("reject") || key.includes("declin") || key.includes("cancel")) {
        return { Icon: XCircle, colorClass: "!text-danger" };
    }

    if (key.includes("approv") || key.includes("accepted") || key.includes("qualified")) {
        return { Icon: BadgeCheck, colorClass: "!text-brand" };
    }

    if (key.includes("represent") || key.includes("request")) {
        return { Icon: Send, colorClass: "!text-brand-deep" };
    }

    if (
        key.includes("reminder") ||
        key.includes("follow-up") ||
        key.includes("follow up") ||
        key.includes("due")
    ) {
        return { Icon: BellRing, colorClass: "!text-urgent" };
    }

    if (key.includes("client") || key.includes("lead")) {
        return { Icon: UserPlus, colorClass: "!text-brand-text" };
    }

    if (key.includes("verif") || key.includes("rera")) {
        return { Icon: ShieldCheck, colorClass: "!text-brand-text" };
    }

    if (key.includes("announce") || key.includes("update") || key.includes("system")) {
        return { Icon: Bell, colorClass: "!text-brand" };
    }

    return { Icon: Bell, colorClass: "!text-brand" };
}

function NotificationTypeIcon({
    type,
    title,
    body,
}: {
    type: string | null;
    title: string;
    body: string | null;
}) {
    const { Icon, colorClass } = getNotificationVisual(type, title, body);

    return <Icon aria-hidden className={cn(iconBaseClass, colorClass)} strokeWidth={1.75} />;
}

function NotificationsHeader({
    unreadCount,
    onMarkAllRead,
}: {
    unreadCount: number;
    onMarkAllRead: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="eyebrow flex items-center gap-2 text-ink-muted">
                <span aria-hidden className="shrink-0 rounded-full bg-brand block-1.5 inline-1.5" />
                <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
                <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="eyebrow text-ink-muted">{unreadCount} unread</p>
                    <button
                        type="button"
                        className="
                          eyebrow font-semibold text-brand transition-colors duration-160 ease-out
                          hover:text-brand-text
                        "
                        onClick={onMarkAllRead}
                    >
                        Mark all read
                    </button>
                </div>
            )}
        </div>
    );
}

function NotificationsEmpty({ viewAllHref }: { viewAllHref: string }) {
    return (
        <EmptyState
            icon={Bell}
            heading="Nothing yet"
            description="When something needs your attention, it shows up here."
            className="gap-3 px-2 py-14 [&>div]:gap-1"
        >
            <TextLinkButton href={viewAllHref}>View all notifications</TextLinkButton>
        </EmptyState>
    );
}

function NotificationRow({
    item,
    viewAllHref,
    now,
    onMarkRead,
}: {
    item: NotificationItem;
    viewAllHref: string;
    now: Date;
    onMarkRead: (id: string) => void;
}) {
    const occurredAt = item.createdAt ? new Date(item.createdAt) : null;
    const href = item.href || viewAllHref;

    return (
        <DropdownMenuItem
            className={itemClass}
            render={<Link href={href} />}
            onClick={() => {
                if (!item.isRead) onMarkRead(item.id);
            }}
        >
            <NotificationTypeIcon type={item.type} title={item.title} body={item.body} />

            <span className="flex flex-1 gap-1.5 min-inline-0">
                {!item.isRead ? (
                    <span
                        aria-hidden
                        className="mbs-1.5 shrink-0 rounded-full bg-brand block-1.5 inline-1.5"
                    />
                ) : null}

                <span className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <span className="flex items-start gap-2">
                        <span
                            className={cn(
                                "body-sm line-clamp-1 flex-1 min-inline-0",
                                item.isRead ? "font-medium text-ink" : "font-semibold text-ink",
                            )}
                        >
                            {item.title}
                        </span>
                    </span>
                    {item.body ? (
                        <span className="body-xs line-clamp-2 text-pretty text-ink-muted">
                            {item.body}
                        </span>
                    ) : null}
                </span>

                {occurredAt ? (
                    <time
                        dateTime={formatDateIso(occurredAt)}
                        className="tabular body-xs ms-auto shrink-0 pbs-0.5 text-ink-subtle"
                    >
                        {formatRelativePast(occurredAt, now)}
                    </time>
                ) : null}
            </span>
        </DropdownMenuItem>
    );
}

export function PortalNotificationsMenu({
    viewAllHref,
    triggerClassName,
    tooltipLabel,
}: PortalNotificationsMenuProps) {
    const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
    const now = new Date();
    const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

    const trigger = (
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
            <Bell aria-hidden="true" strokeWidth={1.75} />
            <UnreadBadge count={unreadCount} />
        </DropdownMenuTrigger>
    );

    return (
        <DropdownMenu>
            {tooltipLabel ? (
                <Tooltip>
                    <TooltipTrigger render={trigger} />
                    <TooltipContent side="bottom">{tooltipLabel}</TooltipContent>
                </Tooltip>
            ) : (
                trigger
            )}

            <DropdownMenuContent align="end" sideOffset={14} className={cn(menuSurfaceClass)}>
                <DropdownMenuGroup className="shrink-0 p-3">
                    <NotificationsHeader
                        unreadCount={unreadCount}
                        onMarkAllRead={() => void markAllRead()}
                    />
                </DropdownMenuGroup>

                <div className="px-3">
                    <DropdownMenuSeparator
                        className="
                      mx-0! my-0 shrink-0 bg-border-warm inline-full!
                    "
                    />
                </div>

                {loading && items.length === 0 ? (
                    <p className="body-sm shrink-0 px-3 py-10 text-center text-ink-muted">
                        Loading notifications…
                    </p>
                ) : items.length === 0 ? (
                    <div className="mx-auto px-3 max-inline-80">
                        <NotificationsEmpty viewAllHref={viewAllHref} />
                    </div>
                ) : (
                    <div className="relative block-72 min-block-0 shrink-0">
                        <ScrollArea className={cn(notificationsScrollClass)}>
                            <DropdownMenuGroup
                                className={cn(
                                    "flex flex-col gap-0.5 px-3",
                                    items.length >= 3 ? "pbe-9" : "pbe-1",
                                )}
                            >
                                {items.map((item) => (
                                    <NotificationRow
                                        key={item.id}
                                        item={item}
                                        viewAllHref={viewAllHref}
                                        now={now}
                                        onMarkRead={(id) => void markRead(id)}
                                    />
                                ))}
                            </DropdownMenuGroup>
                        </ScrollArea>

                        <NotificationsFooter
                            viewAllHref={viewAllHref}
                            showFade={items.length >= 3}
                        />
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
