"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardApi, type DashboardResponse } from "@/lib/api/dashboard";
import { isMockMode } from "@/lib/api/mock-mode";

import { EmptyState } from "@/components/shared/empty-state";
import { ArrowLeft, BellRing } from "@/components/shared/icons";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";

import { FollowUpRow } from "./follow-ups-card";
import { dashboardMock } from "./mock-data";

/** The dashboard API returns a preview, not a paginated follow-up collection. */
export function OverdueFollowUpsPage() {
    const query = useQuery<DashboardResponse>({
        queryKey: ["dashboard", "overdue-follow-ups"],
        queryFn: () => dashboardApi.get(),
        refetchOnWindowFocus: true,
    });
    const followUps = isMockMode() ? dashboardMock.followUps : query.data?.followUps;
    const items = followUps?.items.filter((item) => item.due === "overdue") ?? [];
    const total = followUps?.overdueCount;

    return (
        <section className="mx-auto flex flex-col gap-6 inline-full max-inline-3xl min-inline-0">
            <Link
                href="/broker/contacts"
                className="body-sm inline-flex items-center gap-2 self-start rounded-control font-semibold text-brand-text min-block-11"
            >
                <ArrowLeft aria-hidden className="block-4 inline-4" /> All clients
            </Link>
            <header className="flex flex-col gap-2">
                <h1 className="h2">Overdue follow-ups</h1>
                <p className="body-sm text-ink-muted">
                    Review who needs a follow-up. Open a client to see their details, or contact
                    them directly.
                </p>
            </header>
            {query.isPending && !isMockMode() ? (
                <p role="status">Loading follow-ups…</p>
            ) : query.isError && !isMockMode() ? (
                <div role="alert" className="flex flex-col items-start gap-3">
                    <p>Couldn&apos;t load follow-ups.</p>
                    <Button variant="outline" onClick={() => void query.refetch()}>
                        Try again
                    </Button>
                </div>
            ) : total == null ? (
                <p>Follow-up counts are currently unavailable.</p>
            ) : (
                <div className="rounded-card border border-border-warm bg-surface p-4 sm:p-6">
                    <p className="body-sm font-semibold text-ink">
                        {total.toLocaleString("en-IN")} overdue{" "}
                        {total === 1 ? "follow-up" : "follow-ups"}
                    </p>
                    {items.length < total ? (
                        <p className="body-sm mbs-2 text-ink-muted">
                            Showing {items.length} of {total} overdue follow-ups. More follow-ups
                            aren&apos;t available in this view yet.
                        </p>
                    ) : null}
                    {items.length ? (
                        <ul className="mbs-3 divide-y divide-border-warm">
                            {items.map((item) => (
                                <FollowUpRow key={item.id} item={item} />
                            ))}
                        </ul>
                    ) : total === 0 ? (
                        <EmptyState
                            icon={BellRing}
                            heading="No overdue follow-ups"
                            description="You're caught up on overdue follow-ups."
                        />
                    ) : null}
                </div>
            )}
        </section>
    );
}
