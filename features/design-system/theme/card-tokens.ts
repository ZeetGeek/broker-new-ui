export const CARD_SURFACES = [
    {
        name: "surface",
        label: "Surface",
        note: "White on canvas. Default resting card — rounded-card, shadow-sm or none.",
    },
    {
        name: "dark",
        label: "Dark attention",
        note: "brand-deep. One action that matters — max two per screen, one on mobile.",
    },
] as const;

export const CARD_SIZES = [
    {
        name: "default",
        label: "Default",
        note: "spacing(6) padding. Lists, dashboards, form sections.",
    },
    {
        name: "sm",
        label: "SM",
        note: "spacing(4) padding. Dense rows and side panels.",
    },
] as const;
