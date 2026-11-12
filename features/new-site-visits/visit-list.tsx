"use client";

import { formatVisitDate, formatVisitTime } from "@/lib/visits/time";

import { PortalSectionNav } from "@/components/layout/portal-section-nav";
import { AppImage } from "@/components/shared/app-image";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterChip } from "@/components/shared/filter-chip";
import {
    type AppIcon,
    Building2,
    CalendarClock,
    CalendarDays,
    MapPin,
    Plus,
    Search,
    SlidersHorizontal,
} from "@/components/shared/icons";
import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";
import { StatusTabs } from "@/components/shared/status-tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
    DATE_RANGES,
    getVisitActions,
    type SiteVisit,
    VISIT_TABS,
    type VisitActionKind,
    visitState,
    type VisitTab,
} from "./model";
import { PREVIEW_CLIENTS, PREVIEW_PROPERTIES } from "./preview-store";
import { VISIT_ACTIONS } from "./visit-actions";
import type { VisitFilters } from "./visit-filters";
import { VisitSelect } from "./visit-select";
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
                        <button
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
    onEdit,
    onAction,
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
    onEdit: (id: string) => void;
    onAction: (id: string, action: VisitActionKind) => void;
}) {
    const count = Object.entries(filters).filter(([key, value]) => key !== "range" && value).length;
    const filtered = count > 0 || !!search || filters.range === "custom";
    const copy =
        filters.archive === "all"
            ? ["All visits", "Your complete visit history, including cancelled visits."]
            : filters.archive === "cancelled"
              ? ["Cancelled visits", "Cancelled visits stay in your history."]
              : LIST_COPY[tab];
    const summaryLines = visits.length
        ? VISIT_TABS.map(({ value }) => {
              const total = visits.filter((visit) => visitState(visit, now) === value).length;
              const label = total === 1 ? "visit" : "visits";
              return {
                  total,
                  text:
                      value === "upcoming"
                          ? `${total} upcoming ${label}`
                          : value === "running"
                            ? `${total} ${label} happening now`
                            : value === "needs_update"
                              ? `${total} ${label} ${total === 1 ? "needs" : "need"} an update`
                              : value === "completed"
                                ? `${total} completed ${label}`
                                : `${total} ${label} not attended`,
              };
          })
              .filter(({ total }) => total > 0)
              .map(({ text }) => text)
        : ["Schedule your first visit"];
    return (
        <Tabs
            className="gap-6"
            value={filters.archive || tab}
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
                            lines={summaryLines}
                            loadingPlaceholder="Your visits at a glance"
                        />
                    </h1>
                    {visits.length === 0 && (
                        <Button
                            variant="accent"
                            className={styles.scheduleButton}
                            onClick={onSchedule}
                        >
                            <Plus aria-hidden />
                            Schedule visit
                        </Button>
                    )}
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
                    <StatusTabs
                        label="Visit status"
                        value={filters.archive || tab}
                        tabs={VISIT_TABS.map((t) => ({
                            ...t,
                            count: visits.filter((v) => visitState(v, now) === t.value).length,
                            dotClassName: VISIT_STATUS_COLORS[t.value].dotClassName,
                        }))}
                    />
                </div>
                {visits.length > 0 && (
                    <div className={styles.searchRow}>
                        <label className={styles.searchField}>
                            <span className="sr-only">Search visits</span>
                            <Input
                                size="sm"
                                startIcon={Search}
                                wrapperClassName="rounded-control shadow-sm inline-full"
                                className="rounded-control border! border-border-warm bg-surface text-sm font-medium shadow-sm block-[38px]! hover:border-ink/25! focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20"
                                placeholder="Search client or property"
                                value={search}
                                onValueChange={onSearch}
                                clearable
                            />
                        </label>
                        <VisitSelect
                            compact
                            toolbar
                            label="Visit date range"
                            value={range}
                            options={DATE_RANGES}
                            onChange={onRange}
                        />
                        <Button
                            variant="accent"
                            className={styles.scheduleButton}
                            onClick={onSchedule}
                        >
                            <Plus aria-hidden />
                            Schedule visit
                        </Button>
                        {filtered && (
                            <Button variant="ghost" size="sm" onClick={onClear}>
                                Clear filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
            <TabsContent value={filters.archive || tab} aria-label={copy[0]}>
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
                                    <div className={styles.rowProperty}>
                                        <span className={styles.propertyThumbnail}>
                                            <Building2 aria-hidden />
                                            {property?.imageUrl && (
                                                <AppImage
                                                    src={property.imageUrl}
                                                    alt={property.title}
                                                    fill
                                                    sizes="64px"
                                                />
                                            )}
                                        </span>
                                        <div>
                                            <button
                                                type="button"
                                                className={styles.propertyLink}
                                                aria-label={`Visit details for ${property?.title} with ${client?.name}`}
                                                onClick={() => onOpen(visit.id)}
                                            >
                                                {property?.title}
                                            </button>
                                            <div className={styles.propertyMeta}>
                                                <span className={styles.propertyLocation}>
                                                    <MapPin aria-hidden />
                                                    {property?.locality}, {property?.city}
                                                </span>
                                                <span aria-hidden>·</span>
                                                <p>{property?.configLabel}</p>
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
                                                {formatVisitTime(visit.startsAt)} {"\u2013"}{" "}
                                                {formatVisitTime(visit.endsAt)}{" "}
                                                <span className={styles.timeZone}>IST</span>
                                            </time>
                                        </div>
                                    </div>
                                    <div className={styles.rowProfiles}>
                                        <div className={styles.rowClient}>
                                            <UserAvatar
                                                name={property?.owner?.name ?? "Owner"}
                                                imageUrl={property?.owner?.imageUrl}
                                                size="sm"
                                                className="shadow-sm ring-2 ring-surface"
                                            />
                                            <div>
                                                <small>Owner</small>
                                                <strong
                                                    data-missing={!property?.owner || undefined}
                                                >
                                                    {property?.owner?.name ?? "Not added"}
                                                </strong>
                                            </div>
                                        </div>
                                        <div className={styles.rowClient}>
                                            <UserAvatar
                                                name={client?.name ?? "Client"}
                                                size="sm"
                                                className="shadow-sm ring-2 ring-surface"
                                            />
                                            <div>
                                                <small>Client</small>
                                                <strong>{client?.name ?? "Not added"}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.rowStatus}>
                                        <VisitStatusBadge state={state} />
                                    </div>
                                    <div
                                        className={styles.rowActions}
                                        role="group"
                                        aria-label={`Actions for ${property?.title} with ${client?.name}`}
                                    >
                                        {getVisitActions(visit, now).map((action) => (
                                            <VisitAction
                                                key={action}
                                                {...VISIT_ACTIONS[action]}
                                                onClick={() =>
                                                    action === "edit"
                                                        ? onEdit(visit.id)
                                                        : action === "view"
                                                          ? onOpen(visit.id)
                                                          : onAction(visit.id, action)
                                                }
                                            />
                                        ))}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}
