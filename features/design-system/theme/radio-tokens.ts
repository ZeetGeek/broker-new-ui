export const RADIO_LAYOUTS = [
    {
        name: "stack",
        label: "Stack",
        note: "Vertical list. Default RadioGroup layout for short exclusive choices.",
    },
    {
        name: "grid",
        label: "Grid",
        note: "2–4 columns. Property form deal type, furnishing, looking-for.",
    },
    {
        name: "cards",
        label: "Option cards",
        note: "Label wraps the radio. Brand-soft fill when selected. Mobile tap-friendly.",
    },
] as const;

export const RADIO_STATES = [
    { name: "unchecked", label: "Unchecked" },
    { name: "checked", label: "Checked" },
    { name: "disabled", label: "Disabled" },
    { name: "invalid", label: "Invalid" },
] as const;
