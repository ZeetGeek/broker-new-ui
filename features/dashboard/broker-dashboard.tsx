"use client";

import { useEffect } from "react";

import { LoadingSpinner } from "@/components/shared/loading-spinner";

import { mapBrokerDashboardView } from "@/features/dashboard/map-dashboard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBrokerDashboard } from "@/store/slices/dashboard-slice";

import { ActivityCard } from "./activity-card";
import { DashboardHeader } from "./dashboard-header";
import { FollowUpsCard } from "./follow-ups-card";
import { NewInAreas } from "./new-in-areas";
import { NextShowingCard } from "./next-showing-card";
import { PipelineCard } from "./pipeline-card";
import { RequestsCard } from "./requests-card";
import { TodayCard } from "./today-card";
import { YouRepresentCard } from "./you-represent-card";

function DashboardLoading() {
    return (
        <div className="flex items-center justify-center min-block-[calc(100dvh-5rem)]">
            <LoadingSpinner label="Loading dashboard" />
        </div>
    );
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div
            className="
              flex flex-col items-center justify-center gap-4 text-center
              min-block-[calc(100dvh-5rem)]
            "
        >
            <p className="h5 text-ink">Could not load your dashboard</p>
            <p className="body text-ink-muted max-inline-96">{message}</p>
            <button
                type="button"
                onClick={onRetry}
                className="body font-medium text-brand underline underline-offset-4"
            >
                Try again
            </button>
        </div>
    );
}

export function BrokerDashboard() {
    const dispatch = useAppDispatch();
    const { data, profile, status, error } = useAppSelector((state) => state.dashboard);

    useEffect(() => {
        void dispatch(fetchBrokerDashboard());
    }, [dispatch]);

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
    const view = mapBrokerDashboardView(data, profile, now);

    return (
        <div className="flex flex-col gap-6 min-block-[calc(100dvh-5rem)] md:gap-6">
            <header className="flex shrink-0 flex-col gap-4">
                <DashboardHeader
                    now={now}
                    siteVisitCount={view.siteVisitCount}
                    requestsWaitingCount={view.requestsWaitingCount}
                    reraStatus={view.reraStatus}
                    serviceAreas={view.serviceAreas}
                    phoneDigits={view.phoneDigits}
                    email={view.email}
                />
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
                <NextShowingCard showing={view.nextShowing} now={now} className="md:col-span-5" />
                <div className="grid grid-cols-1 gap-4 md:col-span-7 md:grid-cols-2 md:gap-5">
                    <TodayCard agenda={view.today} now={now} />
                    <RequestsCard data={view.requests} serviceAreas={view.serviceAreas} />
                </div>
                <div className="grid grid-cols-1 gap-4 md:col-span-7 md:grid-cols-2 md:gap-5">
                    <PipelineCard data={view.pipelineCard} />
                    <FollowUpsCard data={view.followUps} />
                </div>
                <ActivityCard data={view.activity} className="md:col-span-5" />
                <div className="grid grid-cols-1 gap-4 md:col-span-12 md:grid-cols-2 md:gap-5">
                    <YouRepresentCard data={view.youRepresent} />
                    <NewInAreas
                        properties={view.newInAreas}
                        serviceAreas={view.serviceAreas}
                    />
                </div>
            </div>
        </div>
    );
}
