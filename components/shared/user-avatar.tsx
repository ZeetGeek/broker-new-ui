"use client";

import { useState } from "react";

import Avvvatars from "avvvatars-react";
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

const avatarImageSizes = {
    xxs: "16px",
    xs: "28px",
    sm: "32px",
    md: "36px",
    lg: "48px",
    fill: "(max-width: 768px) 40px, 48px",
} as const;

/** Pixel sizes passed to avvvatars-react (it needs a number, not CSS). */
const avvatarPixelSizes = {
    xxs: 16,
    xs: 28,
    sm: 32,
    md: 36,
    lg: 48,
    /** Parent sets the box; we paint at 80 and stretch to fill. */
    fill: 80,
} as const;

/**
 * avvvatars paints a fixed-size wrapper. Force it to fill our round frame when
 * the parent uses `size="fill"` or a one-off className size.
 */
const avvatarFillClass =
    "[&>div]:block-full! [&>div]:inline-full! [&>div]:max-w-none! [&>div]:rounded-full!";

function initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    const first = parts[0][0] ?? "";
    const last = parts[parts.length - 1][0] ?? "";
    return `${first}${last}`.toUpperCase();
}

export type UserAvatarFallback = "shape" | "character";

export type UserAvatarProps = VariantProps<typeof avatarVariants> & {
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
        <span className={cn(avatarVariants({ size }), className)}>
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
    );
}
