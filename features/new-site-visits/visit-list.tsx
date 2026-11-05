"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";
import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterChip, filterChipClassName, FilterChipCount } from "@/components/shared/filter-chip";
import { CalendarDays, Plus, Search, SlidersHorizontal, User } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";

import { DATE_RANGES, type SiteVisit, VISIT_TABS, visitState, type VisitTab } from "./model";
import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";
import type { VisitFilters } from "./visit-filters";
import { VisitSelect } from "./visit-select";
import { VisitStatusBadge } from "./visit-status";

import styles from "./visits.module.css";

const LIST_COPY = {
    upcoming: ["Your next visits", "Scheduled visits appear here until their start time."],
    running: ["Happening now", "These visits are within their scheduled start and end times."],
    needs_update: [
        "Did these visits happen?",
        "The time has ended. Record attendance or reschedule.",
    ],
    completed: ["Completed visits", "Visits you have confirmed as attended."],
    not_attended: [
        "Not attended",
        "Visits you marked as not attended. Schedule a new visit when ready.",
    ],
};

export function VisitList({
    visits,
    shown,
    tab,
    now,
    search,
    filters,
    range,
    onTab,
    onSearch,
    onRange,
    onFilters,
    onClear,
    onSchedule,
    onOpen,
}: {
    visits: SiteVisit[];
    shown: SiteVisit[];
    tab: VisitTab;
    now: number;
    search: string;
    filters: VisitFilters;
    range: string;
    onTab: (tab: VisitTab) => void;
    onSearch: (query: string) => void;
    onRange: (range: string) => void;
    onFilters: () => void;
    onClear: () => void;
    onSchedule: () => void;
    onOpen: (id: string) => void;
}) {
    const count = Object.entries(filters).filter(([key, value]) => key !== "range" && value).length;
    const filtered = count > 0 || !!search || filters.range === "custom";
    const copy =
        filters.archive === "all"
            ? ["All visits", "Your complete visit history, including cancelled visits."]
            : filters.archive === "cancelled"
              ? ["Cancelled visits", "Cancelled visits stay in your history."]
              : LIST_COPY[tab];
    return (
        <Tabs
            className="gap-6"
            value={filters.archive || tab}
            onValueChange={(value) => {
                if (VISIT_TABS.some((t) => t.value === value)) onTab(value as VisitTab);
            }}
        >
            <PortalSectionNav>
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="h3 text-ink">Site visits</h1>
                        <p className="body-sm mbs-1 text-ink-muted">
                            {visits.length
                                ? "Your clients, properties and visit times in one place."
                                : "Plan your client visits and keep the timing in one place."}
                        </p>
                    </div>
                    <Button onClick={onSchedule}>
                        <Plus aria-hidden />
                        Schedule visit
                    </Button>
                </header>
            </PortalSectionNav>
            <div className={styles.listToolbar}>
                <div className="flex flex-wrap items-center gap-3 max-inline-full min-inline-0">
                    <FilterChip
                        label="Filters"
                        icon={SlidersHorizontal}
                        count={count}
                        isActive={count > 0}
                        clearable={count > 0}
                        onClick={onFilters}
                        onClear={onClear}
                    />
                    <div className="overflow-x-auto max-inline-full">
                        <TabsList
                            aria-label="Visit status"
                            className="gap-3 bg-transparent p-0 block-auto! max-inline-full"
                        >
                            {VISIT_TABS.map((t) => (
                                <TabsPrimitive.Tab
                                    key={t.value}
                                    value={t.value}
                                    className={cn(
                                        "group/visit-tab",
                                        filterChipClassName(!filters.archive && tab === t.value),
                                    )}
                                >
                                    {t.label}
                                    <FilterChipCount
                                        count={
                                            visits.filter((v) => visitState(v, now) === t.value)
                                                .length
                                        }
                                        isActive={!filters.archive && tab === t.value}
                                    />
                                </TabsPrimitive.Tab>
                            ))}
                        </TabsList>
                    </div>
                </div>
                {visits.length > 0 && (
                    <div className={styles.searchRow}>
                        <label className={styles.searchField}>
                            <span className="sr-only">Search visits</span>
                            <Input
                                startIcon={Search}
                                placeholder="Search client or property"
                                value={search}
                                onValueChange={onSearch}
                                clearable
                            />
                        </label>
                        <VisitSelect
                            compact
                            label="Visit date range"
                            value={range}
                            options={DATE_RANGES}
                            onChange={onRange}
                        />
                        <span className={styles.timezone}>Times in IST</span>
                        {filtered && (
                            <Button variant="ghost" size="sm" onClick={onClear}>
                                Clear filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
            <TabsContent value={filters.archive || tab} aria-label={copy[0]}>
                {visits.length > 0 && (
                    <div className={styles.listIntro}>
                        <h2>{copy[0]}</h2>
                        <p>{copy[1]}</p>
                    </div>
                )}
                {visits.length === 0 ? (
                    <EmptyState
                        className="py-16"
                        icon={CalendarDays}
                        heading="Schedule your first site visit"
                        description="Choose a client, a property and a start and end time. We will remind you when it starts and ask how it went."
                    >
                        <Button onClick={onSchedule}>Schedule a visit</Button>
                    </EmptyState>
                ) : shown.length === 0 ? (
                    <EmptyState
                        className="py-16"
                        icon={CalendarDays}
                        heading={
                            filtered
                                ? "No visits match your filters"
                                : tab === "needs_update"
                                  ? "You're all up to date"
                                  : "No visits to show"
                        }
                        description={
                            filtered
                                ? "Try another search or clear your filters."
                                : "Your visits will appear here when there's something to show."
                        }
                    >
                        <Button onClick={filtered ? onClear : onSchedule}>
                            {filtered ? "Clear filters" : "Schedule a visit"}
                        </Button>
                    </EmptyState>
                ) : (
                    <div className={styles.list}>
                        {shown.map((visit) => {
                            const client = PREVIEW_CLIENTS.find((c) => c.id === visit.clientId);
                            const property = PREVIEW_PROPERTIES.find(
                                (p) => p.id === visit.propertyId,
                            );
                            const state = visitState(visit, now);
                            return (
                                <article className={styles.visitRow} key={visit.id}>
                                    <div className={styles.rowTime}>
                                        <small>{formatVisitDate(visit.startsAt)}</small>
                                        <time dateTime={visit.startsAt}>
                                            {formatVisitTime(visit.startsAt)} –{" "}
                                            {formatVisitTime(visit.endsAt)}
                                        </time>
                                    </div>
                                    <div className={styles.rowClient}>
                                        <User aria-hidden />
                                        <div>
                                            <strong>{client?.name}</strong>
                                            <p>
                                                {property?.configLabel} · {property?.title}
                                            </p>
                                            <small>
                                                {property?.locality}, {property?.city}
                                            </small>
                                        </div>
                                    </div>
                                    <div className={styles.rowStatus}>
                                        <VisitStatusBadge state={state} />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        aria-label={`${state === "needs_update" ? "Update" : "View"} visit with ${client?.name}`}
                                        onClick={() => onOpen(visit.id)}
                                    >
                                        {state === "needs_update" ? "Update visit" : "View visit"}
                                    </Button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}
