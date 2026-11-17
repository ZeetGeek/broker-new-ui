"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";

import { pipelineApi } from "@/lib/api/pipeline";
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation";
import { BROKER_PIPELINE_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { Info, Wallet } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { EarningsDealLists } from "@/features/earnings/earnings-deal-lists";
import { EarningsKpis } from "@/features/earnings/earnings-kpis";
import { EarningsLosses } from "@/features/earnings/earnings-losses";
import {
    buildEarningsReport,
    DEFAULT_EARNINGS_PRESET,
    EARNINGS_PRESETS,
    type EarningsPreset,
    type EarningsSelection,
} from "@/features/earnings/earnings-math";
import { EarningsPipeline } from "@/features/earnings/earnings-pipeline";
import { EarningsRangePicker } from "@/features/earnings/earnings-range-picker";
import { EarningsPageSkeleton } from "@/features/earnings/earnings-skeleton";
import { EarningsSplit } from "@/features/earnings/earnings-split";
import { EarningsTrendChart } from "@/features/earnings/earnings-trend-chart";
import { DEAL_LOST_REASON_LABEL } from "@/features/pipeline/stage-meta";
import { DEFAULT_DEALS_FILTERS } from "@/features/pipeline/types";

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

    const { data, error, isPending, refetch, isRefetching } = useQuery({
        queryKey: ["broker", "earnings", "deals"],
        queryFn: ({ signal }) => pipelineApi.list(DEFAULT_DEALS_FILTERS, signal),
        staleTime: 60_000,
    });

    const report = useMemo(
        () =>
            data
                ? buildEarningsReport(data.items, selection, (key) => DEAL_LOST_REASON_LABEL[key])
                : null,
        [data, selection],
    );

    if (isPending) return <EarningsPageSkeleton />;

    if (error || !report || !data) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <p className="h5 text-ink">Could not load your earnings</p>
                <p className="body text-ink-muted max-inline-96">
                    Check your internet connection and try again. Your deals are safe.
                </p>
                <Button type="button" onClick={() => refetch()} disabled={isRefetching}>
                    {isRefetching ? "Trying again…" : "Try again"}
                </Button>
            </div>
        );
    }

    const header = (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1 min-inline-0">
                <h1 className="h3 text-ink">Earnings</h1>
                <p className="body-sm text-ink-muted">
                    What you have earned, what you lost, and what is still in play.
                </p>
            </div>
            {data.items.length > 0 ? (
                <EarningsRangePicker value={selection} onChange={setSelection} />
            ) : null}
        </header>
    );

    if (data.items.length === 0) {
        return (
            <div className="flex flex-col gap-6">
                {header}
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
        <div className="flex flex-col gap-6">
            {header}

            <EarningsKpis report={report} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
                <EarningsTrendChart report={report} />
                <EarningsSplit report={report} />
                <EarningsPipeline report={report} />
                <EarningsLosses report={report} />
                <EarningsDealLists report={report} />
            </div>

            <p className="flex items-start gap-2 text-xs text-ink-muted">
                <Info aria-hidden className="mbs-px shrink-0 block-4 inline-4" />
                All amounts are estimates, worked out from the commission each owner set on their
                property. Sale commission uses the final price when you saved one, otherwise the
                accepted offer or asking price.
            </p>
        </div>
    );
}
