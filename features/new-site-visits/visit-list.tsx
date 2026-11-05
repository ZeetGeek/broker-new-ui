"use client";

import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { CalendarDays, Plus, Search, SlidersHorizontal, User } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    DATE_RANGES,
    type SiteVisit,
    STATE_LABELS,
    VISIT_TABS,
    visitState,
    type VisitTab,
} from "./model";
import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";
import type { VisitFilters } from "./visit-filters";

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
        <>
            <header className={styles.heading}>
                <div>
                    <h1>Site visits</h1>
                    <p>
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
            <div
                role="tablist"
                aria-label="Visit status"
                className={styles.tabs}
                onKeyDown={(event) => {
                    const buttons = Array.from(
                        event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
                    );
                    const index = buttons.indexOf(event.target as HTMLButtonElement);
                    const next =
                        event.key === "ArrowRight"
                            ? (index + 1) % buttons.length
                            : event.key === "ArrowLeft"
                              ? (index + buttons.length - 1) % buttons.length
                              : event.key === "Home"
                                ? 0
                                : event.key === "End"
                                  ? buttons.length - 1
                                  : -1;
                    if (next >= 0) {
                        event.preventDefault();
                        buttons[next].focus();
                        buttons[next].click();
                    }
                }}
            >
                {VISIT_TABS.map((t) => (
                    <button
                        type="button"
                        role="tab"
                        id={`visit-tab-${t.value}`}
                        aria-controls="visit-list"
                        aria-selected={!filters.archive && t.value === tab}
                        tabIndex={t.value === tab ? 0 : -1}
                        key={t.value}
                        onClick={() => onTab(t.value)}
                    >
                        {t.label}
                        <span>· {visits.filter((v) => visitState(v, now) === t.value).length}</span>
                    </button>
                ))}
            </div>
            {visits.length > 0 && (
                <div className={styles.searchRow}>
                    <label className={styles.searchField}>
                        <span>Search visits</span>
                        <Input
                            startIcon={Search}
                            placeholder="Search client or property"
                            value={search}
                            onValueChange={onSearch}
                            clearable
                        />
                    </label>
                    <Button variant="outline" onClick={onFilters}>
                        <SlidersHorizontal aria-hidden />
                        Filters{count > 0 ? ` (${count})` : ""}
                    </Button>
                    <label className={styles.rangeSelect}>
                        <span className="sr-only">Visit date range</span>
                        <select value={range} onChange={(e) => onRange(e.target.value)}>
                            {DATE_RANGES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <span className={styles.timezone}>Times in IST</span>
                    {filtered && (
                        <Button variant="ghost" size="sm" onClick={onClear}>
                            Clear filters
                        </Button>
                    )}
                </div>
            )}
            <section
                id="visit-list"
                role="tabpanel"
                aria-labelledby={filters.archive ? undefined : `visit-tab-${tab}`}
                aria-label={filters.archive ? copy[0] : undefined}
            >
                {visits.length > 0 && (
                    <div className={styles.listIntro}>
                        <h2>{copy[0]}</h2>
                        <p>{copy[1]}</p>
                    </div>
                )}
                {visits.length === 0 ? (
                    <div className={styles.empty}>
                        <CalendarDays aria-hidden />
                        <h2>Schedule your first site visit</h2>
                        <p>
                            Choose a client, a property and a start and end time. We will remind you
                            when it starts and ask how it went.
                        </p>
                        <Button onClick={onSchedule}>Schedule a visit</Button>
                        <p>Upcoming → Running → Needs update → Attendance recorded</p>
                    </div>
                ) : shown.length === 0 ? (
                    <div className={styles.empty}>
                        <CalendarDays aria-hidden />
                        <h2>
                            {filtered
                                ? "No visits match your filters"
                                : tab === "needs_update"
                                  ? "You’re all up to date"
                                  : "No visits to show"}
                        </h2>
                        <p>
                            {filtered
                                ? "Try another search or clear your filters."
                                : "Your visits will appear here when there’s something to show."}
                        </p>
                        <Button onClick={filtered ? onClear : onSchedule}>
                            {filtered ? "Clear filters" : "Schedule a visit"}
                        </Button>
                    </div>
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
                                    <span className={styles.status} data-state={state}>
                                        {state === "upcoming" ? "Scheduled" : STATE_LABELS[state]}
                                    </span>
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
            </section>
        </>
    );
}
