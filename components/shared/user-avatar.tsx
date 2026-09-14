"use client";

import { useState } from "react";

import Avvvatars from "avvvatars-react";
import { cva, type VariantProps } from "class-variance-authority";

import { normalizeAvatarUrl } from "@/lib/auth/avatar";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";

/**
 * Outer frame carries ring + shadow (must not use overflow-hidden or the
 * shadow clips). Inner clip keeps the photo / avvatar circular.
 */
const avatarFrameVariants = cva(
    "relative inline-flex shrink-0 rounded-full bg-surface shadow-xs ring-1 ring-border-warm",
    {
        variants: {
            size: {
                /** 20px — tiny credit faces on dense cards. */
                xxs: "block-5 inline-5",
                /** 32px — buyer/owner rows on pipeline cards. */
                xs: "block-8 inline-8",
                sm: "block-9 inline-9",
                md: "block-10 inline-10",
                lg: "block-14 inline-14",
                fill: "block-full inline-full",
            },
        },
        defaultVariants: {
            size: "md",
        },
    },
);

const avatarMediaClass = "block-full inline-full object-cover object-center";

const avatarImageSizes = {
    xxs: "20px",
    xs: "32px",
    sm: "36px",
    md: "40px",
    lg: "56px",
    fill: "(max-width: 768px) 48px, 56px",
} as const;

/** Pixel sizes passed to avvvatars-react (it needs a number, not CSS). */
const avvatarPixelSizes = {
    xxs: 20,
    xs: 32,
    sm: 36,
    md: 40,
    lg: 56,
    /** Parent sets the box; we paint at 96 and stretch to fill. */
    fill: 96,
} as const;

/**
 * avvvatars paints a fixed-size wrapper (and hardcodes Inter + weight 500 on
 * character text). Stretch to fill our frame and force DM Sans semibold.
 */
const avvatarFillClass = cn(
    "[&>div]:block-full! [&>div]:inline-full! [&>div]:max-w-none! [&>div]:rounded-full!",
    "[&_p]:font-sans! [&_p]:font-semibold!",
);

function initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0][0] ?? "";
    const last = parts[parts.length - 1][0] ?? "";
    return `${first}${last}`.toUpperCase();
}

export type UserAvatarFallback = "shape" | "character";

export type UserAvatarProps = VariantProps<typeof avatarFrameVariants> & {
    name: string;
    imageUrl?: string;
    className?: string;
    /**
     * No-photo placeholder from `avvvatars-react`.
     * `shape` — unique abstract shape (product default).
     * `character` — initials; use in dense multi-person rows.
     */
    fallback?: UserAvatarFallback;
};

export function UserAvatar({
    name,
    imageUrl,
    size,
    className,
    fallback = "shape",
}: UserAvatarProps) {
    const resolvedImageUrl = normalizeAvatarUrl(imageUrl);
    // Track the URL that failed, not a flag, so a new src retries without an effect.
    const [failedImageUrl, setFailedImageUrl] = useState<string>();

    const resolvedSize = size ?? "md";
    const showPhoto = Boolean(resolvedImageUrl) && resolvedImageUrl !== failedImageUrl;
    const initials = initialsFromName(name);
    const displayValue =
        resolvedSize === "xxs" ? initials.slice(0, 1) : initials;

    return (
        <span className={cn(avatarFrameVariants({ size }), className)}>
            <span className="relative block overflow-hidden rounded-full block-full inline-full">
                {showPhoto && resolvedImageUrl ? (
                    <AppImage
                        src={resolvedImageUrl}
                        alt={name}
                        fill
                        sizes={avatarImageSizes[resolvedSize]}
                        quality={75}
                        unoptimized={!resolvedImageUrl.includes("googleusercontent.com")}
                        fallbackSrc={null}
                        className={avatarMediaClass}
                        onError={() => setFailedImageUrl(resolvedImageUrl)}
                    />
                ) : (
                    <span aria-hidden className={cn("block-full inline-full", avvatarFillClass)}>
                        <Avvvatars
                            value={name}
                            displayValue={fallback === "character" ? displayValue : undefined}
                            style={fallback === "character" ? "character" : "shape"}
                            size={avvatarPixelSizes[resolvedSize]}
                            shadow={false}
                        />
                    </span>
                )}
            </span>
        </span>
    );
}
