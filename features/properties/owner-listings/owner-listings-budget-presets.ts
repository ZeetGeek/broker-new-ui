import type { OwnerListingTransactionType } from "@/features/properties/owner-listings/types";

export type OwnerListingsBudgetPreset = {
    min: string;
    max: string;
    label: string;
    /** Compact center readout on the knob. */
    shortLabel: string;
};

export type OwnerListingsBudgetKind = OwnerListingTransactionType | "";

/** Sale / purchase dial steps — index 0 is Any. */
export const OWNER_LISTINGS_SALE_BUDGET_STEPS: OwnerListingsBudgetPreset[] = [
    { min: "", max: "", label: "Any budget", shortLabel: "Any" },
    { min: "", max: "2500000", label: "Under ₹25 L", shortLabel: "₹25 L" },
    { min: "", max: "5000000", label: "Under ₹50 L", shortLabel: "₹50 L" },
    { min: "", max: "10000000", label: "Under ₹1 Cr", shortLabel: "₹1 Cr" },
    { min: "", max: "20000000", label: "Under ₹2 Cr", shortLabel: "₹2 Cr" },
    { min: "", max: "50000000", label: "Under ₹5 Cr", shortLabel: "₹5 Cr" },
    { min: "4000000", max: "6000000", label: "₹40 L – ₹60 L", shortLabel: "₹40–60 L" },
    { min: "10000000", max: "20000000", label: "₹1 Cr – ₹2 Cr", shortLabel: "₹1–2 Cr" },
    { min: "20000000", max: "", label: "₹2 Cr+", shortLabel: "₹2 Cr+" },
];

/** Monthly rent dial steps — index 0 is Any. */
export const OWNER_LISTINGS_RENT_BUDGET_STEPS: OwnerListingsBudgetPreset[] = [
    { min: "", max: "", label: "Any budget", shortLabel: "Any" },
    { min: "", max: "10000", label: "Under ₹10k/mo", shortLabel: "₹10k" },
    { min: "", max: "15000", label: "Under ₹15k/mo", shortLabel: "₹15k" },
    { min: "", max: "20000", label: "Under ₹20k/mo", shortLabel: "₹20k" },
    { min: "", max: "30000", label: "Under ₹30k/mo", shortLabel: "₹30k" },
    { min: "", max: "40000", label: "Under ₹40k/mo", shortLabel: "₹40k" },
    { min: "", max: "50000", label: "Under ₹50k/mo", shortLabel: "₹50k" },
    { min: "15000", max: "25000", label: "₹15k – ₹25k/mo", shortLabel: "₹15–25k" },
    { min: "25000", max: "40000", label: "₹25k – ₹40k/mo", shortLabel: "₹25–40k" },
    { min: "50000", max: "", label: "₹50k+/mo", shortLabel: "₹50k+" },
];

/** @deprecated Use getBudgetSteps — kept for any stray sale-only imports. */
export const OWNER_LISTINGS_BUDGET_STEPS = OWNER_LISTINGS_SALE_BUDGET_STEPS;

/**
 * Budget presets for the Looking-for mode.
 * `rent` → monthly rent steps. Sale and Any → purchase (lakh/crore) steps.
 */
export function getBudgetSteps(kind: OwnerListingsBudgetKind): OwnerListingsBudgetPreset[] {
    return kind === "rent" ? OWNER_LISTINGS_RENT_BUDGET_STEPS : OWNER_LISTINGS_SALE_BUDGET_STEPS;
}

export function findBudgetStepIndex(
    min: string,
    max: string,
    steps: OwnerListingsBudgetPreset[] = OWNER_LISTINGS_SALE_BUDGET_STEPS,
): number {
    const index = steps.findIndex((step) => step.min === min && step.max === max);
    return index >= 0 ? index : 0;
}

/** True when min/max match a step in the given preset list (including Any). */
export function isBudgetInSteps(
    min: string,
    max: string,
    steps: OwnerListingsBudgetPreset[],
): boolean {
    return steps.some((step) => step.min === min && step.max === max);
}
