"use client";

import { useState } from "react";

import BoringAvatar from "boring-avatars";
import { cva, type VariantProps } from "class-variance-authority";

import { normalizeAvatarUrl } from "@/lib/auth/avatar";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";

const avatarVariants = cva("relative block overflow-hidden rounded-full", {
    variants: {
        size: {
            /** 16px — the tiny "Handled by" credit avatar on a pipeline card. */
            xxs: "block-4 inline-4",
            /** 28px — the two-party (buyer/owner) rows on a pipeline card. */
            xs: "block-7 inline-7",
            sm: "block-control-sm inline-control-sm",
            md: "block-control-md inline-control-md",
            lg: "block-control-xl inline-control-xl",
            fill: "block-full inline-full",
        },
    },
    defaultVariants: {
        size: "md",
    },
});

const avatarMediaClass = "block-full inline-full object-cover object-center";

const avatarSizes = {
    xxs: "16px",
    xs: "28px",
    sm: "32px",
    md: "40px",
    lg: "48px",
    fill: "(max-width: 768px) 40px, 48px",
} as const;

/**
 * boring-avatars renders a raw <svg>, where `object-cover` does nothing. It needs
 * explicit 100% sizing plus a slice aspect ratio to fill the round frame.
 */
const avatarSvgClass = "block-full! inline-full!";

/** Palette handed to boring-avatars; it picks deterministically from `name`. */
const avatarPalette = ["#F97316", "#FACC15", "#0F172A", "#38BDF8", "#F43F5E"];

/**
 * Muted, low-saturation pairs for the `initials-color` fallback — a stable
 * per-person identity colour (pipeline buyer/owner rows) rather than a brand
 * colour, so it deliberately sits outside the one-hue brand palette the same
 * way `avatarPalette` above already does for the marble fallback.
 */
const mutedInitialsPalette = [
    { bg: "#E4E1F5", text: "#423F82" }, // violet
    { bg: "#E3EEE9", text: "#285C48" }, // teal-green
    { bg: "#F3E5D8", text: "#7A4E22" }, // terracotta
    { bg: "#E6EAF2", text: "#34496B" }, // denim
    { bg: "#F1E3E8", text: "#7C4055" }, // rose
    { bg: "#EDEAD9", text: "#5C5C2E" }, // olive
    { bg: "#E0ECEF", text: "#2F5F6C" }, // slate-teal
    { bg: "#EFE3E3", text: "#7A4438" }, // brick
] as const;

function mutedColorFromName(name: string): { bg: string; text: string } {
    const key = name.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return mutedInitialsPalette[hash % mutedInitialsPalette.length];
}

function initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0][0] ?? "";
    const last = parts[parts.length - 1][0] ?? "";
    return `${first}${last}`.toUpperCase();
}

export type UserAvatarProps = VariantProps<typeof avatarVariants> & {
    name: string;
    imageUrl?: string;
    className?: string;
    /**
     * Initials for pipeline cards; marble stays the default elsewhere.
     * `initials-color` is the same initials glyph on a stable, muted,
     * per-name background — for rows where several different people
     * (buyer, owner, teammate) appear together and need to stay visually
     * distinct without resorting to random gradients.
     */
    fallback?: "marble" | "initials" | "initials-color";
};

export function UserAvatar({
    name,
    imageUrl,
    size,
    className,
    fallback = "marble",
}: UserAvatarProps) {
    const resolvedImageUrl = normalizeAvatarUrl(imageUrl);
    // Track the URL that failed, not a flag, so a new src retries without an effect.
    const [failedImageUrl, setFailedImageUrl] = useState<string>();

    const showPhoto = Boolean(resolvedImageUrl) && resolvedImageUrl !== failedImageUrl;

    return (
        <span className={cn(avatarVariants({ size }), className)}>
            {showPhoto && resolvedImageUrl ? (
                <AppImage
                    src={resolvedImageUrl}
                    alt={name}
                    fill
                    sizes={avatarSizes[size ?? "md"]}
                    quality={75}
                    unoptimized={!resolvedImageUrl.includes("googleusercontent.com")}
                    fallbackSrc={null}
                    className={avatarMediaClass}
                    onError={() => setFailedImageUrl(resolvedImageUrl)}
                />
            ) : fallback === "initials" ? (
                <span
                    aria-hidden
                    className="
                      body-xs flex items-center justify-center bg-brand-soft font-semibold
                      text-brand-text block-full inline-full
                    "
                >
                    {initialsFromName(name)}
                </span>
            ) : fallback === "initials-color" ? (
                (() => {
                    const { bg, text } = mutedColorFromName(name);
                    const glyph =
                        size === "xxs"
                            ? initialsFromName(name).slice(0, 1)
                            : initialsFromName(name);
                    return (
                        <span
                            aria-hidden
                            style={{ backgroundColor: bg, color: text }}
                            className="
                              body-xs flex items-center justify-center font-semibold block-full
                              inline-full
                            "
                        >
                            {glyph}
                        </span>
                    );
                })()
            ) : (
                <BoringAvatar
                    name={name}
                    variant="marble"
                    colors={avatarPalette}
                    square
                    size="100%"
                    preserveAspectRatio="xMidYMid slice"
                    className={avatarSvgClass}
                />
            )}
        </span>
    );
}
