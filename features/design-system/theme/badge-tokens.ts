export const BADGE_VARIANTS = [
    {
        name: "brand",
        label: "Brand",
        note: "Verified, approved, active — white → brand-soft.",
        sample: "Verified",
    },
    {
        name: "urgent",
        label: "Urgent",
        note: "Expiring, overdue, due now — never decorative.",
        sample: "Due today",
    },
    {
        name: "danger",
        label: "Danger",
        note: "Rejected, inactive, destructive status.",
        sample: "Rejected",
    },
    {
        name: "neutral",
        label: "Neutral",
        note: "Default. Quiet status and counts on cards.",
        sample: "2 requests",
    },
    {
        name: "outline",
        label: "Outline",
        note: "Filters, tags, and secondary labels.",
        sample: "Vesu",
    },
] as const;

export const BADGE_USES = [
    {
        name: "status",
        label: "Status",
        note: "Pipeline and visit state — one meaning per colour.",
    },
    {
        name: "with-icon",
        label: "With icon",
        note: "Optional leading icon. Keep it tiny; gap-1 is built in.",
    },
    {
        name: "chips",
        label: "Chips",
        note: "Filter and area chips — outline on canvas or surface.",
    },
    {
        name: "row",
        label: "In a row",
        note: "Stack meanings side by side — never more than one urgent.",
    },
] as const;
