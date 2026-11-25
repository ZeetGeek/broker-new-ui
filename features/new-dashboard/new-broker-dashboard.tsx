"use client";

import { useEffect, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tinykeys } from "tinykeys";

import { isMockMode } from "@/lib/api/mock-mode";
import { myListingsApi } from "@/lib/api/my-listings";
import { formatWeekdayDate } from "@/lib/format/date";
import { formatPlaceName } from "@/lib/format/owner-listings-labels";
import { useRouter } from "@/lib/navigation";
import { getShortcut, type ShortcutId } from "@/lib/shortcuts";
import { areaColorClassName } from "@/lib/styles/area-color";
import { isTestSampleMode } from "@/lib/testing/test-lab";
import { cn } from "@/lib/utils";
import { WORKFLOW_SAVED_EVENT } from "@/lib/workflows/refresh";

import {
    portalProfileMenuItemClass,
    portalProfileMenuSurfaceClass,
    PortalProfileShortcutHint,
} from "@/components/layout/portal-profile-menu";
import {
    BellRing,
    Briefcase,
    Building2,
    CalendarCheck,
    CalendarPlus,
    ChevronDown,
    Clock,
    MapPin,
    Pencil,
    Plus,
    UserRoundPlus,
} from "@/components/shared/icons";
import { ListAddButton } from "@/components/shared/list-toolbar";
import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";
import { useWorkflow } from "@/components/shared/workflow-context";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import { DashboardError } from "@/features/dashboard/dashboard-page-shell";
import {
    mapBrokerDashboardView,
    mapBrokerDashboardViewFromMock,
} from "@/features/dashboard/map-dashboard";
import { dashboardMock } from "@/features/dashboard/mock-data";
import { isShortcutEventBlocked } from "@/features/shortcuts/shortcut-event";
import { taskGroup } from "@/features/tasks/model";
import { useTasks } from "@/features/tasks/task-store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBrokerDashboard } from "@/store/slices/dashboard-slice";

import { CommissionEarned } from "./commission-earned";
import { DASHBOARD_DEFAULT_MONTHS } from "./commission-window";
import { refreshDashboardQueries } from "./dashboard-refresh";
import { DashboardSkeleton, DashboardStatSkeleton } from "./dashboard-skeleton";
import { InventoryAndUpdates } from "./inventory-and-updates";
import { useDashboardEarnings } from "./use-dashboard-earnings";
import { useDashboardVisits } from "./use-dashboard-visits";
import { WorkOverview } from "./work-overview";

import styles from "./dashboard.module.css";

const TIME_ZONE = "Asia/Kolkata";
const plural = (count: number, singular: string, multiple = `${singular}s`) =>
    `${count} ${count === 1 ? singular : multiple}`;

function WorkingAreas({ areas }: { areas: string[] }) {
    const uniqueAreas = [...new Set(areas.map((area) => area.trim()).filter(Boolean))];

    if (!uniqueAreas.length) {
        return (
            <Button
                variant="link"
                size="sm"
                nativeButton={false}
                render={<Link href="/broker/profile" />}
                className="px-0 text-brand"
            >
                <MapPin aria-hidden className="shrink-0 block-4 inline-4" />
                Add working areas
            </Button>
        );
    }

    return (
        <div className="inline-flex flex-wrap items-center gap-1.5 max-inline-full min-inline-0">
            <MapPin aria-hidden className="shrink-0 block-4 inline-4" />
            <span className="shrink-0">Working in</span>
            {uniqueAreas.slice(0, 3).map((area) => (
                <span
                    key={area}
                    className={cn(
                        "body-xs inline-flex rounded-full px-2.5 py-1 font-semibold wrap-break-word max-inline-full min-inline-0",
                        areaColorClassName(area),
                    )}
                >
                    {formatPlaceName(area)}
                </span>
            ))}
            {uniqueAreas.length > 3 ? (
                <Popover>
                    <PopoverTrigger
                        className="body-xs touch-target shrink-0 cursor-pointer rounded-sm p-1 font-semibold text-brand-text underline decoration-brand/35 underline-offset-4 outline-none hover:decoration-brand focus-visible:ring-2 focus-visible:ring-ring/30"
                        aria-label={`View ${uniqueAreas.length - 3} more working areas`}
                    >
                        +{uniqueAreas.length - 3} more
                    </PopoverTrigger>
                    <PopoverContent
                        align="end"
                        className="gap-3 inline-56 max-inline-[calc(100vw-2rem)]"
                    >
                        <PopoverTitle className="body-sm font-semibold">
                            More working areas
                        </PopoverTitle>
                        <ul className="flex flex-col gap-3 overflow-y-auto overscroll-contain max-block-64">
                            {uniqueAreas.slice(3).map((area) => (
                                <li
                                    key={area}
                                    className="body-sm flex items-start gap-2 text-ink-muted"
                                >
                                    <MapPin
                                        aria-hidden
                                        className="mbs-0.5 shrink-0 block-4 inline-4"
                                    />
                                    <span
                                        className={cn(
                                            "body-xs rounded-full px-2.5 py-1 font-semibold wrap-anywhere min-inline-0",
                                            areaColorClassName(area),
                                        )}
                                    >
                                        {formatPlaceName(area)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <div className="border-bs border-border-warm pbs-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="inline-full pointer-coarse:min-block-11"
                                nativeButton={false}
                                render={<Link href="/broker/profile" />}
                            >
                                <Pencil aria-hidden />
                                Edit working areas
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            ) : null}
        </div>
    );
}

export function NewBrokerDashboard() {
    const router = useRouter();
    const openWorkflow = useWorkflow();
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    useEffect(() => {
        const refresh = () => {
            void dispatch(fetchBrokerDashboard({ background: true }));
            void refreshDashboardQueries(queryClient);
        };
        window.addEventListener(WORKFLOW_SAVED_EVENT, refresh);
        return () => window.removeEventListener(WORKFLOW_SAVED_EVENT, refresh);
    }, [dispatch, queryClient]);
    const hydrated = useAppSelector((state) => state.auth.hydrated);
    const accountId = useAppSelector((state) => state.auth.user?.id) ?? "design-preview";
    const tasks = useTasks(accountId);
    const { data, profile, status, error } = useAppSelector((state) => state.dashboard);
    const [now, setNow] = useState<Date | null>(null);
    const [addClientOpen, setAddClientOpen] = useState(false);
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const listings = useQuery({
        queryKey: ["my-listings-summary", "broker"],
        queryFn: () => myListingsApi.summary(),
        enabled: hydrated,
    });
    const visits = useDashboardVisits(now);
    const todayVisits = visits.today;
    const earnings = useDashboardEarnings(DASHBOARD_DEFAULT_MONTHS, 0, now);

    useEffect(() => {
        const initialTimer = window.setTimeout(() => setNow(new Date()), 0);
        const timer = window.setInterval(() => setNow(new Date()), 30_000);
        return () => {
            window.clearTimeout(initialTimer);
            window.clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (hydrated) void dispatch(fetchBrokerDashboard());
    }, [hydrated, dispatch]);

    useEffect(() => {
        if (!hydrated || status !== "succeeded") return;
        const actions: [ShortcutId, () => void][] = [
            ["add_contact", () => setAddClientOpen(true)],
            [
                "add_property",
                () => {
                    if (!openWorkflow?.("/broker/properties/new"))
                        router.push("/broker/properties/new");
                },
            ],
            [
                "schedule_visit",
                () => {
                    if (!openWorkflow?.("/broker/visits?view=schedule"))
                        router.push("/broker/visits?view=schedule");
                },
            ],
            [
                "add_task",
                () => {
                    if (!openWorkflow?.("/broker/tasks?view=create"))
                        router.push("/broker/tasks?view=create");
                },
            ],
        ];
        return tinykeys(
            window,
            Object.fromEntries(
                actions.flatMap(([id, action]) => {
                    const shortcut = getShortcut(id);
                    if (!shortcut) return [];
                    return [
                        [
                            shortcut.keys,
                            (event: KeyboardEvent) => {
                                if (addClientOpen || isShortcutEventBlocked(event)) return;
                                event.preventDefault();
                                setAddMenuOpen(false);
                                action();
                            },
                        ],
                    ];
                }),
            ),
        );
    }, [hydrated, status, addClientOpen, router, openWorkflow]);

    if (status === "failed") {
        return (
            <DashboardError
                message={error || "Failed to load dashboard"}
                onRetry={() => void dispatch(fetchBrokerDashboard())}
            />
        );
    }
    if (!now || status === "idle" || status === "loading") return <DashboardSkeleton />;

    const view = isMockMode()
        ? mapBrokerDashboardViewFromMock(dashboardMock, profile, now)
        : mapBrokerDashboardView(data, profile, now);
    // Same source as the pipeline card, so the two never disagree.
    const activeDeals =
        isMockMode() && !isTestSampleMode()
            ? view.pipelineCard.activeTotal
            : (earnings.data?.live.count ?? null);
    const overdue = tasks.tasks.filter(
        (task) =>
            !task.completedAt && !task.deletedAt && taskGroup(task, now.getTime()) === "overdue",
    ).length;
    const upcoming = view.today.items.filter(
        (item) => item.kind === "site_visit" && item.state === "upcoming",
    ).length;
    const needsUpdate = view.today.items.filter(
        (item) =>
            item.kind === "site_visit" && (item.state === "elapsed" || item.state === "missed"),
    ).length;
    const counts = todayVisits.data?.counts;
    const visitTotal =
        isMockMode() && !isTestSampleMode()
            ? view.siteVisitCount
            : counts
              ? counts.upcoming +
                counts.running +
                counts.needs_update +
                counts.completed +
                counts.not_attended
              : null;
    // Every unmarked visit, any day — the same number as the Visits page tab.
    const visitNeedsUpdate =
        isMockMode() && !isTestSampleMode() ? needsUpdate : (visits.needsUpdate.data?.total ?? 0);
    const taskCountKnown = !tasks.isLoading && !tasks.error;
    const lines = [
        "Your day, organised.",
        ...(taskCountKnown
            ? [
                  overdue
                      ? `${overdue} overdue ${overdue === 1 ? "task needs" : "tasks need"} attention`
                      : "You're all caught up on overdue tasks",
              ]
            : []),
        ...(activeDeals === null
            ? []
            : [
                  activeDeals
                      ? `You're working on ${plural(activeDeals, "active deal")}`
                      : "Add your first client to start building your pipeline",
              ]),
        ...(visitNeedsUpdate ? [`${plural(visitNeedsUpdate, "visit")} need an update`] : []),
        ...(listings.data
            ? [`${plural(listings.data.published, "published listing")} in your inventory`]
            : []),
    ];
    const stats = [
        {
            label: "Visits today",
            loading: visitTotal === null && todayVisits.isPending,
            icon: CalendarCheck,
            urgent: false,
            value: visitTotal,
            detail:
                !isMockMode() && !counts
                    ? todayVisits.isError
                        ? "Couldn't load visits · open to retry"
                        : "Loading today's visits…"
                    : visitTotal === 0
                      ? "No visits scheduled today"
                      : `${counts?.upcoming ?? upcoming} upcoming · ${counts?.needs_update ?? needsUpdate} need an update`,
            href: "/broker/visits?range=today&tab=upcoming",
        },
        {
            label: "Overdue tasks",
            loading: tasks.isLoading,
            icon: BellRing,
            urgent: overdue > 0,
            value: taskCountKnown ? overdue : null,
            detail: tasks.isLoading
                ? "Loading tasks…"
                : tasks.error
                  ? "Couldn't load tasks · open to retry"
                  : overdue
                    ? "Past due · needs attention"
                    : "No overdue tasks",
            href: "/broker/tasks?tab=overdue",
        },
        {
            label: "Active deals",
            loading: activeDeals === null && earnings.isPending,
            icon: Briefcase,
            urgent: false,
            value: activeDeals,
            detail:
                activeDeals === null && earnings.isError
                    ? "Couldn't load deals · open to retry"
                    : "In your pipeline",
            href: "/broker/pipeline?view=active",
        },
        {
            label: "Published listings",
            loading: listings.isPending,
            icon: Building2,
            urgent: false,
            value: listings.data?.published ?? null,
            detail: listings.isError
                ? "Couldn't load listings · open to retry"
                : listings.data
                  ? "Published in your inventory"
                  : "Loading listings…",
            href: "/broker/my-listings?status=published",
        },
    ];

    return (
        <section className={styles.dashboard} aria-labelledby="new-dashboard-heading">
            {/* Row 1: date + rotating summary. Row 2 (md+): info left · actions right.
                Phone hides row 2 — the bottom-nav fan owns the actions. */}
            <header className="flex flex-col items-start gap-4 md:-mbe-1 md:max-lg:-mbe-2 lg:gap-4">
                <h1 id="new-dashboard-heading" className={`h3 ${styles.heading}`}>
                    <span className="shrink-0">{formatWeekdayDate(now)}.</span>{" "}
                    {/* A real space (not margin) so a wrapped summary starts flush left. */}
                    {/*
                      Phone: one static line at its natural height. The rotating slot
                      reserves the tallest message, which leaves a blank line under short
                      ones once messages wrap — and resizing per message would shift the
                      cards below every few seconds.
                    */}
                    {/* Visibility sits on wrappers: the module's display would beat Tailwind's hidden. */}
                    <span className="md:hidden">
                        <span className={styles.summary}>
                            <span className="text-pretty text-ink-muted">{lines[0]}</span>
                        </span>
                    </span>
                    <span className="min-inline-0 max-md:hidden xl:flex-1">
                        <span className={styles.summary}>
                            <RotatingHeaderSummary
                                lines={lines}
                                loadingPlaceholder="Your day, organised."
                            />
                        </span>
                    </span>
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 inline-full max-md:hidden">
                    <div className={`body-sm ${styles.metadata}`}>
                        <time
                            dateTime={now.toISOString()}
                            className="inline-flex shrink-0 items-center gap-1.5"
                        >
                            <Clock aria-hidden className="shrink-0 block-4 inline-4" />
                            {new Intl.DateTimeFormat("en-IN", {
                                timeZone: TIME_ZONE,
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                            }).format(now)}
                            {" · India time"}
                        </time>
                        <span aria-hidden className={styles.metadataDivider}>
                            ·
                        </span>
                        <WorkingAreas areas={view.serviceAreas} />
                    </div>
                    <DropdownMenu open={addMenuOpen} onOpenChange={setAddMenuOpen}>
                        <DropdownMenuTrigger
                            render={
                                <ListAddButton
                                    label="Quick add"
                                    trailingIcon={ChevronDown}
                                    className="ms-auto"
                                />
                            }
                        />
                        <DropdownMenuContent
                            align="end"
                            aria-label="Add actions"
                            className={cn(
                                portalProfileMenuSurfaceClass,
                                "inline-auto min-inline-56",
                            )}
                        >
                            <DropdownMenuItem
                                className={portalProfileMenuItemClass}
                                onClick={() => setAddClientOpen(true)}
                            >
                                <UserRoundPlus aria-hidden />
                                Add client
                                <PortalProfileShortcutHint
                                    shortcutId="add_contact"
                                    showWhenAvailable
                                />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={portalProfileMenuItemClass}
                                render={<Link href="/broker/properties/new" />}
                            >
                                <Building2 aria-hidden />
                                Add listing
                                <PortalProfileShortcutHint
                                    shortcutId="add_property"
                                    showWhenAvailable
                                />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={portalProfileMenuItemClass}
                                render={<Link href="/broker/visits?view=schedule" />}
                            >
                                <CalendarPlus aria-hidden />
                                Schedule visit
                                <PortalProfileShortcutHint
                                    shortcutId="schedule_visit"
                                    showWhenAvailable
                                />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className={portalProfileMenuItemClass}
                                render={<Link href="/broker/tasks?view=create" />}
                            >
                                <Plus aria-hidden />
                                Add task
                                <PortalProfileShortcutHint
                                    shortcutId="add_task"
                                    showWhenAvailable
                                />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <ul aria-label="Your work overview" className={styles.stats}>
                {stats.map((stat) => (
                    <li key={stat.label} className={styles.stat}>
                        <Link href={stat.href} className={styles.statLink}>
                            <stat.icon
                                aria-hidden
                                className={`shrink-0 block-6 inline-6 ${stat.urgent ? "text-urgent" : "text-brand"}`}
                                strokeWidth={1.75}
                            />
                            <div className={styles.statText}>
                                <span className="body-sm font-semibold text-ink">{stat.label}</span>
                                <span className="text-sm font-medium text-ink-muted">
                                    {stat.detail}
                                </span>
                            </div>
                            <span
                                className={`h3 ms-auto shrink-0 tabular-nums ${stat.urgent ? "text-urgent" : "text-brand"}`}
                            >
                                {stat.loading ? (
                                    <DashboardStatSkeleton />
                                ) : stat.value === null ? (
                                    <span aria-label="Count unavailable">—</span>
                                ) : (
                                    stat.value.toLocaleString("en-IN")
                                )}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            <WorkOverview now={now} onAddClient={() => setAddClientOpen(true)} />
            <CommissionEarned now={now} />
            <InventoryAndUpdates activity={view.activity} now={now} />
            <AddBuyerModal
                open={addClientOpen}
                onOpenChange={setAddClientOpen}
                onCreated={() => {
                    setAddClientOpen(false);
                    void dispatch(fetchBrokerDashboard());
                    void refreshDashboardQueries(queryClient);
                }}
            />
        </section>
    );
}
