export const INPUT_SIZES = [
    { name: "sm", label: "SM", note: "32px — control-sm. Dense contexts — filters, tables." },
    { name: "default", label: "Default", note: "36px — control-md. Most forms." },
    {
        name: "lg",
        label: "LG",
        note: "48px — control-xl, same as button lg. Primary mobile forms.",
    },
] as const;

export const INPUT_STATES = [
    { name: "rest", label: "Rest" },
    { name: "focus", label: "Focus" },
    { name: "disabled", label: "Disabled" },
    { name: "error", label: "Error" },
    { name: "success", label: "Success" },
    { name: "loading", label: "Loading" },
] as const;
