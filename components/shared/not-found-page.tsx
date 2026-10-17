"use client";

import Link from "next/link";

import { ArrowLeft, Home } from "lucide-react";

import { useRouter } from "@/lib/navigation";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
    const router = useRouter();

    function goBack() {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.replace("/");
        }
    }

    return (
        <div className="flex flex-col bg-canvas p-4 text-ink min-block-svh md:p-8">
            <header className="flex items-center inline-full">
                <Logo className="rounded-control min-block-12 focus-visible:outline-brand" />
            </header>

            <main className="flex flex-1 items-center justify-center px-2 py-16">
                <div className="text-center inline-full max-inline-lg">
                    <p
                        className="mbe-6 font-display text-8xl font-bold text-ink"
                        aria-hidden="true"
                    >
                        404
                    </p>
                    <h1 className="h1 text-balance text-ink-muted">Page not found</h1>
                    <p className="body mbs-4 text-pretty text-ink-muted">
                        This page may have moved, or the link may be incorrect. Check the address or
                        head back home.
                    </p>

                    <div className="mbs-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Button
                            nativeButton={false}
                            variant="accent"
                            size="lg"
                            render={<Link href="/" />}
                        >
                            <Home aria-hidden="true" data-icon="inline-start" />
                            Back to home
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="
                              border-border-warm bg-surface text-ink
                              hover:bg-brand-soft hover:text-brand-text
                            "
                            onClick={goBack}
                        >
                            <ArrowLeft aria-hidden="true" data-icon="inline-start" />
                            Go back
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
