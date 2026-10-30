"use client";

import { useMemo } from "react";

import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";
import { Skeleton } from "@/components/shared/skeleton";

import { buildMyDealsSummaryLines } from "@/features/properties/my-requests/build-my-deals-summary-lines";
import type { InvitesSummary } from "@/features/properties/my-requests/invite-types";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";
import type { RequestsSummary } from "@/features/properties/my-requests/types";

export function MyDealsIntro({
    activeTab,
    sentSummary,
    inviteSummary,
    isLoading = false,
}: {
    activeTab: RequestsTab;
    sentSummary: RequestsSummary | null;
    inviteSummary: InvitesSummary | null;
    isLoading?: boolean;
}) {
    const lines = useMemo(
        () => buildMyDealsSummaryLines({ activeTab, sentSummary, inviteSummary, isLoading }),
        [activeTab, sentSummary, inviteSummary, isLoading],
    );

    return (
        <h1 className="h3 min-inline-0">
            {isLoading ? (
                <span aria-hidden className="relative inline-block align-bottom">
                    <span className="invisible">Requests & Invitations.</span>
                    <span
                        className="
                      absolute inset-s-0 inset-bs-[0.12em] overflow-hidden rounded-control
                      bg-border-warm block-[0.8em] inline-full
                    "
                    >
                        <Skeleton className="bg-ink/3 block-full inline-full" />
                    </span>
                </span>
            ) : (
                <span className="text-ink">Requests & Invitations.</span>
            )}{" "}
            <RotatingHeaderSummary
                key={activeTab}
                lines={lines}
                isLoading={isLoading}
                loadingLabel="Loading request and invitation counts"
                loadingPlaceholder="Add interested clients or tenants to start working on a property"
                reservePlaceholder
            />
        </h1>
    );
}
