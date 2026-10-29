"use client";

import { useEffect, useRef } from "react";

/** Fade only scrollable edges, updating when results or viewport size change. */
export function useScrollFade() {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const list = ref.current;
        if (!list) return;

        const updateFades = () => {
            const remaining = list.scrollHeight - list.clientHeight - list.scrollTop;
            list.style.setProperty("--scroll-fade-top", list.scrollTop > 1 ? "24px" : "0px");
            list.style.setProperty("--scroll-fade-bottom", remaining > 1 ? "24px" : "0px");
        };
        updateFades();
        list.addEventListener("scroll", updateFades, { passive: true });
        const resizeObserver = new ResizeObserver(updateFades);
        resizeObserver.observe(list);
        const mutationObserver = new MutationObserver(updateFades);
        mutationObserver.observe(list, { childList: true, subtree: true, characterData: true });
        return () => {
            list.removeEventListener("scroll", updateFades);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, []);

    return ref;
}
