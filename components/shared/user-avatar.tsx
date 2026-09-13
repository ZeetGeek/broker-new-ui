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
    /** Initials for pipeline cards; marble stays the default elsewhere. */
    fallback?: "marble" | "initials";
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
