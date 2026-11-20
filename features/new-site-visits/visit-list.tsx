"use client";

import type { BrokerVisit, VisitSort, VisitTab } from "@/lib/api/site-visits";
import { addVisitDays, formatVisitDate, formatVisitTime, istDateKey } from "@/lib/visits/time";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterChip } from "@/components/shared/filter-chip";
import { IconButton } from "@/components/shared/icon-button";
import {
    type AppIcon,
    CalendarClock,
    CalendarDays,
    MapPin,
    SlidersHorizontal,
} from "@/components/shared/icons";
import {
    ListAddButton,
    ListSearchField,
    ListToolbarSelect,
} from "@/components/shared/list-toolbar";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";
import { StatusTabs } from "@/components/shared/status-tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
    DATE_RANGES,
    getVisitActions,
    VISIT_TABS,
    type VisitActionKind,
    visitDurationLabel,
    visitState,
} from "./model";
import { VISIT_ACTIONS } from "./visit-actions";
import { VISIT_STATUS_COLORS, VisitStatusBadge } from "./visit-status";

import styles from "./visits.module.css";

function VisitAction({
    label,
    icon: Icon,
    onClick,
    danger = false,
}: {
    label: string;
    icon: AppIcon;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    render={
                        <IconButton
                            tone={danger ? "danger" : "neutral"}
                            size="sm"
                            type="button"
                            aria-label={label}
                            className={`${styles.circleAction} ${danger ? styles.dangerAction : ""}`}
                            onClick={onClick}
                        />
                    }
                >
                    <Icon aria-hidden size={20} strokeWidth={1.8} />
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

const LIST_COPY: Record<VisitTab, string> = {
    upcoming: "Your next visits",
    running: "Happening now",
    needs_update: "Did these visits happen?",
    completed: "Completed visits",
    not_attended: "Not attended",
    cancelled: "Cancelled visits",
};

const EMPTY_TAB_COPY: Record<VisitTab, { heading: string; description: string }> = {
    upcoming: { heading: "No visits coming up", description: "Visits you book appear here." },
    running: {
        heading: "No visit is happening now",
        description: "A visit shows here from its start time until it ends.",
    },
    needs_update: {
        heading: "You're all up to date",
        description: "Visits whose time has ended wait here until you mark what happened.",
    },
    completed: {
        heading: "No completed visits yet",
        description: "Visits you mark as completed show here.",
    },
    not_attended: {
        heading: "No missed visits",
        description: "Visits a client didn't come to show here.",
    },
    cancelled: {
        heading: "No cancelled visits",
        description: "Visits you or an owner cancel stay here for your records.",
    },
};

export const SORT_OPTIONS: { value: VisitSort; label: string }[] = [
    { value: "start_asc", label: "Soonest first" },
    { value: "start_desc", label: "Latest first" },
    { value: "booked_desc", label: "Recently booked" },
];

const EMPTY_FRAME =
    "min-block-[min(34rem,calc(100dvh-14rem))] py-10 md:min-block-[min(38rem,calc(100dvh-12rem))]";

export function VisitList({
    visits,
    counts,
    firstRun,
    filtered,
    filterCount,
    refreshing,
    hasMore,
    loadingMore,
    tab,
    now,
    search,
    range,
    sort,
    onTab,
    onSearch,
    onRange,
    onSort,
    onFilters,
    onClear,
    onMore,
    onSchedule,
    onOpen,
    onAction,
}: {
    visits: BrokerVisit[];
    counts: Record<VisitTab, number>;
    /** The broker has never booked a visit. */
    firstRun: boolean;
    /** A search, filter or custom date range is narrowing the list. */
    filtered: boolean;
    filterCount: number;
    refreshing: boolean;
    hasMore: boolean;
    loadingMore: boolean;
    tab: VisitTab;
    now: number;
    search: string;
    range: string;
    sort: VisitSort;
    onTab: (tab: VisitTab) => void;
    onSearch: (query: string) => void;
    onRange: (range: string) => void;
    onSort: (sort: VisitSort) => void;
    onFilters: () => void;
    onClear: () => void;
    onMore: () => void;
    onSchedule: () => void;
    onOpen: (visit: BrokerVisit) => void;
    onAction: (visit: BrokerVisit, action: VisitActionKind) => void;
}) {
    const groups = new Map<string, BrokerVisit[]>();
    for (const visit of visits) {
        const day = istDateKey(visit.startsAt);
        const rows = groups.get(day) ?? [];
        rows.push(visit);
        groups.set(day, rows);
    }
    const today = istDateKey(new Date(now));
    const tomorrow = istDateKey(addVisitDays(new Date(now), 1));
    const yesterday = istDateKey(addVisitDays(new Date(now), -1));
    const dayLabel = (day: string, startsAt: string) =>
        day === today
            ? "Today"
            : day === tomorrow
              ? "Tomorrow"
              : day === yesterday
                ? "Yesterday"
                : formatVisitDate(startsAt);
    const plural = (n: number) => (n === 1 ? "visit" : "visits");
    const summaryLines = firstRun
        ? ["Schedule your first visit"]
        : [
              counts.upcoming > 0 && `${counts.upcoming} upcoming ${plural(counts.upcoming)}`,
              counts.running > 0 && `${counts.running} ${plural(counts.running)} happening now`,
              counts.needs_update > 0 &&
                  `${counts.needs_update} ${plural(counts.needs_update)} ${counts.needs_update === 1 ? "needs" : "need"} an update`,
          ].filter((line): line is string => Boolean(line));
    const empty = EMPTY_TAB_COPY[tab];

    return (
        <Tabs
            className="gap-6"
            value={tab}
            onValueChange={(value) => {
                if (VISIT_TABS.some((t) => t.value === value)) onTab(value as VisitTab);
            }}
        >
            <PortalSectionNav>
                <header className={styles.pageHeader}>
                    <h1 className="h3 text-start min-inline-0">
                        <span className="text-ink">Site visits.</span>{" "}
                        <RotatingHeaderSummary
                            key={summaryLines.join("|")}
                            lines={summaryLines.length ? summaryLines : ["Your visits at a glance"]}
                            loadingPlaceholder="Your visits at a glance"
                        />
                    </h1>
                    {firstRun && <ListAddButton label="Schedule visit" onClick={onSchedule} />}
                </header>
            </PortalSectionNav>
            {!firstRun && (
                <div className={styles.listToolbar}>
                    <div className="flex flex-wrap items-center gap-3 max-inline-full min-inline-0">
                        <FilterChip
                            label="Filters"
                            icon={SlidersHorizontal}
                            count={filterCount}
                            isActive={filterCount > 0}
                            clearable={filterCount > 0}
                            onClick={onFilters}
                            onClear={onClear}
                        />
                        <StatusTabs
                            label="Visit status"
                            value={tab}
                            tabs={VISIT_TABS.map((t) => ({
                                ...t,
                                count: counts[t.value],
                                dotClassName: VISIT_STATUS_COLORS[t.value].dotClassName,
                            }))}
                        />
                    </div>
                    <div className={styles.searchRow}>
                        <label className={styles.searchField}>
                            <span className="sr-only">Search visits</span>
                            <ListSearchField
                                placeholder="Search client, phone or property"
                                aria-label="Search visits"
                                value={search}
                                onChange={onSearch}
                                debounceMs={0}
                                fullWidth
                            />
                        </label>
                        <ListToolbarSelect
                            active
                            label="Visit dates"
                            value={range}
                            options={DATE_RANGES}
                            onChange={onRange}
                        />
                        <ListToolbarSelect
                            label="Sort visits"
                            value={sort}
                            options={SORT_OPTIONS}
                            onChange={onSort}
                        />
                        <ListAddButton label="Schedule visit" onClick={onSchedule} />
                        {filtered && (
                            <Button variant="ghost" size="sm" onClick={onClear}>
                                Clear filters
                            </Button>
                        )}
                    </div>
                </div>
            )}
            <TabsContent value={tab} aria-label={LIST_COPY[tab]}>
                {firstRun ? (
                    <EmptyState
                        className={EMPTY_FRAME}
                        icon={CalendarDays}
                        heading="Schedule your first site visit"
                        description="Pick a client, one of your listings, how long, and a free time. The visit then moves through Upcoming and Running on its own."
                    >
                        <Button size="md" variant="accent" onClick={onSchedule}>
                            Schedule a visit
                        </Button>
                    </EmptyState>
                ) : visits.length === 0 && filtered ? (
                    <div
                        className={`flex flex-col items-center justify-center gap-4 text-center ${EMPTY_FRAME}`}
                        aria-live="polite"
                    >
                        <p className="h5 text-ink">No visits match these filters</p>
                        <p className="body-sm max-w-prose text-ink-muted">
                            Try another search or clear your filters.
                        </p>
                        <button
                            type="button"
                            onClick={onClear}
                            className="body-sm font-semibold text-brand underline-offset-4 hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : visits.length === 0 ? (
                    <EmptyState
                        className={EMPTY_FRAME}
                        icon={CalendarDays}
                        heading={empty.heading}
                        description={empty.description}
                    />
                ) : (
                    <div
                        aria-busy={refreshing || undefined}
                        className={`${styles.groups} ${refreshing ? "opacity-60" : ""}`}
                    >
                        {[...groups].map(([day, rows]) => (
                            <section
                                key={day}
                                className={styles.group}
                                aria-labelledby={`visits-${day}`}
                            >
                                <div className={styles.groupHeading}>
                                    <h2 id={`visits-${day}`}>
                                        <time dateTime={day}>
                                            {dayLabel(day, rows[0].startsAt)}
                                        </time>
                                    </h2>
                                    <span
                                        className={styles.groupCount}
                                        aria-label={`${rows.length} ${plural(rows.length)}`}
                                    >
                                        {rows.length}
                                    </span>
                                </div>
                                <div className={styles.list}>
                                    {rows.map((visit) => (
                                        <VisitRow
                                            key={visit.id}
                                            visit={visit}
                                            now={now}
                                            onOpen={onOpen}
                                            onAction={onAction}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                        {hasMore && (
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={onMore}
                                    disabled={loadingMore}
                                    loading={loadingMore}
                                >
                                    {loadingMore ? "Loading more visits…" : "Show more visits"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}

function VisitRow({
    visit,
    now,
    onOpen,
    onAction,
}: {
    visit: BrokerVisit;
    now: number;
    onOpen: (visit: BrokerVisit) => void;
    onAction: (visit: BrokerVisit, action: VisitActionKind) => void;
}) {
    const state = visitState(visit, now);
    const waitingForOwner = visit.status === "scheduled" && !visit.isExclusive;
    return (
        <article className={styles.visitRow}>
            <div className={styles.rowProperty}>
                <PropertyCoverImage src={null} alt="" size={64} />
                <div>
                    <button
                        type="button"
                        className={styles.propertyLink}
                        aria-label={`Visit details for ${visit.propertyTitle} with ${visit.clientName}`}
                        onClick={() => onOpen(visit)}
                    >
                        {visit.propertyTitle}
                    </button>
                    <div className={styles.propertyMeta}>
                        <span className={styles.propertyLocation}>
                            <MapPin aria-hidden />
                            {visit.locality}
                        </span>
                        <span aria-hidden>·</span>
                        <p>{visitDurationLabel(visit.durationMinutes)}</p>
                    </div>
                </div>
            </div>
            <div className={styles.rowTime}>
                <span className={styles.detailIcon} aria-hidden>
                    <CalendarClock />
                </span>
                <div>
                    <small>{formatVisitDate(visit.startsAt)}</small>
                    <time dateTime={visit.startsAt}>
                        {formatVisitTime(visit.startsAt)} {"–"} {formatVisitTime(visit.endsAt)}
                    </time>
                </div>
            </div>
            <div className={styles.rowProfiles}>
                <div className={styles.rowClient}>
                    <UserAvatar
                        name={visit.ownerName ?? "Owner"}
                        imageUrl={visit.ownerAvatarUrl ?? undefined}
                        size="sm"
                        className="shadow-sm ring-2 ring-surface"
                    />
                    <div>
                        <small>Owner</small>
                        <strong data-missing={!visit.ownerName || undefined}>
                            {visit.ownerName ?? "Not added"}
                        </strong>
                    </div>
                </div>
                <div className={styles.rowClient}>
                    <UserAvatar
                        name={visit.clientName}
                        size="sm"
                        className="shadow-sm ring-2 ring-surface"
                    />
                    <div>
                        <small>Client</small>
                        <strong>{visit.clientName}</strong>
                    </div>
                </div>
            </div>
            <div className={styles.rowStatus}>
                <VisitStatusBadge state={state} />
                {waitingForOwner && state === "upcoming" && (
                    <small className="body-xs text-ink-muted">Waiting for owner</small>
                )}
            </div>
            <div
                className={styles.rowActions}
                role="group"
                aria-label={`Actions for ${visit.propertyTitle} with ${visit.clientName}`}
            >
                {getVisitActions(visit, now).map((action) => (
                    <VisitAction
                        key={action}
                        {...VISIT_ACTIONS[action]}
                        onClick={() =>
                            action === "view" ? onOpen(visit) : onAction(visit, action)
                        }
                    />
                ))}
            </div>
        </article>
    );
}
