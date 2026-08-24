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

const HEADING_SAMPLE = "12 requests. 3 waiting on you.";

export const DISPLAY_SCALE: TypeScaleStep[] = [
    {
        token: "display-1",
        name: "Display 1",
        mobilePx: 44,
        desktopPx: 72,
        weight: 700,
        tracking: "-0.03em",
        leading: "1.0",
        face: "display",
        sample: HEADING_SAMPLE,
        element: "p",
    },
    {
        token: "display-2",
        name: "Display 2",
        mobilePx: 38,
        desktopPx: 60,
        weight: 700,
        tracking: "-0.03em",
        leading: "1.0",
        face: "display",
        sample: HEADING_SAMPLE,
        element: "p",
    },
    {
        token: "display-3",
        name: "Display 3",
        mobilePx: 32,
        desktopPx: 48,
        weight: 700,
        tracking: "-0.02em",
        leading: "1.02",
        face: "display",
        sample: HEADING_SAMPLE,
        element: "p",
    },
];

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
        sample: HEADING_SAMPLE,
        element: "h1",
    },
    {
        token: "h2",
        name: "Heading 2",
        mobilePx: 24,
        desktopPx: 34,
        weight: 600,
        tracking: "-0.02em",
        leading: "1.15",
        face: "display",
        sample: HEADING_SAMPLE,
        element: "h2",
    },
    {
        token: "h3",
        name: "Heading 3",
        mobilePx: 22,
        desktopPx: 28,
        weight: 600,
        tracking: "-0.01em",
        leading: "1.2",
        face: "display",
        sample: HEADING_SAMPLE,
        element: "h3",
    },
    {
        token: "h4",
        name: "Heading 4",
        mobilePx: 20,
        desktopPx: 24,
        weight: 600,
        tracking: "-0.01em",
        leading: "1.25",
        face: "display",
        sample: HEADING_SAMPLE,
        element: "h4",
    },
    {
        token: "h5",
        name: "Heading 5",
        mobilePx: 18,
        desktopPx: 22,
        weight: 600,
        tracking: "0",
        leading: "1.3",
        face: "display",
        sample: HEADING_SAMPLE,
        element: "h5",
    },
    {
        token: "h6",
        name: "Heading 6",
        mobilePx: 16,
        desktopPx: 20,
        weight: 600,
        tracking: "0",
        leading: "1.35",
        face: "display",
        sample: HEADING_SAMPLE,
        element: "h6",
    },
];

const BODY_SAMPLE =
    "Owners in your area are listing now. Send a request to represent and it lands in your pipeline once the owner approves — no manual re-entry, no retyping property details. Track every stage from first showing to closed deal in one place.";

export const BODY_SCALE: TypeScaleStep[] = [
    {
        token: "body-lg",
        name: "Body large",
        mobilePx: 16,
        desktopPx: 18,
        weight: 400,
        tracking: "0",
        leading: "1.55",
        face: "sans",
        sample: BODY_SAMPLE,
        element: "p",
    },
    {
        token: "body",
        name: "Body",
        mobilePx: 14,
        desktopPx: 16,
        weight: 400,
        tracking: "0",
        leading: "1.55",
        face: "sans",
        sample: BODY_SAMPLE,
        element: "p",
    },
    {
        token: "body-sm",
        name: "Body small",
        mobilePx: 12,
        desktopPx: 14,
        weight: 400,
        tracking: "0",
        leading: "1.45",
        face: "sans",
        sample: BODY_SAMPLE,
        element: "p",
    },
    {
        token: "body-xs",
        name: "Body extra small",
        mobilePx: 12,
        desktopPx: 12,
        weight: 400,
        tracking: "0",
        leading: "1.4",
        face: "sans",
        sample: BODY_SAMPLE,
        element: "p",
    },
];

export const SPECIAL_SCALE: TypeScaleStep[] = [
    {
        token: "eyebrow",
        name: "Eyebrow",
        mobilePx: 12,
        desktopPx: 12,
        weight: 600,
        tracking: "0.1em",
        leading: "1.2",
        face: "sans",
        sample: "NEXT SHOWING",
        element: "p",
    },
];
