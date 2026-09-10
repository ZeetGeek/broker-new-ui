"use client";

import { AuthFormFrame } from "./auth-back-link";
import { AuthHeading } from "./auth-heading";

export function AuthBusyState({ title, description }: { title: string; description: string }) {
    return (
        <div
            className="
              mx-auto flex flex-col items-center gap-6 text-center inline-full max-inline-96
            "
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <AuthHeading title={title} description={description} />
        </div>
    );
}

export function AuthPageFallback({
    title = "Loading",
    description = "Please wait.",
}: {
    title?: string;
    description?: string;
}) {
    return (
        <AuthFormFrame>
            <AuthBusyState title={title} description={description} />
        </AuthFormFrame>
    );
}
