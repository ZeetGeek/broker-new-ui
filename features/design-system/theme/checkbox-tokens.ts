export const CHECKBOX_LAYOUTS = [
    {
        name: "stack",
        label: "Stack",
        note: "Label beside the box. Consent lines, reminders, filter lists.",
    },
    {
        name: "cards",
        label: "Option cards",
        note: "Label wraps the checkbox. Multi-select filters — whole tile is the tap target.",
    },
    {
        name: "indeterminate",
        label: "Indeterminate",
        note: "Parent of a partial group. Dash mark, same brand fill as checked.",
    },
] as const;

export const CHECKBOX_STATES = [
    { name: "unchecked", label: "Unchecked" },
    { name: "checked", label: "Checked" },
    { name: "indeterminate", label: "Indeterminate" },
    { name: "disabled", label: "Disabled" },
    { name: "invalid", label: "Invalid" },
] as const;
