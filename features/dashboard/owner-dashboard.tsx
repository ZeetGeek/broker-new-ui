"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { ApiError } from "@/lib/api/client";
import { dashboardApi, type DashboardResponse } from "@/lib/api/dashboard";
import { profileApi } from "@/lib/api/profile";
import { representativeApi } from "@/lib/api/representative";

import { ActivityCard } from "@/features/dashboard/activity-card";
import {
    DashboardError,
    DashboardLoading,
    DashboardPage,
} from "@/features/dashboard/dashboard-page-shell";
import { GlanceCard } from "@/features/dashboard/glance-card";
import { mapOwnerDashboardView } from "@/features/dashboard/map-dashboard";
import { NextShowingCard } from "@/features/dashboard/next-showing-card";
import { OwnerDashboardHeader } from "@/features/dashboard/owner-dashboard-header";
import { PendingRequestsCard } from "@/features/dashboard/pending-requests-card";
import { TodayCard } from "@/features/dashboard/today-card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/slices/dashboard-slice";

export function OwnerDashboard() {
    const dispatch = useAppDispatch();
    const authHydrated = useAppSelector((state) => state.auth.hydrated);
    const authUser = useAppSelector((state) => state.auth.user);
    const profile = useAppSelector((state) => state.dashboard.profile);
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "succeeded" | "failed">("idle");
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setStatus("loading");
        setError(null);
        try {
            const [dashboard, nextProfile] = await Promise.all([
                dashboardApi.get(),
                profileApi.get().catch(() => null),
            ]);
            setData(dashboard);
            if (nextProfile) dispatch(setProfile(nextProfile));
            setStatus("succeeded");
        } catch (err) {
            setStatus("failed");
            setError(
                err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Failed to load dashboard",
            );
        }
    }, [dispatch]);

    useEffect(() => {
        if (!authHydrated) return;
        void load();
    }, [authHydrated, load]);

    const handleRespond = useCallback(
        async (representationId: string, respondStatus: "accepted" | "rejected") => {
            setBusyId(representationId);
            try {
                await representativeApi.ownerRespond(representationId, { status: respondStatus });
                toast.success(
                    respondStatus === "accepted" ? "Request accepted" : "Request declined",
                );
                setData((prev) => {
                    if (!prev?.brokerRequests) return prev;
                    return {
                        ...prev,
                        brokerRequests: prev.brokerRequests.filter(
                            (item) => item.id !== representationId,
                        ),
                        summary: {
                            ...prev.summary,
                            pendingRequests: Math.max(
                                0,
                                Number(prev.summary.pendingRequests ?? 1) - 1,
                            ),
                            ...(respondStatus === "accepted"
                                ? {
                                      activeBrokers: Number(prev.summary.activeBrokers ?? 0) + 1,
                                  }
                                : null),
                        },
                    };
                });
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Couldn't update that request");
            } finally {
                setBusyId(null);
            }
        },
        [],
    );

    if (status === "idle" || status === "loading" || !authHydrated) {
        return <DashboardLoading />;
    }

    if (status === "failed" || !data) {
        return (
            <DashboardError
                message={error || "Failed to load dashboard"}
                onRetry={() => {
                    void load();
                }}
            />
        );
    }

    const now = new Date();
    const view = mapOwnerDashboardView(data, profile, now);
    const phoneDigits = view.phoneDigits || authUser?.phone || "";
    const email = view.email || authUser?.email || "";
    const city = view.city || authUser?.city?.trim() || null;
    const visitsEmpty = view.nextShowing == null && view.today.items.length === 0;

    return (
        <DashboardPage
            header={
                <OwnerDashboardHeader
                    now={now}
                    propertiesListed={view.summary.propertiesListed}
                    activeBrokers={view.summary.activeBrokers}
                    pendingRequests={view.summary.pendingRequests}
                    visitsScheduled={view.summary.visitsScheduled}
                    dealsClosed={view.summary.dealsClosed}
                    phoneDigits={phoneDigits}
                    email={email}
                    city={city}
                />
            }
        >
            {/* Pending first on mobile (decision card above the fold); desktop order restored via md:order-* */}
            <PendingRequestsCard
                requests={view.pendingRequests}
                pendingCount={view.pendingRequestsCount}
                busyId={busyId}
                onRespond={(id, respondStatus) => {
                    void handleRespond(id, respondStatus);
                }}
                className={
                    visitsEmpty
                        ? "order-1 md:order-2 md:col-span-4"
                        : "order-1 md:order-3 md:col-span-4"
                }
            />

            {visitsEmpty ? (
                <NextShowingCard
                    showing={null}
                    now={now}
                    portal="owner"
                    className="order-2 md:order-1 md:col-span-8"
                />
            ) : (
                <>
                    <NextShowingCard
                        showing={view.nextShowing}
                        now={now}
                        portal="owner"
                        className="order-2 md:order-1 md:col-span-4"
                    />
                    <TodayCard
                        agenda={view.today}
                        now={now}
                        portal="owner"
                        className="order-3 md:order-2 md:col-span-4"
                    />
                </>
            )}

            <GlanceCard
                summary={view.summary}
                visits={view.glanceVisits}
                invites={view.glanceInvites}
                now={now}
                className="order-4 md:col-span-6"
            />
            <ActivityCard data={view.activity} portal="owner" className="order-5 md:col-span-6" />
        </DashboardPage>
    );
}
