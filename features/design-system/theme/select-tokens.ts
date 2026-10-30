export const SELECT_SIZES = [
    { name: "xs", label: "XS", note: "24px desktop; at least 44px on phone/touch." },
    { name: "sm", label: "SM", note: "32px desktop; at least 44px on phone/touch." },
    { name: "default", label: "Default", note: "36px desktop; at least 44px on phone/touch." },
    { name: "md", label: "MD", note: "44px — control-lg, same as button md. Desktop tap-target." },
    {
        name: "lg",
        label: "LG",
        note: "48px — control-xl, same as button lg. Primary mobile forms.",
    },
] as const;

export const SELECT_STATES = [
    { name: "rest", label: "Rest" },
    { name: "open", label: "Open" },
    { name: "disabled", label: "Disabled" },
    { name: "error", label: "Error" },
    { name: "success", label: "Success" },
    { name: "loading", label: "Loading" },
] as const;
