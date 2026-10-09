export const SWITCH_SIZES = [
    {
        name: "sm",
        label: "SM",
        note: "16×28px track. Dense filter rows and compact settings lists.",
    },
    {
        name: "default",
        label: "Default",
        note: "20×44px track. Preference rows and primary form toggles.",
    },
] as const;

export const SWITCH_STATES = [
    { name: "unchecked", label: "Off" },
    { name: "checked", label: "On" },
    { name: "disabled", label: "Disabled" },
    { name: "invalid", label: "Invalid" },
] as const;
