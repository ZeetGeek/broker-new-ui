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
const avatarFrameVariants = cva("relative inline-flex shrink-0 rounded-full bg-surface", {
    variants: {
        size: {
            /** 20px — tiny credit faces on dense cards. */
            xxs: "block-5 inline-5",
            /** 24px — buyer/owner rows on pipeline board cards. */
            "2xs": "block-6 inline-6",
            /** 32px — buyer/owner rows on pipeline cards. */
            xs: "block-8 inline-8",
            sm: "block-9 inline-9",
            md: "block-10 inline-10",
            lg: "block-14 inline-14",
            fill: "block-full inline-full",
        },
        /**
         * `true` — product default ring + soft shadow.
         * `false` — bare circle (detail headers that sit on a white surface).
         */
        framed: {
            true: "shadow-xs ring-1 ring-border-warm",
            false: "shadow-none ring-0",
        },
    },
    defaultVariants: {
        size: "md",
        framed: true,
    },
});

const avatarMediaClass = "block-full inline-full object-cover object-center";

const avatarImageSizes = {
    xxs: "20px",
    "2xs": "24px",
    xs: "32px",
    sm: "36px",
    md: "40px",
    lg: "56px",
    fill: "(max-width: 768px) 48px, 56px",
} as const;

/** Pixel sizes passed to avvvatars-react (it needs a number, not CSS). */
const avvatarPixelSizes = {
    xxs: 20,
    "2xs": 24,
    xs: 32,
    sm: 36,
    md: 40,
    lg: 56,
    /** Parent sets the box; we paint at 96 and stretch to fill. */
    fill: 96,
} as const;

/** Stretch avvvatars' fixed-size wrapper to fill our frame. */
const avvatarFillClass = cn(
    "[&>div]:rounded-full! [&>div]:block-full! [&>div]:inline-full! [&>div]:max-inline-none!",
);

export type UserAvatarProps = VariantProps<typeof avatarFrameVariants> & {
    name: string;
    imageUrl?: string;
    className?: string;
};

export function UserAvatar({ name, imageUrl, size, framed = true, className }: UserAvatarProps) {
    const resolvedImageUrl = normalizeAvatarUrl(imageUrl);
    // Track the URL that failed, not a flag, so a new src retries without an effect.
    const [failedImageUrl, setFailedImageUrl] = useState<string>();

    const resolvedSize = size ?? "md";
    const showPhoto = Boolean(resolvedImageUrl) && resolvedImageUrl !== failedImageUrl;

    return (
        <span className={cn(avatarFrameVariants({ size, framed }), className)}>
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
                            style="shape"
                            size={avvatarPixelSizes[resolvedSize]}
                            shadow={false}
                        />
                    </span>
                )}
            </span>
        </span>
    );
}
