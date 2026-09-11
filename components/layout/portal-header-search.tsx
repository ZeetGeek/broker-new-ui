"use client";

import { type ComponentProps, useRef } from "react";

import { SearchIcon, type SearchIconHandle } from "@animateicons/react/lucide/search-icon";
import { useReducedMotion } from "motion/react";

import { SearchPlaceholderLoop } from "@/components/layout/search-placeholder-loop";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

const HEADER_ICON_SIZE = 16;

export function PortalHeaderSearch({
    className,
    onMouseEnter,
    onMouseLeave,
    ...props
}: ComponentProps<typeof Button>) {
    const iconRef = useRef<SearchIconHandle>(null);
    const reduceMotion = useReducedMotion();

    return (
        <Button
            type="button"
            variant="outline"
            size="icon-md"
            aria-label="Search"
            className={className}
            {...props}
            onMouseEnter={(event) => {
                iconRef.current?.startAnimation();
                onMouseEnter?.(event);
            }}
            onMouseLeave={(event) => {
                iconRef.current?.stopAnimation();
                onMouseLeave?.(event);
            }}
        >
            <SearchIcon
                ref={iconRef}
                size={HEADER_ICON_SIZE}
                isAnimated={!reduceMotion}
                aria-hidden="true"
            />
            <span aria-hidden="true" className="hidden overflow-hidden md:inline-flex">
                <SearchPlaceholderLoop />
            </span>
            <Kbd variant="surface" className="hidden md:ms-auto md:me-0 md:inline-flex">
                Ctrl + K
            </Kbd>
        </Button>
    );
}
