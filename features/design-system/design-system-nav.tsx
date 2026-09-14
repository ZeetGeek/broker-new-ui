"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function movePill(pill: HTMLElement, tab: HTMLElement, animate: boolean) {
    const nextTransform = `translateX(${tab.offsetLeft}px)`;
    const nextWidth = `${tab.offsetWidth}px`;
    if (!animate) {
        const previous = pill.style.transition;
        pill.style.transition = "none";
        pill.style.transform = nextTransform;
        pill.style.width = nextWidth;
        void pill.offsetWidth;
        pill.style.transition = previous;
        return;
    }
    pill.style.transform = nextTransform;
    pill.style.width = nextWidth;
}

const THEME_LINKS = [
    { href: "/design-system/colors", label: "Colors" },
    { href: "/design-system/typography", label: "Typography" },
    { href: "/design-system/shadows", label: "Shadows" },
    { href: "/design-system/logo", label: "Logo" },
    { href: "/design-system/components/button", label: "Button" },
    { href: "/design-system/components/input", label: "Input" },
    { href: "/design-system/components/select", label: "Select" },
    { href: "/design-system/components/switch", label: "Switch" },
    { href: "/design-system/components/radio", label: "Radio" },
    { href: "/design-system/components/tooltip", label: "Tooltip" },
    { href: "/design-system/components/tabs", label: "Tabs" },
    { href: "/design-system/components/dialog", label: "Dialog" },
];

export function DesignSystemNav() {
    const pathname = usePathname();
    const barRef = useRef<HTMLDivElement>(null);
    const pillRef = useRef<HTMLSpanElement>(null);
    const hasPainted = useRef(false);

    useLayoutEffect(() => {
        const bar = barRef.current;
        const pill = pillRef.current;
        if (!bar || !pill) {
            return;
        }
        const active =
            bar.querySelector<HTMLElement>('[aria-current="page"]') ??
            bar.querySelector<HTMLElement>(".t-tab");
        if (!active) {
            return;
        }
        movePill(pill, active, hasPainted.current);
        hasPainted.current = true;
    }, [pathname]);

    useLayoutEffect(() => {
        function onResize() {
            const bar = barRef.current;
            const pill = pillRef.current;
            if (!bar || !pill) {
                return;
            }
            const active =
                bar.querySelector<HTMLElement>('[aria-current="page"]') ??
                bar.querySelector<HTMLElement>(".t-tab");
            if (active) {
                movePill(pill, active, false);
            }
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <nav className="overflow-x-auto max-inline-full">
            <div ref={barRef} className="t-tabs">
                <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
                {THEME_LINKS.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="t-tab body font-medium no-underline"
                            aria-current={isActive ? "page" : undefined}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
