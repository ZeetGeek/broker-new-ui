"use client";

import type { ReactNode } from "react";

import useEmblaCarousel from "embla-carousel-react";

import { cn } from "@/lib/utils";

type OwnerListingsChipsCarouselProps = {
    children: ReactNode;
    className?: string;
};

export function OwnerListingsChipsCarousel({
    children,
    className,
}: OwnerListingsChipsCarouselProps) {
    const [emblaRef] = useEmblaCarousel({
        align: "start",
        containScroll: "trimSnaps",
        dragFree: true,
    });

    return (
        <div
            ref={emblaRef}
            className={cn("-my-1.5 flex-1 overflow-hidden py-1.5 min-inline-0", className)}
            aria-roledescription="carousel"
        >
            <div className="flex touch-pan-y gap-2.5 px-0.5">{children}</div>
        </div>
    );
}

export function OwnerListingsChipsCarouselSlide({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={cn("shrink-0", className)}>{children}</div>;
}
