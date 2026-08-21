"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Home01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

import { AuthFormEnter } from "./auth-form-enter";

export function AuthFormFrame({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="relative min-block-svh">
            <div className="fixed inset-s-4 inset-bs-4 z-20 sm:inset-s-8 sm:inset-bs-8">
                <Logo />
            </div>
            <div className="fixed inset-e-3 inset-bs-3.5 z-20 sm:inset-e-5 sm:inset-bs-5">
                <Button
                    variant="link"
                    render={<Link href="/" />}
                    className="body gap-2 px-0 font-medium text-ink-muted hover:text-ink"
                >
                    <HugeiconsIcon icon={Home01Icon} className="block-4 inline-4" />
                    Go to home
                </Button>
            </div>
            <div
                className="
                  flex flex-col items-center justify-center px-4 py-12 min-block-svh
                  sm:px-8
                "
            >
                <AuthFormEnter key={pathname}>{children}</AuthFormEnter>
            </div>
        </div>
    );
}
