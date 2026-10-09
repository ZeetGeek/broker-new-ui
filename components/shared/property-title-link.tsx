"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export type PropertyTitleLinkProps = {
    href: string;
    children: ReactNode;
    className?: string;
};

/**
 * Property name that opens the listing. Uses the button `link` variant so the
 * hover underline matches other text links, with decoration-color fading in
 * over `--duration-fast` (the base button transition).
 */
export function PropertyTitleLink({ href, children, className }: PropertyTitleLinkProps) {
    return (
        <Button
            variant="link"
            size="sm"
            nativeButton={false}
            render={<Link href={href} prefetch={false} />}
            className={cn(
                `
                  justify-start truncate p-0 font-semibold text-ink underline decoration-transparent
                  underline-offset-4 block-auto max-inline-full min-inline-0
                  hover:text-ink hover:decoration-current
                  active:translate-y-0 active:scale-100
                `,
                className,
            )}
        >
            {children}
        </Button>
    );
}
