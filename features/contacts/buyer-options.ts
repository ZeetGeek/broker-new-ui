import type { LucideIcon } from "lucide-react";
import {
    Building,
    Building2,
    CalendarClock,
    CalendarRange,
    Compass,
    Home,
    Landmark,
    LayoutGrid,
    Megaphone,
    Repeat,
    Store,
    Trees,
    UserRoundCheck,
    Wallet,
    Zap,
} from "lucide-react";

import type {
    BuyerFunding,
    BuyerPropertyKind,
    BuyerSource,
    BuyerUrgency,
} from "@/lib/validation/buyer";

export type Option<T extends string> = {
    value: T;
    label: string;
    icon?: LucideIcon;
    /** Plain-English expansion shown on hover where the label is terse. */
    hint?: string;
};

export const PROPERTY_KIND_OPTIONS: Option<BuyerPropertyKind>[] = [
    { value: "any", label: "Any", icon: LayoutGrid },
    { value: "apartment", label: "Apartment", icon: Building2 },
    { value: "villa", label: "Villa", icon: Home },
    { value: "plot", label: "Plot", icon: Trees },
    { value: "shop", label: "Shop", icon: Store },
    { value: "office", label: "Office", icon: Building },
];

export const URGENCY_OPTIONS: Option<BuyerUrgency>[] = [
    {
        value: "immediate",
        label: "Right away",
        icon: Zap,
        hint: "Ready to move within a month. Call these first.",
    },
    {
        value: "three_months",
        label: "In 3 months",
        icon: CalendarRange,
        hint: "Planning a move this quarter.",
    },
    {
        value: "exploring",
        label: "Just looking",
        icon: Compass,
        hint: "No timeline yet. Keep them warm.",
    },
];

export const FUNDING_OPTIONS: Option<BuyerFunding>[] = [
    { value: "unknown", label: "Not sure", icon: CalendarClock, hint: "They have not said yet." },
    { value: "cash", label: "Cash", icon: Wallet, hint: "Paying without a loan. Closes fastest." },
    { value: "loan", label: "Needs loan", icon: Landmark, hint: "Will need a home loan." },
    {
        value: "loan_approved",
        label: "Loan approved",
        icon: UserRoundCheck,
        hint: "Loan is already sanctioned.",
    },
];

export const SOURCE_OPTIONS: Option<BuyerSource>[] = [
    { value: "referral", label: "Referral" },
    { value: "walk_in", label: "Walk-in" },
    { value: "portal", label: "Portal", icon: Megaphone },
    { value: "social", label: "Social" },
    { value: "repeat", label: "Repeat client", icon: Repeat },
    { value: "other", label: "Other" },
];

export const BHK_OPTIONS = ["1", "2", "3", "4", "5"] as const;

/** Kinds that have no bedroom count — the BHK row hides for these. */
export const KINDS_WITHOUT_BHK: BuyerPropertyKind[] = ["plot", "shop", "office"];
