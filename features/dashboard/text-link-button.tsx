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
 * Brand text link with transitions.dev learn-more chevron.
 * Hover underline sits on the label only — the chevron stays undecorated.
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                        className="t-learn-arm t-learn-arm-top"
                        d="M6 4L10 8"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                    />
                    <path
                        className="t-learn-arm t-learn-arm-bot"
                        d="M10 8L6 12"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                    />
                </svg>
            </span>
        </Button>
    );
}
