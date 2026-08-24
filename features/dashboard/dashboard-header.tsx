import Link from "next/link";

import { Button } from "@/components/ui/button";

export type DashboardHeaderProps = {
    weekdayLabel: string;
    siteVisitCount: number;
    requestsWaitingCount: number;
};

export function DashboardHeader({
    weekdayLabel,
    siteVisitCount,
    requestsWaitingCount,
}: DashboardHeaderProps) {
    const visitWord = siteVisitCount === 1 ? "site visit" : "site visits";
    const requestWord = requestsWaitingCount === 1 ? "request" : "requests";

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="h1 min-inline-0">
                <span className="text-ink">{weekdayLabel}.</span>{" "}
                <span className="text-ink-muted">
                    {siteVisitCount} {visitWord}, {requestsWaitingCount} {requestWord} waiting.
                </span>
            </h1>

            <Button
                variant="outline"
                size="md"
                nativeButton={false}
                render={<Link href="/broker/clients" />}
                className="shrink-0 self-start border-2 border-border-warm"
            >
                + Add client
            </Button>
        </div>
    );
}
