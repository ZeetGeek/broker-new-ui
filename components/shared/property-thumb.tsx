import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { AppImage } from "./app-image";

const THUMB_FRAME = `
  relative shrink-0 overflow-hidden rounded-inner bg-surface-muted
  block-12 inline-16 sm:block-16 sm:inline-20
`;

export type PropertyThumbProps = {
    /** Public path or absolute URL. Omit / null shows the missing-photo state. */
    src?: string | null;
    alt: string;
    className?: string;
    /** First visible thumb on a page — mark for LCP. */
    priority?: boolean;
};

/**
 * Compact property photo used in dashboard list rows.
 * Missing src keeps the designed muted placeholder (not a broken image).
 */
export function PropertyThumb({ src, alt, className, priority = false }: PropertyThumbProps) {
    if (!src) {
        return (
            <span
                className={cn(
                    THUMB_FRAME,
                    "flex items-center justify-center text-ink-muted",
                    className,
                )}
                aria-hidden
            >
                <Building2 className="block-5 inline-5" strokeWidth={1.75} />
            </span>
        );
    }

    return (
        <span className={cn(THUMB_FRAME, className)}>
            <AppImage
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 640px) 64px, 80px"
                priority={priority}
            />
        </span>
    );
}
