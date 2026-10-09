export const BUTTON_VARIANTS = [
    { name: "default", label: "Default", note: "Primary action. One per screen." },
    { name: "accent", label: "Accent", note: "Marketing/hero CTA. One per screen." },
    {
        name: "highlight",
        label: "Highlight",
        note: "Dark surfaces only. One per screen, max.",
    },
    {
        name: "highlight-outline",
        label: "Highlight outline",
        note: "Dark surfaces only. One per screen, max.",
    },
    { name: "outline", label: "Outline", note: "Secondary action." },
    {
        name: "surface",
        label: "Surface",
        note: "White fill, warm border. Filter chips and quiet actions on canvas.",
    },
    { name: "secondary", label: "Secondary", note: "Alternate fill." },
    { name: "ghost", label: "Ghost", note: "Tertiary, inside cards." },
    { name: "destructive", label: "Destructive", note: "Reject, delete." },
    { name: "link", label: "Link", note: "Inline, no container." },
] as const;

export const BUTTON_SIZES = [
    { name: "xs", label: "XS", note: "24px — control-xs" },
    { name: "sm", label: "SM", note: "32px — control-sm" },
    { name: "default", label: "Default", note: "36px — control-md" },
    { name: "md", label: "MD", note: "44px — control-lg, desktop tap-target" },
    { name: "lg", label: "LG", note: "48px — control-xl, same as input lg" },
] as const;

export const BUTTON_ICON_SIZES = [
    { name: "icon-xs", label: "Icon XS" },
    { name: "icon-sm", label: "Icon SM" },
    { name: "icon", label: "Icon" },
    { name: "icon-md", label: "Icon MD" },
    { name: "icon-lg", label: "Icon LG" },
] as const;
