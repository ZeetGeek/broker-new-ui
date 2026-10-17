"use client";

import { type MouseEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

import useEmblaCarousel from "embla-carousel-react";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { HoverScaleLayer, HoverScaleRoot } from "@/components/shared/hover-scale-media";

/**
 * Same glass and 36px size as the photo menu button (`block-control-md`).
 * Hidden until the photo is hovered or a button inside it is focused.
 */
const PHOTO_NAV_BUTTON_CLASS = `
  pointer-events-none absolute inset-bs-1/2 z-20 flex -translate-y-1/2 items-center
  justify-center rounded-full bg-ink/30 text-surface opacity-0 backdrop-blur-md
  transition-opacity duration-160
  block-control-md inline-control-md
  group-hover/photo:pointer-events-auto group-hover/photo:opacity-100
  group-focus-within/photo:pointer-events-auto group-focus-within/photo:opacity-100
  hover:bg-ink/45 hover:text-surface
  focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-brand
`;

export type OverlayCardPhotosProps = {
    href: string;
    images: readonly string[];
    imageAlt: string;
    imageSizes: string;
    priority?: boolean;
    muted?: boolean;
};

function stopControlEvent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
}

export function OverlayCardPhotos({
    href,
    images,
    imageAlt,
    imageSizes,
    priority = false,
    muted = false,
}: OverlayCardPhotosProps) {
    const canCarousel = images.length > 1;
    const [preparedThrough, setPreparedThrough] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(canCarousel);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const draggedRef = useRef(false);

    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "start",
        containScroll: "trimSnaps",
        watchDrag: canCarousel,
    });

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => {
            const nextIndex = emblaApi.selectedScrollSnap();
            setPreparedThrough((current) => Math.max(current, nextIndex));
            setCanScrollPrev(emblaApi.canScrollPrev());
            setCanScrollNext(emblaApi.canScrollNext());
        };
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
        const frame = requestAnimationFrame(onSelect);
        return () => {
            cancelAnimationFrame(frame);
            emblaApi.off("select", onSelect);
            emblaApi.off("reInit", onSelect);
        };
    }, [emblaApi]);

    const prepareNextImage = () => {
        if (!emblaApi) return;
        setPreparedThrough((current) => Math.max(current, emblaApi.selectedScrollSnap() + 1));
    };

    const scrollPrev = (event: MouseEvent) => {
        stopControlEvent(event);
        emblaApi?.scrollPrev();
    };

    const scrollNext = (event: MouseEvent) => {
        stopControlEvent(event);
        prepareNextImage();
        emblaApi?.scrollNext();
    };

    const rememberPointer = (event: PointerEvent) => {
        dragStartRef.current = { x: event.clientX, y: event.clientY };
        draggedRef.current = false;
    };

    const trackPointer = (event: PointerEvent) => {
        const start = dragStartRef.current;
        if (!start) return;
        if (Math.abs(event.clientX - start.x) > 8 || Math.abs(event.clientY - start.y) > 8) {
            draggedRef.current = true;
        }
    };

    const blockDragClick = (event: MouseEvent) => {
        if (draggedRef.current) event.preventDefault();
    };

    if (images.length === 0) {
        return (
            <div
                className="
                  flex flex-col items-center justify-center gap-2 bg-surface-muted px-4
                  text-center block-full inline-full
                "
            >
                <Building2
                    aria-hidden
                    className="text-ink-subtle block-8 inline-8"
                    strokeWidth={1.5}
                />
                <p className="body-xs text-ink-muted">No photos yet</p>
            </div>
        );
    }

    return (
        <HoverScaleRoot className="group/photo relative block-full overflow-hidden inline-full">
            <HoverScaleLayer className="absolute inset-0">
                <div
                    ref={emblaRef}
                    className="overflow-hidden block-full inline-full"
                    onPointerDown={canCarousel ? rememberPointer : undefined}
                    onPointerMove={canCarousel ? trackPointer : undefined}
                    onPointerEnter={canCarousel ? prepareNextImage : undefined}
                    aria-roledescription={canCarousel ? "carousel" : undefined}
                    aria-label={canCarousel ? `${imageAlt} photos` : undefined}
                >
                    <div className="flex touch-pan-y block-full">
                        {images.map((src, index) => (
                            <div
                                key={`${src}-${index}`}
                                className="relative shrink-0 grow-0 basis-full min-inline-0"
                                role={canCarousel ? "group" : undefined}
                                aria-roledescription={canCarousel ? "slide" : undefined}
                                aria-label={
                                    canCarousel
                                        ? `Photo ${index + 1} of ${images.length}`
                                        : undefined
                                }
                            >
                                <Link
                                    href={href}
                                    prefetch={false}
                                    tabIndex={-1}
                                    aria-hidden
                                    className="absolute inset-0 block"
                                    onClick={blockDragClick}
                                    onDragStart={(event) => event.preventDefault()}
                                >
                                    {index <= preparedThrough ? (
                                        <AppImage
                                            src={src}
                                            alt={
                                                index === 0
                                                    ? imageAlt
                                                    : `${imageAlt} — photo ${index + 1}`
                                            }
                                            fill
                                            sizes={imageSizes}
                                            priority={priority && index === 0}
                                            draggable={false}
                                            className={cn(
                                                "pointer-events-none object-cover",
                                                muted && "grayscale-60",
                                            )}
                                        />
                                    ) : (
                                        <span className="absolute inset-0 bg-surface-muted" />
                                    )}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </HoverScaleLayer>

            {canCarousel && canScrollPrev ? (
                <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={scrollPrev}
                    onPointerDown={(event) => event.stopPropagation()}
                    className={cn(PHOTO_NAV_BUTTON_CLASS, "inset-s-3")}
                >
                    <ChevronLeft aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                </button>
            ) : null}

            {canCarousel && canScrollNext ? (
                <button
                    type="button"
                    aria-label="Next photo"
                    onClick={scrollNext}
                    onPointerDown={(event) => {
                        event.stopPropagation();
                        prepareNextImage();
                    }}
                    className={cn(PHOTO_NAV_BUTTON_CLASS, "inset-e-3")}
                >
                    <ChevronRight aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                </button>
            ) : null}
        </HoverScaleRoot>
    );
}
