export const DATE_PICKER_SIZES = [
    { name: "xs", label: "XS", note: "24px — control-xs. Dense icon-adjacent fields." },
    { name: "sm", label: "SM", note: "32px — control-sm. Dense contexts — filters, tables." },
    { name: "default", label: "Default", note: "36px — control-md. Compact forms." },
    { name: "md", label: "MD", note: "44px — control-lg. Desktop tap-target." },
    {
        name: "lg",
        label: "LG",
        note: "48px — control-xl. Primary mobile forms (component default).",
    },
] as const;

export const DATE_PICKER_STATES = [
    { name: "empty", label: "Empty" },
    { name: "filled", label: "Filled" },
    { name: "open", label: "Open" },
    { name: "disabled", label: "Disabled" },
    { name: "invalid", label: "Invalid" },
] as const;
