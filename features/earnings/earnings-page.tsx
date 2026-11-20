"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";

import { earningsReportQueryOptions } from "@/lib/api/earnings";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
import { BROKER_PIPELINE_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { AlertCircle, Wallet } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import {
    DEFAULT_EARNINGS_PRESET,
    EARNINGS_PRESETS,
    type EarningsPreset,
    type EarningsSelection,
} from "@/features/earnings/earnings-math";
import { EarningsReportView } from "@/features/earnings/earnings-report-view";
import { EarningsPageSkeleton } from "@/features/earnings/earnings-skeleton";

const DATE_PARAM = "yyyy-MM-dd";

function isPreset(value: string | null): value is EarningsPreset {
    return value === "custom" || EARNINGS_PRESETS.some((preset) => preset.value === value);
}

function parseDateParam(value: string | null): Date | null {
    if (!value) return null;
    const date = parseISO(value);
    return isValid(date) ? date : null;
}

/** Period lives in the URL so back/forward and shared links keep it. */
function useEarningsSelection() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const selection = useMemo<EarningsSelection>(() => {
        const period = searchParams.get("period");
        if (!isPreset(period)) return { preset: DEFAULT_EARNINGS_PRESET };
        if (period !== "custom") return { preset: period };
        const customFrom = parseDateParam(searchParams.get("from"));
        if (!customFrom) return { preset: DEFAULT_EARNINGS_PRESET };
        return {
            preset: "custom",
            customFrom,
            customTo: parseDateParam(searchParams.get("to")) ?? customFrom,
        };
    }, [searchParams]);

    const setSelection = useCallback(
        (next: EarningsSelection) => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("from");
            params.delete("to");
            if (next.preset === DEFAULT_EARNINGS_PRESET) {
                params.delete("period");
            } else {
                params.set("period", next.preset);
            }
            if (next.preset === "custom" && next.customFrom) {
                params.set("from", format(next.customFrom, DATE_PARAM));
                params.set("to", format(next.customTo ?? next.customFrom, DATE_PARAM));
            }
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [pathname, router, searchParams],
    );

    return [selection, setSelection] as const;
}

export function EarningsPage() {
    const [selection, setSelection] = useEarningsSelection();
    const {
        data: report,
        error,
        isPending,
        isPlaceholderData,
        refetch,
        isRefetching,
    } = useQuery(earningsReportQueryOptions(selection));

    if (isPending) return <EarningsPageSkeleton />;

    if (error || !report) {
        return (
            <div className="flex flex-col gap-6 pbe-6">
                <header>
                    <h1 className="h3 text-ink">Earnings</h1>
                </header>
                <EmptyState
                    icon={AlertCircle}
                    heading="Couldn’t load your earnings"
                    description="Check your internet connection and try again. Your deals are safe."
                >
                    <Button type="button" onClick={() => refetch()} loading={isRefetching}>
                        Try again
                    </Button>
                </EmptyState>
            </div>
        );
    }

    // First run: nothing sold or lost ever, and nothing on the board.
    if (!report.hasResolvedDeals && report.live.count === 0) {
        return (
            <div className="flex flex-col gap-6 pbe-6">
                <header>
                    <h1 className="h3 text-ink">Earnings</h1>
                </header>
                <EmptyState
                    icon={Wallet}
                    heading="Your earnings will show here"
                    description="Add a client to a property and work the deal in your pipeline. When you mark it as sold, the commission shows up on this page."
                >
                    <Button nativeButton={false} render={<Link href={BROKER_PIPELINE_HREF} />}>
                        Go to pipeline
                    </Button>
                </EmptyState>
            </div>
        );
    }

    return (
        <EarningsReportView
            report={report}
            selection={selection}
            onSelectionChange={setSelection}
            refreshing={isPlaceholderData}
        />
    );
}
