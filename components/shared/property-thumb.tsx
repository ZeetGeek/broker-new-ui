import { PROPERTY_PLACEHOLDER_SRC } from "@/lib/media/property-placeholder";
import { cn } from "@/lib/utils";

import { AppImage } from "./app-image";
import { HoverScaleMedia } from "./hover-scale-media";
import { PropertyPlaceholderImage } from "./property-placeholder-image";

const THUMB_FRAME = `relative shrink-0 overflow-hidden rounded-[8px] bg-surface-muted`;

/** Default frame size. Replaced wholesale by `sizeClassName`, never merged. */
const THUMB_SIZE = `block-14 inline-18 sm:block-18 sm:inline-22`;

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
    /**
     * Zoom the photo on hover. Off on dense surfaces (the pipeline board),
     * where a card under the cursor should change colour, not move.
     */
    hoverScale?: boolean;
    /**
     * Replaces the default frame size outright. Use this rather than passing
     * `block-*` / `inline-*` through `className`: tailwind-merge does not know
     * those share an axis with the defaults, so both would survive and the
     * default would win. See the `inline-auto` note in app/globals.css.
     */
    sizeClassName?: string;
};

/**
 * Compact property photo used in dashboard list rows.
 * Missing or failed src shows the brand property placeholder.
 */
export function PropertyThumb({
    src,
    alt,
    className,
    priority = false,
    sizes = "(max-width: 640px) 72px, 88px",
    hoverScale = true,
    sizeClassName,
}: PropertyThumbProps) {
    const frame = cn(THUMB_FRAME, sizeClassName ?? THUMB_SIZE);
    if (!src?.trim()) {
        return (
            <span className={cn(frame, className)} aria-hidden>
                <PropertyPlaceholderImage sizes={sizes} />
            </span>
        );
    }

    const image = (
        <AppImage
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            fallbackSrc={PROPERTY_PLACEHOLDER_SRC}
        />
    );

    return (
        <span className={cn(frame, className)}>
            {hoverScale ? (
                <HoverScaleMedia className="absolute inset-0">{image}</HoverScaleMedia>
            ) : (
                image
            )}
        </span>
    );
}
