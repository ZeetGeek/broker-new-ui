"use client";

import { pipelineSummary } from "@/lib/format/broker-page-summary";

import { PageHeader } from "@/components/shared/page-header";

import type { DealItem, DealsView } from "@/features/pipeline/types";

export function PipelineIntro({
    deals,
    view,
    hasActiveFilters,
    isLoading,
    hasError,
}: {
    deals: DealItem[];
    view: DealsView;
    hasActiveFilters: boolean;
    isLoading: boolean;
    hasError: boolean;
}) {
    return (
        <PageHeader
            title="Pipeline"
            summaryLines={pipelineSummary(deals, view, hasActiveFilters)}
            summaryLoading={isLoading}
            summaryPlaceholder="Loading your deals"
            summaryError={hasError ? "Could not load your pipeline summary. Try again." : undefined}
        />
    );
}
