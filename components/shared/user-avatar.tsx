"use client";

import { useState } from "react";

import Avvvatars from "avvvatars-react";

import { normalizeAvatarUrl } from "@/lib/auth/avatar";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";

/**
 * The ONE avatar size table for the whole app.
 *
 * To resize an avatar step everywhere, edit its row here — nothing else.
 * - `box`    Tailwind classes for the frame (must be static strings).
 * - `frame`  White border + soft shadow, scaled to the size so small faces
 *            stay crisp and large faces get a little more lift.
 * - `px`     Pixel size painted by avvvatars-react (needs a number).
 * - `sizes`  `sizes` hint for the photo so the browser picks a small file.
 */
export const AVATAR_SIZES = {
    /** 20px — tiny credit faces on dense cards. */
    xxs: { box: "block-5 inline-5", frame: "ring-1 shadow-xs", px: 20, sizes: "20px" },
    /** 24px — inline people rows on board cards. */
    "2xs": { box: "block-6 inline-6", frame: "ring-1 shadow-xs", px: 24, sizes: "24px" },
    /** 32px — buyer/owner rows on pipeline cards. */
    xs: { box: "block-8 inline-8", frame: "ring-2 shadow-xs", px: 32, sizes: "32px" },
    /** 36px — list rows, pickers. */
    sm: { box: "block-9 inline-9", frame: "ring-2 shadow-sm", px: 36, sizes: "36px" },
    /** 40px — header account button, card headers. */
    md: { box: "block-10 inline-10", frame: "ring-2 shadow-sm", px: 40, sizes: "40px" },
    /** 48px — contact card headers. */
    card: { box: "block-12 inline-12", frame: "ring-2 shadow-sm", px: 48, sizes: "48px" },
    /** 56px — profile / detail headers. */
    lg: { box: "block-14 inline-14", frame: "ring-3 shadow-md", px: 56, sizes: "56px" },
    /** Parent sets the box; we paint at 96 and stretch to fill. */
    fill: {
        box: "block-full inline-full",
        frame: "ring-3 shadow-md",
        px: 96,
        sizes: "(max-width: 768px) 48px, 56px",
    },
} as const;

export type UserAvatarSize = keyof typeof AVATAR_SIZES;

/** Colour of the size-scaled border. Width + shadow come from `AVATAR_SIZES`. */
const FRAME_RING_CLASS = "ring-surface";

/** Stretch avvvatars' fixed-size wrapper to fill our frame. */
const AVATAR_FILL_CLASS =
    "[&>div]:rounded-full! [&>div]:block-full! [&>div]:inline-full! [&>div]:max-inline-none!";

export type UserAvatarProps = {
    name: string;
    imageUrl?: string;
    /** Browser-created object URL for an unsaved photo preview. Caller owns cleanup. */
    previewUrl?: string;
    /** Size step from `AVATAR_SIZES`. Defaults to `md` (40px). */
    size?: UserAvatarSize | null;
    /**
     * `true` (default) — white border + soft shadow for a lifted look.
     * `false` — bare circle, for faces packed inside dense rows.
     */
    framed?: boolean | null;
    className?: string;
};

/**
 * Circular face for a person. Shows the photo when there is one, otherwise a
 * generated shape avatar seeded by `name`. Use this everywhere — never
 * hand-roll an avatar.
 *
 * Outer frame carries ring + shadow (no overflow-hidden, or the shadow clips).
 * Inner span clips the photo / generated avatar to a circle.
 */
export function UserAvatar({
    name,
    imageUrl,
    previewUrl,
    size,
    framed,
    className,
}: UserAvatarProps) {
    const resolvedImageUrl = previewUrl?.startsWith("blob:")
        ? previewUrl
        : normalizeAvatarUrl(imageUrl);
    // Track the URL that failed, not a flag, so a new src retries without an effect.
    const [failedImageUrl, setFailedImageUrl] = useState<string>();

    const step = AVATAR_SIZES[size ?? "md"];
    const showPhoto = Boolean(resolvedImageUrl) && resolvedImageUrl !== failedImageUrl;

    return (
        <span
            className={cn(
                "relative inline-flex shrink-0 rounded-full bg-surface",
                step.box,
                framed !== false && [FRAME_RING_CLASS, step.frame],
                className,
            )}
        >
            <span className="relative block overflow-hidden rounded-full block-full inline-full">
                {showPhoto && resolvedImageUrl ? (
                    <AppImage
                        src={resolvedImageUrl}
                        alt={name}
                        fill
                        sizes={step.sizes}
                        quality={75}
                        unoptimized={!resolvedImageUrl.includes("googleusercontent.com")}
                        fallbackSrc={null}
                        className="object-cover object-center block-full inline-full"
                        onError={() => setFailedImageUrl(resolvedImageUrl)}
                    />
                ) : (
                    <span aria-hidden className={cn("block-full inline-full", AVATAR_FILL_CLASS)}>
                        <Avvvatars value={name} style="shape" size={step.px} shadow={false} />
                    </span>
                )}
            </span>
        </span>
    );
}
