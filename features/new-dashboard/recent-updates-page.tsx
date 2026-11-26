"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { dashboardApi, type DashboardResponse } from "@/lib/api/dashboard";
import { isLaunchEventVisible } from "@/lib/notifications/launch-policy";

import { HistoryPage } from "@/features/history/history-page";

import { activityIcon } from "./activity-icon";

const CATEGORY_LABELS: Record<string, string> = {
    calendar: "Visits",
    clients: "Clients",
    properties: "Listings",
    representation: "Requests",
    profile: "Profile",
};

export function RecentUpdatesPage() {
    const query = useQuery<DashboardResponse>({
        queryKey: ["dashboard-update-history", "broker"],
        queryFn: () => dashboardApi.get(),
    });
    const entries = useMemo(
        () =>
            (query.data?.activity?.items ?? [])
                .filter((item) => Number.isFinite(Date.parse(item.createdAt)))
                .filter((item) =>
                    isLaunchEventVisible({
                        type: `${item.category} ${item.action}`,
                        referenceType: item.entityType,
                        href: item.href,
                    }),
                )
                .map((item) => ({
                    id: item.id,
                    title: item.title,
                    body: item.detail,
                    createdAt: item.createdAt,
                    href: item.href,
                    category: CATEGORY_LABELS[item.category] ?? "Other updates",
                    Icon: activityIcon(item.category),
                })),
        [query.data],
    );
    return (
        <HistoryPage
            title="Recent updates"
            entries={entries}
            loading={query.isPending}
            error={query.isError}
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            emptyDescription="Updates to your listings, clients and visits will appear here."
            footer={
                (query.data?.activity?.remainingCount ?? 0) > 0 ? (
                    <p className="body-sm text-ink-muted">
                        Showing the latest updates available. Older updates are not available yet.
                    </p>
                ) : null
            }
        />
    );
}
