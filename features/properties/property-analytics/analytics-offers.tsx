import { cn } from "@/lib/utils";

import { ContactName } from "@/components/shared/contact-name";
import {
    type AppIcon,
    CircleCheck,
    CircleSlash,
    Clock,
    HandCoins,
} from "@/components/shared/icons";

import { OFFER_STATUS_LABEL } from "@/features/pipeline/stage-meta";
import { AnalyticsCard } from "@/features/properties/property-analytics/analytics-card";
import {
    formatSideAmount,
    offerGapLabel,
} from "@/features/properties/property-analytics/analytics-labels";
import type {
    ClientRow,
    OfferInfo,
    PropertyReport,
} from "@/features/properties/property-analytics/analytics-math";
import { isPreviewAnalyticsClient } from "@/features/properties/property-analytics/mock-property-analytics";

import styles from "./analytics.module.css";

type OfferStatus = NonNullable<OfferInfo["status"]>;

const STATUS_STYLE: Record<OfferStatus, { icon: AppIcon; pill: string; bar: string }> = {
    pending: { icon: Clock, pill: "bg-pending/12 text-pending", bar: "bg-pending/70" },
    accepted: { icon: CircleCheck, pill: "bg-success-soft text-success", bar: "bg-brand" },
    rejected: {
        icon: CircleSlash,
        pill: "bg-surface-muted text-ink-muted",
        bar: "bg-ink-subtle/40",
    },
};

function StatusPill({ status }: { status: OfferStatus }) {
    const style = STATUS_STYLE[status];
    return (
        <span
            className={cn(
                "body-xs inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold",
                style.pill,
            )}
        >
            <style.icon aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
            {OFFER_STATUS_LABEL[status]}
        </span>
    );
}

/**
 * Bar length is the offer against the asking price; the dark tick marks
 * asking. Offers above asking push the scale out so the tick stays honest.
 */
function OfferBar({
    offer,
    scaleMax,
    amountMax,
}: {
    offer: OfferInfo;
    scaleMax: number;
    amountMax: number;
}) {
    const fill = offer.ratio != null ? offer.ratio / scaleMax : offer.amountInr / amountMax;
    const tick = offer.ratio != null ? 1 / scaleMax : null;
    return (
        <span aria-hidden className="relative block block-3">
            <span className="absolute inset-0 overflow-hidden rounded-full bg-surface-muted">
                <span
                    className={cn(
                        "block rounded-full block-full",
                        offer.status ? STATUS_STYLE[offer.status].bar : "bg-brand/70",
                    )}
                    style={{ inlineSize: `${Math.min(100, fill * 100)}%` }}
                />
            </span>
            {tick != null ? (
                <span
                    className="absolute -inset-y-1 rounded-full bg-ink inline-0.5"
                    style={{ insetInlineStart: `calc(${tick * 100}% - 0.0625rem)` }}
                />
            ) : null}
        </span>
    );
}

function OfferRow({
    client,
    scaleMax,
    amountMax,
    showSide,
}: {
    client: ClientRow;
    scaleMax: number;
    amountMax: number;
    showSide: boolean;
}) {
    const sample = isPreviewAnalyticsClient(client.id);
    const offer = client.offer!;
    const gap = offerGapLabel(offer);
    return (
        <li className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-inline-0">
                    <ContactName
                        name={client.name}
                        contactId={client.clientId}
                        contactType={sample ? undefined : "buyer"}
                        className="body-sm truncate font-semibold text-ink hover:text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    />
                    <p className="body-sm flex flex-wrap items-baseline gap-x-2 text-ink-muted">
                        <span className="font-semibold text-ink tabular-nums">
                            {formatSideAmount(offer.amountInr, offer.side)}
                        </span>
                        {showSide ? <span>{offer.side === "rent" ? "Rent" : "Sale"}</span> : null}
                        {gap ? <span className="tabular-nums">{gap}</span> : null}
                    </p>
                </div>
                {offer.status ? <StatusPill status={offer.status} /> : null}
            </div>
            <OfferBar offer={offer} scaleMax={scaleMax} amountMax={amountMax} />
        </li>
    );
}

/** Every offer on this listing, best first, each set against the asking price. */
export function AnalyticsOffers({
    report,
    className,
}: {
    report: PropertyReport;
    className?: string;
}) {
    const rows = report.offers.rows;
    const ratios = rows.flatMap((c) => (c.offer?.ratio != null ? [c.offer.ratio] : []));
    const scaleMax = Math.max(1, ...ratios) * 1.08;
    const amountMax = Math.max(1, ...rows.map((c) => c.offer?.amountInr ?? 0));
    const showSide = report.ask.saleInr != null && report.ask.rentInr != null;
    const best = report.offers.best;
    const bestGap = best?.offer ? offerGapLabel(best.offer) : null;

    return (
        <AnalyticsCard
            title="Offers vs asking price"
            titleId="analytics-offers-heading"
            description={
                rows.length > 0
                    ? "Every offer compared with the property's asking price"
                    : undefined
            }
            className={className}
        >
            {rows.length === 0 ? (
                <div className={styles.quietState}>
                    <HandCoins aria-hidden className="block-5 inline-5" />
                    <div className="flex flex-col gap-1">
                        <p className="body-sm font-medium text-ink">No offers yet</p>
                        <p className="body-sm text-ink-muted">
                            Add an offer to a client’s deal to compare it with the asking price.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {best?.offer ? (
                        <div className="flex flex-col gap-4 border-be border-border-warm pbe-4">
                            <div className="flex flex-col gap-1 min-inline-0">
                                <span className="body-xs font-semibold text-ink-muted">
                                    Best standing offer
                                </span>
                                <strong className="h3 text-ink tabular-nums">
                                    {formatSideAmount(best.offer.amountInr, best.offer.side)}
                                </strong>
                                <span className="body-sm text-ink-muted">
                                    From {best.name}
                                    {bestGap ? ` · ${bestGap}` : ""}
                                </span>
                            </div>
                            <dl className="grid grid-cols-3 divide-x divide-border-warm text-center sm:min-inline-64">
                                <div className="px-2">
                                    <dt className="body-xs text-ink-muted">Waiting</dt>
                                    <dd className="h5 mbs-1 text-ink tabular-nums">
                                        {report.offers.pending}
                                    </dd>
                                </div>
                                <div className="px-2">
                                    <dt className="body-xs text-ink-muted">Accepted</dt>
                                    <dd className="h5 mbs-1 text-brand tabular-nums">
                                        {report.offers.accepted}
                                    </dd>
                                </div>
                                <div className="px-2">
                                    <dt className="body-xs text-ink-muted">Declined</dt>
                                    <dd className="h5 mbs-1 text-ink tabular-nums">
                                        {report.offers.rejected}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    ) : null}
                    <ol className="flex flex-col gap-5">
                        {rows.map((client) => (
                            <OfferRow
                                key={client.id}
                                client={client}
                                scaleMax={scaleMax}
                                amountMax={amountMax}
                                showSide={showSide}
                            />
                        ))}
                    </ol>
                    <p className="body-xs text-ink-muted">
                        The dark marker on each bar is the asking price.
                    </p>
                </>
            )}
        </AnalyticsCard>
    );
}
