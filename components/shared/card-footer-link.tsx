import type { ReactNode } from "react";
import Link from "next/link";

import { MoveRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export type CardFooterLinkProps = {
    href: string;
    children: ReactNode;
    className?: string;
};

/**
 * Full-width pill link that closes a dashboard card. Reads as a real target on a
 * phone (the whole strip is tappable) without competing with the card's primary
 * action — border and hover stay in the warm neutral range, not brand.
 */
export function CardFooterLink({ href, children, className }: CardFooterLinkProps) {
    return (
        <Button
            variant="outline-dark"
            size="lg"
            nativeButton={false}
            render={<Link href={href} />}
            className={cn(`inline-full`, className)}
        >
            <span>{children}</span>
            <MoveRight
                aria-hidden
                className="
                  transition-transform duration-160 ease-out block-4 inline-4
                  group-hover/footer:translate-x-0.5
                "
                strokeWidth={1.75}
            />
        </Button>
    );
}
