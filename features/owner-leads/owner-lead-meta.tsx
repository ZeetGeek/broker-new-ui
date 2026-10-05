import { CircleCheck, CircleSlash, Clock } from "lucide-react";

import type { PropertyLead } from "@/lib/api/owner-leads";
import { parseInr } from "@/lib/format/inr";
import { cn } from "@/lib/utils";

import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealStage } from "@/features/pipeline/types";

/**
 * The owner sees the broker's stage keys, which are not the pipeline's own
 * keys. Mapping them lets the owner's cards wear the same stage colours as
 * the broker's pipeline, so a deal looks the same from both portals.
 */
export const LEAD_STAGE_TO_DEAL_STAGE: Record<string, DealStage> = {
    new: "new",
    contacted: "contacted",
    site_visit: "visit",
    negotiation: "negotiation",
    offer_made: "negotiation",
};

const LEAD_STAGE_LABEL: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    site_visit: "Site visit",
    negotiation: "Negotiation",
    offer_made: "Offer made",
    closed_won: "Sold",
    closed_lost: "Lost",
};

export function isFinishedLead(lead: PropertyLead): boolean {
    return lead.stage === "closed_won" || lead.stage === "closed_lost";
}

export function leadBrokerLabel(lead: PropertyLead): string {
    return lead.broker?.fullName?.trim() || lead.broker?.email || "Broker";
}

export function leadClientLabel(lead: PropertyLead): string {
    return lead.client?.name?.trim() || "Buyer";
}

export function leadPropertyLabel(lead: PropertyLead): string {
    return lead.property?.title?.trim() || lead.property?.city || "Property";
}

const BHK_CONFIG_LABEL: Record<string, string> = {
    one_rk: "1 RK",
    one_bhk: "1 BHK",
    two_bhk: "2 BHK",
    three_bhk: "3 BHK",
    four_bhk: "4 BHK",
    five_plus_bhk: "5+ BHK",
};

function titleCase(value: string): string {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export type LeadPropertyFacts = {
    imageSrc: string | null;
    photoCount: number;
    locality: string;
    city: string;
    configLabel: string | null;
    areaSqft: number | null;
    /** The listing's own price — sale price, or monthly rent for a rental. */
    askingInr: number | null;
    isRent: boolean;
};

/**
 * The property facts both lead cards show, worked out the same way the
 * broker's pipeline does (lib/api/pipeline.ts `mapLeadToDeal`) so one listing
 * reads identically in both portals.
 */
export function leadPropertyFacts(lead: PropertyLead): LeadPropertyFacts {
    const property = lead.property;
    const photos = property?.photos?.filter(Boolean) ?? [];
    const rent = parseInr(property?.monthlyRent);
    const sale = parseInr(property?.salePrice);
    const isRent =
        property?.transactionType === "rent" ||
        (property?.transactionType !== "sale" && (rent ?? 0) > 0 && (sale ?? 0) <= 0);
    const typeLabel = property?.subtype ?? property?.propertyType;
    const configLabel =
        (property?.bhkConfig && BHK_CONFIG_LABEL[property.bhkConfig]) ||
        (property?.bedrooms ? `${property.bedrooms} BHK` : null) ||
        (typeLabel ? titleCase(typeLabel.replace(/_/g, " ")) : null);
    const city = titleCase(property?.city?.trim() || "");

    return {
        imageSrc: photos[0] ?? null,
        photoCount: photos.length,
        locality: titleCase(property?.address?.trim() || "") || city,
        city,
        configLabel,
        areaSqft: property?.areaSqft ?? null,
        askingInr: (isRent ? rent : sale) ?? parseInr(lead.listPrice),
        isRent,
    };
}

export function leadWhatsappMessage(lead: PropertyLead): string {
    return `Hi ${leadBrokerLabel(lead)}, this is about ${leadPropertyLabel(lead)}.`;
}

export function StagePill({ stage }: { stage?: string | null }) {
    if (!stage) return <span />;

    const dealStage = LEAD_STAGE_TO_DEAL_STAGE[stage];
    const label = LEAD_STAGE_LABEL[stage] ?? stage.replace(/_/g, " ");

    if (dealStage) {
        const meta = DEAL_STAGE_META[dealStage];
        return (
            <span
                className={cn(
                    "body-xs flex items-center gap-1.5 rounded-control px-2.5 py-1 font-semibold",
                    meta.pillClass,
                )}
            >
                <span
                    aria-hidden
                    className={cn("rounded-full block-1.5 inline-1.5", meta.dotClass)}
                />
                {label}
            </span>
        );
    }

    const OutcomeIcon = stage === "closed_won" ? CircleCheck : CircleSlash;
    return (
        <span
            className="
              body-xs flex items-center gap-1.5 rounded-control bg-surface-muted px-2.5 py-1
              font-semibold text-ink
            "
        >
            <OutcomeIcon aria-hidden className="block-3 inline-3" strokeWidth={2} />
            {label}
        </span>
    );
}

export function OfferStatusPill({ status }: { status?: string | null }) {
    if (status === "pending") {
        return (
            <span
                className="
                  body-xs flex items-center gap-1.5 rounded-control bg-urgent-soft px-2.5 py-1
                  font-semibold text-urgent
                "
            >
                <Clock aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                Waiting for your reply
            </span>
        );
    }
    if (status === "accepted") {
        return (
            <span
                className="
                  body-xs flex items-center gap-1.5 rounded-control bg-success-soft px-2.5 py-1
                  font-semibold text-success
                "
            >
                <CircleCheck aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                You accepted
            </span>
        );
    }
    if (status === "rejected" || status === "withdrawn") {
        return (
            <span
                className="
                  body-xs flex items-center gap-1.5 rounded-control bg-surface-muted px-2.5 py-1
                  font-semibold text-ink-muted
                "
            >
                <CircleSlash aria-hidden className="block-3.5 inline-3.5" strokeWidth={2} />
                {status === "rejected" ? "You rejected" : "Withdrawn"}
            </span>
        );
    }
    return null;
}
