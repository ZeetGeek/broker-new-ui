"use client";

import toast from "react-hot-toast";

import { formatVisitTime } from "@/lib/visits/time";
import { REQUEST_GROUPS, requestIsCollapsed } from "@/lib/visits/status";
import { useRequestActions } from "@/hooks/use-time-requests";

import { Button } from "@/components/ui/button";

import type { TimeRequest } from "@/features/site-visits/broker/model";
import { RequestRow } from "@/features/site-visits/broker/requests/request-row";
import { EmptyState, VisitsTabSkeleton } from "@/features/site-visits/broker/visits-states";

export function RequestsTab({ requests, isLoading, onNew, onRetry, onViewVisit }: { requests: TimeRequest[]; isLoading: boolean; onNew: () => void; onRetry: (propertyId: string, buyerId?: string) => void; onViewVisit: (id: string) => void }) {
    const actions = useRequestActions();
    const expired = requests.filter((request) => requestIsCollapsed(request.status)).length;
    const busy = actions.accept.isPending || actions.decline.isPending || actions.withdraw.isPending || actions.nudge.isPending;
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
                ">{rows.length}</span></h3>{rows.map((request) => <RequestRow key={request.id} request={request} busy={busy} onWithdraw={() => void actions.withdraw.mutateAsync(request.id).then(() => toast.success("Request withdrawn"))} onNudge={() => {
                    const text = encodeURIComponent(`Hello ${request.owner.name}, I had asked for a ${formatVisitTime(request.preferredStartsAt)} visit at ${request.property.title} for my client. Can you confirm if that time works?`);
                    if (request.owner.phoneDigits) window.open(`https://wa.me/91${request.owner.phoneDigits}?text=${text}`, "_blank", "noopener,noreferrer");
                    void actions.nudge.mutateAsync(request.id).then(() => toast.success("Owner nudge ready"));
                }} onAccept={() => void actions.accept.mutateAsync(request).then(() => toast.success("Counter-offer accepted"))} onDecline={() => void actions.decline.mutateAsync(request.id).then(() => toast.success("Counter-offer declined"))} onRetry={() => onRetry(request.propertyId, request.buyerIds[0])} onViewVisit={() => { if (request.createdVisitId) onViewVisit(request.createdVisitId); }} />)}</section>;
            })}
            {expired > 0 ? <details className="
              rounded-inner border border-border-warm bg-surface px-4 py-3
            "><summary className="body-sm cursor-pointer font-semibold text-ink-muted">{expired} expired {expired === 1 ? "request" : "requests"}</summary><p className="
              body-xs mbs-2 text-ink-muted
            ">These times passed before an owner accepted them.</p></details> : null}
        </section>
    );
}
