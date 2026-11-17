import Link from "next/link";

import { formatCommission } from "@/lib/format/commission";
import { plural } from "@/lib/format/plural";
import { formatPrice } from "@/lib/format/price";
import { BROKER_PIPELINE_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { ArrowRight, Clock } from "@/components/shared/icons";

import { EarningsCard } from "@/features/earnings/earnings-card";
import type { EarningsReport } from "@/features/earnings/earnings-math";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { DEAL_STAGE_ORDER } from "@/features/pipeline/types";

/** Live pipeline — not tied to the selected period. It is "right now". */
export function EarningsPipeline({ report }: { report: EarningsReport }) {
    const { live } = report;
    const maxCount = Math.max(1, ...DEAL_STAGE_ORDER.map((s) => live.stageCounts[s]));

    return (
        <EarningsCard
            title="Money in your pipeline"
            titleId="earnings-pipeline-heading"
            description="Deals you are working on right now. Not affected by the period."
            action={
                <Link
                    href={BROKER_PIPELINE_HREF}
                    className="body-sm inline-flex items-center gap-1 font-medium text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                    Open pipeline
                    <ArrowRight aria-hidden className="block-4 inline-4" />
                </Link>
            }
            className="lg:col-span-7"
        >
            {live.count === 0 ? (
                <p className="body-sm text-ink-muted">
                    You have no open deals. Attach a client to a property to start one.
                </p>
            ) : (
                <>
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="flex flex-col gap-1 rounded-control bg-surface-muted/70 p-4">
                            <dt className="text-xs font-medium text-ink-muted">Value in play</dt>
                            <dd className="h5 text-ink tabular-nums">
                                {live.saleCount > 0
                                    ? formatPrice(live.saleValueInr)
                                    : "No sales yet"}
                            </dd>
                            <dd className="text-xs text-ink-muted">
                                {live.saleCount > 0
                                    ? `Asking price of ${plural(live.saleCount, "open sale")}`
                                    : "Only rentals are open right now"}
                            </dd>
                        </div>
                        <div className="flex flex-col gap-1 rounded-control bg-brand-soft/70 p-4">
                            <dt className="text-xs font-medium text-ink-muted">
                                Likely commission
                            </dt>
                            <dd className="h5 text-brand-text tabular-nums">
                                {live.likelyInr > 0 ? formatCommission(live.likelyInr) : "None yet"}
                            </dd>
                            <dd className="text-xs text-ink-muted">
                                {live.likelyCount > 0
                                    ? `${plural(live.likelyCount, "deal")} in negotiation or with an accepted offer`
                                    : "No deals in negotiation yet"}
                            </dd>
                        </div>
                        <div className="flex flex-col gap-1 rounded-control bg-surface-muted/70 p-4">
                            <dt className="text-xs font-medium text-ink-muted">
                                Possible commission
                            </dt>
                            <dd className="h5 text-ink tabular-nums">
                                {live.potentialInr > 0
                                    ? formatCommission(live.potentialInr)
                                    : "Not set"}
                            </dd>
                            <dd className="text-xs text-ink-muted">
                                {live.potentialInr > 0
                                    ? "If every open deal sells"
                                    : "Owners have not set a commission"}
                            </dd>
                        </div>
                    </dl>

                    <div className="flex flex-col gap-3">
                        <h3 className="body-sm font-medium text-ink">Deals by stage</h3>
                        <ul className="flex flex-col gap-2.5">
                            {DEAL_STAGE_ORDER.map((stage) => {
                                const count = live.stageCounts[stage];
                                const meta = DEAL_STAGE_META[stage];
                                return (
                                    <li
                                        key={stage}
                                        className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3"
                                    >
                                        <span className="body-sm flex items-center gap-2 text-ink">
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    "rounded-full block-2 inline-2",
                                                    meta.dotClass,
                                                )}
                                            />
                                            {meta.label}
                                        </span>
                                        <span
                                            aria-hidden
                                            className="block overflow-hidden rounded-full bg-surface-muted block-2"
                                        >
                                            <span
                                                className={cn(
                                                    "block rounded-full block-full",
                                                    meta.dotClass,
                                                )}
                                                style={{
                                                    inlineSize: `${(count / maxCount) * 100}%`,
                                                }}
                                            />
                                        </span>
                                        <span className="body-sm text-end font-semibold text-ink tabular-nums">
                                            {count}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {live.stalledCount > 0 || live.acceptedOfferCount > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                            {live.stalledCount > 0 ? (
                                <li>
                                    <Link
                                        href={BROKER_PIPELINE_HREF}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-urgent-soft px-3 text-xs font-medium text-urgent block-control-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring max-md:block-control-lg"
                                    >
                                        <Clock aria-hidden className="block-3.5 inline-3.5" />
                                        {plural(live.stalledCount, "deal")} gone quiet for 2+ weeks
                                    </Link>
                                </li>
                            ) : null}
                            {live.acceptedOfferCount > 0 ? (
                                <li className="inline-flex items-center rounded-full bg-success-soft px-3 text-xs font-medium text-success block-control-sm">
                                    {plural(live.acceptedOfferCount, "offer")} accepted, ready to
                                    close
                                </li>
                            ) : null}
                        </ul>
                    ) : null}
                </>
            )}
        </EarningsCard>
    );
}
