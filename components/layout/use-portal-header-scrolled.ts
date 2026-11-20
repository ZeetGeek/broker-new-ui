"use client";

import { useEffect, useState } from "react";

const SCROLL_THRESHOLD_PX = 8;

/** True once the page has scrolled past a small threshold — shared by portal chrome. */
export function usePortalHeaderScrolled() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const update = () => {
            setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, []);

    return scrolled;
}
