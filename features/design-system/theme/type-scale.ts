export type TypeScaleStep = {
    token: string;
    name: string;
    mobilePx: number;
    desktopPx: number;
    weight: number;
    tracking: string;
    leading: string;
    face: "display" | "sans";
    sample: string;
    element: React.ElementType;
};

export type TypeScaleCategory = {
    title: string;
    description: string;
    steps: TypeScaleStep[];
};

export const HEADING_SCALE: TypeScaleStep[] = [
    {
        token: "h1",
        name: "Heading 1",
        mobilePx: 28,
        desktopPx: 40,
        weight: 700,
        tracking: "-0.02em",
        leading: "1.08",
        face: "display",
        sample: "12 requests. 3 waiting on you.",
        element: "h1",
    },
    {
        token: "h2",
        name: "Heading 2",
        mobilePx: 22,
        desktopPx: 28,
        weight: 600,
        tracking: "-0.02em",
        leading: "1.15",
        face: "display",
        sample: "Kim & Alex Park",
        element: "h2",
    },
    {
        token: "h3",
        name: "Heading 3",
        mobilePx: 18,
        desktopPx: 20,
        weight: 600,
        tracking: "-0.01em",
        leading: "1.25",
        face: "display",
        sample: "Next showing",
        element: "h3",
    },
    {
        token: "h4",
        name: "Heading 4",
        mobilePx: 16,
        desktopPx: 18,
        weight: 600,
        tracking: "-0.01em",
        leading: "1.3",
        face: "display",
        sample: "Matched listings",
        element: "h4",
    },
    {
        token: "h5",
        name: "Heading 5",
        mobilePx: 15,
        desktopPx: 16,
        weight: 600,
        tracking: "0",
        leading: "1.35",
        face: "display",
        sample: "Looking for",
        element: "h5",
    },
    {
        token: "h6",
        name: "Heading 6",
        mobilePx: 13,
        desktopPx: 14,
        weight: 600,
        tracking: "0",
        leading: "1.4",
        face: "display",
        sample: "Loan amount",
        element: "h6",
    },
];

export const BODY_SCALE: TypeScaleStep[] = [
    {
        token: "text-lg",
        name: "Body large",
        mobilePx: 17,
        desktopPx: 18,
        weight: 400,
        tracking: "0",
        leading: "1.55",
        face: "sans",
        sample: "We'd love to see Fern Ave this week.",
        element: "p",
    },
    {
        token: "text-base",
        name: "Body",
        mobilePx: 15,
        desktopPx: 16,
        weight: 400,
        tracking: "0",
        leading: "1.55",
        face: "sans",
        sample: "Owners in your area are listing now.",
        element: "p",
    },
    {
        token: "text-sm",
        name: "Body small",
        mobilePx: 13,
        desktopPx: 13,
        weight: 400,
        tracking: "0",
        leading: "1.45",
        face: "sans",
        sample: "3 BHK · Vesu · Semi-furnished",
        element: "p",
    },
    {
        token: "text-xs",
        name: "Body extra small",
        mobilePx: 12,
        desktopPx: 12,
        weight: 400,
        tracking: "0",
        leading: "1.4",
        face: "sans",
        sample: "Referred by Mark · 25% split",
        element: "p",
    },
];

export const SPECIAL_SCALE: TypeScaleStep[] = [
    {
        token: "display",
        name: "Display",
        mobilePx: 32,
        desktopPx: 52,
        weight: 700,
        tracking: "-0.03em",
        leading: "1.02",
        face: "display",
        sample: "34 listings.",
        element: "p",
    },
    {
        token: "eyebrow",
        name: "Eyebrow",
        mobilePx: 11,
        desktopPx: 11,
        weight: 500,
        tracking: "0.08em",
        leading: "1.2",
        face: "sans",
        sample: "NEXT SHOWING",
        element: "p",
    },
];
