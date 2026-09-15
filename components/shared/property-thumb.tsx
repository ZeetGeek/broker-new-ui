import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { AppImage } from "./app-image";
import { HoverScaleMedia } from "./hover-scale-media";

const THUMB_FRAME = `
  relative shrink-0 overflow-hidden rounded-inner bg-surface-muted
  block-14 inline-18 sm:block-18 sm:inline-22
`;

export type PropertyThumbProps = {
    /** Public path or absolute URL. Omit / null shows the missing-photo state. */
    src?: string | null;
    alt: string;
    className?: string;
    /** First visible thumb on a page — mark for LCP. */
    priority?: boolean;
    /**
     * Rendered width, for the optimizer. Pass this whenever `className`
     * overrides the default frame size — otherwise Next picks a candidate for
     * the default width and the photo renders soft on a dense display.
     */
    sizes?: string;
    /** Glyph size for the missing-photo state, matched to the frame. */
    iconClassName?: string;
    /**
     * Zoom the photo on hover. Off on dense surfaces (the pipeline board),
     * where a card under the cursor should change colour, not move.
     */
    hoverScale?: boolean;
};

/**
 * Compact property photo used in dashboard list rows.
 * Missing src keeps the designed muted placeholder (not a broken image).
 */
export function PropertyThumb({
    src,
    alt,
    className,
    priority = false,
    sizes = "(max-width: 640px) 72px, 88px",
    iconClassName = "block-5 inline-5",
    hoverScale = true,
}: PropertyThumbProps) {
    if (!src) {
        return (
            <span
                className={cn(
                    THUMB_FRAME,
                    "flex items-center justify-center text-ink-subtle",
                    className,
                )}
                aria-hidden
            >
                <Building2 className={iconClassName} strokeWidth={1.75} />
            </span>
        );
    }

    const image = <AppImage src={src} alt={alt} fill sizes={sizes} priority={priority} />;

    return (
        <span className={cn(THUMB_FRAME, className)}>
            {hoverScale ? (
                <HoverScaleMedia className="absolute inset-0">{image}</HoverScaleMedia>
            ) : (
                image
            )}
        </span>
    );
}
