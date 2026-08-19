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
    { name: "secondary", label: "Secondary", note: "Alternate fill." },
    { name: "ghost", label: "Ghost", note: "Tertiary, inside cards." },
    { name: "destructive", label: "Destructive", note: "Reject, delete." },
    { name: "link", label: "Link", note: "Inline, no container." },
] as const;

export const BUTTON_SIZES = [
    { name: "xs", label: "XS" },
    { name: "sm", label: "SM" },
    { name: "default", label: "Default" },
    { name: "lg", label: "LG" },
] as const;

export const BUTTON_ICON_SIZES = [
    { name: "icon-xs", label: "Icon XS" },
    { name: "icon-sm", label: "Icon SM" },
    { name: "icon", label: "Icon" },
    { name: "icon-lg", label: "Icon LG" },
] as const;
