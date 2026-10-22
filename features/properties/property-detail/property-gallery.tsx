"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { AppImage } from "@/components/shared/app-image";
import { Camera, ChevronLeft, ChevronRight, LayoutGrid, X } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

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
            <div className={styles.photoGrid} data-count={Math.min(imageSrcs.length, 5)}>
                {imageSrcs.slice(0, 5).map((src, photoIndex) => (
                    <button
                        key={src + photoIndex}
                        type="button"
                        className={styles.photo}
                        onClick={() => setIndex(photoIndex)}
                        aria-label={`Open photo ${photoIndex + 1} of ${imageSrcs.length}: ${title}`}
                    >
                        <AppImage
                            src={src}
                            alt={`${title} — photo ${photoIndex + 1}`}
                            fill
                            priority={photoIndex === 0}
                            sizes={
                                imageSrcs.length === 1
                                    ? "(max-width: 1184px) 100vw, 1120px"
                                    : photoIndex === 0 ||
                                        imageSrcs.length <= 3 ||
                                        (imageSrcs.length === 4 && photoIndex === 3)
                                      ? "(max-width: 767px) 100vw, (max-width: 1184px) 50vw, 560px"
                                      : "(max-width: 1184px) 25vw, 280px"
                            }
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>
            {overlay ? (
                <div className="pointer-events-none absolute inset-s-4 inset-bs-4 flex gap-2">
                    {overlay}
                </div>
            ) : null}
            <Button
                type="button"
                variant="outline"
                className={styles.photoCount}
                onClick={() => setIndex(0)}
            >
                <LayoutGrid size={16} aria-hidden />
                {imageSrcs.length === 1 ? "View photo" : `Show all ${imageSrcs.length} photos`}
            </Button>
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
