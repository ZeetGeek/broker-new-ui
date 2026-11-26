"use client";

import { contactsSummary } from "@/lib/format/broker-page-summary";

import { PageHeader } from "@/components/shared/page-header";

import { FEATURE_PLATFORM_OWNER } from "@/config/index";
import type { ContactsSummary, ContactsTab } from "@/features/contacts/types";

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
    return (
        <PageHeader
            title={tab === "owners" ? "Owners" : "Clients"}
            summaryLines={contactsSummary(summary, tab, FEATURE_PLATFORM_OWNER)}
            summaryLoading={isLoading}
            summaryPlaceholder={tab === "owners" ? "Loading your owners" : "Loading your clients"}
            summaryError={hasError ? "Could not load your contact summary. Try again." : undefined}
        />
    );
}
