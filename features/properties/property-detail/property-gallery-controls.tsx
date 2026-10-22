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
            setSelected(api.selectedScrollSnap());
            setProgress(Math.max(0, Math.min(1, api.scrollProgress())));
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
    }, [api]);
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
                min={0}
                max={1}
                step={0.001}
                label="Scroll property photos"
                value={progress}
                disabled={count < 2}
                onValueChange={(value) => {
                    if (!api) return;
                    const engine = api.internalEngine();
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
