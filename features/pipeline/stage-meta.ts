import type { LucideIcon } from "lucide-react";
import {
    CalendarCheck,
    CircleCheck,
    CircleSlash,
    Handshake,
    PhoneCall,
    Sparkles,
} from "lucide-react";

import type { DealLostReason, DealOutcome, DealStage, DealStatus } from "@/features/pipeline/types";

export type StageMeta = {
    /** Plain language, sentence case. Never the internal key. */
    label: string;
    /** One line saying what this stage means and what comes next. */
    hint: string;
    icon: LucideIcon;
    /**
     * The stage token that fills the column dot and progress bar. These
     * deepen through the brand green family and are pipeline-only — see
     * docs/DESIGN.md §1.3.
     */
    dotClass: string;
    /** Verb for the button that advances a deal into this stage. */
    advanceLabel: string;
    /**
     * Column-header pill. One hue (brand green) deepening across the four
     * stages so the board reads left-to-right as progress rather than as
     * four unrelated categories — see docs/DESIGN.md §1.1.
     */
    pillClass: string;
};

export const DEAL_STAGE_META: Record<DealStage, StageMeta> = {
    new: {
        label: "New",
        hint: "You have matched this buyer to this property but not spoken to them about it yet.",
        icon: Sparkles,
        dotClass: "bg-stage-1",
        advanceLabel: "Move to new",
        pillClass: "bg-brand-soft/50 text-brand-text",
    },
    contacted: {
        label: "Contacted",
        hint: "You have spoken to the buyer about this property. Next step is booking a visit.",
        icon: PhoneCall,
        dotClass: "bg-stage-2",
        advanceLabel: "Mark contacted",
        pillClass: "bg-brand-soft text-brand-text",
    },
    visit: {
        label: "Site visit",
        hint: "A visit is booked or done. Next step is an offer from the buyer.",
        icon: CalendarCheck,
        dotClass: "bg-stage-3",
        advanceLabel: "Book a visit",
        pillClass: "bg-brand/15 text-brand-text",
    },
    negotiation: {
        label: "Negotiation",
        hint: "The buyer has made an offer and you are agreeing a price with the owner.",
        icon: Handshake,
        dotClass: "bg-stage-4",
        advanceLabel: "Start negotiating",
        pillClass: "bg-brand-deep text-canvas",
    },
};

export type OutcomeMeta = {
    label: string;
    hint: string;
    icon: LucideIcon;
    badgeVariant: "brand" | "neutral";
    toneClass: string;
};

export const DEAL_OUTCOME_META: Record<DealOutcome, OutcomeMeta> = {
    closed: {
        label: "Closed",
        hint: "The buyer bought this property. The deal is done.",
        icon: CircleCheck,
        badgeVariant: "brand",
        toneClass: "text-success",
    },
    lost: {
        label: "Lost",
        hint: "This buyer will not be buying this property.",
        icon: CircleSlash,
        badgeVariant: "neutral",
        toneClass: "text-ink-muted",
    },
};

/** Why a deal was lost, in the words a broker would use out loud. */
export const DEAL_LOST_REASON_LABEL: Record<DealLostReason, string> = {
    price: "Could not agree a price",
    bought_elsewhere: "Bought somewhere else",
    not_responding: "Buyer stopped replying",
    changed_mind: "Buyer changed their mind",
};

export function isOutcome(status: DealStatus): status is DealOutcome {
    return status === "closed" || status === "lost";
}
