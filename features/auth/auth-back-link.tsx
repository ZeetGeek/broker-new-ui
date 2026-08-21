"use client";

import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";

export function AuthFormFrame({ children }: { children: ReactNode }) {
    return (
        <div className="relative min-block-svh">
            <div className="fixed inset-s-4 inset-bs-4 z-20 sm:inset-s-8 sm:inset-bs-8">
                <Logo />
            </div>
            <div
                className="
                  flex flex-col items-center justify-center px-4 py-12 min-block-svh
                  sm:px-8
                "
            >
                {children}
            </div>
        </div>
    );
}
