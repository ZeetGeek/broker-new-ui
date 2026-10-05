"use client";

import type { PropertyLead } from "@/lib/api/owner-leads";
import { cn } from "@/lib/utils";

import { OwnerLeadBoardCard } from "@/features/owner-leads/owner-lead-board-card";
import { isFinishedLead, LEAD_STAGE_TO_DEAL_STAGE } from "@/features/owner-leads/owner-lead-meta";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import { DEAL_STAGE_ORDER, type DealStage } from "@/features/pipeline/types";

type BoardColumnKey = DealStage | "finished";

type BoardColumn = {
    key: BoardColumnKey;
    label: string;
    columnClass: string;
    labelClass: string;
    leads: PropertyLead[];
};

function columnFor(lead: PropertyLead): BoardColumnKey {
    if (isFinishedLead(lead)) return "finished";
    return (lead.stage && LEAD_STAGE_TO_DEAL_STAGE[lead.stage]) || "new";
}

function buildColumns(leads: PropertyLead[]): BoardColumn[] {
    const grouped = new Map<BoardColumnKey, PropertyLead[]>();
    for (const lead of leads) {
        const key = columnFor(lead);
        grouped.set(key, [...(grouped.get(key) ?? []), lead]);
    }

    const columns: BoardColumn[] = DEAL_STAGE_ORDER.map((stage) => ({
        key: stage,
        label: DEAL_STAGE_META[stage].label,
        columnClass: DEAL_STAGE_META[stage].columnClass,
        labelClass: DEAL_STAGE_META[stage].labelClass,
        leads: grouped.get(stage) ?? [],
    }));

    // Sold and lost leads only get a column when there are some — an empty
    // fifth column would push the live stages off a laptop screen for nothing.
    const finished = grouped.get("finished") ?? [];
    if (finished.length > 0) {
        columns.push({
            key: "finished",
            label: "Finished",
            columnClass: "border-border-warm bg-surface-muted/40",
            labelClass: "text-ink-muted",
            leads: finished,
        });
    }

    return columns;
}

/**
 * The owner's Board view: one column per stage the broker has the deal in,
 * like the broker's own pipeline board. Read-only — only the broker moves a
 * deal between stages, so there is no drag and drop here.
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
    const columns = buildColumns(leads);

    return (
        <div
            className="
              flex snap-x snap-mandatory items-start gap-3 overflow-x-auto pbe-2
              lg:snap-none lg:gap-4
            "
        >
            {columns.map((column) => (
                <section
                    key={column.key}
                    aria-label={`${column.label} leads`}
                    className={cn(
                        `
                          flex flex-1 basis-0 snap-start flex-col gap-3 rounded-card border p-3
                          min-inline-68
                        `,
                        column.columnClass,
                    )}
                >
                    <header className="min-inline-0">
                        <p className={cn("eyebrow truncate", column.labelClass)}>{column.label}</p>
                        <p className="body-sm tabular mbs-1 text-ink-muted">
                            {column.leads.length > 0
                                ? `${column.leads.length} ${column.leads.length === 1 ? "lead" : "leads"}`
                                : "None yet"}
                        </p>
                    </header>

                    {column.leads.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {column.leads.map((lead) => (
                                <OwnerLeadBoardCard
                                    key={lead.id}
                                    lead={lead}
                                    busy={busyId === lead.id}
                                    onAccept={() => onAccept(lead.id)}
                                    onReject={() => onReject(lead.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p
                            className="
                              body-sm rounded-card border border-dashed border-border-warm px-3 py-8
                              text-center text-ink-muted
                            "
                        >
                            No leads here yet.
                        </p>
                    )}
                </section>
            ))}
        </div>
    );
}
