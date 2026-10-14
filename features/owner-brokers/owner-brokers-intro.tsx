"use client";

import type { OwnerBrokersTab } from "@/features/owner-brokers/types";

function buildFact(tab: OwnerBrokersTab, count: number | null): string {
    if (count == null) {
        return tab === "browse" ? "Brokers" : "My brokers";
    }
    if (count === 0) return "No brokers yet";
    return `${count} ${count === 1 ? "broker" : "brokers"}`;
}

function buildMeaning(tab: OwnerBrokersTab, count: number | null): string {
    if (tab === "active") {
        if (count === 0) return "Invite someone from Browse when you’re ready.";
        return "Currently representing your listings.";
    }
    if (count === 0) return "They’ll appear here once the pool is live.";
    return "Find one and invite them — you approve before they start.";
}

export function OwnerBrokersIntro({ tab, count }: { tab: OwnerBrokersTab; count: number | null }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-start">
            <h1 className="h3 min-inline-0">
                <span className="text-ink">{buildFact(tab, count)}</span>
                <span className="text-ink">.</span>{" "}
                <span className="text-ink-muted">{buildMeaning(tab, count)}</span>
            </h1>
        </div>
    );
}
