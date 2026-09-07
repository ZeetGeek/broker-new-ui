"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Camera, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";

const TILE_CLASS = `
  group relative overflow-hidden bg-surface-muted
  transition-transform duration-160
  focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/40
`;

/**
 * The mosaic adapts to how many photos exist. A fixed 4-column grid leaves
 * dead space on a listing with one or two photos, which reads as broken —
 * so the hero widens to fill whatever the side column does not use.
 */
function mosaicLayout(photoCount: number): { grid: string; hero: string; sideTiles: number } {
    if (photoCount === 1) {
        return { grid: "md:grid-cols-1 md:grid-rows-1", hero: "", sideTiles: 0 };
    }
    if (photoCount === 2) {
        return { grid: "md:grid-cols-2 md:grid-rows-1", hero: "", sideTiles: 1 };
    }
    if (photoCount === 3) {
        return {
            grid: "md:grid-cols-3 md:grid-rows-2",
            hero: "md:col-span-2 md:row-span-2",
            sideTiles: 2,
        };
    }
    return {
        grid: "md:grid-cols-4 md:grid-rows-2",
        hero: "md:col-span-2 md:row-span-2",
        sideTiles: 4,
    };
}

export type PropertyGalleryProps = {
    title: string;
    imageSrcs: string[];
    /** Pills laid over the top of the hero tile — status, listing age. */
    overlay?: ReactNode;
    /** Target for the empty state's "Add photos" action. */
    editHref?: string;
};

/**
 * Hero + four-tile mosaic on desktop, a single hero on mobile. Every tile
 * opens the lightbox at its own index; arrows and Escape drive it from there.
 */
export function PropertyGallery({ title, imageSrcs, overlay, editHref }: PropertyGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const hero = imageSrcs[0];
    const layout = mosaicLayout(imageSrcs.length);
    const tiles = imageSrcs.slice(1, layout.sideTiles + 1);
    const remaining = Math.max(0, imageSrcs.length - (layout.sideTiles + 1));

    const close = useCallback(() => setLightboxIndex(null), []);

    const step = useCallback(
        (delta: number) => {
            setLightboxIndex((current) => {
                if (current == null) return current;
                return (current + delta + imageSrcs.length) % imageSrcs.length;
            });
        },
        [imageSrcs.length],
    );

    // Lightbox owns the keyboard and locks page scroll while it is open.
    useEffect(() => {
        if (lightboxIndex == null) return;

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") close();
            if (event.key === "ArrowRight") step(1);
            if (event.key === "ArrowLeft") step(-1);
        }

        document.addEventListener("keydown", onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [close, lightboxIndex, step]);

    if (!hero) {
        return (
            <div
                className="
                  flex flex-col items-center justify-center gap-2 rounded-card border border-dashed
                  border-border-warm bg-surface-muted px-6 py-16 text-center
                "
            >
                <Camera
                    aria-hidden
                    className="text-ink-subtle block-10 inline-10"
                    strokeWidth={1.25}
                />
                <p className="h6 text-ink">No photos on this listing</p>
                <p className="body-sm text-ink-muted max-inline-sm">
                    Brokers skip past listings without photos. Add a few and this property starts
                    getting requests.
                </p>
                {editHref ? (
                    <Link
                        href={editHref}
                        className="
                          body-sm mbs-2 rounded-control bg-brand px-5 py-2.5 font-semibold
                          text-surface transition-colors duration-160
                          hover:bg-brand-text
                        "
                    >
                        Add photos
                    </Link>
                ) : null}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className={cn("relative grid gap-2 md:block-104 lg:block-120", layout.grid)}>
                <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    aria-label={`Open photos of ${title}`}
                    className={cn(
                        TILE_CLASS,
                        "aspect-4/3 rounded-card md:aspect-auto",
                        layout.hero,
                    )}
                >
                    <AppImage
                        src={hero}
                        alt={`${title} — main photo`}
                        fill
                        priority
                        sizes={layout.sideTiles === 0 ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
                        className="
                          object-cover transition-transform duration-160
                          group-hover:scale-[1.02]
                        "
                    />
                    {overlay ? (
                        <span
                            className="
                              pointer-events-none absolute inset-x-0 inset-bs-0 flex flex-wrap
                              items-start gap-2 p-3
                            "
                        >
                            {overlay}
                        </span>
                    ) : null}
                </button>

                {tiles.map((src, index) => {
                    const isLastTile = index === tiles.length - 1;

                    return (
                        <button
                            key={`${src}-${index}`}
                            type="button"
                            onClick={() => setLightboxIndex(index + 1)}
                            aria-label={`Open photo ${index + 2} of ${title}`}
                            className={cn(TILE_CLASS, "hidden rounded-inner md:block")}
                        >
                            <AppImage
                                src={src}
                                alt={`${title} — photo ${index + 2}`}
                                fill
                                sizes="25vw"
                                className="
                                  object-cover transition-transform duration-160
                                  group-hover:scale-[1.02]
                                "
                            />
                            {isLastTile && remaining > 0 ? (
                                <span
                                    className="
                                      h4 absolute inset-0 flex items-center justify-center
                                      bg-brand-ink/65 text-surface
                                    "
                                >
                                    +{remaining}
                                </span>
                            ) : null}
                        </button>
                    );
                })}

                {imageSrcs.length > 1 ? (
                    <button
                        type="button"
                        onClick={() => setLightboxIndex(0)}
                        className="
                          body-sm absolute inset-e-3 inset-be-3 hidden items-center gap-1.5
                          rounded-control border border-border-warm bg-surface/95 px-3.5 py-2
                          font-medium text-ink shadow-sm transition-colors duration-160
                          hover:bg-surface
                          md:inline-flex
                        "
                    >
                        <Expand aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        All {imageSrcs.length} photos
                    </button>
                ) : null}
            </div>

            {imageSrcs.length > 1 ? (
                <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="
                      body-sm inline-flex items-center gap-1.5 self-start rounded-control border
                      border-border-warm bg-surface px-3.5 py-2 font-medium text-ink-muted
                      transition-colors duration-160
                      hover:text-ink
                      md:hidden
                    "
                >
                    <Camera aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    View all {imageSrcs.length} photos
                </button>
            ) : null}

            {lightboxIndex != null ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${title} photos`}
                    onClick={close}
                    className="fixed inset-0 z-50 flex flex-col bg-brand-ink/95 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between p-4 text-surface">
                        <span className="body-sm tabular font-medium">
                            {lightboxIndex + 1} / {imageSrcs.length}
                        </span>
                        <button
                            type="button"
                            onClick={close}
                            aria-label="Close photos"
                            className="
                              rounded-control p-2 transition-colors duration-160
                              hover:bg-surface/15
                            "
                        >
                            <X aria-hidden className="block-5 inline-5" strokeWidth={1.75} />
                        </button>
                    </div>

                    <div
                        className="relative flex flex-1 items-center justify-center px-4 pbe-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {imageSrcs.length > 1 ? (
                            <button
                                type="button"
                                aria-label="Previous photo"
                                onClick={() => step(-1)}
                                className="
                                  absolute inset-s-3 z-10 rounded-full bg-surface/15 p-2
                                  text-surface transition-colors duration-160
                                  hover:bg-surface/25
                                "
                            >
                                <ChevronLeft
                                    aria-hidden
                                    className="block-6 inline-6"
                                    strokeWidth={1.75}
                                />
                            </button>
                        ) : null}

                        <div className="relative block-full inline-full max-inline-5xl">
                            <AppImage
                                src={imageSrcs[lightboxIndex]!}
                                alt={`${title} — photo ${lightboxIndex + 1}`}
                                fill
                                sizes="100vw"
                                className="object-contain"
                            />
                        </div>

                        {imageSrcs.length > 1 ? (
                            <button
                                type="button"
                                aria-label="Next photo"
                                onClick={() => step(1)}
                                className="
                                  absolute inset-e-3 z-10 rounded-full bg-surface/15 p-2
                                  text-surface transition-colors duration-160
                                  hover:bg-surface/25
                                "
                            >
                                <ChevronRight
                                    aria-hidden
                                    className="block-6 inline-6"
                                    strokeWidth={1.75}
                                />
                            </button>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
