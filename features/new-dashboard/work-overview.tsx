"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import { formatDurationUntil } from "@/lib/format/date";
import { formatBudgetAmount } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import {
    portalProfileMenuItemClass,
    portalProfileMenuSurfaceClass,
} from "@/components/layout/portal-profile-menu";
import { CardLink } from "@/components/shared/card-link";
import { ContactName } from "@/components/shared/contact-name";
import { IconButton } from "@/components/shared/icon-button";
import {
    ArrowRight,
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
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

import { columnValue } from "@/features/pipeline/deal-attention";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import { DashboardTasksCard } from "@/features/tasks/dashboard-tasks-card";

import {
    MOCK_PIPELINE,
    MOCK_VISITS,
    type PreviewVisit,
    type PreviewVisitPhase,
} from "./mock-work-overview";

import styles from "./dashboard.module.css";
import nextVisitStyles from "./next-visit.module.css";
import taskStyles from "./task-card.module.css";
import visitStyles from "./visit-card.module.css";

const VISIT_FILTER_TABS: { value: PreviewVisitPhase; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "running", label: "Running" },
    { value: "needs_update", label: "Needs update" },
];

const CARD =
    "flex min-inline-0 flex-col rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 sm:p-5";
const LINK =
    "body-sm inline-flex min-block-11 items-center gap-2 rounded-control font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring";
/** Track remaining content so fixed footers only cast a shadow over a scrollable list. */
function useScrollFooter() {
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [hasMore, setHasMore] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const measure = useCallback(() => {
        const viewport = viewportRef.current;
        if (viewport) {
            setHasMore(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop > 1);
            setScrolled(viewport.scrollTop > 1);
        }
    }, []);
    useEffect(() => {
        const observer = new ResizeObserver(measure);
        if (viewportRef.current) observer.observe(viewportRef.current);
        if (contentRef.current) observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [measure]);
    return { viewportRef, contentRef, hasMore, scrolled, measure };
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

function visitTimeRange(visit: PreviewVisit) {
    const start = visit.time.endsWith(visit.end.slice(-2)) ? visit.time.slice(0, -3) : visit.time;
    return `${start}–${visit.end}`;
}

function visitStatus(visit: PreviewVisit) {
    if (visit.phase === "needs_update") return "Ended · needs update";
    if (visit.phase === "running") return "Happening now";
    if (visit.startsInMinutes == null) return "Upcoming";
    // Preview data stores an offset, so measure it from a fixed origin.
    return `Starts ${formatDurationUntil(new Date(visit.startsInMinutes * 60_000), new Date(0)).label}`;
}

type VisitCardProps = {
    visit: PreviewVisit;
    /** Dark green "Your next visit" card; list rows use the same layout on white. */
    featured?: boolean;
    onMarkOutcome?: (outcome: "attended" | "notAttended") => void;
    onDelete?: () => void;
};

/** One visit, same anatomy everywhere: time + status → property + people → two actions. */
function VisitCard({ visit, featured = false, onMarkOutcome, onDelete }: VisitCardProps) {
    const s = featured ? nextVisitStyles : visitStyles;
    const titleId = `visit-card-${featured ? "next" : visit.id}`;
    const needsUpdate = visit.phase === "needs_update";
    const visitHref = `/broker/visits?${new URLSearchParams({ view: "detail", visit: visit.id, preview: "true" })}`;
    const rescheduleHref = `/broker/visits?${new URLSearchParams({ view: "reschedule", visit: visit.id, preview: "true" })}`;

    const menu = (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <IconButton
                        size="sm"
                        appearance={featured ? "inverse" : "outline"}
                        className={s.menuTrigger}
                        aria-label={`More actions for visit with ${visit.client}`}
                    />
                }
            >
                <MoreHorizontal aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className={cn(portalProfileMenuSurfaceClass, "inline-auto min-inline-44")}
            >
                {/* Preview IDs only open read-only sample details, never live visit mutations. */}
                <DropdownMenuItem
                    className={portalProfileMenuItemClass}
                    render={<Link href={rescheduleHref} />}
                >
                    <CalendarClock aria-hidden />
                    Reschedule
                </DropdownMenuItem>
                {onDelete ? (
                    <>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                            variant="destructive"
                            className={portalProfileMenuItemClass}
                            onClick={onDelete}
                        >
                            <Trash2 aria-hidden />
                            Delete visit
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <article data-linked-card className={s.card} aria-labelledby={titleId}>
            <CardLink href={visitHref} label={`View visit for ${visit.property}`} />
            {featured ? (
                <div className={s.header}>
                    <h2 className="body-sm font-semibold">Your next visit</h2>
                    {menu}
                </div>
            ) : null}

            <div className={s.schedule}>
                <p className={cn(s.time, needsUpdate && s.timeNeedsUpdate)}>
                    {visitTimeRange(visit)}
                </p>
                <div className={s.scheduleMeta}>
                    <p className={s.status} data-phase={visit.phase}>
                        <Clock aria-hidden />
                        {visitStatus(visit)}
                    </p>
                    {featured ? null : menu}
                </div>
            </div>

            <div className={s.details}>
                <PropertyCoverImage
                    src={visit.coverImage}
                    alt=""
                    className={s.cover}
                    sizes="64px"
                />
                <div className={s.property}>
                    <p data-card-title id={titleId} className={s.propertyName}>
                        {visit.property}
                    </p>
                    <p className={s.location}>
                        <MapPin aria-hidden />
                        {visit.location}
                    </p>
                    <div className={s.people}>
                        <p className={s.person}>
                            <span className={s.personRole}>Client</span>
                            <ContactName
                                name={visit.client}
                                contactType="buyer"
                                className={s.personName}
                            />
                        </p>
                        <p className={s.person}>
                            <span className={s.personRole}>Owner</span>
                            <ContactName
                                name={visit.owner}
                                contactType="owner"
                                className={s.personName}
                            />
                        </p>
                    </div>
                </div>
                <div className={s.price}>
                    <PriceWithCommission
                        amountInr={visit.amountInr}
                        isRent={visit.isRent}
                        commissionPercent={visit.commissionPercent}
                        commissionAmountInr={visit.commissionAmountInr}
                        audience="broker"
                        size={featured ? "lg" : "md"}
                        className={featured ? "text-surface" : undefined}
                        underlineClassName={featured ? "decoration-surface/50" : undefined}
                    />
                </div>
            </div>

            <div className={s.actions}>
                {needsUpdate && onMarkOutcome ? (
                    <>
                        <Button
                            variant={featured ? "highlight" : "accent"}
                            className={s.action}
                            aria-label={`Mark visit with ${visit.client} as attended`}
                            onClick={() => onMarkOutcome("attended")}
                        >
                            <Check aria-hidden />
                            Attended
                        </Button>
                        <Button
                            variant={featured ? "ghost" : "outline"}
                            className={cn(s.action, s.secondaryAction)}
                            aria-label={`Mark visit with ${visit.client} as not attended`}
                            onClick={() => onMarkOutcome("notAttended")}
                        >
                            <X aria-hidden />
                            Not attended
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            variant={featured ? "highlight" : "accent"}
                            className={s.action}
                            nativeButton={false}
                            render={<Link href={visitHref} />}
                        >
                            View visit
                            <ArrowRight aria-hidden />
                        </Button>
                        <Popover>
                            <PopoverTrigger
                                render={
                                    <Button
                                        variant={featured ? "ghost" : "outline"}
                                        className={cn(s.action, s.secondaryAction)}
                                        aria-label={`Call ${visit.client}`}
                                    />
                                }
                            >
                                <CallIcon aria-hidden />
                                {/* Visually hidden on narrow cards; aria-label keeps the name. */}
                                <span className={s.actionLabel}>Call client</span>
                            </PopoverTrigger>
                            <PopoverContent className="max-inline-[calc(100vw-2rem)]">
                                <PopoverTitle>
                                    <ContactName name={visit.client} contactType="buyer" />
                                </PopoverTitle>
                                <p className="body-sm text-ink-muted">
                                    No phone number on this Client yet. Open the Client record to
                                    add one, then you can call from here.
                                </p>
                            </PopoverContent>
                        </Popover>
                    </>
                )}
            </div>
        </article>
    );
}

type VisitActions = {
    visits: PreviewVisit[];
    markOutcome: (visitId: string, client: string, outcome: "attended" | "notAttended") => void;
    removeVisit: (visitId: string, client: string) => void;
};

function NextVisit({ visits, removeVisit }: Pick<VisitActions, "visits" | "removeVisit">) {
    const visit = visits.find((item) => item.phase === "upcoming" && !item.outcome);
    if (!visit) return null;
    return (
        <VisitCard visit={visit} featured onDelete={() => removeVisit(visit.id, visit.client)} />
    );
}

function TodayVisits({ visits, markOutcome, removeVisit }: VisitActions) {
    const {
        viewportRef: visitViewportRef,
        contentRef: visitContentRef,
        hasMore: visitsHaveMore,
        scrolled: visitsScrolled,
        measure: measureVisits,
    } = useScrollFooter();
    const [filter, setFilter] = useState<PreviewVisitPhase>("upcoming");
    const activeVisits = visits.filter((visit) => !visit.outcome);
    const needsUpdate = activeVisits.filter((visit) => visit.phase === "needs_update").length;
    const visible = activeVisits.filter((visit) => visit.phase === filter);

    useEffect(() => {
        const viewport = visitViewportRef.current;
        if (viewport) viewport.scrollTop = 0;
        measureVisits();
    }, [filter, measureVisits, visitViewportRef]);

    return (
        <section
            className={cn(CARD, taskStyles.card, taskStyles.fixedCard)}
            aria-labelledby="preview-today-visits-title"
        >
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
                        render={<Link href="/broker/visits?view=schedule" />}
                    >
                        <CalendarPlus aria-hidden />
                        Schedule visit
                    </Button>
                </div>
            </header>
            <div className={visitStyles.tabsBar} data-scrolled={visitsScrolled ? "true" : "false"}>
                <SlidingTabs
                    value={filter}
                    options={VISIT_FILTER_TABS.map((tab) => {
                        const count = activeVisits.filter(
                            (visit) => visit.phase === tab.value,
                        ).length;
                        return {
                            id: `dashboard-visits-tab-${tab.value}`,
                            value: tab.value,
                            label: tab.label,
                            count,
                        };
                    })}
                    onValueChange={setFilter}
                    label="Filter visits"
                    panelId="visit-list-panel"
                    className={cn(taskStyles.tabs, visitStyles.tabs)}
                    tabClassName={visitStyles.tab}
                />
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
                        aria-labelledby={`dashboard-visits-tab-${filter}`}
                    >
                        <ul className={visitStyles.list}>
                            {visible.map((visit) => (
                                <li key={visit.id}>
                                    <VisitCard
                                        visit={visit}
                                        onMarkOutcome={(outcome) =>
                                            markOutcome(visit.id, visit.client, outcome)
                                        }
                                        onDelete={() => removeVisit(visit.id, visit.client)}
                                    />
                                </li>
                            ))}
                        </ul>
                        {!visible.length && (
                            <p className="body-sm py-8 text-center text-ink-muted">
                                {filter === "needs_update"
                                    ? "No visits are waiting for an attendance update."
                                    : filter === "running"
                                      ? "No visits are running right now."
                                      : "No upcoming visits yet. Select Schedule visit to book one."}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <footer
                data-scroll-shadow={visitsHaveMore}
                className={cn(
                    taskStyles.fixedFooter,
                    visitStyles.footer,
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
                            ? "1 visit needs an update"
                            : `${needsUpdate} visits need an update`}
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
    // Shared so deleting from either card updates both.
    const [visits, setVisits] = useState(MOCK_VISITS);
    const [visitAnnouncement, setVisitAnnouncement] = useState("");

    const markOutcome = (visitId: string, client: string, outcome: "attended" | "notAttended") => {
        setVisits((current) =>
            current.map((item) => (item.id === visitId ? { ...item, outcome } : item)),
        );
        setVisitAnnouncement(
            `Visit with ${client} marked as ${outcome === "attended" ? "attended" : "not attended"} in this preview.`,
        );
    };

    const removeVisit = (visitId: string, client: string) => {
        setVisits((current) => current.filter((item) => item.id !== visitId));
        setVisitAnnouncement(`Visit with ${client} deleted from this preview.`);
    };

    return (
        <div className={styles.workGrid}>
            <p className="sr-only" role="status">
                {visitAnnouncement}
            </p>
            <div className={styles.nextVisit}>
                <NextVisit visits={visits} removeVisit={removeVisit} />
            </div>
            <div className={styles.visits}>
                <TodayVisits visits={visits} markOutcome={markOutcome} removeVisit={removeVisit} />
            </div>
            <div className={styles.tasks}>
                <DashboardTasksCard />
            </div>
            <div className={styles.pipeline}>
                <PipelineOverview />
            </div>
        </div>
    );
}
