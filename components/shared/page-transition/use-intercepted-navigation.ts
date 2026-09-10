"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { COVER_DURATION } from "./anim";

/** Modified clicks are the browser's to handle (new tab, download, etc.). */
function isPlainLeftClick(event: MouseEvent) {
    return (
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        !event.defaultPrevented
    );
}

/**
 * Returns the same-origin path an anchor points to, or `null` if this click
 * should be left to the browser — external hosts, new-tab targets, downloads,
 * and in-page hash links.
 */
function internalHref(anchor: HTMLAnchorElement): string | null {
    if (anchor.target && anchor.target !== "_self") return null;
    if (anchor.hasAttribute("download")) return null;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return null;

    // A pure hash change on the current page is not a navigation.
    const samePage =
        url.pathname === window.location.pathname && url.search === window.location.search;
    if (samePage && url.hash) return null;

    return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Holds navigation until the cover animation has played.
 *
 * Next commits a route as soon as it is pushed, so `AnimatePresence` never
 * gets to run an exit before the new page paints — the new content appears
 * underneath a cover that is still sweeping in. Intercepting the click at the
 * document lets the animation finish first, and only then pushes the route.
 *
 * Listens in the capture phase so it runs before Next's own `<Link>` handler.
 */
export function useInterceptedNavigation() {
    const router = useRouter();
    // Two flags, not one: the page must be back at rest BEFORE the overlay
    // starts fading, or the new page is seen riding the scale-up underneath it.
    const [isCovering, setIsCovering] = useState(false);
    const [isShrunk, setIsShrunk] = useState(false);
    const pendingHref = useRef<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    }, []);

    useEffect(() => {
        function onClick(event: MouseEvent) {
            if (!isPlainLeftClick(event)) return;

            const anchor = (event.target as HTMLElement | null)?.closest("a");
            if (!anchor) return;

            const href = internalHref(anchor);
            if (href === null) return;

            // Already going somewhere — ignore rather than restart the cover.
            if (pendingHref.current) {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            pendingHref.current = href;
            setIsCovering(true);
            setIsShrunk(true);

            timer.current = setTimeout(() => {
                router.push(href);
            }, COVER_DURATION * 1000);
        }

        document.addEventListener("click", onClick, { capture: true });
        return () => {
            document.removeEventListener("click", onClick, { capture: true });
            clearTimer();
        };
    }, [router, clearTimer]);

    /**
     * Called once the new route has painted.
     *
     * The page is dropped back to rest immediately, while the overlay is still
     * fully opaque and hiding it. Only on the next frame does the overlay begin
     * to fade, so what it uncovers is a page already sitting at its natural
     * size and position.
     */
    const onRouteSettled = useCallback(() => {
        clearTimer();
        pendingHref.current = null;
        setIsShrunk(false);

        const frame = requestAnimationFrame(() => setIsCovering(false));
        return () => cancelAnimationFrame(frame);
    }, [clearTimer]);

    return { isCovering, isShrunk, onRouteSettled };
}
