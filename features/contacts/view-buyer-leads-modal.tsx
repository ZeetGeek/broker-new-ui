"use client";

import { Building2 } from "@/components/shared/icons";

import { formatRelativePast } from "@/lib/format/date";
import { formatPrice } from "@/lib/format/price";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";

import { AppModal } from "@/components/shared/app-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { VirtualListBox } from "@/components/shared/virtual-list-box";
import { Badge, type BadgeColor } from "@/components/ui/badge";

import type { BuyerLead, BuyerRow } from "@/features/contacts/types";

const STAGE_LABELS: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    visit: "Site visit",
    site_visit: "Site visit",
    negotiation: "Negotiation",
    offer_made: "Offer made",
    closed: "Closed",
    closed_won: "Closed won",
    closed_lost: "Closed lost",
    lost: "Lost",
};

function stageLabel(stage: string): string {
    return STAGE_LABELS[stage] ?? stage.replace(/_/g, " ");
}

function stageColor(stage: string): BadgeColor {
    if (stage === "closed" || stage === "closed_won") return "emerald";
    if (stage === "lost" || stage === "closed_lost") return "stone";
    if (stage === "new") return "sky";
    if (stage === "contacted") return "violet";
    if (stage === "visit" || stage === "site_visit") return "amber";
    if (stage === "offer_made" || stage === "negotiation") return "emerald";
    return "sky";
}

function LeadMoney({ lead }: { lead: BuyerLead }) {
    if (lead.closedAmountInr != null) {
        return (
            <span className="body-xs tabular text-ink-muted">
                Closed at {formatPrice(lead.closedAmountInr)}
            </span>
        );
    }
    if (lead.offerAmountInr != null) {
        return (
            <span className="body-xs tabular text-ink-muted">
                Offer {formatPrice(lead.offerAmountInr)}
            </span>
        );
    }
    if (lead.listPriceInr != null && lead.listPriceInr > 0) {
        return (
            <PriceWithCommission
                amountInr={lead.listPriceInr}
                isRent={lead.isRent}
                commissionPercent={lead.commissionPercent}
                commissionAmountInr={lead.commissionAmountInr}
                audience="broker"
                size="xs"
                showEmptyTip
                className="text-ink-muted"
            />
        );
    }
    return <span className="body-xs text-ink-muted">No price yet</span>;
}

function LeadRow({ lead }: { lead: BuyerLead }) {
    const tone = stageColor(lead.stage);

    return (
        <article className="flex flex-col gap-2 rounded-card border border-border-warm bg-surface p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-inline-0">
                    <PropertyTitleLink
                        href={brokerPropertyDetailHref(lead.propertyId)}
                        className="body-sm truncate font-semibold"
                    >
                        {lead.title}
                    </PropertyTitleLink>
                    {lead.city ? <p className="body-xs text-ink-muted">{lead.city}</p> : null}
                </div>
                <Badge color={tone} className="shrink-0">
                    {stageLabel(lead.stage)}
                </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <LeadMoney lead={lead} />
                <p className="body-xs text-ink-subtle">
                    {lead.updatedAt
                        ? `Updated ${formatRelativePast(new Date(lead.updatedAt), new Date())}`
                        : "No activity yet"}
                </p>
            </div>
        </article>
    );
}

export function ViewBuyerLeadsModal({
    open,
    onOpenChange,
    buyer,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buyer: BuyerRow;
}) {
    const leads = buyer.leads;

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="md"
            title={`${buyer.name}'s properties`}
            description={
                leads.length === 0
                    ? "No properties linked yet. Attach one to start tracking."
                    : `${leads.length} ${leads.length === 1 ? "lead" : "leads"} · latest status on each`
            }
        >
            {leads.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    heading="Not on any property yet"
                    description="Use Attach to link this buyer to an accepted listing."
                />
            ) : (
                <VirtualListBox
                    items={leads}
                    getKey={(lead) => lead.leadId}
                    estimateItemHeight={104}
                    gap={8}
                    ariaLabel={`Properties linked to ${buyer.name}`}
                    renderItem={(lead) => <LeadRow lead={lead} />}
                />
            )}
        </AppModal>
    );
}
