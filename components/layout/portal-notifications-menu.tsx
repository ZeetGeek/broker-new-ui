"use client";

import {
    type CSSProperties,
    Fragment,
    type ReactNode,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
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
    Clock3,
    Gift,
    MessageCircle,
    Send,
    ShieldCheck,
    UserPlus,
    XCircle,
} from "lucide-react";

import type { NotificationItem } from "@/lib/api/notifications";
import { toApiInstant } from "@/lib/datetime/api";
import { formatNotificationDayTime, formatRelativePast } from "@/lib/format/date";
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
  border-border-warm bg-surface p-0 text-ink shadow-md ring-0
  before:backdrop-blur-none
  data-closed:animate-none!
  data-open:animate-none!
  min-inline-[22rem] max-inline-[28rem]
  **:data-[slot$=-item]:data-highlighted:bg-surface-muted!
  **:data-[slot$=-item]:focus:bg-surface-muted!
`;

const notificationsListClass = "relative block-136 shrink-0 min-block-0";

const notificationsScrollClass = `
  block-full overflow-hidden
  [&_[data-slot=scroll-area-thumb]]:bg-brand/55
  hover:[&_[data-slot=scroll-area-thumb]]:bg-brand/75
`;

const itemClass = `
  group/notification relative flex inline-full cursor-pointer items-start gap-3.5 rounded-inner
  px-2.5 py-3 body-sm font-normal text-ink transition-colors duration-160
  focus:text-ink!
  data-highlighted:text-ink!
  data-highlighted:[&_[data-notification-actions]_button:first-child]:border-border-warm!
  data-highlighted:[&_[data-notification-actions]_button:first-child]:bg-surface!
  data-highlighted:[&_[data-notification-actions]_button:first-child]:text-ink!
  data-highlighted:[&_[data-notification-actions]_button:last-child]:bg-primary!
  data-highlighted:[&_[data-notification-actions]_button:last-child]:text-primary-foreground!
  focus:[&_[data-notification-actions]_button:first-child]:border-border-warm!
  focus:[&_[data-notification-actions]_button:first-child]:bg-surface!
  focus:[&_[data-notification-actions]_button:first-child]:text-ink!
  focus:[&_[data-notification-actions]_button:last-child]:bg-primary!
  focus:[&_[data-notification-actions]_button:last-child]:text-primary-foreground!
`;

const listDividerClass = "mx-1 my-1 border-be border-border-warm/80";
const headerSectionDividerClass = "mx-3.5 border-be border-border-warm/80";

const declineActionClass = `
  rounded-inner! font-medium
  border-border-warm! bg-surface! text-ink!
  hover:border-border-warm! hover:bg-surface-muted! hover:text-ink!
  focus-visible:border-border-warm! focus-visible:bg-surface! focus-visible:text-ink!
`;

const acceptActionClass = `
  rounded-inner! font-medium
  bg-primary! text-primary-foreground!
  hover:bg-primary! hover:text-primary-foreground!
  focus-visible:bg-primary! focus-visible:text-primary-foreground!
`;

const unreadItemClass = `
  border border-brand-soft/60 bg-brand-soft/30
  hover:border-brand-soft/80 hover:bg-brand-soft/45!
  data-highlighted:border-brand-soft/80 data-highlighted:bg-brand-soft/45!
  focus:border-brand-soft/80 focus:bg-brand-soft/45!
`;

const notificationLeadClass = "flex shrink-0 items-start justify-center block-8 inline-8 pbs-0.5";

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

function paintNotificationFilterPill(bar: HTMLDivElement, pill: HTMLSpanElement, animate: boolean) {
    const active = bar.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!active) return;
    movePill(pill, active, animate);
}

function scrollNotificationTabIntoView(
    scrollEl: HTMLElement,
    tabEl: HTMLElement,
    animate: boolean,
) {
    const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
    if (maxScroll <= 0) return;

    const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const anchorRatio = 0.36;
    const tabStart = tabEl.offsetLeft;
    const tabWidth = tabEl.offsetWidth;
    const targetScroll = tabStart + tabWidth / 2 - scrollEl.clientWidth * anchorRatio;

    scrollEl.scrollTo({
        left: Math.max(0, Math.min(maxScroll, targetScroll)),
        behavior: animate && !prefersReducedMotion ? "smooth" : "auto",
    });
}

function NotificationsFooter({ viewAllHref }: { viewAllHref: string }) {
    return (
        <div className="absolute inset-x-0 inset-be-0 z-10 flex flex-col justify-end block-14">
            <div
                aria-hidden
                className="
                  pointer-events-none absolute inset-0 bg-linear-to-t from-surface from-45%
                  via-surface/95 to-transparent
                "
            />
            <div className="relative flex justify-center px-4 pbs-1 pbe-2.5">
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

    return (
        <span data-notification-icon className={cn("inline-flex shrink-0", colorClass)}>
            <Icon aria-hidden className="text-current block-6 inline-6" strokeWidth={1.75} />
        </span>
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
    const scrollRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const pillRef = useRef<HTMLSpanElement>(null);
    const hasPainted = useRef(false);

    function syncActiveTabScroll(animate: boolean) {
        const scrollEl = scrollRef.current;
        const bar = barRef.current;
        if (!scrollEl || !bar) return;

        const tabEl = bar.querySelector<HTMLElement>(`[data-tab-value="${activeTab}"]`);
        if (!tabEl) return;

        scrollNotificationTabIntoView(scrollEl, tabEl, animate);
    }

    useLayoutEffect(() => {
        const bar = barRef.current;
        const pill = pillRef.current;
        if (!bar || !pill) return;

        paintNotificationFilterPill(bar, pill, hasPainted.current);
        syncActiveTabScroll(hasPainted.current);
        hasPainted.current = true;
    }, [activeTab, tabCounts]);

    useLayoutEffect(() => {
        const bar = barRef.current;
        const pill = pillRef.current;
        if (!bar || !pill) return;

        function syncPill(animate: boolean) {
            const currentBar = barRef.current;
            const currentPill = pillRef.current;
            if (!currentBar || !currentPill) return;
            paintNotificationFilterPill(currentBar, currentPill, animate);
        }

        function onResize() {
            syncPill(false);
            syncActiveTabScroll(false);
        }

        const observer = new ResizeObserver(() => onResize());
        observer.observe(bar);
        window.addEventListener("resize", onResize);

        requestAnimationFrame(() => {
            syncPill(false);
            syncActiveTabScroll(false);
        });

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", onResize);
        };
    }, [activeTab]);

    function handleTabChange(tab: NotificationTab) {
        const bar = barRef.current;
        const pill = pillRef.current;
        const scrollEl = scrollRef.current;

        if (bar && pill) {
            const next = bar.querySelector<HTMLElement>(`[data-tab-value="${tab}"]`);
            if (next) {
                movePill(pill, next, hasPainted.current);
                if (scrollEl) {
                    scrollNotificationTabIntoView(scrollEl, next, hasPainted.current);
                }
            }
        }

        onTabChange(tab);
    }

    return (
        <div
            ref={scrollRef}
            className="scrollbar-none overflow-x-auto scroll-smooth max-inline-full"
            role="tablist"
            aria-label="Filter notifications"
        >
            <div ref={barRef} className="t-notif-filter-tabs">
                <span ref={pillRef} className="t-notif-filter-tabs-pill" aria-hidden="true" />
                {NOTIFICATION_TABS.map((tab) => {
                    const count = tabCounts[tab.value];
                    const isActive = activeTab === tab.value;

                    return (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            data-tab-value={tab.value}
                            className="t-notif-filter-tab body-xs"
                            onClick={() => handleTabChange(tab.value)}
                        >
                            <span className="t-notif-filter-tab-label">{tab.label}</span>
                            {count > 0 ? (
                                <span
                                    className="t-notif-filter-tab-count body-xs"
                                    data-badge={isActive ? undefined : "true"}
                                >
                                    {count}
                                </span>
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
                <h2 className="body font-display font-semibold tracking-tight text-ink">
                    Notifications
                </h2>
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    disabled={unreadCount === 0}
                    onClick={onMarkAllRead}
                    className="
                      body-xs shrink-0 gap-1.5 p-0 font-medium text-brand block-auto
                      hover:text-brand-text hover:underline
                      disabled:text-ink-subtle disabled:no-underline
                    "
                >
                    Mark all read
                    <CheckCheck aria-hidden strokeWidth={1.75} className="block-3.5 inline-3.5" />
                </Button>
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
        <div
            data-notification-actions
            className="mbs-1 flex flex-wrap items-center gap-2"
            onClick={(event) => event.stopPropagation()}
        >
            <Button
                type="button"
                variant="outline"
                size="xs"
                className={declineActionClass}
                onClick={handlePlaceholder}
            >
                Decline
            </Button>
            <Button
                type="button"
                size="xs"
                className={acceptActionClass}
                onClick={handlePlaceholder}
            >
                Accept
            </Button>
        </div>
    );
}

function measureMarqueeDuration(distancePx: number): number {
    const seconds = distancePx / 32;
    return Math.min(14, Math.max(4, seconds));
}

function NotificationDescription({ text }: { text: string }) {
    const containerRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [marquee, setMarquee] = useState({ overflows: false, distance: 0, duration: 6 });

    useLayoutEffect(() => {
        const container = containerRef.current;
        const label = textRef.current;
        if (!container || !label) return;

        function measure() {
            const currentContainer = containerRef.current;
            const currentLabel = textRef.current;
            if (!currentContainer || !currentLabel) return;

            const distance = Math.max(0, currentLabel.scrollWidth - currentContainer.clientWidth);
            setMarquee({
                overflows: distance > 4,
                distance,
                duration: measureMarqueeDuration(distance),
            });
        }

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(container);
        return () => observer.disconnect();
    }, [text]);

    const marqueeStyle = marquee.overflows
        ? ({
              "--notif-marquee-distance": `${marquee.distance}px`,
              "--notif-marquee-dur": `${marquee.duration}s`,
          } as CSSProperties)
        : undefined;

    return (
        <span
            ref={containerRef}
            data-notification-body
            data-overflow={marquee.overflows ? "true" : undefined}
            title={marquee.overflows ? text : undefined}
            className="t-notif-body-marquee body-sm text-ink-muted"
            style={marqueeStyle}
        >
            <span ref={textRef} className="t-notif-body-marquee-text">
                {text}
            </span>
        </span>
    );
}

function NotificationTimestamp({ occurredAt, now }: { occurredAt: Date; now: Date }) {
    const dateTime = toApiInstant(occurredAt);
    const metaTimeClass =
        "tabular body-xs inline-flex items-center gap-1 leading-none whitespace-nowrap text-ink-muted";
    const metaIconClass = "shrink-0 self-center text-ink-subtle block-2.5 inline-2.5";

    return (
        <div className="mbs-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 min-inline-0">
            <time
                data-notification-meta
                dateTime={dateTime}
                className={cn(metaTimeClass, "font-medium")}
            >
                <Clock3 aria-hidden className={metaIconClass} strokeWidth={1.5} />
                {formatRelativePast(occurredAt, now)}
            </time>
            <time data-notification-meta dateTime={dateTime} className={metaTimeClass}>
                <CalendarClock aria-hidden className={metaIconClass} strokeWidth={1.5} />
                {formatNotificationDayTime(occurredAt)}
            </time>
        </div>
    );
}

function NotificationRowContent({ item, now }: { item: NotificationItem; now: Date }) {
    const occurredAt = item.createdAt ? new Date(item.createdAt) : null;
    const actor = getNotificationActor(item);
    const propertyLabel = getPropertyLabel(item);
    const showActions = isActionableRequest(item);

    return (
        <div className="flex items-start gap-3 inline-full min-inline-0">
            {actor ? (
                <NotificationLeadMedia>
                    <span className="overflow-hidden rounded-full block-8 inline-8">
                        <UserAvatar
                            name={actor.name}
                            imageUrl={actor.avatarUrl ?? undefined}
                            size="fill"
                        />
                    </span>
                </NotificationLeadMedia>
            ) : (
                <NotificationLeadMedia>
                    <span
                        className="
                          inline-flex items-center justify-center rounded-full block-8 inline-8
                        "
                    >
                        <NotificationTypeIcon
                            type={item.type}
                            title={item.title}
                            body={item.body}
                        />
                    </span>
                </NotificationLeadMedia>
            )}

            <div className="pie-6 flex flex-1 flex-col gap-2 min-inline-0">
                <span
                    data-notification-title
                    className={cn(
                        "body-sm line-clamp-2 text-pretty text-ink",
                        item.isRead ? "font-medium" : "font-semibold",
                    )}
                >
                    {item.title}
                </span>

                {item.body ? <NotificationDescription text={item.body} /> : null}

                {propertyLabel ? (
                    <span
                        data-notification-body
                        className="
                          body-xs inline-flex items-center gap-1 rounded-full border
                          border-border-warm bg-surface-muted/80 px-2 py-0.5 font-medium
                          text-ink-muted inline-fit
                        "
                    >
                        <Building2
                            aria-hidden
                            className="shrink-0 text-ink-muted block-3 inline-3"
                        />
                        <span className="truncate">{propertyLabel}</span>
                    </span>
                ) : null}

                {showActions ? <RequestActions /> : null}

                {occurredAt ? <NotificationTimestamp occurredAt={occurredAt} now={now} /> : null}
            </div>

            {!item.isRead ? (
                <span
                    aria-hidden
                    className="
                      t-unread-dot absolute inset-e-2 inset-bs-2 rounded-full block-2 inline-2
                    "
                />
            ) : null}
        </div>
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
    const href = item.href || viewAllHref;
    const actionable = isActionableRequest(item);

    const rowClass = cn(itemClass, !item.isRead && unreadItemClass);

    if (actionable) {
        return (
            <DropdownMenuItem className={rowClass}>
                <NotificationRowContent item={item} now={now} />
            </DropdownMenuItem>
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
                <div className="shrink-0 px-4 py-3.5">
                    <NotificationsHeader
                        unreadCount={unreadCount}
                        activeTab={activeTab}
                        tabCounts={tabCounts}
                        onMarkAllRead={() => void markAllRead()}
                        onTabChange={setActiveTab}
                    />
                </div>

                <div aria-hidden className={headerSectionDividerClass} role="separator" />

                {loading && items.length === 0 ? (
                    <p className="body-sm shrink-0 px-4 py-12 text-center text-ink-muted">
                        Loading notifications…
                    </p>
                ) : items.length === 0 ? (
                    <div className="mx-auto px-4 max-inline-80">
                        <NotificationsEmpty viewAllHref={viewAllHref} />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="mx-auto px-4 max-inline-80">
                        <NotificationsEmpty viewAllHref={viewAllHref} filtered />
                    </div>
                ) : (
                    <div className={notificationsListClass}>
                        <ScrollArea className={notificationsScrollClass}>
                            <DropdownMenuGroup className="flex flex-col px-2.5 py-2 pbe-14">
                                {filteredItems.map((item, index) => (
                                    <Fragment key={item.id}>
                                        <NotificationRow
                                            item={item}
                                            viewAllHref={viewAllHref}
                                            now={now}
                                            onMarkRead={(id) => void markRead(id)}
                                        />
                                        {index < filteredItems.length - 1 ? (
                                            <div
                                                aria-hidden
                                                className={listDividerClass}
                                                role="separator"
                                            />
                                        ) : null}
                                    </Fragment>
                                ))}
                            </DropdownMenuGroup>
                        </ScrollArea>

                        <NotificationsFooter viewAllHref={viewAllHref} />
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
