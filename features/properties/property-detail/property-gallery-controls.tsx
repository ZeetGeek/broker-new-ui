"use client";

import { useEffect, useState } from "react";

import type { UseEmblaCarouselType } from "embla-carousel-react";

import { ChevronLeft, ChevronRight } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

import styles from "./property-detail.module.css";

/** Scroll updates stay here so dragging never re-renders the photo tree. */
export function PropertyGalleryControls({
    api,
    count,
}: {
    api: UseEmblaCarouselType[1];
    count: number;
}) {
    const [selected, setSelected] = useState(0);
    const [progress, setProgress] = useState(0);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);
    useEffect(() => {
        if (!api) return;
        let frame = 0;
        const update = () => {
            frame = 0;
            const photoIndex = api.selectedScrollSnap() % Math.max(1, count);
            setSelected(photoIndex);
            setProgress(count > 1 ? photoIndex / (count - 1) : 0);
            setCanPrev(api.canScrollPrev());
            setCanNext(api.canScrollNext());
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        schedule();
        api.on("select", schedule).on("scroll", schedule).on("reInit", schedule);
        return () => {
            cancelAnimationFrame(frame);
            api.off("select", schedule).off("scroll", schedule).off("reInit", schedule);
        };
    }, [api, count]);
    return (
        <div className={styles.carouselFooter}>
            <div className={styles.carouselControls}>
                <div className={styles.headerActions}>
                    <Button
                        type="button"
                        variant="surface"
                        size="icon"
                        className={styles.circleButton}
                        disabled={!canPrev}
                        onClick={() => api?.scrollPrev()}
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
                        onClick={() => api?.scrollNext()}
                        aria-label="Next photos"
                    >
                        <ChevronRight size={20} aria-hidden />
                    </Button>
                </div>
            </div>
            <Slider
                className={styles.galleryProgress}
                indicatorClassName="t-resize"
                min={0}
                max={1}
                step={count > 1 ? 1 / (count - 1) : 1}
                label="Scroll property photos"
                value={progress}
                disabled={count < 2}
                onValueChange={(value) => {
                    if (!api) return;
                    const photoIndex = Math.min(
                        count - 1,
                        Math.max(0, Math.round(value * (count - 1))),
                    );
                    const current = api.selectedScrollSnap();
                    const cycleStart = current - (current % count);
                    api.scrollTo(cycleStart + photoIndex);
                }}
            />
            <span
                className={`${styles.carouselCounter}
                  rounded-full border border-border-warm bg-surface shadow-sm
                `}
                aria-live="polite"
            >
                {selected + 1} / {count}
            </span>
        </div>
    );
}
