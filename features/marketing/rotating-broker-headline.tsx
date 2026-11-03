"use client";

import { useEffect, useRef } from "react";

const BROKER_FEATURES = ["property listings.", "client records.", "site visits.", "ongoing deals."];

export function RotatingBrokerHeadline() {
    const containerRef = useRef<HTMLSpanElement>(null);
    const indexRef = useRef(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const phrases = Array.from(container.querySelectorAll<HTMLSpanElement>(".t-text-swap"));
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const duration =
            parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue("--text-swap-dur"),
            ) || 200;
        let interval: ReturnType<typeof setInterval> | undefined;
        let timeout: ReturnType<typeof setTimeout> | undefined;

        function stop() {
            clearInterval(interval);
            clearTimeout(timeout);
            phrases.forEach((phrase) => phrase.classList.remove("is-exit", "is-enter-start"));
        }

        function start() {
            stop();
            if (reducedMotion.matches) return;

            interval = setInterval(() => {
                if (document.hidden) return;
                const current = phrases[indexRef.current];
                current.classList.add("is-exit");

                timeout = setTimeout(() => {
                    current.classList.add("invisible");
                    current.classList.remove("is-exit");
                    indexRef.current = (indexRef.current + 1) % phrases.length;
                    const next = phrases[indexRef.current];
                    next.classList.add("is-enter-start");
                    next.classList.remove("invisible");
                    void next.offsetHeight;
                    next.classList.remove("is-enter-start");
                }, duration);
            }, 4500);
        }

        start();
        reducedMotion.addEventListener("change", start);
        return () => {
            stop();
            reducedMotion.removeEventListener("change", start);
        };
    }, []);

    return (
        <h1 className="display-2 relative text-canvas [text-shadow:0_2px_24px_var(--color-brand-ink)]">
            <span className="sr-only">
                One place for your property listings, client records, site visits and ongoing deals.
            </span>
            <span aria-hidden="true">
                <span className="block">One place for your</span>
                {/* All phrases share a grid cell, reserving space for the longest at every width. */}
                <span ref={containerRef} className="grid text-highlight">
                    {BROKER_FEATURES.map((feature, index) => (
                        <span
                            key={feature}
                            className={`t-text-swap col-start-1 row-start-1 ${index === 0 ? "" : "invisible"}`}
                        >
                            {feature}
                        </span>
                    ))}
                </span>
            </span>
        </h1>
    );
}
