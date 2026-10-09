export type ColorToken = {
    name: string;
    variable: string;
    hex: string;
    className: string;
    usage: string;
    onDark?: boolean;
};

export type ColorGroup = {
    title: string;
    description: string;
    tokens: ColorToken[];
};

export const COLOR_GROUPS: ColorGroup[] = [
    {
        title: "Warm neutral",
        description:
            "Page canvas and card surfaces. ~60–70% of every screen. Never pure white or cool gray.",
        tokens: [
            {
                name: "Canvas",
                variable: "--color-canvas",
                hex: "#EFEAE0",
                className: "bg-canvas",
                usage: "Page background",
            },
            {
                name: "Surface",
                variable: "--color-surface",
                hex: "#FFFFFF",
                className: "bg-surface",
                usage: "Cards, sitting on canvas",
            },
            {
                name: "Surface muted",
                variable: "--color-surface-muted",
                hex: "#F7F4EE",
                className: "bg-surface-muted",
                usage: "Inset strips inside a card",
            },
            {
                name: "Border",
                variable: "--color-border-warm",
                hex: "#E4DED2",
                className: "bg-border-warm",
                usage: "Hairline dividers, 1px",
            },
        ],
    },
    {
        title: "Ink",
        description: "Text. Near-black with a green cast, never a neutral gray.",
        tokens: [
            {
                name: "Ink",
                variable: "--color-ink",
                hex: "#191C1A",
                className: "bg-ink",
                usage: "Primary text",
                onDark: true,
            },
            {
                name: "Ink muted",
                variable: "--color-ink-muted",
                hex: "#86867E",
                className: "bg-ink-muted",
                usage: "Secondary text, second line of a two-tone headline",
                onDark: true,
            },
            {
                name: "Ink subtle",
                variable: "--color-ink-subtle",
                hex: "#A9A79D",
                className: "bg-ink-subtle",
                usage: "Captions, metadata, placeholder — contrast floor",
            },
        ],
    },
    {
        title: "Brand green",
        description:
            "One hue family at four pipeline depths plus brand. ~30% combined. No blue, no purple, no second brand colour, ever.",
        tokens: [
            {
                name: "Brand ink",
                variable: "--color-brand-ink",
                hex: "#0B1F17",
                className: "bg-brand-ink",
                usage: "Primary button fill — reads black, is green",
                onDark: true,
            },
            {
                name: "Brand deep",
                variable: "--color-brand-deep",
                hex: "#0F3D2E",
                className: "bg-brand-deep",
                usage: "Dark attention cards, progress strip",
                onDark: true,
            },
            {
                name: "Brand",
                variable: "--color-brand",
                hex: "#1B7A5A",
                className: "bg-brand",
                usage: "Prices, match %, active nav state, links",
                onDark: true,
            },
            {
                name: "Brand soft",
                variable: "--color-brand-soft",
                hex: "#E3F2EA",
                className: "bg-brand-soft",
                usage: "Badge and chip backgrounds",
            },
            {
                name: "Brand soft hover",
                variable: "--color-brand-soft-hover",
                hex: "#D0E8DC",
                className: "bg-brand-soft-hover",
                usage: "Hover fill on brand-soft controls",
            },
            {
                name: "Brand text",
                variable: "--color-brand-text",
                hex: "#0B5A41",
                className: "bg-brand-text",
                usage: "Text sitting on brand-soft",
                onDark: true,
            },
            {
                name: "Stage 1",
                variable: "--color-stage-1",
                hex: "#0284C7",
                className: "bg-stage-1",
                usage: "Pipeline — New (sky-600)",
                onDark: true,
            },
            {
                name: "Stage 1 soft",
                variable: "--color-stage-1-soft",
                hex: "#BAE6FD",
                className: "bg-stage-1-soft",
                usage: "Pipeline — New, pill and column fill (sky-200)",
            },
            {
                name: "Stage 2",
                variable: "--color-stage-2",
                hex: "#7C3AED",
                className: "bg-stage-2",
                usage: "Pipeline — Contacted (violet-600)",
                onDark: true,
            },
            {
                name: "Stage 2 soft",
                variable: "--color-stage-2-soft",
                hex: "#DDD6FE",
                className: "bg-stage-2-soft",
                usage: "Pipeline — Contacted, pill and column fill (violet-200)",
            },
            {
                name: "Stage 3",
                variable: "--color-stage-3",
                hex: "#D97706",
                className: "bg-stage-3",
                usage: "Pipeline — Site visit (amber-600)",
                onDark: true,
            },
            {
                name: "Stage 3 soft",
                variable: "--color-stage-3-soft",
                hex: "#FDE68A",
                className: "bg-stage-3-soft",
                usage: "Pipeline — Site visit, pill and column fill (amber-200)",
            },
            {
                name: "Stage 4",
                variable: "--color-stage-4",
                hex: "#059669",
                className: "bg-stage-4",
                usage: "Pipeline — Negotiation (emerald-600)",
                onDark: true,
            },
            {
                name: "Stage 4 soft",
                variable: "--color-stage-4-soft",
                hex: "#A7F3D0",
                className: "bg-stage-4-soft",
                usage: "Pipeline — Negotiation, pill and column fill (emerald-200)",
            },
        ],
    },
    {
        title: "Highlight",
        description:
            "Lime. One per card, maximum — marks the single most important thing. Never as text on a light surface.",
        tokens: [
            {
                name: "Highlight",
                variable: "--color-highlight",
                hex: "#C9F24D",
                className: "bg-highlight",
                usage: "Current bar in a chart, open count, active stage dot",
            },
            {
                name: "Highlight ink",
                variable: "--color-highlight-ink",
                hex: "#1E3A05",
                className: "bg-highlight-ink",
                usage: "Text sitting on highlight fill",
                onDark: true,
            },
        ],
    },
    {
        title: "Signal — urgent",
        description:
            "Deadline approaching or passed. Never decorative, never on a heading, border, or icon.",
        tokens: [
            {
                name: "Urgent",
                variable: "--color-urgent",
                hex: "#C2410C",
                className: "bg-urgent",
                usage: "Expiring listing, overdue follow-up, showing starting now",
                onDark: true,
            },
            {
                name: "Urgent mid",
                variable: "--color-urgent-mid",
                hex: "#E8895A",
                className: "bg-urgent-mid",
                usage: "Icon or accent between urgent and urgent-soft, still on a warm surface",
            },
            {
                name: "Urgent soft",
                variable: "--color-urgent-soft",
                hex: "#FBEBE0",
                className: "bg-urgent-soft",
                usage: "Badge background paired with urgent text",
            },
        ],
    },
    {
        title: "Signal — pending",
        description:
            "Waiting on a process. No action required. Distinct from urgent (a deadline) so verifying does not look overdue.",
        tokens: [
            {
                name: "Pending",
                variable: "--color-pending",
                hex: "#92650A",
                className: "bg-pending",
                usage: "RERA verification in flight, other wait states with no deadline",
                onDark: true,
            },
        ],
    },
    {
        title: "Signal — danger",
        description: "Destroys or denies something. Reject, delete, remove — nothing else.",
        tokens: [
            {
                name: "Danger",
                variable: "--color-danger",
                hex: "#B42318",
                className: "bg-danger",
                usage: "Reject a request, delete a listing, remove a member",
                onDark: true,
            },
            {
                name: "Danger mid",
                variable: "--color-danger-mid",
                hex: "#E2725F",
                className: "bg-danger-mid",
                usage: "Icon or accent between danger and danger-soft, still on a warm surface",
            },
            {
                name: "Danger soft",
                variable: "--color-danger-soft",
                hex: "#FDECEA",
                className: "bg-danger-soft",
                usage: "Badge background paired with danger text",
            },
        ],
    },
    {
        title: "Signal — success",
        description:
            "Confirms something completed. Approved request, closed deal, verified step — nothing else.",
        tokens: [
            {
                name: "Success",
                variable: "--color-success",
                hex: "#1B7A5A",
                className: "bg-success",
                usage: "Approved representation, closed deal, completed step",
                onDark: true,
            },
            {
                name: "Success mid",
                variable: "--color-success-mid",
                hex: "#7BB89E",
                className: "bg-success-mid",
                usage: "Icon or accent between success and success-soft, still on a warm surface",
            },
            {
                name: "Success soft",
                variable: "--color-success-soft",
                hex: "#E3F2EA",
                className: "bg-success-soft",
                usage: "Badge background paired with success text",
            },
        ],
    },
];
