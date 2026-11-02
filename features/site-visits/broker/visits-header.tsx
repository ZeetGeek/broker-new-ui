"use client";

import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";

import type { BrokerVisitSummary } from "@/features/site-visits/broker/model";

export function BrokerVisitsHeader({
    summary,
    isLoading = false,
    hasError = false,
}: {
    summary: BrokerVisitSummary;
    isLoading?: boolean;
    hasError?: boolean;
}) {
    const lines = [
        summary.today > 0
            ? `${summary.today} ${summary.today === 1 ? "visit" : "visits"} on your schedule today.`
            : "Your schedule is clear today.",
        ...(summary.awaitingOwner > 0
            ? [
                  `${summary.awaitingOwner} ${summary.awaitingOwner === 1 ? "visit is" : "visits are"} waiting for owner confirmation.`,
              ]
            : []),
        ...(summary.tomorrow > 0
            ? [
                  `${summary.tomorrow} ${summary.tomorrow === 1 ? "visit" : "visits"} lined up for tomorrow.`,
              ]
            : []),
        ...(summary.weekTotal > 0
            ? [
                  `${summary.weekTotal} upcoming ${summary.weekTotal === 1 ? "visit" : "visits"} in the next 7 days.`,
              ]
            : []),
    ];

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-start">
            <h1 className="h3 min-inline-0">
                <span className="text-ink">Site visits.</span>{" "}
                <RotatingHeaderSummary
                    key={lines.join("|")}
                    lines={lines}
                    isLoading={isLoading}
                    loadingLabel="Loading your visit summary"
                    loadingPlaceholder="Your schedule and what needs attention."
                    errorMessage={hasError ? "Could not load your visit summary." : undefined}
                />
            </h1>
        </div>
    );
}
