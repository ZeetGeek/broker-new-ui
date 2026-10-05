"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Building2, Check, Handshake, Inbox, X } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import {
    dashboardApi,
    type DashboardOwnerBrokerRequest,
    type DashboardOwnerSummary,
    type DashboardResponse,
} from "@/lib/api/dashboard";
import { profileApi } from "@/lib/api/profile";
import { representativeApi } from "@/lib/api/representative";
import { formatRelativePast, parseApiInstant } from "@/lib/format/date";
import {
    OWNER_LEADS_HREF,
    OWNER_PROPERTIES_HREF,
    OWNER_PROPERTIES_NEW_HREF,
    OWNER_REQUESTS_HREF,
    ownerBrokersHref,
    ownerPropertyDetailHref,
} from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { TextLinkButton } from "@/components/shared/text-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { ActivityCard } from "@/features/dashboard/activity-card";
import { CardLabel } from "@/features/dashboard/card-label";
import { DASHBOARD_CARD_SHELL, DASHBOARD_CARD_SHELL_EMPTY } from "@/features/dashboard/card-shell";
import { DigitPopIn } from "@/features/dashboard/digit-pop-in";
import { mapOwnerDashboardView } from "@/features/dashboard/map-dashboard";
import { NextShowingCard } from "@/features/dashboard/next-showing-card";
import { OwnerDashboardHeader, OwnerMetricCell } from "@/features/dashboard/owner-dashboard-header";
import { TodayCard } from "@/features/dashboard/today-card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setProfile } from "@/store/slices/dashboard-slice";

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

const GLANCE_INFO = "A quick count of your listings, brokers, requests, and property deals closed.";

function GlanceCard({
    summary,
    className,
}: {
    summary: DashboardOwnerSummary;
    className?: string;
}) {
    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="owner-glance-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info={GLANCE_INFO}>
                    <span id="owner-glance-heading">At a glance</span>
                </CardLabel>
                <TextLinkButton href={OWNER_PROPERTIES_HREF}>Your properties</TextLinkButton>
            </div>

            <div
                className="
                  mbs-4 flex shrink-0 items-stretch rounded-inner bg-surface-muted px-2 py-3
                "
                role="group"
                aria-label="Owner summary counts"
            >
                <OwnerMetricCell
                    label="Listed"
                    value={summary.propertiesListed}
                    hint="Properties you have listed on the platform."
                />
                <div className="shrink-0 self-stretch bg-border inline-px" aria-hidden />
                <OwnerMetricCell
                    label="Brokers"
                    value={summary.activeBrokers}
                    hint="Brokers currently approved to represent your properties."
                />
                <div className="shrink-0 self-stretch bg-border inline-px" aria-hidden />
                <OwnerMetricCell
                    label="Waiting"
                    value={summary.pendingRequests}
                    hint="Broker requests waiting for your reply."
                    valueClassName={summary.pendingRequests > 0 ? "text-pending" : undefined}
                />
                <div className="shrink-0 self-stretch bg-border inline-px" aria-hidden />
                <OwnerMetricCell
                    label="Closed"
                    value={summary.dealsClosed}
                    hint="Property deals closed on your listings."
                    valueClassName={summary.dealsClosed > 0 ? "text-success" : undefined}
                />
            </div>

            <div className="mbs-auto flex flex-col gap-3 pt-4">
                <p className="body-sm text-ink-muted">
                    Keep listings current so brokers can represent them without calling you first.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <TextLinkButton href={OWNER_PROPERTIES_HREF}>
                        <Building2
                            aria-hidden
                            className="block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        Manage listings
                    </TextLinkButton>
                    <TextLinkButton href={OWNER_PROPERTIES_NEW_HREF}>Add a property</TextLinkButton>
                    <TextLinkButton href={OWNER_LEADS_HREF}>View offers</TextLinkButton>
                </div>
            </div>
        </section>
    );
}

function PendingRequestRow({
    request,
    busy,
    onRespond,
}: {
    request: DashboardOwnerBrokerRequest;
    busy: boolean;
    onRespond: (status: "accepted" | "rejected") => void;
}) {
    const createdAt = request.createdAt ? parseApiInstant(request.createdAt) : null;
    const brokerLabel = request.brokerDisplayName || request.brokerName || "Broker";

    return (
        <li className="flex flex-col gap-2 border-be border-border-warm py-3 last:border-be-0">
            <div className="flex items-start gap-3 min-inline-0">
                <Handshake
                    aria-hidden
                    className="mbs-0.5 shrink-0 text-brand block-4 inline-4"
                    strokeWidth={1.75}
                />
                <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="body font-semibold text-ink truncate">{brokerLabel}</p>
                        {request.brokerVerified ? (
                            <Badge variant="brand" className="shrink-0">
                                Verified
                            </Badge>
                        ) : null}
                        {request.brokerIsAgency ? (
                            <Badge variant="outline" className="shrink-0 bg-surface">
                                Agency
                            </Badge>
                        ) : null}
                    </div>
                    <Link
                        href={ownerPropertyDetailHref(request.propertyId)}
                        className="
                          body-sm font-medium text-brand underline-offset-4 truncate
                          hover:underline
                        "
                    >
                        {request.propertyTitle}
                    </Link>
                    {request.message ? (
                        <p className="body-sm text-pretty text-ink-muted line-clamp-2">
                            {request.message}
                        </p>
                    ) : null}
                    {createdAt ? (
                        <p className="body-xs text-ink-subtle">
                            {formatRelativePast(createdAt, new Date())}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 ps-7">
                <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => onRespond("accepted")}
                    className="rounded-control bg-brand text-surface hover:bg-brand-text"
                >
                    <Check aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                    Accept
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onRespond("rejected")}
                    className="rounded-control border-border-warm"
                >
                    <X aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                    Decline
                </Button>
            </div>
        </li>
    );
}

function PendingRequestsCard({
    requests,
    pendingCount,
    busyId,
    onRespond,
    className,
}: {
    requests: DashboardOwnerBrokerRequest[];
    pendingCount: number;
    busyId: string | null;
    onRespond: (id: string, status: "accepted" | "rejected") => void;
    className?: string;
}) {
    if (requests.length === 0) {
        return (
            <section
                className={cn(DASHBOARD_CARD_SHELL_EMPTY, className)}
                aria-labelledby="owner-requests-heading"
            >
                <CardLabel info="Brokers asking to represent one of your properties.">
                    <span id="owner-requests-heading">Pending requests</span>
                </CardLabel>
                <EmptyState
                    icon={Inbox}
                    heading="No pending requests"
                    description="When a broker asks to represent a listing, it shows up here."
                >
                    <TextLinkButton href={ownerBrokersHref()}>Browse brokers</TextLinkButton>
                </EmptyState>
            </section>
        );
    }

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="owner-requests-heading"
        >
            <div className="flex shrink-0 items-start justify-between gap-3">
                <CardLabel info="Brokers asking to represent one of your properties.">
                    <span id="owner-requests-heading">Pending requests</span>
                </CardLabel>
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <button
                                type="button"
                                aria-label={`${pendingCount} broker requests waiting`}
                                className="
                                  eyebrow shrink-0 rounded-sm text-ink-muted outline-none
                                  focus-visible:ring-2 focus-visible:ring-ring
                                "
                            >
                                <DigitPopIn value={pendingCount} /> waiting
                            </button>
                        }
                    />
                    <TooltipContent
                        side="bottom"
                        align="center"
                        className="text-pretty max-inline-64"
                    >
                        Broker representation requests that still need your reply.
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="mbs-2 flex-1 overflow-hidden min-block-0">
                <div
                    className="
                      scrollbar-none overflow-y-auto overscroll-contain
                      [-ms-overflow-style:none] block-full
                      [&::-webkit-scrollbar]:hidden
                    "
                >
                    <ul className="flex flex-col">
                        {requests.map((request) => (
                            <PendingRequestRow
                                key={request.id}
                                request={request}
                                busy={busyId === request.id}
                                onRespond={(status) => onRespond(request.id, status)}
                            />
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mbs-auto flex shrink-0 justify-end pt-2">
                <TextLinkButton href={OWNER_REQUESTS_HREF}>View all</TextLinkButton>
            </div>
        </section>
    );
}

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

    return (
        <div className="flex flex-col gap-6 min-block-[calc(100dvh-5rem)] md:gap-6">
            <header className="flex shrink-0 flex-col gap-4">
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
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
                <NextShowingCard
                    showing={view.nextShowing}
                    now={now}
                    portal="owner"
                    className="md:col-span-4"
                />
                <TodayCard agenda={view.today} now={now} portal="owner" className="md:col-span-4" />
                <PendingRequestsCard
                    requests={view.pendingRequests}
                    pendingCount={view.pendingRequestsCount}
                    busyId={busyId}
                    onRespond={(id, respondStatus) => {
                        void handleRespond(id, respondStatus);
                    }}
                    className="md:col-span-4"
                />
                <GlanceCard summary={view.summary} className="md:col-span-4" />
                <ActivityCard data={view.activity} portal="owner" className="md:col-span-8" />
            </div>
        </div>
    );
}
