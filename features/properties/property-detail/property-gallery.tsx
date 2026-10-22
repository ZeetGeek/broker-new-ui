"use client";

import { type ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import useEmblaCarousel from "embla-carousel-react";

import { AppImage } from "@/components/shared/app-image";
import { Camera } from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";

import { PropertyGalleryControls } from "./property-gallery-controls";

import styles from "./property-detail.module.css";

const PropertyLightbox = dynamic(() => import("./property-lightbox"), { ssr: false });

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
    firstSlide,
}: {
    src: string;
    title: string;
    photoIndex: number;
    count: number;
    onOpen: (index: number) => void;
    firstSlide: boolean;
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
                    priority={firstSlide}
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
    // Small sets need extra instances of their real photos to fill a looping track.
    const carouselPhotos =
        imageSrcs.length > 1 && imageSrcs.length <= 4
            ? Array.from({ length: Math.ceil(6 / imageSrcs.length) }, () => imageSrcs).flat()
            : imageSrcs;
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
                    {carouselPhotos.map((src, slideIndex) => (
                        <div className={styles.carouselSlide} key={src + slideIndex}>
                            <GalleryPhoto
                                src={src}
                                title={title}
                                photoIndex={slideIndex % imageSrcs.length}
                                count={imageSrcs.length}
                                onOpen={setIndex}
                                firstSlide={slideIndex === 0}
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
                <PropertyLightbox
                    title={title}
                    imageSrcs={imageSrcs}
                    index={index}
                    onClose={() => setIndex(null)}
                />
            ) : null}
        </div>
    );
}
