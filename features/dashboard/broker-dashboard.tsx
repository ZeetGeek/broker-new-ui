"use client";

import { useEffect } from "react";

import { isMockMode } from "@/lib/api/mock-mode";

import {
    mapBrokerDashboardView,
    mapBrokerDashboardViewFromMock,
} from "@/features/dashboard/map-dashboard";
import { dashboardMock } from "@/features/dashboard/mock-data";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBrokerDashboard } from "@/store/slices/dashboard-slice";

import { ActivityCard } from "./activity-card";
import { DashboardHeader } from "./dashboard-header";
import { DashboardError, DashboardLoading, DashboardPage } from "./dashboard-page-shell";
import { FollowUpsCard } from "./follow-ups-card";
import { NewInAreas } from "./new-in-areas";
import { NextShowingCard } from "./next-showing-card";
import { PipelineCard } from "./pipeline-card";
import { RequestsCard } from "./requests-card";
import { TodayCard } from "./today-card";
import { YouRepresentCard } from "./you-represent-card";

export function BrokerDashboard() {
    const dispatch = useAppDispatch();
    const authHydrated = useAppSelector((state) => state.auth.hydrated);
    const { data, profile, status, error } = useAppSelector((state) => state.dashboard);

    useEffect(() => {
        if (!authHydrated) return;
        void dispatch(fetchBrokerDashboard());
    }, [authHydrated, dispatch]);

    if (status === "idle" || status === "loading") {
        return <DashboardLoading />;
    }

    if (status === "failed") {
        return (
            <DashboardError
                message={error || "Failed to load dashboard"}
                onRetry={() => {
                    void dispatch(fetchBrokerDashboard());
                }}
            />
        );
    }

    const now = new Date();
    const view = isMockMode()
        ? mapBrokerDashboardViewFromMock(dashboardMock, profile, now)
        : mapBrokerDashboardView(data, profile, now);

    return (
        <DashboardPage
            header={
                <DashboardHeader
                    now={now}
                    siteVisitCount={view.siteVisitCount}
                    requestsWaitingCount={view.requestsWaitingCount}
                    pipelineActiveTotal={view.pipelineCard.activeTotal}
                    followUpsOverdueCount={view.followUps.overdueCount}
                    followUpsRemainingCount={view.followUps.remainingThisWeek}
                    activityCount={view.activity.items.length + (view.activity.remainingCount ?? 0)}
                    reraStatus={view.reraStatus}
                    serviceAreas={view.serviceAreas}
                    phoneDigits={view.phoneDigits}
                    email={view.email}
                />
            }
        >
            <NextShowingCard showing={view.nextShowing} now={now} className="md:col-span-4" />
            <TodayCard agenda={view.today} now={now} className="md:col-span-4" />
            <RequestsCard data={view.requests} className="md:col-span-4" />
            <PipelineCard data={view.pipelineCard} className="md:col-span-4" />
            <FollowUpsCard data={view.followUps} className="md:col-span-4" />
            <ActivityCard data={view.activity} className="md:col-span-4" />
            <YouRepresentCard data={view.youRepresent} className="md:col-span-6" />
            <NewInAreas
                properties={view.newInAreas}
                serviceAreas={view.serviceAreas}
                className="md:col-span-6"
            />
        </DashboardPage>
    );
}
