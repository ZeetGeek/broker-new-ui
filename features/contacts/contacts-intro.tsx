"use client";

import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";
import type { ContactsSummary, ContactsTab } from "@/features/contacts/types";

function buildLines(summary: ContactsSummary | null, tab: ContactsTab): string[] {
    if (!summary) return [];
    if (tab === "owners") {
        if (summary.ownerCount === 0) return ["Add an owner to start linking their properties."];
        return [
            FEATURE_PLATFORM_OWNER
                ? "The owners behind your property listings."
                : "The property owners you added yourself.",
            "Open an owner to see their linked properties.",
            "Keep property locations close at hand.",
            "Find the owner behind your next deal.",
        ];
    }
    if (summary.buyerCount === 0) return ["Add your first client and capture what they need."];
    return [
        "Everyone you’re helping find a property.",
        "Keep budgets and preferred areas in view.",
        "Link clients to properties that fit.",
        "Your next client call starts here.",
    ];
}

function buildFact(summary: ContactsSummary | null, tab: ContactsTab): string {
    if (!summary) return tab === "owners" ? "Owners" : "Clients";
    const count = tab === "owners" ? summary.ownerCount : summary.buyerCount;
    if (count === 0) return tab === "owners" ? "No owners yet" : "No clients yet";
    return `${count} ${tab === "owners" ? (count === 1 ? "owner" : "owners") : count === 1 ? "client" : "clients"}`;
}

export function ContactsIntro({
    summary,
    tab,
    isLoading = false,
    hasError = false,
}: {
    summary: ContactsSummary | null;
    tab: ContactsTab;
    isLoading?: boolean;
    hasError?: boolean;
}) {
    const lines = buildLines(summary, tab);
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-start">
            <h1 className="h3 min-inline-0">
                <span className="text-ink">{buildFact(hasError ? null : summary, tab)}.</span>{" "}
                <RotatingHeaderSummary
                    key={`${tab}:${lines.join("|")}`}
                    lines={lines}
                    isLoading={isLoading}
                    loadingLabel={`Loading your ${tab === "owners" ? "owner" : "client"} summary`}
                    loadingPlaceholder={
                        tab === "owners"
                            ? "Your owners and their linked properties"
                            : "Your clients and what they’re looking for"
                    }
                    errorMessage={hasError ? "Could not load your contact counts." : undefined}
                />
            </h1>
        </div>
    );
}
