export type LogoColorVariant = {
    name: string;
    fillClass: string;
    surfaceClass: string;
    token: string;
    hex: string;
    usage: string;
};

export type LogoAppIconVariant = {
    name: string;
    fillClass: string;
    surfaceClass: string;
    usage: string;
};

export const LOGO_MIN_SIZE_PX = 32;

export const LOGO_COMPONENT_VARIANTS = [
    {
        name: "default",
        note: "Light chrome. Brand-ink mark, ink wordmark.",
        surfaceClass: "border border-border-warm bg-surface",
    },
    {
        name: "inverse",
        note: "Dark chrome, quiet. Canvas mark and wordmark.",
        surfaceClass: "bg-brand-deep",
    },
    {
        name: "accent",
        note: "Dark chrome, the one that leads. Highlight mark, white wordmark.",
        surfaceClass: "bg-brand-deep",
    },
] as const;

export const LOGO_COLOR_VARIANTS: LogoColorVariant[] = [
    {
        name: "Brand ink",
        fillClass: "text-brand-ink",
        surfaceClass: "bg-canvas",
        token: "brand-ink",
        hex: "#0B1F17",
        usage: "Preferred mark on canvas. Headers, auth, wordmark.",
    },
    {
        name: "Ink",
        fillClass: "text-ink",
        surfaceClass: "bg-surface",
        token: "ink",
        hex: "#191C1A",
        usage: "On white cards, when the mark must match body text.",
    },
    {
        name: "Brand",
        fillClass: "text-brand",
        surfaceClass: "bg-canvas",
        token: "brand",
        hex: "#1B7A5A",
        usage: "Active state. Same green as prices and nav.",
    },
    {
        name: "Inverse",
        fillClass: "text-canvas",
        surfaceClass: "bg-brand-deep",
        token: "canvas",
        hex: "#EFEAE0",
        usage: "On dark attention cards. Canvas cream, not pure white.",
    },
    {
        name: "Highlight",
        fillClass: "text-highlight",
        surfaceClass: "bg-brand-deep",
        token: "highlight",
        hex: "#C9F24D",
        usage: "App icon and splash. Lime never sits on cream.",
    },
];

export const LOGO_APP_ICONS: LogoAppIconVariant[] = [
    {
        name: "App icon",
        fillClass: "text-highlight",
        surfaceClass: "bg-brand-deep",
        usage: "Default. Brand-deep field, highlight mark.",
    },
    {
        name: "Quiet",
        fillClass: "text-canvas",
        surfaceClass: "bg-brand-ink",
        usage: "Lower contrast. Auth splash, loading.",
    },
    {
        name: "Soft",
        fillClass: "text-brand-ink",
        surfaceClass: "bg-brand-soft",
        usage: "Tinted chip. Profile, settings header.",
    },
];

export const LOGO_SIZES_PX = [32, 48, 64, 96, 128] as const;

export const LOGO_SOURCE_FILES = [
    {
        file: "public/logo/yes-broker-logo.svg",
        fill: "brand-ink #0B1F17",
        usage: "Default mark. Inline via Logo from components/shared/logo.tsx.",
    },
    {
        file: "public/logo/yes-broker-logo-brand.svg",
        fill: "brand #1B7A5A",
        usage: "Static mid-green mark for <img> tags.",
    },
    {
        file: "public/logo/yes-broker-logo-inverse.svg",
        fill: "canvas #EFEAE0",
        usage: "Static inverse for dark fields.",
    },
    {
        file: "public/logo/yes-broker-app-icon.svg",
        fill: "highlight on brand-deep",
        usage: "Square app icon. Favicon, PWA, splash.",
    },
] as const;
