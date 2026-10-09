export const SELECT_SIZES = [
    { name: "xs", label: "XS", note: "24px — control-xs. Dense icon-adjacent fields." },
    { name: "sm", label: "SM", note: "32px — control-sm. Dense contexts — filters, tables." },
    { name: "default", label: "Default", note: "36px — control-md. Most forms." },
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
