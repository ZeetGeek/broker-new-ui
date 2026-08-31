import type { ReactNode } from "react";
import Link from "next/link";

import { MoveRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export type TextLinkButtonProps = {
    href: string;
    children: ReactNode;
    className?: string;
};

/**
 * Brand text link with a trailing arrow — used for secondary CTAs on cards and lists.
 * Hover underline sits on the label only; the arrow slides via `t-learn-chevron`.
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
                  t-learn body-sm gap-1 p-0 font-semibold text-brand block-auto
                  hover:text-brand-text hover:no-underline
                `,
                className,
            )}
        >
            <span className="underline-offset-4 group-hover/button:underline">{children}</span>
            <span className="t-learn-chevron" aria-hidden>
                <MoveRight className="block-4 inline-4" strokeWidth={1.75} />
            </span>
        </Button>
    );
}
