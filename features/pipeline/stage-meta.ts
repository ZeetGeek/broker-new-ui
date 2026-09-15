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
     * The stage token that fills the column dot and progress bar. One
     * Tailwind hue per stage, pipeline-only — see docs/DESIGN.md §1.3.
     */
    dotClass: string;
    /** Verb for the button that advances a deal into this stage. */
    advanceLabel: string;
    /**
     * Column-header pill: the stage's soft fill carrying its solid tone as
     * text. One hue per stage so the four columns are told apart at a
     * glance — see docs/DESIGN.md §1.3.
     */
    pillClass: string;
    /**
     * The whole board column: a wash of the stage's soft token plus a solid
     * border in that same token. The border carries the separation, which
     * lets the fill stay light enough that the white cards on top of it are
     * still the thing the eye lands on.
     */
    columnClass: string;
    /**
     * The stage name above a column's total, as an eyebrow in the stage's own
     * solid tone. `pillClass` still backs the compact pill used in menus and
     * on the mobile stage tabs.
     */
    labelClass: string;
};

export const DEAL_STAGE_META: Record<DealStage, StageMeta> = {
    new: {
        label: "New",
        hint: "You have matched this buyer to this property but not spoken to them about it yet.",
        icon: Sparkles,
        dotClass: "bg-stage-1",
        advanceLabel: "Move to new",
        pillClass: "bg-stage-1-soft text-stage-1",
        columnClass: "border-stage-1-soft bg-stage-1-soft/25",
        labelClass: "text-stage-1",
    },
    contacted: {
        label: "Contacted",
        hint: "You have spoken to the buyer about this property. Next step is booking a visit.",
        icon: PhoneCall,
        dotClass: "bg-stage-2",
        advanceLabel: "Mark contacted",
        pillClass: "bg-stage-2-soft text-stage-2",
        columnClass: "border-stage-2-soft bg-stage-2-soft/25",
        labelClass: "text-stage-2",
    },
    visit: {
        label: "Site visit",
        hint: "A visit is booked or done. Next step is an offer from the buyer.",
        icon: CalendarCheck,
        dotClass: "bg-stage-3",
        advanceLabel: "Book a visit",
        pillClass: "bg-stage-3-soft text-stage-3",
        columnClass: "border-stage-3-soft bg-stage-3-soft/25",
        labelClass: "text-stage-3",
    },
    negotiation: {
        label: "Negotiation",
        hint: "The buyer has made an offer and you are agreeing a price with the owner.",
        icon: Handshake,
        dotClass: "bg-stage-4",
        advanceLabel: "Start negotiating",
        pillClass: "bg-stage-4-soft text-stage-4",
        columnClass: "border-stage-4-soft bg-stage-4-soft/25",
        labelClass: "text-stage-4",
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
