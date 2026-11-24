"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useQueryClient } from "@tanstack/react-query";
import { Label, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import type { BrokerVisit } from "@/lib/api/site-visits";
import { formatBudgetAmount } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { EmptyState, LoadingState } from "@/components/empty-state";
import {
    portalProfileMenuItemClass,
    portalProfileMenuSurfaceClass,
} from "@/components/layout/portal-profile-menu";
import { CardLink } from "@/components/shared/card-link";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ContactName } from "@/components/shared/contact-name";
import { IconButton } from "@/components/shared/icon-button";
import {
    ArrowRight,
    Briefcase,
    CalendarClock,
    CalendarPlus,
    CallIcon,
    ChartBar,
    Check,
    Clock,
    MapPin,
    MoreHorizontal,
    Trash2,
    UserRoundPlus,
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

import { getVisitActions, visitErrorMessage } from "@/features/new-site-visits/model";
import { useVisitMutations } from "@/features/new-site-visits/use-visits";
import { DashboardTasksCard } from "@/features/tasks/dashboard-tasks-card";
import { useAppDispatch } from "@/store/hooks";
import { fetchBrokerDashboard } from "@/store/slices/dashboard-slice";

import { CardError } from "./card-states";
import { DASHBOARD_DEFAULT_MONTHS } from "./commission-window";
import { refreshDashboardQueries } from "./dashboard-refresh";
import {
    DashboardVisitListSkeleton,
    NextVisitSkeleton,
    PipelineSkeleton,
} from "./dashboard-skeleton";
import {
    type DashboardVisitPhase,
    dashboardVisitPhase,
    groupDashboardVisits,
    needsUpdateCount,
    visitStatusLabel,
    visitWhenLabel,
    withBusy,
} from "./dashboard-visit";
import { pipelineView } from "./pipeline-view";
import { useDashboardEarnings } from "./use-dashboard-earnings";
import { useDashboardVisits } from "./use-dashboard-visits";

import styles from "./dashboard.module.css";
import nextVisitStyles from "./next-visit.module.css";
import taskStyles from "./task-card.module.css";
import visitStyles from "./visit-card.module.css";

const VISIT_FILTER_TABS: { value: DashboardVisitPhase; label: string }[] = [
    { value: "upcoming", label: "Upcoming" },
    { value: "running", label: "Running" },
    { value: "needs_update", label: "Needs update" },
];

const CARD =
    "flex min-inline-0 flex-col rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 sm:p-5";
const LINK =
    "body-sm inline-flex min-block-11 items-center gap-2 rounded-control font-semibold text-brand outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring";
/** Track remaining content so fixed footers only cast a shadow over a scrollable list. */
function useScrollFooter(contentKey: string) {
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
    }, [measure, contentKey]);
    return { viewportRef, contentRef, hasMore, scrolled, measure };
}

function PipelineHeader() {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 id="dashboard-pipeline-title" className="h5 text-ink">
                Pipeline overview
            </h2>
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
    );
}

function PipelineOverview({ now, onAddClient }: { now: Date; onAddClient?: () => void }) {
    const report = useDashboardEarnings(DASHBOARD_DEFAULT_MONTHS, 0, now);

    if (report.isPending || (report.isError && !report.data)) {
        return (
            <section className={cn(CARD, "block-full")} aria-labelledby="dashboard-pipeline-title">
                <PipelineHeader />
                {report.isPending ? (
                    <LoadingState label="Loading your pipeline">
                        <PipelineSkeleton />
                    </LoadingState>
                ) : (
                    <CardError
                        what="your pipeline"
                        retrying={report.isFetching}
                        onRetry={() => void report.refetch()}
                    />
                )}
            </section>
        );
    }

    const view = pipelineView(report.data.live);
    if (view.total === 0) {
        return (
            <section className={cn(CARD, "block-full")} aria-labelledby="dashboard-pipeline-title">
                <EmptyState
                    size="card"
                    icon={Briefcase}
                    headingId="dashboard-pipeline-title"
                    heading="No active deals yet"
                    description="Add a client and link a property to track your first deal."
                    action={
                        onAddClient
                            ? { label: "Add client", icon: UserRoundPlus, onClick: onAddClient }
                            : undefined
                    }
                />
            </section>
        );
    }

    const chartData = [Object.fromEntries(view.stages.map((stage) => [stage.id, stage.count]))];
    const chartConfig = Object.fromEntries(
        view.stages.map((stage) => [stage.id, { label: stage.label, color: stage.chartColor }]),
    );
    const stageSum = view.stages.reduce((sum, stage) => sum + stage.count, 0);
    const totals = [
        ...(view.saleValueInr > 0
            ? [{ label: "Total sale value", value: formatBudgetAmount(view.saleValueInr) }]
            : []),
        ...(view.rentValueInr > 0
            ? [
                  {
                      label: "Total monthly rent",
                      value: `${formatBudgetAmount(view.rentValueInr)}/mo`,
                  },
              ]
            : []),
    ];
    const dealWord = (count: number) => (count === 1 ? "deal" : "deals");
    return (
        <section className={cn(CARD, "block-full")} aria-labelledby="dashboard-pipeline-title">
            <PipelineHeader />
            <ChartContainer
                config={chartConfig}
                className="mx-auto mbs-2 aspect-auto block-44 inline-full max-inline-72"
                aria-label={`Pipeline: ${view.total} active ${dealWord(view.total)}. ${view.stages.map((stage) => `${stage.label}: ${stage.count}`).join(", ")}`}
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
                        domain={[0, stageSum || 1]}
                        tick={false}
                        axisLine={false}
                    />
                    {view.stages.map((stage) => (
                        <RadialBar
                            key={stage.id}
                            dataKey={stage.id}
                            fill={stage.chartColor}
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
                                            {view.total.toLocaleString("en-IN")}
                                        </tspan>
                                        <tspan
                                            x={viewBox.cx}
                                            y={(viewBox.cy ?? 0) + 1}
                                            className="fill-ink-muted text-sm font-semibold"
                                        >
                                            {view.total === 1 ? "Active deal" : "Active deals"}
                                        </tspan>
                                    </text>
                                );
                            }}
                        />
                    </PolarRadiusAxis>
                </RadialBarChart>
            </ChartContainer>
            {totals.length ? (
                <dl
                    className={cn(
                        "mx-auto mbs-2 grid text-center inline-full max-inline-80",
                        totals.length === 2 ? "grid-cols-2" : "grid-cols-1",
                    )}
                >
                    {totals.map((total, index) => (
                        <div
                            key={total.label}
                            className={cn("px-3", index > 0 && "border-s border-border-warm")}
                        >
                            <dt className="text-xs font-semibold text-ink-muted">{total.label}</dt>
                            <dd className="h5 mbs-1 text-ink tabular-nums">{total.value}</dd>
                        </div>
                    ))}
                </dl>
            ) : null}
            <dl className="mbs-auto grid grid-cols-2 gap-x-3 gap-y-4 pbs-5 sm:grid-cols-4">
                {view.stages.map((stage) => (
                    <div key={stage.id} className="text-center">
                        <dt className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-muted">
                            <span
                                aria-hidden
                                className={cn("shrink-0 rounded-xs block-2 inline-2", stage.color)}
                            />
                            {stage.label}
                        </dt>
                        <dd className="mbs-1 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 text-sm font-semibold text-ink tabular-nums">
                            {stage.saleValueInr > 0 && (
                                <span>{formatBudgetAmount(stage.saleValueInr)}</span>
                            )}
                            {stage.rentValueInr > 0 && (
                                <span className="text-xs text-ink-muted">
                                    {formatBudgetAmount(stage.rentValueInr)}/mo
                                </span>
                            )}
                            {stage.saleValueInr === 0 && stage.rentValueInr === 0 && (
                                <span className="text-ink-muted">
                                    {stage.count ? `${stage.count} ${dealWord(stage.count)}` : "—"}
                                </span>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

const visitHref = (visit: BrokerVisit, view: "detail" | "reschedule" = "detail") =>
    `/broker/visits?${new URLSearchParams({ view, visit: visit.id })}`;

type VisitCardProps = {
    visit: BrokerVisit;
    phase: DashboardVisitPhase;
    now: Date;
    /** Dark green "Your next visit" card; list rows use the same layout on white. */
    featured?: boolean;
    busy?: boolean;
    error?: string;
    onMarkOutcome?: (status: "completed" | "no_show") => void;
    onCancel?: () => void;
};

/** One visit, same anatomy everywhere: time + status → property + people → two actions. */
function VisitCard({
    visit,
    phase,
    now,
    featured = false,
    busy = false,
    error,
    onMarkOutcome,
    onCancel,
}: VisitCardProps) {
    const s = featured ? nextVisitStyles : visitStyles;
    const titleId = `visit-card-${featured ? "next" : visit.id}`;
    const needsUpdate = phase === "needs_update";
    const actions = getVisitActions(visit, now.getTime());
    const location = [visit.locality, visit.city].filter(Boolean).join(", ");
    const canReschedule = actions.includes("reschedule");
    const canCancel = actions.includes("cancelled") && onCancel;

    const menu =
        canReschedule || canCancel ? (
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <IconButton
                            size="sm"
                            appearance={featured ? "inverse" : "outline"}
                            className={s.menuTrigger}
                            aria-label={`More actions for visit with ${visit.clientName}`}
                            disabled={busy}
                        />
                    }
                >
                    <MoreHorizontal aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className={cn(portalProfileMenuSurfaceClass, "inline-auto min-inline-44")}
                >
                    {canReschedule ? (
                        <DropdownMenuItem
                            className={portalProfileMenuItemClass}
                            render={<Link href={visitHref(visit, "reschedule")} />}
                        >
                            <CalendarClock aria-hidden />
                            Reschedule
                        </DropdownMenuItem>
                    ) : null}
                    {canCancel ? (
                        <>
                            {canReschedule ? <DropdownMenuSeparator className="my-1" /> : null}
                            <DropdownMenuItem
                                variant="destructive"
                                className={portalProfileMenuItemClass}
                                onClick={onCancel}
                            >
                                <Trash2 aria-hidden />
                                Cancel visit
                            </DropdownMenuItem>
                        </>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        ) : null;

    return (
        <article data-linked-card className={s.card} aria-labelledby={titleId} aria-busy={busy}>
            <CardLink href={visitHref(visit)} label={`View visit for ${visit.propertyTitle}`} />
            {featured ? (
                <div className={s.header}>
                    <h2 className="body-sm font-semibold">Your next visit</h2>
                    {menu}
                </div>
            ) : null}

            <div className={s.schedule}>
                <p className={cn(s.time, needsUpdate && s.timeNeedsUpdate)}>
                    {visitWhenLabel(visit, now)}
                </p>
                <div className={s.scheduleMeta}>
                    <p className={s.status} data-phase={phase}>
                        <Clock aria-hidden />
                        {visitStatusLabel(visit, now)}
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
                    <p
                        data-card-title
                        id={titleId}
                        className={s.propertyName}
                        title={visit.propertyTitle}
                    >
                        {visit.propertyTitle}
                    </p>
                    {location ? (
                        <p className={s.location}>
                            <MapPin aria-hidden />
                            {location}
                        </p>
                    ) : null}
                    <div className={s.people}>
                        <p className={s.person}>
                            <span className={s.personRole}>Client</span>
                            <ContactName
                                name={visit.clientName}
                                contactType="buyer"
                                className={s.personName}
                            />
                        </p>
                        {visit.ownerName ? (
                            <p className={s.person}>
                                <span className={s.personRole}>Owner</span>
                                <ContactName
                                    name={visit.ownerName}
                                    contactType="owner"
                                    className={s.personName}
                                />
                            </p>
                        ) : null}
                    </div>
                </div>
                {visit.amountInr ? (
                    <div className={s.price}>
                        <PriceWithCommission
                            amountInr={visit.amountInr}
                            isRent={visit.isRent ?? false}
                            commissionPercent={visit.commissionPercent ?? null}
                            commissionAmountInr={visit.commissionAmountInr ?? null}
                            audience="broker"
                            size={featured ? "lg" : "md"}
                            className={featured ? "text-surface" : undefined}
                            underlineClassName={featured ? "decoration-surface/50" : undefined}
                        />
                    </div>
                ) : null}
            </div>

            {error ? (
                <p
                    role="alert"
                    className={cn("body-sm", featured ? "text-surface" : "text-urgent")}
                >
                    {error}
                </p>
            ) : null}

            <div className={s.actions}>
                {needsUpdate && onMarkOutcome ? (
                    <>
                        <Button
                            variant={featured ? "highlight" : "accent"}
                            className={s.action}
                            disabled={busy}
                            aria-label={`Mark visit with ${visit.clientName} as attended`}
                            onClick={() => onMarkOutcome("completed")}
                        >
                            <Check aria-hidden />
                            {busy ? "Saving…" : "Attended"}
                        </Button>
                        <Button
                            variant={featured ? "ghost" : "outline"}
                            className={cn(s.action, s.secondaryAction)}
                            disabled={busy}
                            aria-label={`Mark visit with ${visit.clientName} as not attended`}
                            onClick={() => onMarkOutcome("no_show")}
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
                            render={<Link href={visitHref(visit)} />}
                        >
                            View visit
                            <ArrowRight aria-hidden />
                        </Button>
                        {visit.clientPhone ? (
                            <Button
                                variant={featured ? "ghost" : "outline"}
                                className={cn(s.action, s.secondaryAction)}
                                nativeButton={false}
                                aria-label={`Call ${visit.clientName}`}
                                render={<a href={`tel:${visit.clientPhone}`} />}
                            >
                                <CallIcon aria-hidden />
                                {/* Visually hidden on narrow cards; aria-label keeps the name. */}
                                <span className={s.actionLabel}>Call client</span>
                            </Button>
                        ) : null}
                    </>
                )}
            </div>
        </article>
    );
}

type VisitActions = {
    now: Date;
    busyIds: ReadonlySet<string>;
    error: { id: string; message: string } | null;
    markOutcome: (visit: BrokerVisit, status: "completed" | "no_show") => void;
    askCancel: (visit: BrokerVisit) => void;
};

type VisitQuery = {
    isPending: boolean;
    isError: boolean;
    isFetching: boolean;
    refetch: () => unknown;
};

function NextVisitShell({ children }: { children: React.ReactNode }) {
    return (
        <section className={cn(CARD, "block-full")} aria-labelledby="dashboard-next-visit-title">
            <h2 id="dashboard-next-visit-title" className="h5 text-ink">
                Your next visit
            </h2>
            {children}
        </section>
    );
}

function NextVisit({
    visit,
    query,
    ...actions
}: VisitActions & { visit: BrokerVisit | undefined; query: VisitQuery }) {
    if (query.isPending) {
        return (
            <LoadingState label="Loading your next visit">
                <NextVisitSkeleton />
            </LoadingState>
        );
    }
    if (query.isError && !visit) {
        return (
            <NextVisitShell>
                <CardError
                    what="your next visit"
                    retrying={query.isFetching}
                    onRetry={() => void query.refetch()}
                />
            </NextVisitShell>
        );
    }
    if (!visit) {
        return (
            <section
                className={cn(nextVisitStyles.card, "flex flex-col block-full")}
                data-empty="true"
                aria-labelledby="dashboard-next-visit-title"
            >
                <EmptyState
                    size="card"
                    tone="inverse"
                    icon={CalendarPlus}
                    headingId="dashboard-next-visit-title"
                    heading="No upcoming visits"
                    description="Schedule a property visit with a client. Your next visit will appear here."
                    action={{
                        label: "Schedule visit",
                        icon: CalendarPlus,
                        href: "/broker/visits?view=schedule",
                    }}
                />
            </section>
        );
    }
    return (
        <VisitCard
            visit={visit}
            phase={dashboardVisitPhase(visit, actions.now.getTime()) ?? "upcoming"}
            now={actions.now}
            featured
            busy={actions.busyIds.has(visit.id)}
            error={actions.error?.id === visit.id ? actions.error.message : undefined}
            onCancel={() => actions.askCancel(visit)}
        />
    );
}

function TodayVisits({
    groups,
    needsUpdateTotal,
    query,
    ...actions
}: VisitActions & {
    groups: Record<DashboardVisitPhase, BrokerVisit[]>;
    /** Every unmarked past visit, from the API (the list itself is capped). */
    needsUpdateTotal: number | undefined;
    query: VisitQuery;
}) {
    const {
        viewportRef: visitViewportRef,
        contentRef: visitContentRef,
        hasMore: visitsHaveMore,
        scrolled: visitsScrolled,
        measure: measureVisits,
    } = useScrollFooter(
        `${query.isPending}:${query.isError}:${Object.values(groups)
            .map((items) => items.length)
            .join(":")}`,
    );
    const [filter, setFilter] = useState<DashboardVisitPhase>("upcoming");
    const needsUpdate = needsUpdateCount(groups.needs_update.length, needsUpdateTotal);
    const visible = groups[filter];

    useEffect(() => {
        const viewport = visitViewportRef.current;
        if (viewport) viewport.scrollTop = 0;
        measureVisits();
    }, [filter, measureVisits, visitViewportRef]);

    const empty =
        !query.isPending &&
        !query.isError &&
        Object.values(groups).every((items) => !items.length) &&
        !needsUpdate;
    if (empty) {
        return (
            <section
                className={cn(CARD, taskStyles.card, taskStyles.fixedCard)}
                data-empty="true"
                aria-labelledby="dashboard-today-visits-title"
            >
                <EmptyState
                    size="card"
                    icon={CalendarPlus}
                    headingId="dashboard-today-visits-title"
                    heading="No visits today"
                    description="Schedule a visit to show a property to a client."
                    action={{
                        label: "Schedule visit",
                        icon: CalendarPlus,
                        href: "/broker/visits?view=schedule",
                    }}
                />
            </section>
        );
    }

    return (
        <section
            className={cn(CARD, taskStyles.card, taskStyles.fixedCard)}
            data-empty={!query.isPending && !query.isError && !visible.length}
            aria-labelledby="dashboard-today-visits-title"
        >
            <header className={visitStyles.header}>
                <div className={visitStyles.heading}>
                    <h2 id="dashboard-today-visits-title" className="h5 text-ink">
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
                        const count = query.isPending
                            ? undefined
                            : tab.value === "needs_update"
                              ? needsUpdate
                              : groups[tab.value].length;
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
                        {query.isPending ? (
                            <LoadingState label="Loading today's visits">
                                <DashboardVisitListSkeleton />
                            </LoadingState>
                        ) : query.isError && !visible.length ? (
                            <CardError
                                what="today's visits"
                                retrying={query.isFetching}
                                onRetry={() => void query.refetch()}
                            />
                        ) : visible.length ? (
                            <ul className={visitStyles.list}>
                                {visible.map((visit) => (
                                    <li key={visit.id}>
                                        <VisitCard
                                            visit={visit}
                                            phase={filter}
                                            now={actions.now}
                                            busy={actions.busyIds.has(visit.id)}
                                            error={
                                                actions.error?.id === visit.id
                                                    ? actions.error.message
                                                    : undefined
                                            }
                                            onMarkOutcome={(status) =>
                                                actions.markOutcome(visit, status)
                                            }
                                            onCancel={() => actions.askCancel(visit)}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState
                                size="card"
                                icon={
                                    filter === "needs_update"
                                        ? Check
                                        : filter === "running"
                                          ? Clock
                                          : CalendarPlus
                                }
                                heading={
                                    filter === "needs_update"
                                        ? "No visits need an update"
                                        : filter === "running"
                                          ? "No visits in progress"
                                          : "No upcoming visits today"
                                }
                                description={
                                    filter === "needs_update"
                                        ? "Visits waiting for attendance or an outcome will appear here."
                                        : filter === "running"
                                          ? "When a scheduled visit starts, you will find it here."
                                          : "Schedule a visit to show a property to a client."
                                }
                                action={
                                    filter === "upcoming"
                                        ? {
                                              label: "Schedule visit",
                                              icon: CalendarPlus,
                                              href: "/broker/visits?view=schedule",
                                          }
                                        : undefined
                                }
                            />
                        )}
                    </div>
                </div>
            </div>
            <footer
                data-scroll-shadow={visitsHaveMore}
                className={cn(
                    taskStyles.fixedFooter,
                    visitStyles.footer,
                    "flex items-center justify-between gap-2 border-bs border-border-warm",
                )}
            >
                <Link href="/broker/visits" className={LINK}>
                    Open visits
                    <ArrowRight aria-hidden className="block-4 inline-4" />
                </Link>
                {needsUpdate > 0 ? (
                    <p className={visitStyles.footerNote}>
                        <Clock aria-hidden />
                        <span className="sr-only">
                            {needsUpdate === 1
                                ? "1 visit needs an update"
                                : `${needsUpdate} visits need an update`}
                        </span>
                        <span aria-hidden>
                            {needsUpdate === 1 ? "1 needs update" : `${needsUpdate} need update`}
                        </span>
                    </p>
                ) : query.isPending ? null : (
                    <p className="caption whitespace-nowrap text-ink-muted">All up to date</p>
                )}
            </footer>
        </section>
    );
}

export function WorkOverview({ now, onAddClient }: { now: Date; onAddClient?: () => void }) {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const visits = useDashboardVisits(now);
    const mutations = useVisitMutations();
    const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());
    const [error, setError] = useState<{ id: string; message: string } | null>(null);
    const [cancelling, setCancelling] = useState<BrokerVisit | null>(null);
    const [cancelError, setCancelError] = useState("");
    const [announcement, setAnnouncement] = useState("");

    const groups = groupDashboardVisits(
        visits.today.data?.items ?? [],
        visits.needsUpdate.data?.items ?? [],
        now.getTime(),
    );
    const todayQuery = {
        isPending: visits.today.isPending || visits.needsUpdate.isPending,
        isError: visits.today.isError || visits.needsUpdate.isError,
        isFetching: visits.today.isFetching || visits.needsUpdate.isFetching,
        refetch: () => Promise.all([visits.today.refetch(), visits.needsUpdate.refetch()]),
    };

    const settled = (message: string) => {
        toast.success(message);
        setAnnouncement(message);
        void dispatch(fetchBrokerDashboard({ background: true }));
        void refreshDashboardQueries(queryClient);
    };

    const markOutcome = async (visit: BrokerVisit, status: "completed" | "no_show") => {
        setBusyIds((ids) => withBusy(ids, visit.id, true));
        setError(null);
        try {
            await mutations.setOutcome.mutateAsync({ id: visit.id, status });
            settled(
                `Visit with ${visit.clientName} marked ${status === "completed" ? "attended" : "not attended"}`,
            );
        } catch (caught) {
            setError({ id: visit.id, message: visitErrorMessage(caught) });
        } finally {
            setBusyIds((ids) => withBusy(ids, visit.id, false));
        }
    };

    const confirmCancel = async () => {
        if (!cancelling) return;
        setCancelError("");
        try {
            await mutations.cancel.mutateAsync(cancelling.id);
            settled(`Visit with ${cancelling.clientName} cancelled`);
            setCancelling(null);
        } catch (caught) {
            setCancelError(visitErrorMessage(caught));
        }
    };

    const actions: VisitActions = {
        now,
        busyIds,
        error,
        markOutcome: (visit, status) => void markOutcome(visit, status),
        askCancel: (visit) => {
            setCancelError("");
            setCancelling(visit);
        },
    };

    return (
        <div className={styles.workGrid}>
            <p className="sr-only" role="status">
                {announcement}
            </p>
            <div className={styles.nextVisit}>
                <NextVisit visit={visits.next.data?.items[0]} query={visits.next} {...actions} />
            </div>
            <div className={styles.visits}>
                <TodayVisits
                    groups={groups}
                    needsUpdateTotal={visits.needsUpdate.data?.total}
                    query={todayQuery}
                    {...actions}
                />
            </div>
            <div className={styles.tasks}>
                <DashboardTasksCard />
            </div>
            <div className={styles.pipeline}>
                <PipelineOverview now={now} onAddClient={onAddClient} />
            </div>
            <ConfirmDialog
                open={cancelling !== null}
                onOpenChange={(open) => {
                    if (!open) setCancelling(null);
                }}
                title="Cancel this visit?"
                description={
                    cancelling
                        ? `${cancelling.propertyTitle} with ${cancelling.clientName}, ${visitWhenLabel(cancelling, now)}.`
                        : undefined
                }
                confirmLabel="Cancel visit"
                cancelLabel="Keep visit"
                busy={mutations.cancel.isPending}
                onConfirm={() => void confirmCancel()}
            >
                {cancelError ? (
                    <p role="alert" className="body-sm text-urgent">
                        {cancelError}
                    </p>
                ) : null}
            </ConfirmDialog>
        </div>
    );
}
