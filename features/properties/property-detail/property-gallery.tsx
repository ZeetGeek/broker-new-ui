"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import useEmblaCarousel from "embla-carousel-react";

import { AppImage } from "@/components/shared/app-image";
import { Camera, ChevronLeft, ChevronRight, X } from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";

import { PropertyGalleryControls } from "./property-gallery-controls";

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

function GalleryPhoto({
    src,
    title,
    photoIndex,
    count,
    onOpen,
}: {
    src: string;
    title: string;
    photoIndex: number;
    count: number;
    onOpen: (index: number) => void;
}) {
    const [readySource, setReadySource] = useState<string>();
    const loading = readySource !== src;
    return (
        <button
            type="button"
            className={styles.photo}
            onClick={() => onOpen(photoIndex)}
            aria-label={`Open photo ${photoIndex + 1} of ${count}: ${title}`}
            aria-busy={loading}
        >
            <span className={styles.parallaxImage} data-parallax-image>
                <AppImage
                    src={src}
                    alt={`${title} — photo ${photoIndex + 1}`}
                    fill
                    priority={photoIndex === 0}
                    sizes={
                        count === 1
                            ? "124vw"
                            : "(max-width: 767px) 110vw, (max-width: 1199px) 56vw, 42vw"
                    }
                    onLoad={() => setReadySource(src)}
                    onError={() => setReadySource(src)}
                    className="object-cover"
                />
            </span>
            {loading ? <Skeleton className={styles.photoLoading} /> : null}
        </button>
    );
}

export function PropertyGallery({ title, imageSrcs, editHref, overlay }: PropertyGalleryProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "start",
        dragFree: true,
        loop: true,
        containScroll: "keepSnaps",
    });
    useEffect(() => {
        if (!emblaApi) return;
        const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;
        const updateParallax = () => {
            frame = 0;
            const slides = emblaApi.slideNodes();
            const layers = slides.map((slide) =>
                slide.querySelector<HTMLElement>("[data-parallax-image]"),
            );
            if (motionPreference.matches) {
                layers.forEach((layer) => {
                    if (layer) layer.style.transform = "none";
                });
                return;
            }
            const viewport = emblaApi.rootNode().getBoundingClientRect();
            const center = viewport.left + viewport.width / 2;
            // Read all geometry before writing transforms to avoid forced reflows.
            const rects = slides.map((slide) => slide.getBoundingClientRect());
            rects.forEach((rect, slideIndex) => {
                const layer = layers[slideIndex];
                if (!layer) return;
                const offset = Math.max(
                    -rect.width * 0.1,
                    Math.min(rect.width * 0.1, (center - rect.left - rect.width / 2) * 0.15),
                );
                layer.style.transform = `translate3d(${offset}px, 0, 0)`;
            });
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(updateParallax);
        };
        schedule();
        emblaApi.on("scroll", schedule).on("reInit", schedule);
        motionPreference.addEventListener("change", schedule);
        return () => {
            cancelAnimationFrame(frame);
            emblaApi.off("scroll", schedule).off("reInit", schedule);
            motionPreference.removeEventListener("change", schedule);
            emblaApi.slideNodes().forEach((slide) => {
                const layer = slide.querySelector<HTMLElement>("[data-parallax-image]");
                if (layer) layer.style.transform = "";
            });
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
                            <GalleryPhoto
                                src={src}
                                title={title}
                                photoIndex={photoIndex}
                                count={imageSrcs.length}
                                onOpen={setIndex}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {overlay ? (
                <div className="pointer-events-none absolute inset-s-4 inset-bs-4 flex gap-2">
                    {overlay}
                </div>
            ) : null}
            <PropertyGalleryControls api={emblaApi} count={imageSrcs.length} />
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
