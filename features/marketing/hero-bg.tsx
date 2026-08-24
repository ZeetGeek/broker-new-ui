"use client";

import { useState } from "react";

export function HeroBg() {
    const [desktop] = useState(() => {
        if (typeof window === "undefined") {
            return false;
        }
        const mq = window.matchMedia("(min-width: 768px)");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        return mq.matches && !reduced.matches;
    });

    return (
        <>
            <img
                src="/video/hero-poster.webp"
                alt=""
                className="absolute inset-0 object-cover block-full inline-full"
            />
            {desktop && (
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster="/video/hero-poster.webp"
                    className="absolute inset-0 object-cover block-full inline-full"
                >
                    <source src="/video/hero.mp4" type="video/mp4" />
                </video>
            )}
        </>
    );
}
