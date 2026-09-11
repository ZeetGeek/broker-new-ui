"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { Eye, StickyNote } from "lucide-react";

import { formatAreaSqft } from "@/lib/format/area";
import { formatDateIn, formatRelativePast, formatTimeIn } from "@/lib/format/date";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { PhoneNumber } from "@/components/shared/phone-number";
import { Price } from "@/components/shared/price";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { UserAvatar } from "@/components/shared/user-avatar";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge } from "@/components/ui/badge";

import { DEAL_OUTCOME_META, DEAL_STAGE_META, isOutcome } from "@/features/pipeline/stage-meta";
import type { DealDetail, DealHistoryEntry } from "@/features/pipeline/types";
import { isLiveStage } from "@/features/pipeline/types";

const API_STAGE_LABEL: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    site_visit: "Site visit",
    visit: "Site visit",
    negotiation: "Negotiation",
    offer_made: "Offer made",
    closed_won: "Closed won",
    closed: "Closed",
    closed_lost: "Closed lost",
    lost: "Lost",
    offer_rejected: "Offer rejected",
};

function stageLabel(status: string): string {
    return API_STAGE_LABEL[status] ?? status.replace(/_/g, " ");
}

function formatMoney(amountInr: number | null, isRent: boolean): string {
    if (amountInr == null || amountInr <= 0) return "—";
    return isRent ? formatRentInr(amountInr) : formatPriceInr(amountInr);
}

function formatWhen(iso: string | null, now: Date): string {
    if (!iso) return "—";
    const date = new Date(iso);
    return `${formatDateIn(date)} · ${formatTimeIn(date)} · ${formatRelativePast(date, now)}`;
}

function HistoryList({ history, now }: { history: DealHistoryEntry[]; now: Date }) {
    if (history.length === 0) {
        return <p className="body-sm text-ink-muted">No history yet.</p>;
    }

    const ordered = [...history].reverse();

    return (
        <VirtualListBox
            items={ordered}
            getKey={(entry, index) => `${entry.at ?? "x"}-${entry.status}-${index}`}
            estimateItemHeight={88}
            gap={0}
            ariaLabel="Deal stage history"
            className="max-block-96"
            renderItem={(entry, index) => {
                const isFirst = index === 0;
                return (
                    <div className="flex gap-3">
                        <span aria-hidden className="flex flex-col items-center gap-1 pbs-1">
                            <span
                                className={cn(
                                    "shrink-0 rounded-full block-2 inline-2",
                                    isFirst ? "bg-brand" : "bg-border-warm",
                                )}
                            />
                            {index < ordered.length - 1 ? (
                                <span className="flex-1 bg-border-warm inline-px" />
                            ) : null}
                        </span>

                        <span className="flex flex-col gap-1 pbe-1 min-inline-0">
                            <span className="flex flex-wrap items-center gap-2">
                                <Badge variant={isFirst ? "brand" : "neutral"}>
                                    {stageLabel(entry.status)}
                                </Badge>
                                {entry.by ? (
                                    <span className="body-xs text-ink-subtle capitalize">
                                        by {entry.by}
                                    </span>
                                ) : null}
                            </span>
                            {entry.note ? (
                                <p className="body-sm text-pretty text-ink">{entry.note}</p>
                            ) : null}
                            <span className="body-xs text-ink-subtle">
                                {formatWhen(entry.at, now)}
                            </span>
                        </span>
                    </div>
                );
            }}
        />
    );
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 min-inline-0">
            <p className="eyebrow text-ink-subtle">{label}</p>
            <div className="body-sm text-ink">{children}</div>
        </div>
    );
}

/**
 * Full lead sheet: parties, money, notes, and stage history.
 * Opened from the View button on a pipeline card.
 */
export function DealDetailModal({
    open,
    deal,
    isLoading,
    error,
    onClose,
}: {
    open: boolean;
    deal: DealDetail | null;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
}) {
    const now = new Date();
    const title = deal ? `${deal.buyer.name} · ${deal.property.configLabel}` : "Lead details";

    const statusLabel = deal
        ? deal.apiStage
            ? stageLabel(deal.apiStage)
            : isLiveStage(deal.status)
              ? DEAL_STAGE_META[deal.status].label
              : DEAL_OUTCOME_META[deal.status].label
        : null;

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
            size="lg"
            title={title}
            description={
                deal
                    ? `${deal.property.locality}, ${deal.property.city}`
                    : "Buyer, property, offer and stage history."
            }
            footer={
                <AppModalFooter
                    primaryLabel="Close"
                    primaryIcon={<Eye aria-hidden strokeWidth={1.75} />}
                    onPrimary={onClose}
                />
            }
        >
            {isLoading && !deal ? (
                <p className="body-sm py-10 text-center text-ink-muted">Loading lead details…</p>
            ) : error && !deal ? (
                <p role="alert" className="body-sm py-10 text-center text-urgent">
                    {error}
                </p>
            ) : deal ? (
                <div className="flex flex-col gap-5">
                    {error ? (
                        <p role="alert" className="body-xs text-urgent">
                            {error}
                        </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                        {statusLabel ? <Badge variant="brand">{statusLabel}</Badge> : null}
                        {deal.offerStatus ? (
                            <Badge variant="neutral" className="capitalize">
                                Offer {deal.offerStatus}
                            </Badge>
                        ) : null}
                        {isOutcome(deal.status) ? (
                            <Badge variant={DEAL_OUTCOME_META[deal.status].badgeVariant}>
                                {DEAL_OUTCOME_META[deal.status].label}
                            </Badge>
                        ) : null}
                    </div>

                    <div className="flex items-start gap-3">
                        <Link
                            href={brokerPropertyDetailHref(deal.property.id)}
                            className="
                              shrink-0 rounded-inner
                              focus-visible:outline-2 focus-visible:outline-brand
                            "
                            aria-label={`Open ${deal.property.title}`}
                        >
                            <PropertyThumb src={deal.property.imageSrc} alt={deal.property.title} />
                        </Link>
                        <div className="flex flex-col gap-1 min-inline-0">
                            <Link
                                href={brokerPropertyDetailHref(deal.property.id)}
                                className="body font-semibold text-ink hover:text-brand-text"
                            >
                                {deal.property.title}
                            </Link>
                            <Price
                                amountInr={deal.property.amountInr}
                                isRent={deal.property.isRent}
                                className="body-sm font-semibold"
                            />
                            <p className="body-xs text-ink-muted">
                                {formatAreaSqft(deal.property.areaSqft)} ·{" "}
                                {deal.property.propertyTypeLabel}
                            </p>
                        </div>
                    </div>

                    <div
                        className="
                          grid grid-cols-1 gap-4 rounded-inner bg-surface-muted/60 p-3
                          sm:grid-cols-2
                        "
                    >
                        <div className="flex items-center gap-2.5 min-inline-0">
                            <UserAvatar name={deal.buyer.name} imageUrl={deal.buyer.avatarUrl} />
                            <div className="min-inline-0">
                                <p className="eyebrow text-ink-subtle">Buyer</p>
                                <p className="body-sm truncate font-medium text-ink">
                                    {deal.buyer.name}
                                </p>
                                {deal.buyer.phoneDigits ? (
                                    <PhoneNumber
                                        phoneDigits={deal.buyer.phoneDigits}
                                        className="body-xs text-ink-muted"
                                    />
                                ) : null}
                                {deal.buyerEmail ? (
                                    <p className="body-xs truncate text-ink-muted">
                                        {deal.buyerEmail}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 min-inline-0">
                            <UserAvatar name={deal.owner.name} imageUrl={deal.owner.avatarUrl} />
                            <div className="min-inline-0">
                                <p className="eyebrow text-ink-subtle">Owner</p>
                                <p className="body-sm truncate font-medium text-ink">
                                    {deal.owner.name}
                                </p>
                                {deal.owner.isRepresentationActive && deal.owner.phoneDigits ? (
                                    <PhoneNumber
                                        phoneDigits={deal.owner.phoneDigits}
                                        className="body-xs text-ink-muted"
                                    />
                                ) : (
                                    <p className="body-xs text-ink-subtle">
                                        {deal.owner.isRepresentationActive
                                            ? "No phone on file"
                                            : "Number hidden"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <DetailField label="List price">
                            {formatMoney(deal.listPriceInr, deal.property.isRent)}
                        </DetailField>
                        <DetailField label="Offer amount">
                            {formatMoney(deal.offerAmountInr, deal.property.isRent)}
                        </DetailField>
                        <DetailField label="Closed amount">
                            {formatMoney(deal.closedAmountInr, deal.property.isRent)}
                        </DetailField>
                        <DetailField label="Buyer budget">
                            {deal.buyer.budgetMaxInr != null
                                ? formatMoney(deal.buyer.budgetMaxInr, deal.property.isRent)
                                : "—"}
                        </DetailField>
                        <DetailField label="Created">
                            {deal.createdAt
                                ? formatRelativePast(new Date(deal.createdAt), now)
                                : "—"}
                        </DetailField>
                        <DetailField label="Updated">
                            {deal.updatedAt
                                ? formatRelativePast(new Date(deal.updatedAt), now)
                                : "—"}
                        </DetailField>
                    </div>

                    {deal.nextVisitAt ? (
                        <DetailField label="Next visit">
                            {formatWhen(deal.nextVisitAt, now)}
                        </DetailField>
                    ) : null}

                    {deal.note ? (
                        <div
                            className="
                              flex flex-col gap-1 rounded-inner border border-dashed
                              border-border-warm p-3
                            "
                        >
                            <p className="eyebrow flex items-center gap-1.5">
                                <StickyNote aria-hidden className="block-3 inline-3" />
                                Notes
                            </p>
                            <p className="body-sm text-pretty text-ink">{deal.note}</p>
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-2">
                        <p className="eyebrow">Stage history</p>
                        {isLoading ? <p className="body-xs text-ink-subtle">Refreshing…</p> : null}
                        <HistoryList history={deal.history} now={now} />
                    </div>
                </div>
            ) : null}
        </AppModal>
    );
}
