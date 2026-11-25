import { PROPERTY_PLACEHOLDER_SRC } from "@/lib/media/property-placeholder";
import { cn } from "@/lib/utils";

import { AppImage } from "./app-image";

export type PropertyPlaceholderImageProps = {
    /** Rendered width hint for the optimizer — match the frame it fills. */
    sizes: string;
    /** Describe the property when the frame stands in for its photo; "" when decorative. */
    alt?: string;
    className?: string;
    priority?: boolean;
};

/**
 * Fills its (positioned) parent with the brand property placeholder.
 * Use wherever a property photo is missing instead of an icon + "No photos".
 */
export function PropertyPlaceholderImage({
    sizes,
    alt = "",
    className,
    priority = false,
}: PropertyPlaceholderImageProps) {
    return (
        <AppImage
            src={PROPERTY_PLACEHOLDER_SRC}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            fallbackSrc={null}
            draggable={false}
            className={cn("object-cover", className)}
        />
    );
}
