import type { ComponentType, ReactNode } from "react";
import Link from "next/link";

import {
    AlertCircle,
    CircleCheck,
    Eye,
    Link as LinkIcon,
    ShieldCheck,
    TrendingDown,
    X,
} from "lucide-react";

import {
    type ActivityDayGroup,
    activityDayGroup,
    formatCompactRelative,
    formatDateIso,
    formatDateShort,
} from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import type { ActivityData, ActivityEventType, ActivityItem } from "./mock-data";
import { TextLinkButton } from "./text-link-button";

const ACTIVITY_INFO =
    "What happened while you were away — owner replies, link opens, price and availability changes.";

const MAX_ROWS = 6;
const VIEW_ALL_HREF = "/broker/notifications?tab=activity";

const DAY_GROUP_ORDER: ActivityDayGroup[] = ["today", "yesterday", "this_week"];

const DAY_GROUP_LABEL: Record<ActivityDayGroup, string> = {
    today: "Today",
    yesterday: "Yesterday",
    this_week: "This week",
};

type LucideIcon = ComponentType<{
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean | "true" | "false";
}>;

type EventVisual = {
    Icon: LucideIcon;
    iconClassName: string;
    subtitleClassName: string;
};

const EVENT_VISUAL: Record<ActivityEventType, EventVisual> = {
    request_approved: {
        Icon: CircleCheck,
        iconClassName: "text-success",
        subtitleClassName: "text-ink-muted",
    },
    request_declined: {
        Icon: X,
        iconClassName: "text-ink-subtle",
        subtitleClassName: "text-ink-muted",
    },
    request_viewed: {
        Icon: Eye,
        iconClassName: "text-ink-subtle",
        subtitleClassName: "text-ink-muted",
    },
    share_link_opened: {
        Icon: LinkIcon,
        iconClassName: "text-ink-subtle",
        subtitleClassName: "text-ink-muted",
    },
    property_unavailable: {
        Icon: AlertCircle,
        iconClassName: "text-urgent",
        subtitleClassName: "text-urgent",
    },
    price_changed: {
        Icon: TrendingDown,
        iconClassName: "text-ink-subtle",
        subtitleClassName: "text-ink-muted",
    },
    verification_approved: {
        Icon: ShieldCheck,
        iconClassName: "text-success",
        subtitleClassName: "text-ink-muted",
    },
    team_listing_added: {
        Icon: CircleCheck,
        iconClassName: "text-ink-subtle",
        subtitleClassName: "text-ink-muted",
    },
    team_visit_booked: {
        Icon: CircleCheck,
        iconClassName: "text-ink-subtle",
        subtitleClassName: "text-ink-muted",
    },
};

export type ActivityCardProps = {
    data: ActivityData;
    now: Date;
    className?: string;
};

function ActivityRow({ item, now }: { item: ActivityItem; now: Date }) {
    const visual = EVENT_VISUAL[item.type];
    const { Icon } = visual;
    const relative = formatCompactRelative(new Date(item.occurredAt), now);

    return (
        <li>
            <Link
                href={item.href}
                className={cn(
                    "flex items-start gap-3 py-2.5 outline-none inline-full",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                )}
            >
                <Icon
                    aria-hidden
                    className={cn("mbs-0.5 shrink-0 block-4 inline-4", visual.iconClassName)}
                    strokeWidth={1.75}
                />
                <div className="flex-1 min-inline-0">
                    <div className="flex items-start gap-2">
                        <p className="body flex-1 font-semibold text-ink min-inline-0">
                            {item.title}
                        </p>
                        <time
                            dateTime={item.occurredAt}
                            className="body-xs tabular shrink-0 text-ink-subtle"
                        >
                            {relative}
                        </time>
                    </div>
                    <p className={cn("body-sm mbs-0.5 truncate", visual.subtitleClassName)}>
                        {item.subtitle}
                    </p>
                </div>
            </Link>
        </li>
    );
}

function EmptyActivity() {
    return <p className="body mbs-4 text-ink-muted">Nothing new since you last opened.</p>;
}

function groupItems(
    items: ActivityItem[],
    now: Date,
): { group: ActivityDayGroup; items: ActivityItem[] }[] {
    const buckets: Record<ActivityDayGroup, ActivityItem[]> = {
        today: [],
        yesterday: [],
        this_week: [],
    };

    for (const item of items) {
        buckets[activityDayGroup(new Date(item.occurredAt), now)].push(item);
    }

    return DAY_GROUP_ORDER.filter((group) => buckets[group].length > 0).map((group) => ({
        group,
        items: buckets[group],
    }));
}

/** Day-group heading — same “label · date + rule” pattern as TodayTimeline NowMarker. */
function DayGroupLabel({ group, now }: { group: ActivityDayGroup; now: Date }) {
    const label = DAY_GROUP_LABEL[group];

    let heading: ReactNode = label;
    if (group === "today" || group === "yesterday") {
        const date = group === "today" ? now : new Date(now.getTime() - 86_400_000);
        const dateLabel = formatDateShort(date);
        const dateIso = formatDateIso(date);
        heading = (
            <>
                {label}
                <span aria-hidden> · </span>
                <time dateTime={dateIso}>{dateLabel}</time>
            </>
        );
    }

    return (
        <div className="flex items-center gap-3 py-1" role="presentation">
            <p className="body-sm shrink-0 font-semibold whitespace-nowrap text-urgent">
                {heading}
            </p>
            <span className="flex-1 bg-urgent/70 block-px min-inline-0" aria-hidden />
        </div>
    );
}

/**
 * Ambient inbound feed — owner/buyer/system events only.
 * Returns null when empty so the dashboard grid collapses the slot.
 */
export function ActivityCard({ data, now, className }: ActivityCardProps) {
    const items = data.items.slice(0, MAX_ROWS);
    if (items.length === 0) return null;

    const groups = groupItems(items, now);
    const showFade = items.length >= 3;

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="activity-card-heading"
        >
            <div className="flex shrink-0 items-center justify-between gap-3">
                <CardLabel info={ACTIVITY_INFO}>
                    <span id="activity-card-heading">Activity</span>
                </CardLabel>
                <span className="body-xs shrink-0 text-ink-muted">Since you last opened</span>
            </div>

            {groups.length === 0 ? (
                <EmptyActivity />
            ) : (
                <div className="relative mbs-2 flex-1 min-block-0">
                    <div
                        className="
                          absolute inset-0 scrollbar-none overflow-y-auto overscroll-contain
                          [-ms-overflow-style:none]
                          [&::-webkit-scrollbar]:hidden
                        "
                    >
                        <div className={cn("flex flex-col gap-3", showFade && "pbe-7")}>
                            {groups.map(({ group, items: groupItems }) => (
                                <div key={group}>
                                    <DayGroupLabel group={group} now={now} />
                                    <ul className="flex flex-col divide-y divide-border-warm/50">
                                        {groupItems.map((item) => (
                                            <ActivityRow key={item.id} item={item} now={now} />
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className="
                          absolute inset-x-0 -inset-be-4 z-10 flex flex-col justify-end block-14
                        "
                    >
                        {showFade ? (
                            <div
                                aria-hidden
                                className={`
                                  pointer-events-none absolute inset-0 bg-linear-to-t from-surface
                                  from-40% via-surface/90 to-transparent
                                `}
                            />
                        ) : null}
                        <div className="relative flex justify-center">
                            <TextLinkButton href={VIEW_ALL_HREF}>View all activity</TextLinkButton>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
