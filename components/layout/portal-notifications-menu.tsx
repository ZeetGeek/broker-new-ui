"use client";

import {
    Fragment,
    type ReactNode,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { ApiError } from "@/lib/api/client";
import type { NotificationItem } from "@/lib/api/notifications";
import { formatNotificationDayTime } from "@/lib/format/date";
import {
    countByTab,
    filterNotificationsByTab,
    getNotificationVisual,
    getPropertyLabel,
    getRepresentationDecisionLabel,
    groupNotificationsByDay,
    isActionableRequest,
    NOTIFICATION_TABS,
    type NotificationDaySection,
    type NotificationTab,
} from "@/lib/notifications/classify";
import { getNotificationDisplayContent } from "@/lib/notifications/display-content";
import { cn } from "@/lib/utils";

import { NotificationIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { useNotifications } from "@/providers/notification-provider";
import { useAppSelector } from "@/store/hooks";

export type PortalNotificationsMenuProps = {
    viewAllHref: string;
    triggerClassName?: string;
    tooltipLabel?: string;
};

const menuSurfaceClass = `
  t-dropdown t-profile-menu t-notifications-panel animate-none! flex flex-col overflow-hidden! rounded-card border
  border-border-warm bg-surface p-0 text-ink shadow-xl ring-0
  before:backdrop-blur-none
  data-closed:animate-none!
  data-open:animate-none!
  min-inline-0 inline-[min(23rem,calc(100vw-1.5rem))] max-block-[min(44rem,var(--available-height),calc(100dvh-6rem))]
  **:data-[slot$=-item]:data-highlighted:bg-surface-muted!
  **:data-[slot$=-item]:focus:bg-surface-muted!
`;

const notificationsListClass = `
  relative overflow-y-auto overscroll-contain touch-pan-y
  block-[min(30rem,calc(100dvh-17rem))] min-block-0
  [scrollbar-width:thin] [scrollbar-color:var(--color-border-warm)_transparent]
`;

const itemClass = `
  group/notification relative flex inline-full cursor-pointer items-start gap-3.5 rounded-inner
  px-3 py-4 body-sm font-normal text-ink transition-colors duration-160
  hover:bg-surface-muted!
  focus:text-ink!
  not-data-[variant=destructive]:focus:**:text-inherit
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

const listDividerClass = "mx-3 my-1.5 border-be border-border-warm/60";
const headerSectionDividerClass = "shrink-0 border-be border-border-warm/70";

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

const notificationLeadClass = "flex shrink-0 items-start justify-center pbs-0.5 inline-5";

function NotificationLeadMedia({ children }: { children: ReactNode }) {
    return <span className={notificationLeadClass}>{children}</span>;
}

function NotificationsFooter({ viewAllHref }: { viewAllHref: string }) {
    return (
        <div className="shrink-0 border-bs border-border-warm/70 px-4 py-2">
            <Button
                variant="link"
                nativeButton={false}
                render={<Link href={viewAllHref} />}
                className="body-sm gap-2 font-semibold text-ink inline-full min-block-11 hover:text-ink"
            >
                View all notifications
                <NotificationIcon name="arrow" aria-hidden className="block-4 inline-4" />
            </Button>
        </div>
    );
}

function UnreadBadge({ count }: { count: number }) {
    return (
        <span
            className="t-badge t-notifications-badge"
            data-open={count > 0 ? "true" : "false"}
            aria-hidden
        >
            <span className="t-badge-dot tabular body-xs flex! items-center justify-center rounded-md bg-brand px-1 font-semibold text-canvas ring-2 ring-surface-muted block-5 min-inline-5">
                {count > 9 ? "9+" : count}
            </span>
        </span>
    );
}

function NotificationTypeIcon({ item }: { item: NotificationItem }) {
    const { iconName } = getNotificationVisual(item);
    return (
        <NotificationIcon
            name={iconName}
            aria-hidden
            className="shrink-0 text-ink! block-5! inline-5!"
        />
    );
}

function NotificationDayHeader({ label }: { label: string }) {
    return (
        <div className="px-3 pbs-5 pbe-1.5" role="presentation">
            <p className="body-xs font-semibold text-brand-text">{label}</p>
        </div>
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
    const painted = useRef(false);

    const moveToActive = useCallback((animate: boolean) => {
        const bar = barRef.current;
        const pill = pillRef.current;
        const tab = bar?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (!tab || !pill) return;
        const previous = pill.style.transition;
        if (!animate) pill.style.transition = "none";
        pill.style.transform = `translateX(${tab.offsetLeft}px)`;
        pill.style.width = `${tab.offsetWidth}px`;
        if (!animate) {
            void pill.offsetWidth;
            pill.style.transition = previous;
        }
    }, []);

    useLayoutEffect(() => {
        moveToActive(painted.current);
        painted.current = true;
    }, [activeTab, tabCounts, moveToActive]);

    useLayoutEffect(() => {
        const bar = barRef.current;
        if (!bar) return;
        // Keep the observer stable: recreating it on selection would cancel the slide.
        const observer = new ResizeObserver(() => moveToActive(false));
        observer.observe(bar);
        bar.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => observer.observe(tab));
        return () => observer.disconnect();
    }, [moveToActive]);

    const tabs = NOTIFICATION_TABS.filter(
        (tab) => FEATURE_PLATFORM_OWNER || tab.value !== "requests",
    );
    return (
        <div
            ref={barRef}
            className="t-tabs t-tabs-surface t-tabs-stretch t-notifications-tabs no-scrollbar overflow-x-auto"
            role="tablist"
            aria-label="Filter notifications"
        >
            <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
            {tabs.map((tab, index) => {
                const active = activeTab === tab.value;
                return (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        className="t-tab body-xs whitespace-nowrap"
                        onClick={() => onTabChange(tab.value)}
                        onKeyDown={(event) => {
                            let next = index;
                            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
                            else if (event.key === "ArrowLeft")
                                next = (index - 1 + tabs.length) % tabs.length;
                            else if (event.key === "Home") next = 0;
                            else if (event.key === "End") next = tabs.length - 1;
                            else return;
                            event.preventDefault();
                            event.stopPropagation();
                            onTabChange(tabs[next].value);
                            const buttons =
                                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                                    '[role="tab"]',
                                );
                            buttons?.[next]?.focus();
                        }}
                    >
                        {tab.label}
                        {tabCounts[tab.value] > 0 ? (
                            <span className="tabular text-ink-subtle">{tabCounts[tab.value]}</span>
                        ) : null}
                    </button>
                );
            })}
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
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-ink">Notifications</h2>
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    disabled={unreadCount === 0}
                    onClick={onMarkAllRead}
                    className="
                      body-xs shrink-0 gap-1.5 p-0 font-medium text-ink min-block-11
                      hover:text-ink hover:underline
                      disabled:text-ink-subtle disabled:no-underline
                    "
                >
                    Mark all read
                    <NotificationIcon name="checks" aria-hidden className="block-4 inline-4" />
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

function NotificationsEmpty({ filtered = false }: { filtered?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center" role="status">
            <NotificationIcon
                name="bell"
                aria-hidden
                className="mbe-1 text-ink-subtle block-7 inline-7"
            />
            <p className="body-sm font-semibold text-ink">
                {filtered ? "Nothing in this tab" : "You're up to date"}
            </p>
            <p className="body-sm text-pretty text-ink-muted">
                {filtered
                    ? "Try another filter or view all notifications."
                    : "When something needs your attention, it shows up here."}
            </p>
        </div>
    );
}

function RequestActions({
    item,
    onRespond,
}: {
    item: NotificationItem;
    onRespond: (
        notificationId: string,
        representationId: string,
        status: "accepted" | "rejected",
    ) => Promise<void>;
}) {
    const [saving, setSaving] = useState<"accepted" | "rejected" | null>(null);
    const representationId = item.relatedRepresentationId;

    async function handleDecision(status: "accepted" | "rejected", event: React.MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        if (!representationId || saving) return;

        setSaving(status);
        try {
            await onRespond(item.id, representationId, status);
            toast.success(status === "accepted" ? "Request accepted" : "Request declined");
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "Failed to respond";
            toast.error(message);
        } finally {
            setSaving(null);
        }
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
                disabled={Boolean(saving)}
                loading={saving === "rejected"}
                onClick={(event) => void handleDecision("rejected", event)}
            >
                Decline
            </Button>
            <Button
                type="button"
                size="xs"
                className={acceptActionClass}
                disabled={Boolean(saving)}
                loading={saving === "accepted"}
                onClick={(event) => void handleDecision("accepted", event)}
            >
                Accept
            </Button>
        </div>
    );
}

function NotificationDescription({ text }: { text: string }) {
    return (
        <span
            data-notification-body
            className="body-sm wrap-anywhere whitespace-normal text-ink-muted!"
        >
            {text}
        </span>
    );
}

function NotificationRowContent({
    item,
    userRole,
    onRespond,
}: {
    item: NotificationItem;
    userRole: string | null | undefined;
    onRespond: (
        notificationId: string,
        representationId: string,
        status: "accepted" | "rejected",
    ) => Promise<void>;
}) {
    const occurredAt = item.createdAt ? new Date(item.createdAt) : null;
    const { title, body } = getNotificationDisplayContent(item);
    const propertyLabel = getPropertyLabel(item);
    const showActions = isActionableRequest(item, userRole);
    const decisionLabel = getRepresentationDecisionLabel(item);

    return (
        <div
            className="flex items-start gap-3 inline-full min-inline-0"
            title={occurredAt ? `Received ${formatNotificationDayTime(occurredAt)}` : undefined}
        >
            <NotificationLeadMedia>
                <NotificationTypeIcon item={item} />
            </NotificationLeadMedia>

            <div className="pie-4 flex flex-1 flex-col gap-1.5 min-inline-0">
                <span
                    data-notification-title
                    className="body-sm line-clamp-2 font-semibold text-pretty text-ink"
                >
                    {!item.isRead ? <span className="sr-only">Unread: </span> : null}
                    {title}
                </span>

                {body ? <NotificationDescription text={body} /> : null}

                {propertyLabel ? (
                    <span
                        data-notification-body
                        className="
                          body-xs inline-flex items-center gap-1.5 text-ink-muted! max-inline-full
                        "
                    >
                        <NotificationIcon
                            name="building"
                            aria-hidden
                            className="shrink-0 text-ink-muted! block-3 inline-3"
                        />
                        <span className="truncate">{propertyLabel}</span>
                    </span>
                ) : null}

                {showActions ? <RequestActions item={item} onRespond={onRespond} /> : null}

                {decisionLabel ? (
                    <span
                        data-notification-status
                        className="
                          body-xs rounded-md border border-border-warm bg-surface-muted/80 px-2
                          py-0.5 font-medium text-ink-muted! inline-fit
                        "
                    >
                        {decisionLabel}
                    </span>
                ) : null}
            </div>

            {!item.isRead ? (
                <span
                    aria-hidden
                    className="
                      absolute inset-e-3 inset-bs-5 rounded-full bg-brand block-1.5 inline-1.5
                    "
                />
            ) : null}
        </div>
    );
}

function NotificationDayBlock({
    section,
    viewAllHref,
    userRole,
    onMarkRead,
    onRespond,
    showHeader,
    isLastSection,
}: {
    section: NotificationDaySection;
    viewAllHref: string;
    userRole: string | null | undefined;
    onMarkRead: (id: string) => void;
    onRespond: (
        notificationId: string,
        representationId: string,
        status: "accepted" | "rejected",
    ) => Promise<void>;
    showHeader: boolean;
    isLastSection: boolean;
}) {
    return (
        <div className="flex flex-col">
            {showHeader ? <NotificationDayHeader label={section.label} /> : null}
            {section.items.map((item, index) => {
                const isLastItem = index === section.items.length - 1;
                const showDivider = !(isLastItem && isLastSection);

                return (
                    <Fragment key={item.id}>
                        <NotificationRow
                            item={item}
                            viewAllHref={viewAllHref}
                            userRole={userRole}
                            onMarkRead={onMarkRead}
                            onRespond={onRespond}
                        />
                        {showDivider ? (
                            <div aria-hidden className={listDividerClass} role="separator" />
                        ) : null}
                    </Fragment>
                );
            })}
        </div>
    );
}

function NotificationRow({
    item,
    viewAllHref,
    userRole,
    onMarkRead,
    onRespond,
}: {
    item: NotificationItem;
    viewAllHref: string;
    userRole: string | null | undefined;
    onMarkRead: (id: string) => void;
    onRespond: (
        notificationId: string,
        representationId: string,
        status: "accepted" | "rejected",
    ) => Promise<void>;
}) {
    const href = item.href || viewAllHref;
    const actionable = isActionableRequest(item, userRole);

    const rowClass = itemClass;

    if (actionable) {
        return (
            <DropdownMenuItem closeOnClick={false} className={rowClass}>
                <NotificationRowContent item={item} userRole={userRole} onRespond={onRespond} />
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
            <NotificationRowContent item={item} userRole={userRole} onRespond={onRespond} />
        </DropdownMenuItem>
    );
}

export function PortalNotificationsMenu({
    viewAllHref,
    triggerClassName,
    tooltipLabel,
}: PortalNotificationsMenuProps) {
    const { items, unreadCount, loading, markRead, markAllRead, respondToRepresentation } =
        useNotifications();
    const userRole = useAppSelector((state) => state.auth.user?.role);
    const [activeTab, setActiveTab] = useState<NotificationTab>("all");
    const now = new Date();
    const hasUnread = unreadCount > 0;
    const label = hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications";
    const tabCounts = useMemo(() => countByTab(items), [items]);
    const filteredItems = useMemo(
        () => filterNotificationsByTab(items, activeTab),
        [items, activeTab],
    );
    const daySections = groupNotificationsByDay(filteredItems, now);

    const trigger = (
        <DropdownMenuTrigger
            render={
                <Button
                    type="button"
                    variant="outline"
                    size="icon-md"
                    aria-label={label}
                    className={cn("relative", triggerClassName)}
                />
            }
        >
            <NotificationIcon
                name={hasUnread ? "bell-ring" : "bell"}
                aria-hidden
                className="block-4 inline-4"
            />
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
                <div className="shrink-0 p-4">
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
                        <NotificationsEmpty />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="mx-auto px-4 max-inline-80">
                        <NotificationsEmpty filtered />
                    </div>
                ) : (
                    <div
                        key={activeTab}
                        className={notificationsListClass}
                        role="region"
                        aria-label="Notification list"
                        tabIndex={0}
                    >
                        <DropdownMenuGroup className="t-tabs-panel flex flex-col px-4 py-2">
                            {daySections.map((section, sectionIndex) => (
                                <NotificationDayBlock
                                    key={section.dayKey}
                                    section={section}
                                    viewAllHref={viewAllHref}
                                    userRole={userRole}
                                    onMarkRead={(id) => void markRead(id)}
                                    onRespond={respondToRepresentation}
                                    showHeader={true}
                                    isLastSection={sectionIndex === daySections.length - 1}
                                />
                            ))}
                        </DropdownMenuGroup>
                    </div>
                )}
                <NotificationsFooter viewAllHref={viewAllHref} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
