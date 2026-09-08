import type { LucideIcon } from "lucide-react";
import {
    Building,
    Building2,
    Home,
    LayoutGrid,
    Megaphone,
    Repeat,
    Store,
    Trees,
} from "lucide-react";

import type { BuyerPropertyKind, BuyerSource } from "@/lib/validation/buyer";

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
