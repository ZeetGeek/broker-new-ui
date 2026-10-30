"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { PropertyLead } from "@/lib/api/owner-leads";
import { formatPrice, formatRent } from "@/lib/format/price";
import { ownerBrokersHref } from "@/lib/routes/owner";
import { cn } from "@/lib/utils";

import { GripVertical, Plus } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { OwnerLeadBoardCard } from "@/features/owner-leads/owner-lead-board-card";
import {
    isFinishedLead,
    LEAD_STAGE_TO_DEAL_STAGE,
    leadPropertyFacts,
} from "@/features/owner-leads/owner-lead-meta";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { StageTabs } from "@/features/pipeline/stage-tabs";
import { DEAL_STAGE_ORDER, type DealStage, type StageCounts } from "@/features/pipeline/types";
import { useStageSwipe } from "@/features/pipeline/use-stage-swipe";

type BoardColumn = {
    key: DealStage;
    leads: PropertyLead[];
};

function stageFor(lead: PropertyLead): DealStage {
    return (lead.stage && LEAD_STAGE_TO_DEAL_STAGE[lead.stage]) || "new";
}

function buildColumns(leads: PropertyLead[]): BoardColumn[] {
    const grouped = new Map<DealStage, PropertyLead[]>();

    for (const lead of leads) {
        if (isFinishedLead(lead)) continue;
        const stage = stageFor(lead);
        grouped.set(stage, [...(grouped.get(stage) ?? []), lead]);
    }

    return DEAL_STAGE_ORDER.map((stage) => ({
        key: stage,
        leads: grouped.get(stage) ?? [],
    }));
}

function columnValue(leads: PropertyLead[]): { sale: string | null; rent: string | null } {
    let sale = 0;
    let rent = 0;

    for (const lead of leads) {
        const facts = leadPropertyFacts(lead);
        if (facts.askingInr == null || facts.askingInr <= 0) continue;
        if (facts.isRent) rent += facts.askingInr;
        else sale += facts.askingInr;
    }

    return {
        sale: sale > 0 ? formatPrice(sale) : null,
        rent: rent > 0 ? formatRent(rent) : null,
    };
}

function RentTotal({ value }: { value: string }) {
    return <span className="body-sm tabular font-semibold text-ink-muted">{value}</span>;
}

function EmptyColumn({ highlighted = false }: { highlighted?: boolean }) {
    return (
        <p
            className={cn(
                `
                  body-sm rounded-card border border-dashed border-border-warm px-3 py-8 text-center
                  text-ink-muted
                `,
                highlighted && "border-brand text-brand-text",
            )}
        >
            No leads here yet.
        </p>
    );
}

function LeadCards({
    leads,
    busyId,
    onAccept,
    onReject,
}: {
    leads: PropertyLead[];
    busyId: string | null;
    onAccept: (leadId: string) => void;
    onReject: (leadId: string) => void;
}) {
    if (leads.length === 0) return <EmptyColumn />;

    return (
        <div className="flex flex-col gap-3">
            {leads.map((lead) => (
                <OwnerLeadBoardCard
                    key={lead.id}
                    lead={lead}
                    busy={busyId === lead.id}
                    onAccept={() => onAccept(lead.id)}
                    onReject={() => onReject(lead.id)}
                />
            ))}
        </div>
    );
}

function OwnerLeadColumn({
    column,
    busyId,
    onAccept,
    onReject,
}: {
    column: BoardColumn;
    busyId: string | null;
    onAccept: (leadId: string) => void;
    onReject: (leadId: string) => void;
}) {
    const meta = DEAL_STAGE_META[column.key];
    const totals = columnValue(column.leads);

    return (
        <section
            aria-label={`${meta.label} leads`}
            className={cn(
                `
                  flex snap-start flex-col gap-3 rounded-card border p-3 min-inline-72
                  lg:min-inline-0
                `,
                meta.columnClass,
            )}
        >
            <header className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-inline-0">
                    <GripVertical
                        aria-hidden
                        className="mbs-0.5 shrink-0 text-ink-subtle block-4 inline-4"
                        strokeWidth={1.75}
                    />
                    <div className="min-inline-0">
                        <p className={cn("eyebrow truncate", meta.labelClass)}>{meta.label}</p>
                        <div className="mbs-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            {totals.sale || totals.rent ? (
                                <>
                                    {totals.sale ? (
                                        <span className="h6 tabular text-ink">{totals.sale}</span>
                                    ) : null}
                                    {totals.rent ? <RentTotal value={totals.rent} /> : null}
                                </>
                            ) : (
                                <span className="h6 tabular text-ink-subtle">—</span>
                            )}
                            <span className="body-sm tabular text-ink-muted">
                                {column.leads.length} {column.leads.length === 1 ? "lead" : "leads"}
                            </span>
                        </div>
                    </div>
                </div>

                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                nativeButton={false}
                                aria-label={`Invite a broker for ${meta.label}`}
                                className="shrink-0 text-ink-subtle hover:text-ink"
                                render={<Link href={ownerBrokersHref()} />}
                            />
                        }
                    >
                        <Plus aria-hidden strokeWidth={1.75} />
                    </TooltipTrigger>
                    <TooltipContent>Invite broker</TooltipContent>
                </Tooltip>
            </header>

            <LeadCards
                leads={column.leads}
                busyId={busyId}
                onAccept={onAccept}
                onReject={onReject}
            />
        </section>
    );
}

/**
 * Read-only owner view of the broker pipeline. Desktop keeps the same four
 * stage columns; phones use the pipeline's stage tabs and one card list.
 */
export function OwnerLeadsBoard({
    leads,
    busyId,
    onAccept,
    onReject,
}: {
    leads: PropertyLead[];
    busyId: string | null;
    onAccept: (leadId: string) => void;
    onReject: (leadId: string) => void;
}) {
    const [mobileStage, setMobileStage] = useState<DealStage>("new");
    const columns = useMemo(() => buildColumns(leads), [leads]);
    const counts = useMemo(
        () =>
            Object.fromEntries(
                columns.map((column) => [column.key, column.leads.length]),
            ) as StageCounts,
        [columns],
    );
    const activeColumn = columns.find((column) => column.key === mobileStage) ?? columns[0];
    const swipe = useStageSwipe(mobileStage, setMobileStage);

    return (
        <div className="flex flex-col gap-5">
            <div
                className="
                  hidden snap-x snap-mandatory items-start gap-3 overflow-x-auto
                  md:flex
                  lg:grid lg:snap-none lg:grid-cols-4 lg:gap-4 lg:overflow-visible
                "
            >
                {columns.map((column) => (
                    <OwnerLeadColumn
                        key={column.key}
                        column={column}
                        busyId={busyId}
                        onAccept={onAccept}
                        onReject={onReject}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-4 md:hidden" {...swipe}>
                <StageTabs active={mobileStage} counts={counts} onChange={setMobileStage} />
                <LeadCards
                    leads={activeColumn.leads}
                    busyId={busyId}
                    onAccept={onAccept}
                    onReject={onReject}
                />
            </div>
        </div>
    );
}
