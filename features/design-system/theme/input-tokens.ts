export const INPUT_SIZES = [
    { name: "sm", label: "SM", note: "Dense contexts — filters, tables." },
    { name: "default", label: "Default", note: "Most forms." },
    { name: "lg", label: "LG", note: "48px tap target — primary mobile forms." },
] as const;

export const INPUT_STATES = [
    { name: "rest", label: "Rest" },
    { name: "focus", label: "Focus" },
    { name: "disabled", label: "Disabled" },
    { name: "error", label: "Error" },
    { name: "success", label: "Success" },
    { name: "loading", label: "Loading" },
] as const;
