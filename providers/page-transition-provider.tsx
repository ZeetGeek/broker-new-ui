"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { Inner } from "@/components/shared/page-transition/inner";
import { useInterceptedNavigation } from "@/components/shared/page-transition/use-intercepted-navigation";

/**
 * Page transition wrapper.
 *
 * Unlike the Pages Router pattern this is modelled on, the route change is not
 * what starts the animation. Link clicks are intercepted, the cover plays, and
 * only then is the route pushed — so the incoming page never paints while the
 * cover is still sweeping in. Once the new pathname lands, the cover lifts.
 */
export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isCovering, isShrunk, onRouteSettled } = useInterceptedNavigation();

    // The new route has painted — release the cover.
    useEffect(() => {
        onRouteSettled();
    }, [pathname, onRouteSettled]);

    return (
        <Inner isCovering={isCovering} isShrunk={isShrunk} contentKey={pathname}>
            {children}
        </Inner>
    );
}
