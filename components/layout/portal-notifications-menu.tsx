"use client";

import { type ReactNode, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import type { NotificationItem } from "@/lib/api/notifications";
import { formatCompactRelative, formatNotificationDayTime } from "@/lib/format/date";
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
    type NotificationTone,
} from "@/lib/notifications/classify";
import { getNotificationDisplayContent } from "@/lib/notifications/display-content";
import { cn } from "@/lib/utils";

import { NotificationIcon } from "@/components/shared/icons";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
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

type RespondHandler = (
    notificationId: string,
    representationId: string,
    status: "accepted" | "rejected",
) => Promise<void>;

/* Floating panel: card radius, hairline, dropdown elevation (shadow-lg per DESIGN §3.3). */
const menuSurfaceClass = `
  t-dropdown t-profile-menu t-notifications-panel animate-none! flex flex-col overflow-hidden! rounded-card border
  border-border-warm bg-surface p-0 text-ink shadow-lg ring-0
  before:backdrop-blur-none
  data-closed:animate-none!
  data-open:animate-none!
  min-inline-0 inline-[min(24rem,calc(100vw-1.5rem))] max-block-[min(40rem,var(--available-height),calc(100dvh-6rem))]
`;

/* Sized to content, capped. Never reserves height for rows that are not there. */
const notificationsListClass = `
  relative min-block-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y
  max-block-[min(28rem,calc(100dvh-16rem))]
  [scrollbar-width:thin] [scrollbar-color:var(--color-border-warm)_transparent]
`;

const rowClass = `
  group/notification relative flex inline-full cursor-pointer items-start gap-3 rounded-inner
  px-3 py-3 font-normal text-ink transition-colors duration-160
  hover:bg-surface-muted! data-highlighted:bg-surface-muted! focus:bg-surface-muted!
  data-[unread=true]:bg-brand-soft/45
`;

/* The menu item forces descendants to ink on focus; these keep the action faces intact. */
const declineActionClass = `
  font-medium
  border-border-warm! bg-surface! text-ink!
  hover:bg-surface-muted!
`;

const acceptActionClass = `
  font-medium
  bg-primary! text-primary-foreground!
  hover:bg-primary/85!
`;

const TONE_TILE_CLASS: Record<NotificationTone, string> = {
    brand: "bg-brand-soft text-brand-text!",
    urgent: "bg-urgent-soft text-urgent!",
    danger: "bg-danger-soft text-danger!",
    neutral: "bg-surface-muted text-ink-muted!",
};

function UnreadBadge({ count }: { count: number }) {
    return (
        <span
            className="t-badge t-notifications-badge"
            data-open={count > 0 ? "true" : "false"}
            aria-hidden
        >
            <span className="t-badge-dot tabular body-xs flex! items-center justify-center rounded-full bg-brand px-1 font-semibold text-canvas ring-2 ring-surface block-5 min-inline-5">
                {count > 9 ? "9+" : count}
            </span>
        </span>
    );
}

function NotificationTile({ item }: { item: NotificationItem }) {
    const { iconName, tone } = getNotificationVisual(item);
    return (
        <span
            aria-hidden
            className={cn(
                "flex shrink-0 items-center justify-center rounded-inner block-10 inline-10",
                TONE_TILE_CLASS[tone],
            )}
        >
            <NotificationIcon name={iconName} className="block-5! inline-5!" />
        </span>
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
        <div className="flex shrink-0 flex-col gap-3 px-4 pbs-4 pbe-3">
            <div className="flex items-center justify-between gap-3 min-block-8">
                <div className="flex items-baseline gap-2">
                    <h2 className="h6 text-ink">Notifications</h2>
                    {unreadCount > 0 ? (
                        <span className="tabular body-xs font-semibold text-brand-text">
                            {unreadCount} new
                        </span>
                    ) : null}
                </div>
                {unreadCount > 0 ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onMarkAllRead}
                        className="-me-2 font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
                    >
                        <NotificationIcon name="checks" aria-hidden data-icon="inline-start" />
                        Mark all read
                    </Button>
                ) : null}
            </div>
            <SlidingTabs
                value={activeTab}
                onValueChange={onTabChange}
                label="Filter notifications"
                height={36}
                stretch
                options={NOTIFICATION_TABS.filter(
                    (tab) => FEATURE_PLATFORM_OWNER || tab.value !== "requests",
                ).map((tab) => ({ ...tab, count: tabCounts[tab.value] || null }))}
            />
        </div>
    );
}

function NotificationsEmpty({ onShowAll }: { onShowAll?: () => void }) {
    const filtered = Boolean(onShowAll);
    return (
        <div className="flex flex-col items-center gap-1 px-6 py-10 text-center" role="status">
            <span
                aria-hidden
                className="mbe-3 flex items-center justify-center rounded-inner bg-surface-muted text-ink-muted block-10 inline-10"
            >
                <NotificationIcon
                    name={filtered ? "checks" : "bell"}
                    className="block-5 inline-5"
                />
            </span>
            <p className="body-sm font-semibold text-ink">
                {filtered ? "Nothing new here" : "You're up to date"}
            </p>
            <p className="body-sm text-pretty text-ink-muted max-inline-64">
                {filtered
                    ? "Other tabs may still have updates."
                    : "When something needs your attention, it shows up here."}
            </p>
            {onShowAll ? (
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={onShowAll}
                    className="mbs-1 font-semibold text-brand-text"
                >
                    Show all
                </Button>
            ) : null}
        </div>
    );
}

function NotificationsSkeleton() {
    return (
        <div className="flex flex-col gap-1 p-2" role="status" aria-live="polite">
            <span className="sr-only">Loading notifications…</span>
            {[0, 1, 2].map((key) => (
                <div key={key} aria-hidden className="flex items-start gap-3 p-3">
                    <span className="shrink-0 animate-pulse rounded-inner bg-surface-muted block-10 inline-10" />
                    <span className="flex flex-1 flex-col gap-2 pbs-1">
                        <span className="animate-pulse rounded-full bg-surface-muted block-3 inline-3/4" />
                        <span className="animate-pulse rounded-full bg-surface-muted block-3 inline-1/2" />
                    </span>
                </div>
            ))}
        </div>
    );
}

function RequestActions({
    item,
    onRespond,
}: {
    item: NotificationItem;
    onRespond: RespondHandler;
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
                      : "Couldn't send your answer. Check your connection and try again.";
            toast.error(message);
        } finally {
            setSaving(null);
        }
    }

    return (
        <div
            data-notification-actions
            className="mbs-2 flex flex-wrap items-center gap-2"
            onClick={(event) => event.stopPropagation()}
        >
            <Button
                type="button"
                variant="outline"
                size="sm"
                className={declineActionClass}
                disabled={Boolean(saving)}
                loading={saving === "rejected"}
                onClick={(event) => void handleDecision("rejected", event)}
            >
                Decline
            </Button>
            <Button
                type="button"
                size="sm"
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

function NotificationRowContent({
    item,
    userRole,
    now,
    onRespond,
}: {
    item: NotificationItem;
    userRole: string | null | undefined;
    now: Date;
    onRespond: RespondHandler;
}) {
    const occurredAt = item.createdAt ? new Date(item.createdAt) : null;
    const { title, body } = getNotificationDisplayContent(item);
    const propertyLabel = getPropertyLabel(item);
    const showActions = isActionableRequest(item, userRole);
    const decisionLabel = getRepresentationDecisionLabel(item);

    return (
        <>
            <NotificationTile item={item} />

            <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                <div className="flex items-start gap-2">
                    <span
                        data-notification-title
                        className={cn(
                            "body-sm line-clamp-2 flex-1 text-pretty text-ink",
                            item.isRead ? "font-medium" : "font-semibold",
                        )}
                    >
                        {!item.isRead ? <span className="sr-only">Unread: </span> : null}
                        {title}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 pbs-0.5">
                        {occurredAt ? (
                            <time
                                dateTime={occurredAt.toISOString()}
                                title={formatNotificationDayTime(occurredAt)}
                                className="tabular body-xs text-ink-subtle!"
                            >
                                {formatCompactRelative(occurredAt, now)}
                            </time>
                        ) : null}
                        {!item.isRead ? (
                            <span aria-hidden className="rounded-full bg-brand block-2 inline-2" />
                        ) : null}
                    </span>
                </div>

                {body ? (
                    <p
                        data-notification-body
                        className="body-sm line-clamp-2 wrap-anywhere text-ink-muted!"
                    >
                        {body}
                    </p>
                ) : null}

                {propertyLabel ? (
                    <span className="body-xs mbs-1 inline-flex items-center gap-1.5 text-ink-muted! max-inline-full">
                        <NotificationIcon
                            name="building"
                            aria-hidden
                            className="shrink-0 text-ink-subtle! block-3.5 inline-3.5"
                        />
                        <span className="truncate">{propertyLabel}</span>
                    </span>
                ) : null}

                {showActions ? <RequestActions item={item} onRespond={onRespond} /> : null}

                {decisionLabel ? (
                    <span
                        data-notification-status
                        className="body-xs mbs-1.5 rounded-full bg-surface-muted px-2.5 py-1 font-semibold text-ink-muted! inline-fit"
                    >
                        {decisionLabel}
                    </span>
                ) : null}
            </div>
        </>
    );
}

function NotificationRow({
    item,
    viewAllHref,
    userRole,
    now,
    onMarkRead,
    onRespond,
}: {
    item: NotificationItem;
    viewAllHref: string;
    userRole: string | null | undefined;
    now: Date;
    onMarkRead: (id: string) => void;
    onRespond: RespondHandler;
}) {
    const content = (
        <NotificationRowContent item={item} userRole={userRole} now={now} onRespond={onRespond} />
    );

    if (isActionableRequest(item, userRole)) {
        return (
            <DropdownMenuItem closeOnClick={false} className={rowClass} data-unread={!item.isRead}>
                {content}
            </DropdownMenuItem>
        );
    }

    return (
        <DropdownMenuItem
            className={rowClass}
            data-unread={!item.isRead}
            render={<Link href={item.href || viewAllHref} />}
            onClick={() => {
                if (!item.isRead) onMarkRead(item.id);
            }}
        >
            {content}
        </DropdownMenuItem>
    );
}

function NotificationDayBlock({
    section,
    children,
}: {
    section: NotificationDaySection;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-0.5" role="presentation">
            <p className="body-xs sticky inset-bs-0 z-1 bg-surface px-3 pbs-3 pbe-1.5 font-semibold text-ink-subtle">
                {section.label}
            </p>
            {children}
        </div>
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
    // Tab badges count what is new, so "All 1 · Visits 1" means the same thing everywhere.
    const tabCounts = useMemo(() => countByTab(items.filter((item) => !item.isRead)), [items]);
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
                className="block-5! inline-5!"
            />
            <UnreadBadge count={unreadCount} />
        </DropdownMenuTrigger>
    );

    let list: ReactNode;
    if (loading && items.length === 0) {
        list = <NotificationsSkeleton />;
    } else if (items.length === 0) {
        list = <NotificationsEmpty />;
    } else if (filteredItems.length === 0) {
        list = <NotificationsEmpty onShowAll={() => setActiveTab("all")} />;
    } else {
        list = (
            <div
                key={activeTab}
                className={notificationsListClass}
                role="region"
                aria-label="Notification list"
                tabIndex={0}
            >
                <DropdownMenuGroup className="t-tabs-panel flex flex-col gap-1 px-2 pbe-2">
                    {daySections.map((section) => (
                        <NotificationDayBlock key={section.dayKey} section={section}>
                            {section.items.map((item) => (
                                <NotificationRow
                                    key={item.id}
                                    item={item}
                                    viewAllHref={viewAllHref}
                                    userRole={userRole}
                                    now={now}
                                    onMarkRead={(id) => void markRead(id)}
                                    onRespond={respondToRepresentation}
                                />
                            ))}
                        </NotificationDayBlock>
                    ))}
                </DropdownMenuGroup>
            </div>
        );
    }

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

            <DropdownMenuContent align="end" sideOffset={12} className={menuSurfaceClass}>
                <NotificationsHeader
                    unreadCount={unreadCount}
                    activeTab={activeTab}
                    tabCounts={tabCounts}
                    onMarkAllRead={() => void markAllRead()}
                    onTabChange={setActiveTab}
                />

                <div aria-hidden className="shrink-0 border-be border-border-warm" />

                {list}

                <div className="shrink-0 border-bs border-border-warm p-2">
                    <Button
                        variant="ghost"
                        size="md"
                        nativeButton={false}
                        render={<Link href={viewAllHref} />}
                        className="font-semibold text-ink inline-full hover:bg-surface-muted hover:text-ink"
                    >
                        View all notifications
                        <NotificationIcon
                            name="arrow"
                            aria-hidden
                            data-icon="inline-end"
                            className="block-4 inline-4"
                        />
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
