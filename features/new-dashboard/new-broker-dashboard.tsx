"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { isMockMode } from "@/lib/api/mock-mode";
import { myListingsApi } from "@/lib/api/my-listings";
import { formatWeekdayDate } from "@/lib/format/date";

import {
    Building2,
    CalendarCheck,
    CalendarPlus,
    CheckCheck,
    Clock,
    MapPin,
    Pencil,
    Plus,
    UserRoundPlus,
    Users,
} from "@/components/shared/icons";
import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import { DashboardError, DashboardLoading } from "@/features/dashboard/dashboard-page-shell";
import {
    mapBrokerDashboardView,
    mapBrokerDashboardViewFromMock,
} from "@/features/dashboard/map-dashboard";
import { dashboardMock } from "@/features/dashboard/mock-data";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBrokerDashboard } from "@/store/slices/dashboard-slice";

import { CommissionEarned } from "./commission-earned";
import { InventoryAndUpdates } from "./inventory-and-updates";
import { WorkOverview } from "./work-overview";

import styles from "./dashboard.module.css";

const TIME_ZONE = "Asia/Kolkata";
const plural = (count: number, singular: string, multiple = `${singular}s`) =>
    `${count} ${count === 1 ? singular : multiple}`;

function WorkingAreas({ areas }: { areas: string[] }) {
    const uniqueAreas = [...new Set(areas.map((area) => area.trim()).filter(Boolean))];

    if (!uniqueAreas.length) {
        return (
            <Link
                href="/broker/profile"
                className="inline-flex items-center gap-1.5 rounded-control font-medium text-brand focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-block-11"
            >
                <MapPin aria-hidden className="shrink-0 block-4 inline-4" />
                Add working areas
            </Link>
        );
    }

    return (
        <div className="inline-flex flex-wrap items-center gap-1.5 max-inline-full min-inline-0">
            <MapPin aria-hidden className="shrink-0 block-4 inline-4" />
            <span className="shrink-0">Working in</span>
            {uniqueAreas.slice(0, 3).map((area, index) => (
                <span
                    key={area}
                    className="truncate font-medium max-inline-[14ch] sm:max-inline-[22ch]"
                >
                    {area}
                    {index < Math.min(uniqueAreas.length, 3) - 1 ? "," : ""}
                </span>
            ))}
            {uniqueAreas.length > 3 ? (
                <Popover>
                    <PopoverTrigger
                        className="shrink-0 rounded-control p-0 font-medium text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-block-11"
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
                                    <span className="wrap-anywhere min-inline-0">{area}</span>
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
    const dispatch = useAppDispatch();
    const hydrated = useAppSelector((state) => state.auth.hydrated);
    const { data, profile, status, error } = useAppSelector((state) => state.dashboard);
    const [now, setNow] = useState<Date | null>(null);
    const [addClientOpen, setAddClientOpen] = useState(false);
    const listings = useQuery({
        queryKey: ["my-listings-summary", "broker"],
        queryFn: () => myListingsApi.summary(),
        enabled: hydrated,
    });

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

    if (status === "failed") {
        return (
            <DashboardError
                message={error || "Failed to load dashboard"}
                onRetry={() => void dispatch(fetchBrokerDashboard())}
            />
        );
    }
    if (!now || status === "idle" || status === "loading") return <DashboardLoading />;

    const view = isMockMode()
        ? mapBrokerDashboardViewFromMock(dashboardMock, profile, now)
        : mapBrokerDashboardView(data, profile, now);
    const overdue = view.followUps.overdueCount;
    const upcoming = view.today.items.filter(
        (item) => item.kind === "site_visit" && item.state === "upcoming",
    ).length;
    const needsUpdate = view.today.items.filter(
        (item) =>
            item.kind === "site_visit" && (item.state === "elapsed" || item.state === "missed"),
    ).length;
    const followUpTotal = Math.max(
        overdue,
        view.followUps.items.length + view.followUps.remainingThisWeek,
    );
    const lines = [
        view.siteVisitCount
            ? `You have ${plural(view.siteVisitCount, "site visit")} today`
            : "Your calendar is clear today",
        overdue
            ? `${plural(overdue, "client")} waiting for your call`
            : "You're all caught up on overdue client calls",
        view.pipelineCard.activeTotal
            ? `You're working with ${plural(view.pipelineCard.activeTotal, "active client")}`
            : "Add your first client to start building your pipeline",
        ...(needsUpdate ? [`${plural(needsUpdate, "visit")} need an update`] : []),
        ...(listings.data
            ? [`${plural(listings.data.published, "published listing")} in your inventory`]
            : []),
    ];
    const stats = [
        {
            label: "Visits today",
            icon: CalendarCheck,
            urgent: false,
            value: view.siteVisitCount,
            detail: `${upcoming} upcoming · ${needsUpdate} need an update`,
            href: "/broker/visits",
        },
        {
            label: "Follow-ups",
            icon: CheckCheck,
            urgent: overdue > 0,
            value: followUpTotal,
            detail: `${overdue} overdue`,
            href: "/broker/contacts",
        },
        {
            label: "Active clients",
            icon: Users,
            urgent: false,
            value: view.pipelineCard.activeTotal,
            detail: "In your pipeline",
            href: "/broker/pipeline",
        },
        {
            label: "Active listings",
            icon: Building2,
            urgent: false,
            value: listings.data?.published ?? 0,
            detail: listings.isError
                ? "Couldn't load listings"
                : listings.data
                  ? "Published in your inventory"
                  : "Loading listings…",
            href: "/broker/your-listings",
        },
    ];

    return (
        <section className={styles.dashboard} aria-labelledby="new-dashboard-heading">
            {/* Row 1: date + rotating summary. Row 2 (md+): info left · actions right.
                Phone hides row 2 — the bottom-nav fan owns the actions. */}
            <header className="-mbe-1 flex flex-col items-start gap-4 max-lg:-mbe-2 lg:gap-4">
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
                    <div className="shrink-0 max-lg:inline-full">
                        <div className={styles.actions}>
                            <Button
                                variant="accent"
                                size="md"
                                onClick={() => setAddClientOpen(true)}
                            >
                                <UserRoundPlus aria-hidden />
                                Add client
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                nativeButton={false}
                                render={<Link href="/broker/properties/new" />}
                            >
                                <Plus aria-hidden />
                                Add listing
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                nativeButton={false}
                                render={<Link href="/broker/visits?tab=slots" />}
                            >
                                <CalendarPlus aria-hidden />
                                Schedule visit
                            </Button>
                        </div>
                    </div>
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
                                {stat.value}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            <WorkOverview />
            <CommissionEarned />
            <InventoryAndUpdates activity={view.activity} now={now} preview />
            <AddBuyerModal
                open={addClientOpen}
                onOpenChange={setAddClientOpen}
                onCreated={() => {
                    setAddClientOpen(false);
                    void dispatch(fetchBrokerDashboard());
                }}
            />
        </section>
    );
}
