"use client";

import type { ReactNode } from "react";

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
        <div
            className="
              flex flex-col items-center justify-center gap-4 text-center
              min-block-[calc(100dvh-5rem)]
            "
        >
            <p className="h5 text-ink">Could not load your dashboard</p>
            <p className="body text-ink-muted max-inline-96">{message}</p>
            <button
                type="button"
                onClick={onRetry}
                className="body font-medium text-brand underline underline-offset-4"
            >
                Try again
            </button>
        </div>
    );
}

export function DashboardPage({ header, children }: { header: ReactNode; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-6 min-block-[calc(100dvh-5rem)] md:gap-6">
            <header className="flex shrink-0 flex-col gap-4">{header}</header>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">{children}</div>
        </div>
    );
}
