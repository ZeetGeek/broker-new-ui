"use client";

import type { ReactNode } from "react";

import { EmptyState, EmptyStateAction } from "@/components/empty-state";
import { AlertCircle, RefreshCw } from "@/components/shared/icons";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function DashboardLoading() {
    return (
        <div className="flex items-center justify-center min-block-[calc(100dvh-5rem)]">
            <LoadingSpinner label="Loading dashboard" />
        </div>
    );
}

export function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <EmptyState
            size="card"
            icon={AlertCircle}
            heading="Could not load your dashboard"
            variant="error"
            description={message}
        >
            <EmptyStateAction label="Try again" icon={RefreshCw} onClick={onRetry} />
        </EmptyState>
    );
}

export function DashboardPage({ header, children }: { header: ReactNode; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-6 min-block-[calc(100dvh-5rem)] md:gap-6">
            <header className="flex shrink-0 flex-col gap-4">{header}</header>
            <div className="grid grid-cols-1 gap-card-grid md:grid-cols-12">{children}</div>
        </div>
    );
}
