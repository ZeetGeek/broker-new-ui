"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import type { LucideIcon } from "lucide-react";
import {
    BadgeCheck,
    Bell,
    BellRing,
    Building2,
    CalendarClock,
    CheckCheck,
    Gift,
    MessageCircle,
    Send,
    ShieldCheck,
    UserPlus,
    XCircle,
} from "lucide-react";

import type { NotificationItem } from "@/lib/api/notifications";
import { formatDateIso, formatNotificationWhen, formatRelativePast } from "@/lib/format/date";
import {
    countByTab,
    filterNotificationsByTab,
    getNotificationActor,
    getPropertyLabel,
    isActionableRequest,
    NOTIFICATION_TABS,
    type NotificationTab,
} from "@/lib/notifications/classify";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { TextLinkButton } from "@/components/shared/text-link-button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
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

const notificationsScrollClass = `
  block-full overflow-hidden
  [&_[data-slot=scroll-area-viewport]]:pe-2
`;

const itemClass = `
  flex inline-full cursor-pointer items-start gap-3 rounded-inner px-1 py-3 body-sm font-normal
  text-ink
`;

const notificationLeadClass = "flex shrink-0 items-center justify-center block-6 inline-6";

function NotificationLeadMedia({ children }: { children: ReactNode }) {
    return <span className={notificationLeadClass}>{children}</span>;
}

function movePill(pill: HTMLElement, tab: HTMLElement, animate: boolean) {
    const nextTransform = `translateX(${tab.offsetLeft}px)`;
    const nextWidth = `${tab.offsetWidth}px`;
    if (!animate) {
        const previous = pill.style.transition;
        pill.style.transition = "none";
        pill.style.transform = nextTransform;
        pill.style.width = nextWidth;
        void pill.offsetWidth;
        pill.style.transition = previous;
        return;
    }
    pill.style.transform = nextTransform;
    pill.style.width = nextWidth;
}

function NotificationsFooter({
    viewAllHref,
    showFade,
}: {
    viewAllHref: string;
    showFade: boolean;
}) {
    return (
        <div className="absolute inset-x-0 inset-be-0 z-10 flex flex-col justify-end px-3 block-18">
            {showFade ? (
                <div
                    aria-hidden
                    className="
                      pointer-events-none absolute inset-0 bg-linear-to-t from-surface from-40%
                      via-surface/90 to-transparent
                    "
                />
            ) : null}
            <div className="relative flex justify-center pbs-1 pbe-2">
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
        return { Icon: Gift, colorClass: "text-urgent-mid" };
    }

    if (key.includes("message") || key.includes("chat")) {
        return { Icon: MessageCircle, colorClass: "text-brand-deep" };
    }

    if (key.includes("visit") || key.includes("showing") || key.includes("schedule")) {
        return {
            Icon: CalendarClock,
            colorClass:
                key.includes("approv") || key.includes("accept") ? "text-brand" : "text-urgent",
        };
    }

    if (key.includes("invite") || key.includes("property") || key.includes("listing")) {
        return { Icon: Building2, colorClass: "text-brand" };
    }

    if (key.includes("reject") || key.includes("declin") || key.includes("cancel")) {
        return { Icon: XCircle, colorClass: "text-danger" };
    }

    if (key.includes("approv") || key.includes("accepted") || key.includes("qualified")) {
        return { Icon: BadgeCheck, colorClass: "text-brand" };
    }

    if (key.includes("represent") || key.includes("request")) {
        return { Icon: Send, colorClass: "text-brand-deep" };
    }

    if (
        key.includes("reminder") ||
        key.includes("follow-up") ||
        key.includes("follow up") ||
        key.includes("due")
    ) {
        return { Icon: BellRing, colorClass: "text-urgent" };
    }

    if (key.includes("client") || key.includes("lead")) {
        return { Icon: UserPlus, colorClass: "text-brand-text" };
    }

    if (key.includes("verif") || key.includes("rera")) {
        return { Icon: ShieldCheck, colorClass: "text-brand-text" };
    }

    if (key.includes("announce") || key.includes("update") || key.includes("system")) {
        return { Icon: Bell, colorClass: "text-brand" };
    }

    return { Icon: Bell, colorClass: "text-brand" };
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

    return (
        <Icon
            aria-hidden
            className={cn("block-6 inline-6", colorClass)}
            strokeWidth={1.75}
        />
    );
}

function NotificationFilterTabs({
    activeTab,
    tabCounts,
    onTabChange,
}: {
    activeTab: NotificationTab;
    tabCounts: Record<NotificationTab, number>;
    onTabChange: (tab: NotificationTab) => void;
}) {
    const barRef = useRef<HTMLDivElement>(null);
    const pillRef = useRef<HTMLSpanElement>(null);
    const hasPainted = useRef(false);

    useLayoutEffect(() => {
        const bar = barRef.current;
        const pill = pillRef.current;
        if (!bar || !pill) return;

        const active = bar.querySelector<HTMLElement>('[aria-selected="true"]');
        if (!active) return;

        movePill(pill, active, hasPainted.current);
        hasPainted.current = true;
    }, [activeTab, tabCounts]);

    useLayoutEffect(() => {
        function onResize() {
            const bar = barRef.current;
            const pill = pillRef.current;
            if (!bar || !pill) return;

            const active = bar.querySelector<HTMLElement>('[aria-selected="true"]');
            if (active) {
                movePill(pill, active, false);
            }
        }

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <div
            className="overflow-x-auto max-inline-full"
            role="tablist"
            aria-label="Filter notifications"
        >
            <div ref={barRef} className="t-tabs">
                <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
                {NOTIFICATION_TABS.map((tab) => {
                    const count = tabCounts[tab.value];
                    const isActive = activeTab === tab.value;

                    return (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className="t-tab body-xs inline-flex items-center gap-1.5 font-medium"
                            onClick={() => onTabChange(tab.value)}
                        >
                            <span>{tab.label}</span>
                            {count > 0 ? (
                                <span className="tabular text-ink-subtle">{count}</span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function NotificationsHeader({
    unreadCount,
    activeTab,
    tabCounts,
    onMarkAllRead,
    onTabChange,
}: {
    unreadCount: number;
    activeTab: NotificationTab;
    tabCounts: Record<NotificationTab, number>;
    onMarkAllRead: () => void;
    onTabChange: (tab: NotificationTab) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <h2 className="body font-display font-semibold text-ink">Notifications</h2>
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Mark all as read"
                                disabled={unreadCount === 0}
                                onClick={onMarkAllRead}
                            >
                                <CheckCheck aria-hidden strokeWidth={1.75} />
                            </Button>
                        }
                    />
                    <TooltipContent side="bottom">Mark all as read</TooltipContent>
                </Tooltip>
            </div>
            <NotificationFilterTabs
                activeTab={activeTab}
                tabCounts={tabCounts}
                onTabChange={onTabChange}
            />
        </div>
    );
}

function NotificationsEmpty({
    viewAllHref,
    filtered,
}: {
    viewAllHref: string;
    filtered?: boolean;
}) {
    return (
        <EmptyState
            icon={Bell}
            heading={filtered ? "Nothing in this tab" : "Nothing yet"}
            description={
                filtered
                    ? "Try another filter or view all notifications."
                    : "When something needs your attention, it shows up here."
            }
            className="gap-3 px-2 py-14 [&>div]:gap-1"
        >
            <TextLinkButton href={viewAllHref}>View all notifications</TextLinkButton>
        </EmptyState>
    );
}

function RequestActions() {
    function handlePlaceholder(event: React.MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        toast("Approve and reject from here is coming soon");
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handlePlaceholder}>
                Decline
            </Button>
            <Button type="button" size="sm" onClick={handlePlaceholder}>
                Accept
            </Button>
        </div>
    );
}

function NotificationRowContent({ item, now }: { item: NotificationItem; now: Date }) {
    const occurredAt = item.createdAt ? new Date(item.createdAt) : null;
    const actor = getNotificationActor(item);
    const propertyLabel = getPropertyLabel(item);
    const showActions = isActionableRequest(item);

    return (
        <div className="flex inline-full items-start gap-3 min-inline-0">
            {actor ? (
                <NotificationLeadMedia>
                    <UserAvatar
                        name={actor.name}
                        imageUrl={actor.avatarUrl ?? undefined}
                        className="block-full inline-full pbs-0"
                    />
                </NotificationLeadMedia>
            ) : (
                <NotificationLeadMedia>
                    <NotificationTypeIcon type={item.type} title={item.title} body={item.body} />
                </NotificationLeadMedia>
            )}

            <div className="flex flex-1 flex-col gap-2 min-inline-0">
                <div className="flex inline-full flex-wrap items-start gap-3 min-inline-0">
                    <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                        <span
                            className={cn(
                                "body-sm line-clamp-2 text-pretty",
                                item.isRead ? "font-medium text-ink" : "font-semibold text-ink",
                            )}
                        >
                            {item.title}
                        </span>
                        {item.body ? (
                            <span className="body-xs line-clamp-2 text-pretty text-ink-muted">
                                {item.body}
                            </span>
                        ) : null}
                        {occurredAt ? (
                            <time
                                dateTime={formatDateIso(occurredAt)}
                                className="tabular body-xs text-ink-subtle"
                            >
                                {formatNotificationWhen(occurredAt)}
                            </time>
                        ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-3 overflow-visible">
                        {!item.isRead ? (
                            <span
                                aria-hidden
                                className="t-unread-dot shrink-0 rounded-full block-2.5 inline-2.5"
                            />
                        ) : (
                            <span aria-hidden className="shrink-0 block-2.5 inline-2.5" />
                        )}
                        {occurredAt ? (
                            <time
                                dateTime={formatDateIso(occurredAt)}
                                className="tabular body-xs whitespace-nowrap text-ink-subtle"
                            >
                                {formatRelativePast(occurredAt, now)}
                            </time>
                        ) : null}
                    </div>
                </div>

                {propertyLabel ? (
                    <span
                        className="
                          body-xs inline-flex inline-fit items-center gap-1 rounded-full bg-surface-muted
                          px-2.5 py-1 font-medium text-ink-muted
                        "
                    >
                        <Building2 aria-hidden className="shrink-0 block-3 inline-3" />
                        {propertyLabel}
                    </span>
                ) : null}
                {showActions ? <RequestActions /> : null}
            </div>
        </div>
    );
}

function NotificationRow({
    item,
    viewAllHref,
    now,
    onMarkRead,
    isLast,
}: {
    item: NotificationItem;
    viewAllHref: string;
    now: Date;
    onMarkRead: (id: string) => void;
    isLast: boolean;
}) {
    const href = item.href || viewAllHref;
    const actionable = isActionableRequest(item);

    const rowClass = cn(itemClass, !isLast && "border-be border-dashed border-border-warm");

    if (actionable) {
        return (
            <div className={rowClass}>
                <NotificationRowContent item={item} now={now} />
            </div>
        );
    }

    return (
        <DropdownMenuItem
            className={rowClass}
            render={<Link href={href} />}
            onClick={() => {
                if (!item.isRead) onMarkRead(item.id);
            }}
        >
            <NotificationRowContent item={item} now={now} />
        </DropdownMenuItem>
    );
}

export function PortalNotificationsMenu({
    viewAllHref,
    triggerClassName,
    tooltipLabel,
}: PortalNotificationsMenuProps) {
    const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
    const [activeTab, setActiveTab] = useState<NotificationTab>("all");
    const now = new Date();
    const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

    const tabCounts = useMemo(() => countByTab(items), [items]);
    const filteredItems = useMemo(
        () => filterNotificationsByTab(items, activeTab),
        [items, activeTab],
    );

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
                        activeTab={activeTab}
                        tabCounts={tabCounts}
                        onMarkAllRead={() => void markAllRead()}
                        onTabChange={setActiveTab}
                    />
                </DropdownMenuGroup>

                {loading && items.length === 0 ? (
                    <p className="body-sm shrink-0 px-3 py-10 text-center text-ink-muted">
                        Loading notifications…
                    </p>
                ) : items.length === 0 ? (
                    <div className="mx-auto px-3 max-inline-80">
                        <NotificationsEmpty viewAllHref={viewAllHref} />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="mx-auto px-3 max-inline-80">
                        <NotificationsEmpty viewAllHref={viewAllHref} filtered />
                    </div>
                ) : (
                    <div className="relative shrink-0 block-132 min-block-0">
                        <ScrollArea className={cn(notificationsScrollClass)}>
                            <DropdownMenuGroup
                                className={cn(
                                    "flex flex-col px-3",
                                    filteredItems.length >= 3 ? "pbe-9" : "pbe-1",
                                )}
                            >
                                {filteredItems.map((item, index) => (
                                    <NotificationRow
                                        key={item.id}
                                        item={item}
                                        viewAllHref={viewAllHref}
                                        now={now}
                                        onMarkRead={(id) => void markRead(id)}
                                        isLast={index === filteredItems.length - 1}
                                    />
                                ))}
                            </DropdownMenuGroup>
                        </ScrollArea>

                        <NotificationsFooter
                            viewAllHref={viewAllHref}
                            showFade={filteredItems.length >= 3}
                        />
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
