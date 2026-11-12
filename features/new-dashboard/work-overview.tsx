"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import { formatBudgetAmount } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import {
    ArrowRight,
    Building,
    CalendarClock,
    CalendarPlus,
    CallIcon,
    ChartBar,
    Check,
    Clock,
    MapPin,
    MoreHorizontal,
    Trash2,
    X,
} from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

import { columnValue } from "@/features/pipeline/deal-attention";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import { DashboardTasksCard } from "@/features/tasks/dashboard-tasks-card";

import { MOCK_PIPELINE, MOCK_VISITS, type PreviewVisit } from "./mock-work-overview";

import nextVisitStyles from "./next-visit.module.css";
import taskStyles from "./task-card.module.css";
import visitStyles from "./visit-card.module.css";

const CARD =
    "flex min-inline-0 flex-col rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 sm:p-5";
const LINK =
    "body-sm inline-flex min-block-11 items-center gap-2 rounded-control font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring";
const TAG = "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 caption font-medium";
/** Track remaining content so fixed footers only cast a shadow over a scrollable list. */
function useScrollFooter() {
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [hasMore, setHasMore] = useState(false);
    const measure = useCallback(() => {
        const viewport = viewportRef.current;
        if (viewport) {
            setHasMore(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 1);
        }
    }, []);
    useEffect(() => {
        const observer = new ResizeObserver(measure);
        if (viewportRef.current) observer.observe(viewportRef.current);
        if (contentRef.current) observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [measure]);
    return { viewportRef, contentRef, hasMore, measure };
}

function PipelineOverview() {
    const total = MOCK_PIPELINE.reduce((sum, stage) => sum + stage.count, 0);
    const pipelineValue = columnValue(
        MOCK_DEALS.filter((deal) => deal.status !== "closed" && deal.status !== "lost"),
    );
    const monthlyRent = MOCK_DEALS.filter(
        (deal) => deal.status !== "closed" && deal.status !== "lost" && deal.property.isRent,
    ).reduce((sum, deal) => sum + deal.property.amountInr, 0);
    const chartData = [Object.fromEntries(MOCK_PIPELINE.map((stage) => [stage.id, stage.count]))];
    const chartConfig = Object.fromEntries(
        MOCK_PIPELINE.map((stage, index) => [
            stage.id,
            { label: stage.label, color: `var(--color-stage-${index + 1})` },
        ]),
    );
    return (
        <section className={cn(CARD, "block-full")} aria-labelledby="preview-pipeline-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="preview-pipeline-title" className="h5 text-ink">
                        Pipeline overview
                    </h2>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/broker/pipeline" />}
                >
                    <ChartBar aria-hidden />
                    Open pipeline
                </Button>
            </div>
            <ChartContainer
                config={chartConfig}
                className="mx-auto mbs-2 aspect-auto block-44 inline-full max-inline-72"
                aria-label={`Pipeline: ${total} active clients. ${MOCK_PIPELINE.map((stage) => `${stage.label}: ${stage.count}`).join(", ")}`}
            >
                <RadialBarChart
                    data={chartData}
                    startAngle={180}
                    endAngle={0}
                    cy={140}
                    innerRadius={90}
                    outerRadius={120}
                    accessibilityLayer
                >
                    <PolarAngleAxis
                        type="number"
                        domain={[0, total || 1]}
                        tick={false}
                        axisLine={false}
                    />
                    {MOCK_PIPELINE.map((stage) => (
                        <RadialBar
                            key={stage.id}
                            dataKey={stage.id}
                            fill={chartConfig[stage.id].color}
                            stackId="pipeline"
                            cornerRadius={5}
                            className="stroke-surface stroke-2"
                            isAnimationActive={false}
                        />
                    ))}
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                            content={({ viewBox }) => {
                                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox))
                                    return null;
                                return (
                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                        <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy ?? 0) - 22}
                                            className="fill-ink text-3xl font-semibold tabular-nums"
                                        >
                                            {total.toLocaleString("en-IN")}
                                        </tspan>
                                        <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy ?? 0) + 1}
                                            className="fill-ink-muted text-sm font-semibold"
                                        >
                                            Active clients
                                        </tspan>
                                    </text>
                                );
                            }}
                        />
                    </PolarRadiusAxis>
                </RadialBarChart>
            </ChartContainer>
            <dl className="mx-auto mbs-2 grid grid-cols-2 text-center inline-full max-inline-80">
                <div className="px-3">
                    <dt className="text-xs font-semibold text-ink-muted">Total sale value</dt>
                    <dd className="h5 mbs-1 text-ink tabular-nums">{pipelineValue.sale ?? "—"}</dd>
                </div>
                <div className="border-s border-border-warm px-3">
                    <dt className="text-xs font-semibold text-ink-muted">Total monthly rent</dt>
                    <dd className="h5 mbs-1 text-ink tabular-nums">
                        {formatBudgetAmount(monthlyRent)}/mo
                    </dd>
                </div>
            </dl>
            <dl className="mbs-auto grid grid-cols-2 gap-x-3 gap-y-4 pbs-5 sm:grid-cols-4">
                {MOCK_PIPELINE.map((stage) => {
                    const status = stage.id === "site_visit" ? "visit" : stage.id;
                    const deals = MOCK_DEALS.filter((deal) => deal.status === status);
                    const value = columnValue(deals);
                    const rent = deals
                        .filter((deal) => deal.property.isRent)
                        .reduce((sum, deal) => sum + deal.property.amountInr, 0);
                    return (
                        <div key={stage.id} className="text-center">
                            <dt className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-muted">
                                <span
                                    aria-hidden
                                    className={cn(
                                        "shrink-0 rounded-xs block-2 inline-2",
                                        stage.color,
                                    )}
                                />
                                {stage.label}
                            </dt>
                            <dd className="mbs-1 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 text-sm font-semibold text-ink tabular-nums">
                                {value.sale && <span>{value.sale}</span>}
                                {value.rent && (
                                    <span className="text-xs text-ink-muted">
                                        {formatBudgetAmount(rent)}/mo
                                    </span>
                                )}
                                {!value.sale && !value.rent && <span>—</span>}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </section>
    );
}

function VisitDetails({ visit, children }: { visit: PreviewVisit; children: React.ReactElement }) {
    return (
        <Popover>
            <PopoverTrigger render={children} />
            <PopoverContent align="end" className="max-inline-[calc(100vw-2rem)]">
                <PopoverTitle>{visit.client}</PopoverTitle>
                <p className="body-sm font-medium text-ink">
                    {visit.time}–{visit.end}
                </p>
                <p className="body-sm text-ink-muted">{visit.property}</p>
                <p className="body-sm flex items-center gap-1.5 text-ink-muted">
                    <MapPin aria-hidden className="shrink-0 block-4 inline-4" />
                    {visit.location}
                </p>
                <span
                    className={cn(
                        TAG,
                        "self-start",
                        visit.needsUpdate
                            ? "bg-urgent-soft text-urgent"
                            : "bg-brand-soft text-brand-text",
                    )}
                >
                    {visit.outcome
                        ? visit.outcome === "attended"
                            ? "Attended"
                            : "Not attended"
                        : visit.needsUpdate
                          ? "Needs update"
                          : "Confirmed"}
                </span>
            </PopoverContent>
        </Popover>
    );
}

function NextVisit() {
    const visit = MOCK_VISITS.find((item) => !item.needsUpdate && !item.outcome);
    if (!visit) return null;

    return (
        <section className={nextVisitStyles.card} aria-labelledby="preview-next-visit-title">
            <div className={nextVisitStyles.header}>
                <h2 id="preview-next-visit-title" className="body-sm font-semibold">
                    Your next visit
                </h2>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon"
                                className={nextVisitStyles.menuTrigger}
                                aria-label="More visit actions"
                            />
                        }
                    >
                        <MoreHorizontal aria-hidden />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            render={
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                />
                            }
                        >
                            <MapPin aria-hidden />
                            View location on Maps
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/broker/visits" />}>
                            <CalendarClock aria-hidden />
                            View all visits
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className={nextVisitStyles.schedule}>
                <p className={nextVisitStyles.time}>
                    {visit.time.endsWith(visit.end.slice(-2))
                        ? visit.time.slice(0, -3)
                        : visit.time}
                    &ndash;{visit.end}
                </p>
                <p className={nextVisitStyles.countdown}>
                    <Clock aria-hidden className="block-4 inline-4" />
                    Starts in 1 hour
                </p>
            </div>

            <div className={nextVisitStyles.details}>
                <div className={nextVisitStyles.cover}>
                    <Building aria-hidden className={nextVisitStyles.coverFallback} />
                    <AppImage src={visit.coverImage} alt="" fill sizes="64px" />
                </div>
                <div className={nextVisitStyles.property}>
                    <p className={nextVisitStyles.propertyName}>{visit.property}</p>
                    <p className={nextVisitStyles.location}>
                        <MapPin aria-hidden className="shrink-0 block-3.5 inline-3.5" />
                        {visit.location}
                    </p>
                    <div className={nextVisitStyles.people}>
                        <p className={nextVisitStyles.client}>
                            <span>Client</span>
                            <span className="font-semibold">{visit.client}</span>
                        </p>
                        <p className={nextVisitStyles.client}>
                            <span>Owner</span>
                            <span className="font-semibold">{visit.owner}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className={nextVisitStyles.actions}>
                <VisitDetails visit={visit}>
                    <Button variant="highlight" className={nextVisitStyles.action}>
                        View visit
                        <ArrowRight aria-hidden />
                    </Button>
                </VisitDetails>
                <Popover>
                    <PopoverTrigger
                        render={
                            <Button
                                variant="ghost"
                                className={cn(nextVisitStyles.action, nextVisitStyles.call)}
                            />
                        }
                    >
                        <CallIcon aria-hidden />
                        Call client
                    </PopoverTrigger>
                    <PopoverContent className="max-inline-[calc(100vw-2rem)]">
                        <PopoverTitle>{visit.client}</PopoverTitle>
                        <p className="body-sm text-ink-muted">Phone number not shared.</p>
                    </PopoverContent>
                </Popover>
            </div>
        </section>
    );
}

function TodayVisits() {
    const {
        viewportRef: visitViewportRef,
        contentRef: visitContentRef,
        hasMore: visitsHaveMore,
        measure: measureVisits,
    } = useScrollFooter();
    const [visits, setVisits] = useState(MOCK_VISITS);
    const [visitAnnouncement, setVisitAnnouncement] = useState("");
    const [filter, setFilter] = useState<
        "scheduled" | "needsUpdate" | "confirmed" | "completed" | "notAttended"
    >("scheduled");
    const visitTabsRef = useRef<HTMLDivElement>(null);
    const visitTabsPillRef = useRef<HTMLSpanElement>(null);
    const visitTabsPainted = useRef(false);
    const scheduled = visits.length;
    const needsUpdate = visits.filter((visit) => visit.needsUpdate).length;
    const confirmed = visits.filter((visit) => !visit.needsUpdate && !visit.outcome).length;
    const completed = visits.filter((visit) => visit.outcome === "attended").length;
    const notAttended = visits.filter((visit) => visit.outcome === "notAttended").length;
    const visitTabOptions = [
        ["scheduled", "Today", scheduled],
        ["needsUpdate", "Needs update", needsUpdate],
        ["completed", "Completed", completed],
        ["notAttended", "Not attended", notAttended],
    ] as const;
    const visible = visits.filter((visit) => {
        if (filter === "needsUpdate") return visit.needsUpdate;
        if (filter === "confirmed") return !visit.needsUpdate && !visit.outcome;
        if (filter === "completed") return visit.outcome === "attended";
        if (filter === "notAttended") return visit.outcome === "notAttended";
        return true;
    });
    const groups =
        filter === "scheduled"
            ? (["needsUpdate", "confirmed", "completed", "notAttended"] as const)
            : ([filter] as const);

    const moveVisitTabsPill = useCallback((animate: boolean) => {
        const bar = visitTabsRef.current;
        const pill = visitTabsPillRef.current;
        const activeTab = bar?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (!pill || !activeTab) return;

        const previousTransition = pill.style.transition;
        if (!animate) pill.style.transition = "none";
        pill.style.transform = `translateX(${activeTab.offsetLeft}px)`;
        pill.style.width = `${activeTab.offsetWidth}px`;
        if (!animate) {
            void pill.offsetWidth;
            pill.style.transition = previousTransition;
        }
    }, []);

    useLayoutEffect(() => {
        moveVisitTabsPill(visitTabsPainted.current);
        visitTabsPainted.current = true;
    }, [filter, scheduled, needsUpdate, confirmed, completed, notAttended, moveVisitTabsPill]);

    useLayoutEffect(() => {
        const bar = visitTabsRef.current;
        if (!bar) return;
        const observer = new ResizeObserver(() => moveVisitTabsPill(false));
        observer.observe(bar);
        bar.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => observer.observe(tab));
        return () => observer.disconnect();
    }, [moveVisitTabsPill]);

    return (
        <section
            className={cn(CARD, taskStyles.card, taskStyles.fixedCard)}
            aria-labelledby="preview-today-visits-title"
        >
            <p className="sr-only" role="status">
                {visitAnnouncement}
            </p>
            <header className={visitStyles.header}>
                <div className={visitStyles.heading}>
                    <h2 id="preview-today-visits-title" className="h5 text-ink">
                        Today&apos;s visits
                    </h2>
                </div>
                <div className="ms-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/broker/visits?tab=slots" />}
                    >
                        <CalendarPlus aria-hidden />
                        Schedule visit
                    </Button>
                </div>
            </header>
            <div
                ref={visitTabsRef}
                className={cn(
                    "t-tabs t-tabs-surface t-tabs-compact",
                    taskStyles.tabs,
                    visitStyles.tabs,
                )}
                role="tablist"
                aria-label="Filter visits"
            >
                <span ref={visitTabsPillRef} className="t-tabs-pill" aria-hidden="true" />
                {visitTabOptions.map(([value, label, count], index) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={filter === value}
                        aria-controls="visit-list-panel"
                        tabIndex={filter === value ? 0 : -1}
                        onClick={() => setFilter(value)}
                        onKeyDown={(event) => {
                            let next = index;
                            if (event.key === "ArrowRight") {
                                next = (index + 1) % visitTabOptions.length;
                            } else if (event.key === "ArrowLeft") {
                                next =
                                    (index - 1 + visitTabOptions.length) % visitTabOptions.length;
                            } else if (event.key === "Home") {
                                next = 0;
                            } else if (event.key === "End") {
                                next = visitTabOptions.length - 1;
                            } else {
                                return;
                            }
                            event.preventDefault();
                            setFilter(visitTabOptions[next][0]);
                            event.currentTarget.parentElement
                                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                                [next]?.focus();
                        }}
                        className={cn("t-tab", taskStyles.tab, visitStyles.tab)}
                    >
                        {label}
                        {count > 0 ? <span className={taskStyles.count}>{count}</span> : null}
                    </button>
                ))}
            </div>
            <div
                ref={visitViewportRef}
                onScroll={measureVisits}
                className={cn(taskStyles.scrollViewport, visitStyles.viewport)}
                tabIndex={0}
                role="region"
                aria-label="Today's visit list"
            >
                <div ref={visitContentRef} className={taskStyles.list}>
                    <div
                        key={filter}
                        id="visit-list-panel"
                        role="tabpanel"
                        className="t-tabs-panel"
                    >
                        {groups.map((group) => {
                            const items = visible.filter((visit) =>
                                group === "needsUpdate"
                                    ? visit.needsUpdate
                                    : group === "completed"
                                      ? visit.outcome === "attended"
                                      : group === "notAttended"
                                        ? visit.outcome === "notAttended"
                                        : !visit.needsUpdate && !visit.outcome,
                            );
                            if (!items.length) return null;
                            return (
                                <div key={group}>
                                    {filter === "scheduled" ? (
                                        <h3
                                            className={cn(
                                                visitStyles.group,
                                                group === "needsUpdate" && "text-urgent",
                                            )}
                                        >
                                            {group === "needsUpdate"
                                                ? "Needs update"
                                                : group === "completed"
                                                  ? "Completed"
                                                  : group === "notAttended"
                                                    ? "Not attended"
                                                    : "Confirmed"}
                                            <span
                                                className={cn(
                                                    group === "needsUpdate"
                                                        ? "text-urgent"
                                                        : "text-ink-subtle",
                                                )}
                                            >
                                                {items.length}
                                            </span>
                                        </h3>
                                    ) : null}
                                    <ul className="divide-y divide-border-warm/60">
                                        {items.map((visit) => (
                                            <li key={visit.id} className={visitStyles.row}>
                                                <div className={visitStyles.cover}>
                                                    <Building
                                                        aria-hidden
                                                        className={visitStyles.coverFallback}
                                                    />
                                                    <AppImage
                                                        src={visit.coverImage}
                                                        alt={`Cover of ${visit.property}`}
                                                        fill
                                                        sizes="104px"
                                                    />
                                                </div>
                                                <div className={visitStyles.propertyInfo}>
                                                    <p
                                                        className={cn(
                                                            visitStyles.time,
                                                            visit.needsUpdate &&
                                                                visitStyles.timeNeedsUpdate,
                                                        )}
                                                    >
                                                        <Clock aria-hidden />
                                                        <span>
                                                            {visit.time} &ndash; {visit.end}
                                                        </span>
                                                    </p>
                                                    <VisitDetails visit={visit}>
                                                        <button
                                                            type="button"
                                                            className={visitStyles.propertyTitle}
                                                            title="View visit"
                                                            aria-label={`View visit for ${visit.property} with ${visit.client}`}
                                                        >
                                                            {visit.property}
                                                        </button>
                                                    </VisitDetails>
                                                    <div className={visitStyles.metadata}>
                                                        <p className={visitStyles.location}>
                                                            <MapPin aria-hidden />
                                                            {visit.location}
                                                        </p>
                                                    </div>
                                                </div>
                                                <dl className={visitStyles.people}>
                                                    <div>
                                                        <dt>Client</dt>
                                                        <dd>{visit.client}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>Owner</dt>
                                                        <dd>{visit.owner}</dd>
                                                    </div>
                                                </dl>
                                                <div className={visitStyles.actions}>
                                                    {visit.needsUpdate ? (
                                                        <>
                                                            {(
                                                                ["attended", "notAttended"] as const
                                                            ).map((outcome) => (
                                                                <Button
                                                                    key={outcome}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={
                                                                        outcome === "attended"
                                                                            ? "text-brand hover:bg-brand-soft hover:text-brand-text"
                                                                            : "text-danger hover:bg-danger/5 hover:text-danger"
                                                                    }
                                                                    title={
                                                                        outcome === "attended"
                                                                            ? "Mark as attended"
                                                                            : "Mark as not attended"
                                                                    }
                                                                    aria-label={`Mark visit with ${visit.client} as ${outcome === "attended" ? "attended" : "not attended"}`}
                                                                    onClick={() => {
                                                                        setVisits((current) =>
                                                                            current.map((item) =>
                                                                                item.id === visit.id
                                                                                    ? {
                                                                                          ...item,
                                                                                          needsUpdate: false,
                                                                                          outcome,
                                                                                      }
                                                                                    : item,
                                                                            ),
                                                                        );
                                                                        setVisitAnnouncement(
                                                                            `Visit with ${visit.client} marked as ${outcome === "attended" ? "attended" : "not attended"} in this preview.`,
                                                                        );
                                                                    }}
                                                                >
                                                                    {outcome === "attended" ? (
                                                                        <Check aria-hidden />
                                                                    ) : (
                                                                        <X aria-hidden />
                                                                    )}
                                                                </Button>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Popover>
                                                                <PopoverTrigger
                                                                    render={
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-ink-subtle hover:bg-surface-muted hover:text-ink"
                                                                            aria-label={`Call ${visit.client}`}
                                                                            title="Call client"
                                                                        />
                                                                    }
                                                                >
                                                                    <CallIcon aria-hidden />
                                                                </PopoverTrigger>
                                                                <PopoverContent
                                                                    align="end"
                                                                    className="max-inline-[calc(100vw-2rem)]"
                                                                >
                                                                    <PopoverTitle>
                                                                        {visit.client}
                                                                    </PopoverTitle>
                                                                    <p className="body-sm text-ink-muted">
                                                                        No client phone number is
                                                                        available in this preview.
                                                                    </p>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-danger hover:bg-danger/5 hover:text-danger"
                                                                aria-label={`Delete visit with ${visit.client}`}
                                                                title="Delete visit"
                                                                onClick={() => {
                                                                    setVisits((current) =>
                                                                        current.filter(
                                                                            (item) =>
                                                                                item.id !==
                                                                                visit.id,
                                                                        ),
                                                                    );
                                                                    setVisitAnnouncement(
                                                                        `Visit with ${visit.client} deleted from this preview.`,
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2 aria-hidden />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                        {!visible.length && (
                            <p className="body-sm py-8 text-center text-ink-muted">
                                {filter === "needsUpdate"
                                    ? "No visits are waiting for an attendance update."
                                    : filter === "confirmed"
                                      ? "No confirmed visits yet today."
                                      : filter === "completed"
                                        ? "No visits marked as attended today."
                                        : filter === "notAttended"
                                          ? "No visits marked as not attended today."
                                          : "No visits scheduled today. Select Schedule visit to book one."}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <footer
                data-scroll-shadow={visitsHaveMore}
                className={cn(
                    taskStyles.fixedFooter,
                    "flex flex-wrap items-center justify-between gap-2 border-bs border-border-warm",
                )}
            >
                <Link href="/broker/visits" className={LINK}>
                    Open visits
                    <ArrowRight aria-hidden className="block-4 inline-4" />
                </Link>
                {needsUpdate > 0 ? (
                    <p className={visitStyles.footerNote}>
                        <Clock aria-hidden />
                        {needsUpdate === 1
                            ? "1 visit needs an attendance update"
                            : `${needsUpdate} visits need an attendance update`}
                    </p>
                ) : (
                    <p className="caption text-ink-muted">No attendance updates pending</p>
                )}
            </footer>
        </section>
    );
}

/** Local preview only: this section does not read or write API data. */
export function WorkOverview() {
    return (
        <div className="grid items-stretch gap-5 xl:grid-cols-3">
            <div className="flex flex-col gap-5 min-inline-0">
                <NextVisit />
                <div className="flex-1 min-inline-0">
                    <PipelineOverview />
                </div>
            </div>
            <div className="flex flex-col min-inline-0">
                <TodayVisits />
            </div>
            <div className="min-inline-0">
                <DashboardTasksCard />
            </div>
        </div>
    );
}
