"use client";

import { useReducedMotion } from "motion/react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import {
    ChevronLeft,
    ChevronRight,
    Expand,
    Images,
    Maximize2,
    Minus,
    Pause,
    Play,
    Plus,
    X,
} from "@/components/shared/icons";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function PropertyLightbox({
    title,
    imageSrcs,
    index,
    onClose,
}: {
    title: string;
    imageSrcs: string[];
    index: number;
    onClose: () => void;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <Lightbox
            open
            close={onClose}
            index={index}
            slides={imageSrcs.map((src, photoIndex) => ({
                src,
                alt: `${title} — photo ${photoIndex + 1}`,
            }))}
            plugins={[Counter, Zoom, Fullscreen, Slideshow, Thumbnails]}
            controller={{ aria: true, closeOnBackdropClick: true }}
            carousel={{ preload: 1 }}
            zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true }}
            fullscreen={{ auto: false }}
            slideshow={{ autoplay: false, delay: 4000 }}
            thumbnails={{
                width: 80,
                height: 56,
                padding: 0,
                gap: 8,
                border: 2,
                borderRadius: 8,
                showToggle: true,
                vignette: false,
            }}
            styles={{
                root: {
                    "--yarl__color_backdrop": "var(--color-canvas)",
                    "--yarl__color_button": "var(--color-ink)",
                    "--yarl__color_button_active": "var(--color-brand)",
                    "--yarl__color_button_disabled": "var(--color-ink-subtle)",
                    "--yarl__button_filter": "none",
                    "--yarl__counter_color": "var(--color-ink)",
                    "--yarl__counter_filter": "none",
                    "--yarl__thumbnails_container_background_color": "var(--color-canvas)",
                    "--yarl__thumbnails_thumbnail_background": "var(--color-surface-muted)",
                    "--yarl__thumbnails_thumbnail_border_color": "var(--color-border)",
                    "--yarl__thumbnails_thumbnail_active_border_color": "var(--color-brand-ink)",
                    "--yarl__thumbnails_thumbnail_focus_box_shadow": "0 0 0 2px var(--color-brand)",
                },
                button: { minWidth: 48, minHeight: 48, padding: 12 },
            }}
            animation={reduceMotion ? { fade: 0, swipe: 0, navigation: 0, zoom: 0 } : undefined}
            render={{
                iconPrev: () => <ChevronLeft size={28} aria-hidden />,
                iconNext: () => <ChevronRight size={28} aria-hidden />,
                iconClose: () => <X size={28} aria-hidden />,
                iconZoomIn: () => <Plus size={24} aria-hidden />,
                iconZoomOut: () => <Minus size={24} aria-hidden />,
                iconEnterFullscreen: () => <Expand size={24} aria-hidden />,
                iconExitFullscreen: () => <Maximize2 size={24} aria-hidden />,
                iconSlideshowPlay: () => <Play size={24} aria-hidden />,
                iconSlideshowPause: () => <Pause size={24} aria-hidden />,
                iconThumbnailsVisible: () => <Images size={24} aria-hidden />,
                iconThumbnailsHidden: () => <Images size={24} aria-hidden />,
            }}
        />
    );
}
