"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

type AuthBackLinkProps = {
    children: ReactNode;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

export function AuthBackLink({ href, onClick, children }: AuthBackLinkProps) {
    const className = `
      body gap-2 px-0 font-medium text-ink-muted
      hover:text-ink
    `;
    const icon = <HugeiconsIcon icon={ArrowLeft02Icon} className="block-4 inline-4" />;

    const link =
        href != null ? (
            <Button variant="link" render={<Link href={href} />} className={className}>
                {icon}
                {children}
            </Button>
        ) : (
            <Button variant="link" type="button" onClick={onClick} className={className}>
                {icon}
                {children}
            </Button>
        );

    return (
        <div className="absolute inset-be-4 inset-is-0 inset-ie-0 z-10 flex justify-center sm:inset-be-8">
            {link}
        </div>
    );
}

export function AuthFormFrame({ children }: { children: ReactNode }) {
    return (
        <div
            className="
              absolute inset-0 flex flex-col items-center justify-center overflow-y-auto px-4
              py-16 pb-20
              sm:px-8 sm:pb-24
            "
        >
            <div className="absolute inset-s-4 inset-bs-4 z-10 sm:inset-s-8 sm:inset-bs-8">
                <Logo />
            </div>
            {children}
        </div>
    );
}
