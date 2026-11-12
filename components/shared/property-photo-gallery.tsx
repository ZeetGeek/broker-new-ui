"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "motion/react";

import { AppImage } from "@/components/shared/app-image";
import { Building2 } from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";

import styles from "./property-photo-gallery.module.css";

const PropertyLightbox = dynamic(
    () => import("@/features/properties/property-detail/property-lightbox"),
    { ssr: false },
);

export function PropertyPhotoGallery({
    property,
    onLightboxChange,
    thumbnailPosition = "bottom",
}: {
    property: { title: string; imageSrc: string; imageSrcs?: readonly string[] };
    onLightboxChange: (open: boolean) => void;
    thumbnailPosition?: "bottom" | "right";
}) {
    const photos = [
        ...new Set(
            (property.imageSrcs?.length ? property.imageSrcs : [property.imageSrc]).filter(Boolean),
        ),
    ];
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [failed, setFailed] = useState<string[]>([]);
    const [loaded, setLoaded] = useState<string[]>([]);
    const [active, setActive] = useState(0);
    const reduceMotion = useReducedMotion();
    const [viewportRef, carousel] = useEmblaCarousel({
        loop: photos.length > 1,
        duration: reduceMotion ? 0 : 28,
    });
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!carousel) return;
        const select = () => {
            const selected = carousel.selectedScrollSnap();
            setActive(selected);
            const thumbnail = thumbnailsRef.current?.children[selected] as HTMLElement | undefined;
            const strip = thumbnailsRef.current;
            if (thumbnail && strip) {
                // Scroll only the thumbnail strip, never the surrounding modal.
                strip.scrollTo({
                    left:
                        thumbnail.offsetLeft -
                        strip.offsetLeft -
                        (strip.clientWidth - thumbnail.clientWidth) / 2,
                    top:
                        thumbnail.offsetTop -
                        strip.offsetTop -
                        (strip.clientHeight - thumbnail.clientHeight) / 2,
                    behavior: reduceMotion ? "instant" : "smooth",
                });
            }
        };
        let frame = 0;
        const layers = carousel
            .slideNodes()
            .map((slide) => slide.querySelector<HTMLElement>("[data-deal-parallax]"));
        const update = () => {
            frame = 0;
            if (reduceMotion) {
                layers.forEach((layer) => {
                    if (layer) layer.style.transform = "";
                });
                return;
            }
            const viewport = carousel.rootNode().getBoundingClientRect();
            const center = viewport.left + viewport.width / 2;
            const rects = carousel.slideNodes().map((slide) => slide.getBoundingClientRect());
            rects.forEach((rect, index) => {
                const layer = layers[index];
                if (!layer) return;
                const offset = Math.max(
                    -rect.width * 0.07,
                    Math.min(rect.width * 0.07, (center - rect.left - rect.width / 2) * 0.18),
                );
                layer.style.transform = `translate3d(${offset}px, 0, 0)`;
            });
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        select();
        schedule();
        carousel
            .on("select", select)
            .on("reInit", select)
            .on("scroll", schedule)
            .on("reInit", schedule);
        return () => {
            cancelAnimationFrame(frame);
            carousel
                .off("select", select)
                .off("reInit", select)
                .off("scroll", schedule)
                .off("reInit", schedule);
            layers.forEach((layer) => {
                if (layer) layer.style.transform = "";
            });
        };
    }, [carousel, reduceMotion]);
    return (
        <div
            className={`${styles.gallery} ${thumbnailPosition === "right" && photos.length > 1 ? styles.sideThumbnails : ""}`}
        >
            {photos.length ? (
                <div className={styles.photoLayout}>
                    <div
                        className={styles.carouselFrame}
                        role="region"
                        aria-roledescription="carousel"
                        aria-label="Property photos"
                        onKeyDown={(event) => {
                            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                                event.preventDefault();
                                if (event.key === "ArrowLeft") carousel?.scrollPrev();
                                else carousel?.scrollNext();
                            }
                        }}
                    >
                        <div ref={viewportRef} className={styles.carouselViewport}>
                            <div className={styles.carouselTrack}>
                                {photos.map((src, index) => (
                                    <button
                                        key={src}
                                        type="button"
                                        className={styles.carouselSlide}
                                        tabIndex={index === active ? 0 : -1}
                                        onClick={() => {
                                            setActive(index);
                                            setLightboxOpen(true);
                                            onLightboxChange(true);
                                        }}
                                        aria-label={`Open property photo ${index + 1} of ${photos.length}`}
                                        aria-hidden={index !== active}
                                    >
                                        {!failed.includes(src) ? (
                                            <span
                                                className={styles.parallaxImage}
                                                data-deal-parallax
                                            >
                                                <AppImage
                                                    src={src}
                                                    alt={`${property.title} - photo ${index + 1}`}
                                                    fill
                                                    draggable={false}
                                                    sizes="(max-width: 899px) 90vw, 560px"
                                                    priority={index === 0}
                                                    onLoad={() =>
                                                        setLoaded((previous) =>
                                                            previous.includes(src)
                                                                ? previous
                                                                : [...previous, src],
                                                        )
                                                    }
                                                    onError={() =>
                                                        setFailed((previous) => [...previous, src])
                                                    }
                                                />
                                                {!loaded.includes(src) ? (
                                                    <Skeleton className={styles.imageSkeleton} />
                                                ) : null}
                                            </span>
                                        ) : (
                                            <span className={styles.photoEmpty}>
                                                <Building2 size={32} strokeWidth={1.5} />
                                                <span>Photo could not load</span>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {photos.length > 1 ? (
                            <>
                                <span
                                    className={styles.photoPosition}
                                    aria-live="polite"
                                    aria-atomic="true"
                                >
                                    {active + 1} / {photos.length}
                                </span>
                            </>
                        ) : null}
                    </div>
                    {photos.length > 1 ? (
                        <div
                            ref={thumbnailsRef}
                            className={styles.thumbnails}
                            role="group"
                            aria-label="Choose property photo"
                        >
                            {photos.map((src, index) => (
                                <button
                                    type="button"
                                    key={src}
                                    className={styles.thumbnail}
                                    aria-label={`Show property photo ${index + 1}`}
                                    aria-pressed={active === index}
                                    onClick={() => carousel?.scrollTo(index)}
                                >
                                    <AppImage src={src} alt="" fill sizes="64px" />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className={styles.emptyGallery}>
                    <Building2 size={32} strokeWidth={1.5} />
                    <span>No property photos added</span>
                </div>
            )}
            {lightboxOpen ? (
                <PropertyLightbox
                    title={property.title}
                    imageSrcs={photos}
                    index={active}
                    onClose={() => {
                        setLightboxOpen(false);
                        onLightboxChange(false);
                    }}
                />
            ) : null}
        </div>
    );
}
