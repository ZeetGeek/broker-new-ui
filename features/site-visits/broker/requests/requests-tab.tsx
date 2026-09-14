"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { REQUEST_GROUPS, requestIsCollapsed } from "@/lib/visits/status";
import { formatVisitTime } from "@/lib/visits/time";
import { useRequestActions } from "@/hooks/use-time-requests";

import { Button } from "@/components/ui/button";

import type { TimeRequest } from "@/features/site-visits/broker/model";
import { RequestRow } from "@/features/site-visits/broker/requests/request-row";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

export function RequestsTab({ requests, isLoading, onNew, onRetry, onViewVisit }: { requests: TimeRequest[]; isLoading: boolean; onNew: () => void; onRetry: (propertyId: string, buyerId?: string) => void; onViewVisit: (id: string) => void }) {
    const actions = useRequestActions();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const expired = requests.filter((request) => requestIsCollapsed(request.status)).length;
    const busy = actions.accept.isPending || actions.decline.isPending || actions.withdraw.isPending || actions.nudge.isPending;
    const run = async (request: TimeRequest, action: () => Promise<unknown>, success: string) => {
        setErrors((current) => ({ ...current, [request.id]: "" }));
        try {
            await action();
            toast.success(success);
        } catch (error) {
            setErrors((current) => ({ ...current, [request.id]: error instanceof Error ? error.message : "Could not update this request. Check your connection and try again." }));
        }
    };
    if (isLoading && requests.length === 0) return <VisitsTabSkeleton kind="requests" />;
    if (requests.length === 0) return <EmptyState kind="no-requests" onPrimary={onNew} />;
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between gap-3"><div><h2 className="
              h5 text-ink
            ">Time requests</h2><p className="body-xs text-ink-muted">Newest first. Owner replies that need you stay at the top.</p></div><Button onClick={onNew}>Request a time</Button></div>
            {REQUEST_GROUPS.map((group) => {
                const rows = requests.filter((request) => request.status === group.status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                if (!rows.length) return null;
                return <section key={group.status} className="space-y-3"><h3 className="h6 text-ink">{group.label} <span className="
                  body-xs font-normal text-ink-muted
                ">{rows.length}</span></h3>{rows.map((request) => <RequestRow key={request.id} request={request} busy={busy} error={errors[request.id]} onWithdraw={() => void run(request, () => actions.withdraw.mutateAsync(request.id), "Request withdrawn")} onNudge={() => {
                    const text = encodeURIComponent(`Hello ${request.owner.name}, I had asked for a ${formatVisitTime(request.preferredStartsAt)} visit at ${request.property.title} for my client. Can you confirm if that time works?`);
                    if (request.owner.phoneDigits) window.open(`https://wa.me/91${request.owner.phoneDigits}?text=${text}`, "_blank", "noopener,noreferrer");
                    void run(request, () => actions.nudge.mutateAsync(request.id), "Owner nudge ready");
                }} onAccept={() => void run(request, () => actions.accept.mutateAsync(request), "Counter-offer accepted")} onDecline={() => void run(request, () => actions.decline.mutateAsync(request.id), "Counter-offer declined")} onRetry={() => onRetry(request.propertyId, request.buyerIds[0])} onViewVisit={() => { if (request.createdVisitId) onViewVisit(request.createdVisitId); }} />)}</section>;
            })}
            {expired > 0 ? <details className="
              rounded-inner border border-border-warm bg-surface px-4 py-3
            "><summary className="body-sm cursor-pointer font-semibold text-ink-muted">{expired} expired {expired === 1 ? "request" : "requests"}</summary><p className="
              body-xs mbs-2 text-ink-muted
            ">These times passed before an owner accepted them.</p></details> : null}
        </section>
    );
}
