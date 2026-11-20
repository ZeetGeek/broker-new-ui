export type ShadowToken = {
    name: string;
    variable: string;
    className: string;
    css: string;
    usage: string;
};

export const SHADOW_TOKENS: ShadowToken[] = [
    {
        name: "Extra small",
        variable: "--shadow-xs",
        className: "shadow-xs",
        css: "0 1px 2px -1px ink/6%",
        usage: "Inputs, filter chips, resting badges",
    },
    {
        name: "Small",
        variable: "--shadow-sm",
        className: "shadow-sm",
        css: "0 1px 2px -1px ink/5%, 0 3px 8px -2px ink/6%",
        usage: "Default resting card on canvas",
    },
    {
        name: "Medium",
        variable: "--shadow-md",
        className: "shadow-md",
        css: "0 2px 4px -2px ink/5%, 0 8px 16px -4px ink/8%",
        usage: "Raised card, hover / press feedback",
    },
    {
        name: "Large",
        variable: "--shadow-lg",
        className: "shadow-lg",
        css: "0 4px 8px -4px ink/6%, 0 16px 32px -8px ink/10%",
        usage: "Dropdowns, popovers, floating menus",
    },
    {
        name: "Extra large",
        variable: "--shadow-xl",
        className: "shadow-xl",
        css: "0 8px 16px -6px ink/8%, 0 28px 56px -12px ink/14%",
        usage: "Modals, bottom sheets",
    },
    {
        name: "Brand glow",
        variable: "--shadow-brand-glow",
        className: "shadow-brand-glow",
        css: "0 2px 4px -1px ink/18%, 0 8px 16px -4px brand/45%, 0 14px 28px -6px brand/35%",
        usage: "Floating brand action only — mobile action fan (+)",
    },
    {
        name: "Brand glow soft",
        variable: "--shadow-brand-glow-soft",
        className: "shadow-brand-glow-soft",
        css: "0 1px 2px -1px ink/12%, 0 4px 10px -4px brand/30%, 0 8px 16px -8px brand/20%",
        usage: "Inline solid brand buttons — Button accent",
    },
];
