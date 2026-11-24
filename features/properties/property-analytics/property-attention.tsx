"use client";

import { useEffect, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { pipelineApi } from "@/lib/api/pipeline";
import { siteVisitsApi } from "@/lib/api/site-visits";
import { cn } from "@/lib/utils";
import { WORKFLOW_SAVED_EVENT } from "@/lib/workflows/refresh";

import { CalendarCheck, CheckCircle2, ChevronRight, Clock, Info } from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";

import { useVisitsLive, VISITS_KEY } from "@/features/new-site-visits/use-visits";
import { DEFAULT_DEALS_FILTERS } from "@/features/pipeline/types";
import { AnalyticsCard } from "@/features/properties/property-analytics/analytics-card";
import { buildPropertyAttention } from "@/features/properties/property-analytics/property-attention-model";
import { useTasks } from "@/features/tasks/task-store";
import { useAppSelector } from "@/store/hooks";

import styles from "./broker-property-analytics.module.css";

export function PropertyAttention({ propertyId }: { propertyId: string }) {
    const accountId = useAppSelector((state) => state.auth.user?.id) ?? "design-preview";
    const taskData = useTasks(accountId);
    const queryClient = useQueryClient();
    const [now, setNow] = useState(() => Date.now());
    const pipeline = useQuery({
        queryKey: ["property-attention", "pipeline", accountId],
        queryFn: ({ signal }) => pipelineApi.list(DEFAULT_DEALS_FILTERS, signal),
        staleTime: 0,
        refetchInterval: 60_000,
    });
    const visits = useQuery({
        queryKey: [...VISITS_KEY, "list", "property-attention", accountId, propertyId],
        queryFn: ({ signal }) =>
            siteVisitsApi.searchSource(
                { tab: "needs_update", propertyId, sort: "start_asc" },
                signal,
            ),
        staleTime: 0,
        refetchInterval: 60_000,
    });
    useVisitsLive(visits.data?.nextChangeAt ?? null, visits.dataUpdatedAt);
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(timer);
    }, []);
    useEffect(() => {
        const refresh = () => {
            void queryClient.invalidateQueries({ queryKey: ["property-attention"] });
            void queryClient.invalidateQueries({ queryKey: [...VISITS_KEY, "list"] });
        };
        window.addEventListener(WORKFLOW_SAVED_EVENT, refresh);
        return () => window.removeEventListener(WORKFLOW_SAVED_EVENT, refresh);
    }, [queryClient]);

    // Time-based classifications update with the same clock cadence as the source screens.
    const items = buildPropertyAttention(
        propertyId,
        taskData.tasks,
        pipeline.data?.items ?? [],
        visits.data?.items ?? [],
        now,
    );
    const loading = taskData.isLoading || pipeline.isPending || visits.isPending;
    const failed = [
        taskData.error && "Tasks",
        pipeline.isError && "Pipeline",
        visits.isError && "Visits",
    ].filter(Boolean);
    const retry = () => {
        void queryClient.invalidateQueries({
            predicate: (query) =>
                query.queryKey[1] === accountId &&
                ["tasks", "private-tasks-mock-v8"].includes(String(query.queryKey[0])),
        });
        void pipeline.refetch();
        void visits.refetch();
    };

    return (
        <AnalyticsCard
            title="Needs your attention"
            titleId="broker-attention-heading"
            description="Your Tasks, Pipeline and Visits for this property."
            action={
                loading ? (
                    <Skeleton className="block-7 inline-7" />
                ) : (
                    <span
                        className={styles.count}
                        aria-label={`${items.length} items${failed.length ? " from available sources" : ""}`}
                    >
                        {items.length}
                        {failed.length ? "+" : ""}
                    </span>
                )
            }
            className={cn(styles.section, styles.attention, styles.liveAttention)}
        >
            {failed.length > 0 && (
                <div role="status" className={styles.attentionWarning}>
                    <Info size={16} aria-hidden />
                    <p>
                        Couldn’t load {failed.join(", ")}.{" "}
                        {items.length
                            ? "Showing available records."
                            : "Try again to check all records."}
                    </p>
                    <Button variant="ghost" size="sm" onClick={retry}>
                        Retry
                    </Button>
                </div>
            )}
            <div
                role="region"
                aria-label="Items needing your attention"
                tabIndex={0}
                className={styles.attentionViewport}
            >
                {loading ? (
                    <div
                        role="status"
                        aria-label="Loading items needing attention"
                        className={styles.attentionLoading}
                    >
                        {[0, 1, 2].map((key) => (
                            <Skeleton key={key} className="block-16 inline-full" />
                        ))}
                    </div>
                ) : items.length ? (
                    <ul className={styles.attentionList}>
                        {items.map((item) => (
                            <li key={item.id}>
                                <span
                                    className={cn(
                                        styles.taskIcon,
                                        item.urgent && styles.taskUrgent,
                                    )}
                                >
                                    {item.source === "Visits" ? (
                                        <CalendarCheck size={18} aria-hidden />
                                    ) : (
                                        <Clock size={18} aria-hidden />
                                    )}
                                </span>
                                <div className={styles.taskCopy}>
                                    <Link href={item.href} className={styles.attentionTitle}>
                                        {item.title}
                                    </Link>
                                    <p>{item.detail}</p>
                                    <span className={styles.attentionSource}>{item.source}</span>
                                </div>
                                <Button
                                    nativeButton={false}
                                    render={<Link href={item.href} />}
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Open ${item.source}: ${item.title}`}
                                >
                                    <ChevronRight aria-hidden />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : !failed.length ? (
                    <div className={styles.empty}>
                        <CheckCircle2 size={26} aria-hidden />
                        <div>
                            <strong>You’re up to date</strong>
                            <p>
                                No tasks due today, visits awaiting an outcome or quiet deals for
                                this property.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </AnalyticsCard>
    );
}
