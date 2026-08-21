"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

type AuthBackLinkProps = {
    children: ReactNode;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

export function AuthBackLink({ href, onClick, children }: AuthBackLinkProps) {
    const className = `
      body absolute inset-s-0 inset-bs-0 z-10 gap-2 px-0 font-medium text-ink-muted
      hover:text-ink
    `;
    const icon = <HugeiconsIcon icon={ArrowLeft02Icon} className="block-4 inline-4" />;

    if (href) {
        return (
            <Button variant="link" render={<Link href={href} />} className={className}>
                {icon}
                {children}
            </Button>
        );
    }

    return (
        <Button variant="link" type="button" onClick={onClick} className={className}>
            {icon}
            {children}
        </Button>
    );
}

export function AuthFormFrame({ children }: { children: ReactNode }) {
    return (
        <div className="relative flex flex-col items-center justify-center self-stretch block-full inline-full">
            {children}
        </div>
    );
}
