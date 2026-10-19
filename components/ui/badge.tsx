import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Flat pill. Fill is Tailwind 200, text is 700, the leading dot is 600.
 * `stone` is the quiet default.
 */
const BADGE_COLORS = [
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "stone",
] as const;

type BadgeColor = (typeof BADGE_COLORS)[number];

type BadgeCustomColor = {
    bg: string;
    text: string;
    dot: string;
};

/** Old names, kept so existing call sites compile. Next pass switches them to `color`. */
const LEGACY_VARIANT_COLOR = {
    brand: "emerald",
    urgent: "orange",
    danger: "red",
    neutral: "stone",
    outline: "stone",
} as const;

type LegacyBadgeVariant = keyof typeof LEGACY_VARIANT_COLOR;

const badgeColorVariants = cva(
    `
      body-xs inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold
      tracking-wide whitespace-nowrap
      [&_svg]:pointer-events-none [&_svg]:shrink-0
      [&_svg:not([class*='size-'])]:block-3 [&_svg:not([class*='size-'])]:inline-3
    `,
    {
        variants: {
            color: {
                red: "bg-red-200 text-red-700 [--badge-dot:var(--color-red-600)]",
                orange: "bg-orange-200 text-orange-700 [--badge-dot:var(--color-orange-600)]",
                amber: "bg-amber-200 text-amber-700 [--badge-dot:var(--color-amber-600)]",
                yellow: "bg-yellow-200 text-yellow-700 [--badge-dot:var(--color-yellow-600)]",
                lime: "bg-lime-200 text-lime-700 [--badge-dot:var(--color-lime-600)]",
                green: "bg-green-200 text-green-700 [--badge-dot:var(--color-green-600)]",
                emerald: "bg-emerald-200 text-emerald-700 [--badge-dot:var(--color-emerald-600)]",
                teal: "bg-teal-200 text-teal-700 [--badge-dot:var(--color-teal-600)]",
                cyan: "bg-cyan-200 text-cyan-700 [--badge-dot:var(--color-cyan-600)]",
                sky: "bg-sky-200 text-sky-700 [--badge-dot:var(--color-sky-600)]",
                blue: "bg-blue-200 text-blue-700 [--badge-dot:var(--color-blue-600)]",
                indigo: "bg-indigo-200 text-indigo-700 [--badge-dot:var(--color-indigo-600)]",
                violet: "bg-violet-200 text-violet-700 [--badge-dot:var(--color-violet-600)]",
                purple: "bg-purple-200 text-purple-700 [--badge-dot:var(--color-purple-600)]",
                stone: "bg-stone-200 text-stone-700 [--badge-dot:var(--color-stone-600)]",
            },
        },
        defaultVariants: {
            color: "stone",
        },
    },
);

/** Same glass as the photo menu button: ink at 30%, light type, blur. */
const BADGE_BLUR_DARK_CLASS = "bg-ink/30 text-surface backdrop-blur-md";

/** Lighter dot so the hue still reads on the dark glass. Solid pills stay on 600. */
const BADGE_BLUR_DARK_DOT: Record<BadgeColor, string> = {
    red: "[--badge-dot:var(--color-red-300)]",
    orange: "[--badge-dot:var(--color-orange-300)]",
    amber: "[--badge-dot:var(--color-amber-300)]",
    yellow: "[--badge-dot:var(--color-yellow-300)]",
    lime: "[--badge-dot:var(--color-lime-300)]",
    green: "[--badge-dot:var(--color-green-300)]",
    emerald: "[--badge-dot:var(--color-emerald-300)]",
    teal: "[--badge-dot:var(--color-teal-300)]",
    cyan: "[--badge-dot:var(--color-cyan-300)]",
    sky: "[--badge-dot:var(--color-sky-300)]",
    blue: "[--badge-dot:var(--color-blue-300)]",
    indigo: "[--badge-dot:var(--color-indigo-300)]",
    violet: "[--badge-dot:var(--color-violet-300)]",
    purple: "[--badge-dot:var(--color-purple-300)]",
    stone: "[--badge-dot:var(--color-stone-300)]",
};

/** Translucent tint. Dot and type stay on the hue. */
const BADGE_BLUR_CLASS: Record<BadgeColor, string> = {
    red: "bg-red-200/80 backdrop-blur-md",
    orange: "bg-orange-200/80 backdrop-blur-md",
    amber: "bg-amber-200/80 backdrop-blur-md",
    yellow: "bg-yellow-200/80 backdrop-blur-md",
    lime: "bg-lime-200/80 backdrop-blur-md",
    green: "bg-green-200/80 backdrop-blur-md",
    emerald: "bg-emerald-200/80 backdrop-blur-md",
    teal: "bg-teal-200/80 backdrop-blur-md",
    cyan: "bg-cyan-200/80 backdrop-blur-md",
    sky: "bg-sky-200/80 backdrop-blur-md",
    blue: "bg-blue-200/80 backdrop-blur-md",
    indigo: "bg-indigo-200/80 backdrop-blur-md",
    violet: "bg-violet-200/80 backdrop-blur-md",
    purple: "bg-purple-200/80 backdrop-blur-md",
    stone: "bg-stone-200/80 backdrop-blur-md",
};

function resolveBadgeColor(color?: BadgeColor | null, variant?: LegacyBadgeVariant | null) {
    if (color) return color;
    if (variant) return LEGACY_VARIANT_COLOR[variant];
    return "stone" as const;
}

function blurClass(blur: boolean | "dark" | undefined, color: BadgeColor) {
    if (blur === "dark") return cn(BADGE_BLUR_DARK_CLASS, BADGE_BLUR_DARK_DOT[color]);
    if (blur) return BADGE_BLUR_CLASS[color];
    return undefined;
}

function badgeVariants({
    color,
    variant,
    blur = false,
    className,
}: {
    color?: BadgeColor;
    variant?: LegacyBadgeVariant;
    blur?: boolean | "dark";
    className?: string;
} = {}) {
    const resolved = resolveBadgeColor(color, variant);
    return cn(badgeColorVariants({ color: resolved }), blurClass(blur, resolved), className);
}

function Badge({
    className,
    color,
    variant,
    blur = false,
    pulse = false,
    customColor,
    children,
    style,
    ...props
}: React.ComponentProps<"span"> &
    Omit<VariantProps<typeof badgeColorVariants>, "color"> & {
        color?: BadgeColor;
        variant?: LegacyBadgeVariant;
        /** `true` tints the fill. `"dark"` matches the photo menu: ink glass, light type. */
        blur?: boolean | "dark";
        /** Ping the dot. Fresh or waiting-on-you only. */
        pulse?: boolean;
        customColor?: BadgeCustomColor;
    }) {
    const customStyle = customColor
        ? ({
              backgroundColor: customColor.bg,
              color: customColor.text,
              "--badge-dot": customColor.dot,
          } as React.CSSProperties)
        : undefined;

    return (
        <span
            data-slot="badge"
            data-blur={blur ? "" : undefined}
            className={cn(badgeVariants({ color, variant, blur }), className)}
            style={{ ...customStyle, ...style }}
            {...props}
        >
            <span aria-hidden className="relative flex shrink-0">
                {pulse ? (
                    <span
                        className="
                          absolute inset-0 rounded-full bg-(--badge-dot)
                          motion-safe:animate-ping
                        "
                    />
                ) : null}
                <span
                    data-slot="badge-dot"
                    className="relative shrink-0 rounded-full bg-(--badge-dot) block-1.5 inline-1.5"
                />
            </span>
            {children}
        </span>
    );
}

export { Badge, BADGE_COLORS, badgeVariants };
export type { BadgeColor, BadgeCustomColor };
