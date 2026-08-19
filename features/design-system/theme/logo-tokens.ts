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

export const LOGO_MARK_PATH =
    "M306.134 99.4369L210.053 4.06545C204.585 -1.35515 195.778 -1.35515 190.311 4.06545L146.466 47.6208L0 191.899L19.5346 211.78L49.3987 182.356V258.972C49.3987 266.713 55.6796 273 63.4138 273H137.797C141.483 273 145.03 271.545 147.66 268.948L189.826 227.176C195.276 221.773 204.049 221.773 209.516 227.159L251.89 268.965C254.503 271.545 258.05 273 261.735 273H337.036C344.77 273 351.051 266.713 351.051 258.972V182.789L380.465 211.763L400 191.881L306.134 99.4369ZM321.447 229.358C321.447 237.099 315.166 243.386 307.431 243.386H273.865C270.179 243.386 266.649 241.931 264.019 239.351L236.318 212.023H276.719C281.893 212.023 286.08 207.832 286.08 202.636V191.76C286.08 186.582 281.893 182.391 276.719 182.391H235.038L263.05 154.63C268.553 149.175 268.605 140.308 263.154 134.801L262.047 133.692C256.597 128.185 247.738 128.133 242.236 133.588L214.967 160.605V121.292C214.967 115.491 210.26 110.78 204.464 110.78H195.882C190.086 110.78 185.379 115.491 185.379 121.292V161.782L159.218 135.978C153.698 130.54 144.84 130.61 139.407 136.117L138.299 137.243C132.866 142.767 132.935 151.634 138.438 157.072L164.115 182.408H123.021C117.848 182.408 113.643 186.599 113.643 191.778V202.653C113.643 207.832 117.83 212.04 123.021 212.04H163.042L135.479 239.351C132.849 241.948 129.319 243.403 125.616 243.403H93.0011C85.2669 243.403 78.9861 237.117 78.9861 229.375V162.215C78.9861 158.475 80.4741 154.89 83.1214 152.257L190.293 45.8197C195.761 40.3991 204.568 40.3991 210.036 45.8197L317.277 152.257C319.924 154.89 321.429 158.475 321.429 162.215V229.358H321.447Z";

export const LOGO_VIEWBOX_WIDTH = 400;
export const LOGO_VIEWBOX_HEIGHT = 273;
export const LOGO_MIN_SIZE_PX = 32;

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
        usage: "Default mark. Inline via LogoMark when the fill must follow the theme.",
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
