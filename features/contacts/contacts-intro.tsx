"use client";

import type { ContactsSummary, ContactsTab } from "@/features/contacts/types";

function buildMeaning(summary: ContactsSummary | null, tab: ContactsTab): string {
    if (!summary) return "Everyone on both sides of your deals.";

    if (tab === "owners") {
        if (summary.ownerCount === 0) return "They appear once one accepts you.";
        if (summary.lapsedOwnerCount > 0) {
            return `${summary.lapsedOwnerCount} no longer represented.`;
        }
        return "All still represented by you.";
    }

    if (summary.buyerCount === 0) return "Add the people looking to buy or rent.";
    return "Everyone you’re helping find a property.";
}

function buildFact(summary: ContactsSummary | null, tab: ContactsTab): string {
    if (!summary) return "Contacts";

    if (tab === "owners") {
        if (summary.ownerCount === 0) return "No owners yet";
        return `${summary.ownerCount} ${summary.ownerCount === 1 ? "owner" : "owners"}`;
    }

    if (summary.buyerCount === 0) return "No buyers yet";
    return `${summary.buyerCount} ${summary.buyerCount === 1 ? "buyer" : "buyers"}`;
}

export function ContactsIntro({
    summary,
    tab,
}: {
    summary: ContactsSummary | null;
    tab: ContactsTab;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-start">
            <h1 className="h3 min-inline-0">
                <span className="text-ink">{buildFact(summary, tab)}</span>
                <span className="text-ink">.</span>{" "}
                <span className="text-ink-muted">{buildMeaning(summary, tab)}</span>
            </h1>
        </div>
    );
}
