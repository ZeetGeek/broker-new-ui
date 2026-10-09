"use client";

import { useEffect, useState } from "react";

import { formatInTimeZone } from "date-fns-tz";
import { CircleAlert, Clock3 } from "lucide-react";

import { VISITS_TIME_ZONE } from "@/lib/visits/constants";

import { Badge } from "@/components/ui/badge";

import type { BrokerVisitSummary } from "@/features/site-visits/broker/model";

export function BrokerVisitsHeader({ summary }: { summary: BrokerVisitSummary }) {
    const [now, setNow] = useState(() => new Date());
    const attentionCount = summary.awaitingOwner + summary.needsOutcome;

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    const summaryLine = summary.today > 0
        ? `${summary.today} ${summary.today === 1 ? "visit" : "visits"} today${attentionCount > 0 ? `, ${attentionCount} need your attention` : ""}.`
        : attentionCount > 0
          ? `Nothing today, ${attentionCount} need your attention.`
          : "Your schedule is clear today.";

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-start">
            <h1 className="h3 min-inline-0">
                <span className="text-ink">Site visits.</span>{" "}
                <span className="text-ink-muted">{summaryLine}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-2">
                {attentionCount > 0 ? (
                    <Badge
                        variant="outline"
                        className="border-pending/25 bg-urgent-soft text-pending"
                    >
                        <CircleAlert aria-hidden />
                        {attentionCount} to handle
                    </Badge>
                ) : null}
                <Badge variant="outline" className="bg-surface tabular-nums">
                    <Clock3 aria-hidden />
                    {formatInTimeZone(now, VISITS_TIME_ZONE, "EEE, d MMM · h:mm a")}
                    <span className="sr-only">India Standard Time</span>
                </Badge>
            </div>
        </div>
    );
}
