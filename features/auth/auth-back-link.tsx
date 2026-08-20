"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";

export function AuthBackLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Button
            variant="link"
            render={<Link href={href} />}
            className="
              body absolute inset-s-0 inset-bs-0 z-10 gap-2 px-0 font-medium text-ink-muted
              hover:text-ink
            "
        >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="block-4 inline-4" />
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
