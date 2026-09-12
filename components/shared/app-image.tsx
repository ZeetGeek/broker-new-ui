"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

import { cn } from "@/lib/utils";

const DEFAULT_QUALITY = 80;

// A tiny neutral placeholder is cheaper than shipping a placeholder file for
// every API image and avoids a white flash while remote property photos load.
const DEFAULT_BLUR_DATA_URL =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='12'%3E%3Cpath fill='%23e9e7e2' d='M0 0h16v12H0z'/%3E%3C/svg%3E";
const TRANSPARENT_FALLBACK = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

type ImageSource = ImageProps["src"];

export type AppImageProps = Omit<ImageProps, "alt" | "src"> & {
    /** Required — decorative images still pass an empty string explicitly. */
    alt: string;
    src: ImageSource;
    /** Replaces a failed image. `null` keeps the browser's normal error state. */
    fallbackSrc?: ImageSource | null;
};

function sourceKey(src: ImageSource): string {
    if (typeof src === "string") return src;
    return "default" in src ? src.default.src : src.src;
}

function shouldBypassOptimizer(src: ImageSource): boolean {
    if (typeof src !== "string") return false;
    const cleanSrc = src.split(/[?#]/, 1)[0]?.toLowerCase() ?? "";
    return src.startsWith("blob:") || src.startsWith("data:") || cleanSrc.endsWith(".svg");
}

function supportsBlurPlaceholder(src: ImageSource): boolean {
    if (typeof src !== "string") {
        return Boolean("default" in src ? src.default.blurDataURL : src.blurDataURL);
    }
    return !shouldBypassOptimizer(src);
}

/**
 * App-wide Next.js Image wrapper. It centralizes modern format delivery via
 * Next, lazy loading, async decoding, a lightweight blur placeholder, quality,
 * and a non-broken fallback. Fill images must still provide an honest `sizes`
 * value because only the caller knows their rendered width.
 */
export function AppImage({
    alt,
    src,
    fallbackSrc = TRANSPARENT_FALLBACK,
    className,
    quality,
    placeholder,
    blurDataURL,
    preload,
    priority,
    loading,
    decoding = "async",
    unoptimized,
    onError,
    ...props
}: AppImageProps) {
    // Store the URL that failed so a changed `src` automatically gets a retry.
    const [failedSource, setFailedSource] = useState<string>();
    const originalSourceKey = sourceKey(src);
    const useFallback = failedSource === originalSourceKey && fallbackSrc !== null;
    const resolvedSrc = useFallback ? fallbackSrc : src;
    const bypassOptimizer = unoptimized ?? shouldBypassOptimizer(resolvedSrc);
    const shouldPreload = preload ?? priority ?? false;
    const resolvedPlaceholder =
        placeholder ?? (supportsBlurPlaceholder(resolvedSrc) ? "blur" : "empty");

    return (
        <Image
            alt={alt}
            src={resolvedSrc}
            quality={quality ?? DEFAULT_QUALITY}
            placeholder={resolvedPlaceholder}
            blurDataURL={
                resolvedPlaceholder === "blur" ? (blurDataURL ?? DEFAULT_BLUR_DATA_URL) : undefined
            }
            preload={shouldPreload}
            loading={shouldPreload ? undefined : (loading ?? "lazy")}
            decoding={decoding}
            unoptimized={bypassOptimizer}
            className={cn("object-cover", className)}
            onError={(event) => {
                if (!useFallback && fallbackSrc !== null) setFailedSource(originalSourceKey);
                onError?.(event);
            }}
            {...props}
        />
    );
}
