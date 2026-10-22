"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import useEmblaCarousel from "embla-carousel-react";

import { AppImage } from "@/components/shared/app-image";
import { Camera, ChevronLeft, ChevronRight, X } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

import styles from "./property-detail.module.css";

export function mosaicLayout(photoCount: number) {
    if (photoCount <= 1) return { grid: "md:grid-cols-1", hero: "", sideTiles: 0 };
    if (photoCount === 2) return { grid: "md:grid-cols-2", hero: "", sideTiles: 1 };
    return {
        grid: photoCount < 5 ? "md:grid-cols-2" : "md:grid-cols-4",
        hero: "md:row-span-2",
        sideTiles: Math.min(photoCount - 1, 4),
    };
}

export type PropertyGalleryProps = {
    title: string;
    imageSrcs: string[];
    overlay?: ReactNode;
    editHref?: string;
};

export function PropertyGallery({ title, imageSrcs, editHref, overlay }: PropertyGalleryProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "keepSnaps" });
    const [selected, setSelected] = useState(0);
    const [progress, setProgress] = useState(0);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);
    useEffect(() => {
        if (!emblaApi) return;
        const update = () => {
            setSelected(emblaApi.selectedScrollSnap());
            setProgress(Math.max(0, Math.min(1, emblaApi.scrollProgress())));
            setCanPrev(emblaApi.canScrollPrev());
            setCanNext(emblaApi.canScrollNext());
        };
        update();
        emblaApi.on("select", update).on("scroll", update).on("reInit", update);
        return () => {
            emblaApi.off("select", update).off("scroll", update).off("reInit", update);
        };
    }, [emblaApi]);
    const [index, setIndex] = useState<number | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const isOpen = index != null;
    const close = useCallback(() => setIndex(null), []);
    const step = useCallback(
        (delta: number) =>
            setIndex((current) =>
                current == null ? null : (current + delta + imageSrcs.length) % imageSrcs.length,
            ),
        [imageSrcs.length],
    );
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!isOpen || !dialog) return;
        const previousFocus =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
            dialog.close();
            previousFocus?.focus();
        };
    }, [isOpen]);

    if (imageSrcs.length === 0)
        return (
            <div className={styles.noPhotos}>
                <Camera size={32} strokeWidth={1.5} aria-hidden />
                <h2>No property photos yet</h2>
                <p>Photos will appear here when they are added.</p>
                {editHref ? <Link href={editHref}>Add property photos</Link> : null}
            </div>
        );

    return (
        <div className={styles.gallery}>
            <div
                className={styles.carouselViewport}
                ref={emblaRef}
                role="region"
                aria-roledescription="carousel"
                aria-label="Property photos"
            >
                <div className={styles.carouselTrack}>
                    {imageSrcs.map((src, photoIndex) => (
                        <div className={styles.carouselSlide} key={src + photoIndex}>
                            <button
                                type="button"
                                className={styles.photo}
                                onClick={() => {
                                    setIndex(photoIndex);
                                }}
                                aria-label={`Open photo ${photoIndex + 1} of ${imageSrcs.length}: ${title}`}
                            >
                                <AppImage
                                    src={src}
                                    alt={`${title} — photo ${photoIndex + 1}`}
                                    fill
                                    priority={photoIndex === 0}
                                    sizes="(max-width: 767px) 88vw, 50vw"
                                    className="object-cover"
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {overlay ? (
                <div className="pointer-events-none absolute inset-s-4 inset-bs-4 flex gap-2">
                    {overlay}
                </div>
            ) : null}
            <div className={styles.carouselFooter}>
                <div className={styles.carouselControls}>
                    <div className={styles.headerActions}>
                        <Button
                            type="button"
                            variant="surface"
                            size="icon"
                            className={styles.circleButton}
                            disabled={!canPrev}
                            onClick={() => emblaApi?.scrollPrev()}
                            aria-label="Previous photos"
                        >
                            <ChevronLeft size={20} aria-hidden />
                        </Button>
                        <Button
                            type="button"
                            variant="surface"
                            size="icon"
                            className={styles.circleButton}
                            disabled={!canNext}
                            onClick={() => emblaApi?.scrollNext()}
                            aria-label="Next photos"
                        >
                            <ChevronRight size={20} aria-hidden />
                        </Button>
                    </div>
                </div>
                <Slider
                    min={0}
                    max={1}
                    step={0.001}
                    label="Scroll property photos"
                    value={progress}
                    disabled={imageSrcs.length < 2}
                    onValueChange={(value) => {
                        if (!emblaApi) return;
                        const engine = emblaApi.internalEngine();
                        engine.animation.stop();
                        const distance =
                            (value - engine.scrollProgress.get(engine.target.get())) *
                            engine.limit.length *
                            -1;
                        engine.scrollBody.useDuration(0);
                        engine.scrollTo.distance(distance, false);
                    }}
                />
                <span
                    className={`${styles.carouselCounter} rounded-full border border-border-warm bg-surface shadow-sm`}
                    aria-live="polite"
                >
                    {selected + 1} / {imageSrcs.length}
                </span>
            </div>
            {index != null ? (
                <dialog
                    ref={dialogRef}
                    className={styles.lightbox}
                    aria-label={`${title} photos`}
                    onCancel={close}
                    onKeyDown={(event) => {
                        if (event.key === "ArrowLeft") {
                            event.preventDefault();
                            step(-1);
                        }
                        if (event.key === "ArrowRight") {
                            event.preventDefault();
                            step(1);
                        }
                    }}
                >
                    <div className={styles.lightboxHeader}>
                        <span aria-live="polite">
                            {index + 1} / {imageSrcs.length}
                        </span>
                        <button type="button" onClick={close} aria-label="Close photos" autoFocus>
                            <X size={24} aria-hidden />
                        </button>
                    </div>
                    <div className={styles.lightboxImage}>
                        <AppImage
                            src={imageSrcs[index]}
                            alt={`${title} — photo ${index + 1}`}
                            fill
                            sizes="100vw"
                            className="object-contain"
                        />
                        {imageSrcs.length > 1 ? (
                            <>
                                <button
                                    type="button"
                                    className={styles.previousPhoto}
                                    onClick={() => step(-1)}
                                    aria-label="Previous photo"
                                >
                                    <ChevronLeft size={24} aria-hidden />
                                </button>
                                <button
                                    type="button"
                                    className={styles.nextPhoto}
                                    onClick={() => step(1)}
                                    aria-label="Next photo"
                                >
                                    <ChevronRight size={24} aria-hidden />
                                </button>
                            </>
                        ) : null}
                    </div>
                </dialog>
            ) : null}
        </div>
    );
}
