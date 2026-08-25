import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

type TextLinkButtonProps = {
    href: string;
    children: ReactNode;
    className?: string;
};

/**
 * Brand text link with trailing arrow. Hover underline sits on the label only —
 * the arrow stays undecorated.
 */
export function TextLinkButton({ href, children, className }: TextLinkButtonProps) {
    return (
        <Button
            variant="link"
            size="sm"
            nativeButton={false}
            render={<Link href={href} />}
            className={cn(
                `
                  body-sm gap-1 p-0 font-semibold text-brand block-auto
                  hover:text-brand-text hover:no-underline
                `,
                className,
            )}
        >
            <span className="underline-offset-4 group-hover/button:underline">{children}</span>
            <span aria-hidden>→</span>
        </Button>
    );
}
