"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { type BookableLead, type BrokerVisit, siteVisitsApi } from "@/lib/api/site-visits";
import { formatPersonName } from "@/lib/format/person-name";
import { matchWorkflowVisitIntent, resolveWorkflowVisitIntent } from "@/lib/visits/workflow-intent";
import { notifyWorkflowSaved } from "@/lib/workflows/refresh";
import type { WorkflowTarget } from "@/lib/workflows/target";

import { EmptyState } from "@/components/empty-state";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import toast from "@/components/shared/app-toast";
import { CalendarCheck } from "@/components/shared/icons";
import { useWorkflowWorking } from "@/components/shared/workflow-context";
import { Button } from "@/components/ui/button";

import { MOCK_VISITS } from "@/features/new-dashboard/mock-work-overview";
import { getVisitActions, visitErrorMessage } from "@/features/new-site-visits/model";
import { ScheduleForm } from "@/features/new-site-visits/schedule-form";
import { useVisitMutations, VISITS_KEY } from "@/features/new-site-visits/use-visits";
import {
    AttendanceConfirmation,
    VisitDetail,
    type VisitIntent,
} from "@/features/new-site-visits/visit-detail";
import { VisitOverlay } from "@/features/new-site-visits/visit-overlay";
import { useAppSelector } from "@/store/hooks";

type View =
    | { kind: "schedule"; intent: BookableLead | null; intentMissed: boolean }
    | { kind: "detail" | "reschedule"; visit: BrokerVisit }
    | { kind: "confirm"; visit: BrokerVisit; intent: VisitIntent };

/** Reuses Visits' actual forms and mutation hooks; the page below is never navigated. */
export function VisitWorkflow({
    target,
    onClose,
}: {
    target: Extract<WorkflowTarget, { kind: "visit" }>;
    onClose: () => void;
}) {
    const accountId = useAppSelector((state) => state.auth.user?.id);
    const queryClient = useQueryClient();
    const mutations = useVisitMutations();
    const [view, setView] = useState<View | null>(null);
    const [actionError, setActionError] = useState("");
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 15_000);
        return () => window.clearInterval(timer);
    }, []);
    const detailKey = [...VISITS_KEY, "detail", accountId, target.id];
    const detail = useQuery({
        queryKey: detailKey,
        queryFn: ({ signal }) => siteVisitsApi.get(target.id!, signal),
        enabled: !target.preview && target.mode !== "schedule" && Boolean(target.id),
        retry: 1,
    });
    const hasIntent = Boolean(
        target.intent.leadId || target.intent.clientId || target.intent.propertyId,
    );
    const intent = useQuery({
        queryKey: [...VISITS_KEY, "schedule-intent", accountId, target.intent],
        queryFn: async () => {
            const leads = await queryClient.fetchQuery({
                queryKey: [...VISITS_KEY, "bookable"],
                queryFn: () => siteVisitsApi.bookable(),
            });
            const lead = matchWorkflowVisitIntent(target.intent, leads);
            const active = lead ? await siteVisitsApi.activeForLead(lead.leadId) : null;
            return resolveWorkflowVisitIntent(target.intent, leads, active);
        },
        enabled: !target.preview && target.mode === "schedule" && hasIntent,
        retry: 1,
    });
    const busy = mutations.cancel.isPending || mutations.setOutcome.isPending;
    const refresh = () => {
        notifyWorkflowSaved("visit");
        void queryClient.invalidateQueries({
            predicate: (query) =>
                /^(property-analytics|workflow-deal|broker)$/.test(String(query.queryKey[0])),
        });
    };
    const done = () => {
        refresh();
        void queryClient.invalidateQueries({ queryKey: [...VISITS_KEY, "detail"] });
        onClose();
    };
    const initial: View | null =
        target.mode === "schedule"
            ? hasIntent
                ? (intent.data ?? null)
                : { kind: "schedule", intent: null, intentMissed: false }
            : detail.data
              ? { kind: target.mode === "reschedule" ? "reschedule" : "detail", visit: detail.data }
              : null;
    const current = view ?? initial;
    useWorkflowWorking(
        busy ||
            current?.kind === "schedule" ||
            current?.kind === "reschedule" ||
            current?.kind === "confirm",
    );
    const fresh = (visit: BrokerVisit) => (detail.data?.id === visit.id ? detail.data : visit);
    const confirm = async (visit: BrokerVisit, outcome: VisitIntent) => {
        if (busy) return;
        setActionError("");
        try {
            let saved: BrokerVisit;
            if (outcome === "cancelled") {
                await mutations.cancel.mutateAsync(visit.id);
                saved = { ...visit, status: "cancelled" };
                toast.success("Visit cancelled");
            } else {
                saved = await mutations.setOutcome.mutateAsync({
                    id: visit.id,
                    status: outcome === "completed" ? "completed" : "no_show",
                });
                toast.success(outcome === "completed" ? "Marked completed" : "Marked not attended");
            }
            queryClient.setQueryData([...VISITS_KEY, "detail", accountId, saved.id], saved);
            refresh();
            setView({ kind: "detail", visit: saved });
        } catch (error) {
            setActionError(visitErrorMessage(error));
        }
    };

    const sample = target.preview ? MOCK_VISITS.find((visit) => visit.id === target.id) : null;
    if (target.preview && !view)
        return (
            <VisitOverlay
                title="Sample visit"
                onClose={onClose}
                footer={(close) => (
                    <AppModalFooter
                        secondaryLabel="Close"
                        secondaryVariant="outline"
                        onSecondary={close}
                        primaryLabel="Schedule a new visit"
                        primaryVariant="accent"
                        onPrimary={() =>
                            setView({ kind: "schedule", intent: null, intentMissed: false })
                        }
                    />
                )}
            >
                <p className="body text-ink-muted">
                    This dashboard card is sample data and is not linked to a saved visit. Its
                    details and time cannot be changed here.
                </p>
                {sample ? (
                    <dl className="mbs-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[
                            ["Property", sample.property],
                            ["Place", sample.location],
                            ["Time", `${sample.time}–${sample.end}`],
                            ["Client", formatPersonName(sample.client)],
                            ["Owner", formatPersonName(sample.owner)],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <dt className="body-xs text-ink-muted">{label}</dt>
                                <dd className="body-sm mbs-1 font-semibold text-ink">{value}</dd>
                            </div>
                        ))}
                    </dl>
                ) : null}
                <p className="body-sm mbs-3 text-ink-muted">
                    You can schedule a new visit, or{" "}
                    <Link className="underline underline-offset-4" href="/broker/visits">
                        open Visits
                    </Link>{" "}
                    to find an existing appointment.
                </p>
            </VisitOverlay>
        );
    if (current?.kind === "schedule")
        return (
            <ScheduleForm
                key={current.intent?.leadId ?? "new"}
                intent={current.intent}
                intentMissed={current.intentMissed}
                onDone={done}
                onBack={onClose}
            />
        );
    if (current?.kind === "reschedule") {
        const visit = fresh(current.visit);
        if (getVisitActions(visit, now).includes("reschedule"))
            return <ScheduleForm key={visit.id} visit={visit} onDone={done} onBack={onClose} />;
        return (
            <VisitOverlay
                title="Visit cannot be rescheduled"
                onClose={onClose}
                footer={(close) => (
                    <AppModalFooter
                        secondaryLabel="Close"
                        secondaryVariant="outline"
                        onSecondary={close}
                        primaryLabel="View details"
                        primaryVariant="accent"
                        onPrimary={() => setView({ kind: "detail", visit })}
                    />
                )}
            >
                <p className="body text-ink-muted">
                    This visit cannot be moved with its current status or listing type. Open its
                    details to review the available actions.
                </p>
            </VisitOverlay>
        );
    }
    if (current?.kind === "confirm")
        return (
            <AttendanceConfirmation
                visit={fresh(current.visit)}
                intent={current.intent}
                busy={busy}
                error={actionError}
                onClose={() => {
                    if (!busy) {
                        setActionError("");
                        setView({ kind: "detail", visit: fresh(current.visit) });
                    }
                }}
                onConfirm={() => confirm(fresh(current.visit), current.intent)}
            />
        );
    if (current?.kind === "detail")
        return (
            <VisitDetail
                visit={fresh(current.visit)}
                now={now}
                busy={busy}
                onBack={onClose}
                onReschedule={() => setView({ kind: "reschedule", visit: fresh(current.visit) })}
                onConfirm={(outcome) => {
                    setActionError("");
                    setView({ kind: "confirm", visit: fresh(current.visit), intent: outcome });
                }}
                onScheduleAnother={() => {
                    const visit = fresh(current.visit);
                    setView({
                        kind: "schedule",
                        intent: {
                            leadId: visit.leadId,
                            clientId: visit.clientId,
                            clientName: visit.clientName,
                            propertyId: visit.propertyId,
                            propertyTitle: visit.propertyTitle,
                        },
                        intentMissed: false,
                    });
                }}
            />
        );
    const query = target.mode === "schedule" ? intent : detail;
    const missing = (query.isSuccess && !query.data) || (target.mode !== "schedule" && !target.id);
    return (
        <VisitOverlay
            title={
                missing ? "Visit not found" : query.isError ? "Visit unavailable" : "Loading visit"
            }
            onClose={onClose}
            footer={(close) => (
                <AppModalFooter>
                    <Button variant="outline" onClick={close}>
                        Close
                    </Button>
                    {query.isError ? (
                        <Button variant="accent" onClick={() => void query.refetch()}>
                            Retry
                        </Button>
                    ) : null}
                </AppModalFooter>
            )}
        >
            {query.isError || missing ? (
                <EmptyState
                    size="card"
                    icon={CalendarCheck}
                    variant={query.isError ? "error" : "default"}
                    heading={
                        query.isError ? "Could not load this visit" : "Visit no longer available"
                    }
                    description={
                        query.isError
                            ? "Check your connection and try again."
                            : "It may have been removed. Open Visits to choose another visit."
                    }
                    action={
                        missing
                            ? { label: "Open visits", icon: CalendarCheck, href: "/broker/visits" }
                            : undefined
                    }
                />
            ) : (
                <p className="body text-ink-muted" role="status">
                    Loading visit details…
                </p>
            )}
        </VisitOverlay>
    );
}
