import Link from "next/link";

import {
    Activity,
    BadgeCheck,
    Ban,
    Check,
    Eye,
    Link2,
    type LucideIcon,
    TrendingDown,
    X,
} from "lucide-react";

import { formatActivityDayLabel, formatCompactRelative, formatDateIso } from "@/lib/format/date";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { ShortcutKbdMessage } from "@/components/shared/shortcut-tooltip";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import type { ActivityData, ActivityEventType, ActivityItem } from "./mock-data";

export type { ActivityData, ActivityItem } from "./mock-data";

const ACTIVITY_INFO = "Recent updates across your properties, clients, and visits.";
const OWNER_ACTIVITY_INFO =
    "Recent updates across your properties, broker requests, visits, and offers.";

const MAX_ACTIVITY_ROWS = 6;

export type ActivityCardProps = {
    data: ActivityData;
    className?: string;
    portal?: "broker" | "owner";
};

type ActivityDaySection = {
    dayKey: string;
    label: string;
    items: ActivityItem[];
};

const ACTIVITY_ICON: Record<ActivityEventType, LucideIcon> = {
    request_approved: Check,
    request_declined: X,
    request_viewed: Eye,
    share_link_opened: Link2,
    property_unavailable: Ban,
    price_changed: TrendingDown,
    verification_approved: BadgeCheck,
    team_listing_added: Activity,
    team_visit_booked: Activity,
};

function groupActivitiesByDay(items: ActivityItem[], now: Date): ActivityDaySection[] {
    const byDay = new Map<string, ActivityItem[]>();

    for (const item of items) {
        const occurredAt = new Date(item.occurredAt);
        const dayKey = formatDateIso(occurredAt);
        const bucket = byDay.get(dayKey);
        if (bucket) {
            bucket.push(item);
        } else {
            byDay.set(dayKey, [item]);
        }
    }

    return [...byDay.entries()]
        .sort(([left], [right]) => right.localeCompare(left))
        .map(([dayKey, dayItems]) => ({
            dayKey,
            label: formatActivityDayLabel(new Date(dayItems[0].occurredAt), now),
            items: dayItems,
        }));
}

function EmptyActivity({ portal }: { portal: "broker" | "owner" }) {
    return (
        <EmptyState
            icon={Activity}
            heading="Nothing yet"
            description={
                portal === "owner"
                    ? "Broker requests, visit bookings, and offer updates will appear here."
                    : "Owner approvals, views, and updates will appear here."
            }
        >
            <ShortcutKbdMessage shortcutId="notifications">to view all activity</ShortcutKbdMessage>
        </EmptyState>
    );
}

function ActivityIcon({ type }: { type: ActivityEventType }) {
    const Icon = ACTIVITY_ICON[type];
    const isApproved = type === "request_approved";

    return (
        <span
            className={cn(
                `mbs-0.5 flex shrink-0 items-center justify-center rounded-control block-8 inline-8`,
                isApproved ? "bg-brand-soft text-brand" : "bg-surface-muted text-ink-muted",
            )}
        >
            <Icon aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
        </span>
    );
}

function ActivityRow({ item, now }: { item: ActivityItem; now: Date }) {
    const occurredAt = new Date(item.occurredAt);
    const whenLabel = formatCompactRelative(occurredAt, now);

    const content = (
        <>
            <ActivityIcon type={item.type} />
            <div className="flex-1 min-inline-0">
                <p className="body truncate font-medium text-ink">{item.title}</p>
                {item.subtitle ? (
                    <p className="body-sm mbs-0.5 truncate text-ink-muted">{item.subtitle}</p>
                ) : null}
            </div>
            <span className="body-xs mbs-0.5 shrink-0 font-medium text-ink-muted">{whenLabel}</span>
        </>
    );

    if (item.href) {
        return (
            <li>
                <Link
                    href={item.href}
                    className="
                      flex items-start gap-3 py-3 outline-none
                      hover:opacity-90
                      focus-visible:ring-3 focus-visible:ring-ring/30
                    "
                >
                    {content}
                </Link>
            </li>
        );
    }

    return <li className="flex items-start gap-3 py-3">{content}</li>;
}

function DaySection({ section, now }: { section: ActivityDaySection; now: Date }) {
    return (
        <li className="flex flex-col gap-1">
            <div className="flex items-center gap-3 py-2">
                <p className="body-sm shrink-0 font-semibold text-pending">{section.label}</p>
                <div className="flex-1 bg-pending/35 block-px" aria-hidden />
            </div>
            <ul className="flex flex-col">
                {section.items.map((item) => (
                    <ActivityRow key={item.id} item={item} now={now} />
                ))}
            </ul>
        </li>
    );
}

export function ActivityCard({ data, className, portal = "broker" }: ActivityCardProps) {
    const now = new Date();
    const items = data.items.slice(0, MAX_ACTIVITY_ROWS);
    const sections = groupActivitiesByDay(items, now);
    const isEmpty = items.length === 0;

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="activity-card-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={portal === "owner" ? OWNER_ACTIVITY_INFO : ACTIVITY_INFO}>
                    <span id="activity-card-heading">Activity</span>
                </CardLabel>
            </div>

            {isEmpty ? (
                <EmptyActivity portal={portal} />
            ) : (
                <div className="relative mbs-2 flex-1 min-block-0">
                    <div
                        className="
                          absolute inset-0 scrollbar-none overflow-y-auto overscroll-contain
                          [-ms-overflow-style:none]
                          [&::-webkit-scrollbar]:hidden
                        "
                    >
                        <ul className="flex flex-col gap-4">
                            {sections.map((section) => (
                                <DaySection key={section.dayKey} section={section} now={now} />
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </section>
    );
}
