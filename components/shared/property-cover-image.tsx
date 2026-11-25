import type { CSSProperties, ReactNode } from "react";

import { PROPERTY_PLACEHOLDER_SRC } from "@/lib/media/property-placeholder";
import { cn } from "@/lib/utils";

import { AppImage, type AppImageProps } from "@/components/shared/app-image";
import { PropertyPlaceholderImage } from "@/components/shared/property-placeholder-image";

import styles from "./property-cover-image.module.css";

export type PropertyCoverImageProps = Omit<
    AppImageProps,
    "src" | "fill" | "width" | "height" | "sizes" | "className" | "style" | "children"
> & {
    /** Missing or failed photos show the property placeholder. */
    src?: AppImageProps["src"] | null;
    /** Square frame size in pixels, including the border. Defaults to 64. */
    size?: number;
    /** Set when responsive layout classes override the frame size. */
    sizes?: string;
    /** Layout classes for the frame. The component owns its visual treatment. */
    className?: string;
    /** Optional crop position, such as object-top. */
    imageClassName?: string;
    /** Optional photo-count badge inside the frame. */
    children?: ReactNode;
};

/** Square property cover with a shared white frame, rounded corners and soft shadow. */
export function PropertyCoverImage({
    src,
    alt,
    size = 64,
    sizes = `${size}px`,
    className,
    imageClassName,
    children,
    ...imageProps
}: PropertyCoverImageProps) {
    const hasImage = typeof src === "string" ? Boolean(src.trim()) : Boolean(src);

    return (
        <span
            className={cn(styles.frame, className)}
            style={{ "--property-cover-default-size": `${size}px` } as CSSProperties}
            role={!hasImage && alt ? "img" : undefined}
            aria-label={!hasImage && alt ? alt : undefined}
            aria-hidden={!hasImage && !alt ? true : undefined}
        >
            {hasImage && src ? (
                <AppImage
                    {...imageProps}
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    className={imageClassName}
                    fallbackSrc={PROPERTY_PLACEHOLDER_SRC}
                />
            ) : (
                <PropertyPlaceholderImage sizes={sizes} />
            )}
            {children}
        </span>
    );
}
