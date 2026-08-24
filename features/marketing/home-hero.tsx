import Link from "next/link";

import { ArrowRight, IndianRupee, Lock, Rocket, ShieldCheck } from "lucide-react";

import { ProgressiveBlur } from "@/components/motion-primitives/progressive-blur";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { HeroBg } from "./hero-bg";

const TRUST_ITEMS = [
    { icon: ShieldCheck, label: "RERA-verified brokers" },
    { icon: IndianRupee, label: "No listing fee" },
    { icon: Lock, label: "Your number stays private" },
];

export function HomeHero() {
    return (
        <section className="relative overflow-hidden rounded-card block-full">
            <div className="absolute inset-0 bg-brand-ink" aria-hidden="true">
                <HeroBg />

                <ProgressiveBlur
                    className="
                      pointer-events-none absolute inset-x-0 inset-bs-0 block-1/5
                      md:block-1/4
                    "
                    direction="top"
                    blurLayers={4}
                    blurIntensity={2}
                />
                <ProgressiveBlur
                    className="
                      pointer-events-none absolute inset-x-0 inset-be-0 block-1/5
                      md:block-1/4
                    "
                    direction="bottom"
                    blurLayers={4}
                    blurIntensity={2}
                />

                <div
                    className="
                      absolute inset-0 bg-linear-to-b from-brand-ink/40 via-brand-ink/58
                      to-brand-ink/75
                    "
                />
            </div>

            <header
                className="
                  absolute inset-x-0 inset-bs-0 z-10 flex items-center justify-between p-4
                  md:p-6
                "
            >
                <Logo variant="accent" />
                <nav className="flex items-center gap-2">
                    <Button
                        variant="link"
                        className="text-canvas hover:text-canvas"
                        render={<Link href="/login" />}
                    >
                        Login
                    </Button>
                    <Button variant="highlight" render={<Link href="/register" />}>
                        Get started
                    </Button>
                </nav>
            </header>

            <div
                className="
                  relative z-10 mx-auto flex items-center justify-center px-4 block-full
                  max-inline-[800px]
                "
            >
                <div className="relative flex flex-col items-center gap-6 p-6 text-center md:p-8">
                    <div
                        aria-hidden="true"
                        className="
                          pointer-events-none absolute -inset-x-4 -inset-y-6 rounded-card bg-radial
                          from-brand-ink/45 from-20% via-brand-ink/25 via-50% to-transparent to-75%
                          md:-inset-x-10 md:-inset-y-8
                        "
                    />

                    <Badge
                        variant="brand"
                        className="
                          body-sm relative border border-canvas/25 bg-canvas/10 px-3.5 py-1.5
                          text-canvas backdrop-blur-lg
                          [&_svg:not([class*='size-'])]:block-3.5
                          [&_svg:not([class*='size-'])]:inline-3.5
                        "
                    >
                        <Rocket aria-hidden="true" />
                        Now onboarding brokers and owners
                    </Badge>

                    <h1
                        className="
                          display-2 relative text-canvas
                          [text-shadow:0_2px_24px_var(--color-brand-ink)]
                        "
                    >
                        Sell your property through a broker you trust.
                    </h1>

                    <p
                        className="
                          body relative text-canvas/90
                          [text-shadow:0_1px_16px_var(--color-brand-ink)] max-inline-[420px]
                        "
                    >
                        List it free. Verified brokers ask to sell it. You approve the one you like.
                    </p>

                    <div
                        className="
                          relative flex flex-col gap-2.5 inline-full
                          sm:flex-row sm:inline-auto
                        "
                    >
                        <Button
                            size="lg"
                            variant="highlight"
                            render={<Link href="/register?portal=owner" />}
                        >
                            List my property free
                        </Button>
                        <Button
                            size="lg"
                            variant="highlight-outline"
                            className="bg-canvas/10 backdrop-blur-lg hover:bg-canvas/15"
                            render={<Link href="/register?portal=broker" />}
                        >
                            I&apos;m a broker
                            <ArrowRight aria-hidden="true" data-icon="inline-end" />
                        </Button>
                    </div>

                    <ul
                        className="
                          body-sm relative flex flex-col items-center gap-3 text-canvas/90
                          sm:flex-row sm:gap-0 sm:divide-x sm:divide-canvas/15
                        "
                    >
                        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                            <li key={label} className="flex items-center gap-2 sm:px-5">
                                <span
                                    className="
                                      flex items-center justify-center rounded-full border
                                      border-canvas/25 bg-canvas/10 backdrop-blur-md block-6
                                      inline-6
                                    "
                                >
                                    <Icon aria-hidden="true" className="block-3.5 inline-3.5" />
                                </span>
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
