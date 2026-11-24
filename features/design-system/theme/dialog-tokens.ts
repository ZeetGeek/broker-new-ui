export const DIALOG_USES = [
    {
        name: "confirmation",
        label: "Confirmation",
        note: "AppModal for short confirmations, with the action and consequence made clear.",
    },
    {
        name: "app-modal",
        label: "AppModal",
        note: "Product default — sticky header, scroll body, optional footer.",
    },
    {
        name: "destructive",
        label: "Destructive",
        note: "Name the thing and the consequence. Verb on the danger button.",
    },
] as const;

export const DIALOG_SIZES = [
    {
        name: "sm",
        label: "SM",
        note: "24rem — notes, short confirms, single field.",
    },
    {
        name: "md",
        label: "MD",
        note: "32rem — default. Most product modals.",
    },
    {
        name: "lg",
        label: "LG",
        note: "48rem — multi-field forms and richer body content.",
    },
] as const;
