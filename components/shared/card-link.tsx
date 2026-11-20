"use client";

import type { ComponentProps } from "react";
import Link from "next/link";

type CardLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
    label: string;
    /** Keep an existing detail panel on ordinary clicks; modified clicks follow href. */
    onOpen?: () => void;
};

/** A sibling link, never a wrapper around the card's buttons or other links. */
export function CardLink({ label, onOpen, onNavigate, ...props }: CardLinkProps) {
    return (
        <Link
            {...props}
            data-card-link
            aria-label={label}
            prefetch={false}
            draggable={false}
            onNavigate={(event) => {
                onNavigate?.(event);
                if (onOpen) {
                    event.preventDefault();
                    onOpen();
                }
            }}
        />
    );
}
