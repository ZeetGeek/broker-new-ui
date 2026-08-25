import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

export type AppImageProps = Omit<ImageProps, "alt"> & {
    /** Required — decorative images still pass an empty string explicitly. */
    alt: string;
};

/**
 * App-wide Next.js Image wrapper. Change defaults here (object-fit, sizes,
 * className, loading behaviour) so every photo picks them up in one edit.
 */
export function AppImage({ alt, className, sizes = "100vw", ...props }: AppImageProps) {
    return (
        <Image
            alt={alt}
            sizes={sizes}
            className={cn("object-cover", className)}
            {...props}
        />
    );
}
