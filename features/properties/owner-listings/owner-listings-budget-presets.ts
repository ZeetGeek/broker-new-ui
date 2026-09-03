export type OwnerListingsBudgetPreset = {
    min: string;
    max: string;
    label: string;
    /** Compact center readout on the knob. */
    shortLabel: string;
};

/** Budget dial steps — index 0 is Any. */
export const OWNER_LISTINGS_BUDGET_STEPS: OwnerListingsBudgetPreset[] = [
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

export function findBudgetStepIndex(min: string, max: string): number {
    const index = OWNER_LISTINGS_BUDGET_STEPS.findIndex(
        (step) => step.min === min && step.max === max,
    );
    return index >= 0 ? index : 0;
}
